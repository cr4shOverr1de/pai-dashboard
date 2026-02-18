// PAI Observability Server — Background Task Watcher
// Monitors /tmp/claude/ for background agent output files

import { watch, readdirSync, statSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import type { BackgroundTask } from "./types";

const USER = process.env.USER || "cr4sh";
const TASKS_DIR = join(
  "/tmp",
  "claude",
  `-home-${USER}--claude`,
  "tasks"
);

const IDLE_THRESHOLD_MS = 30_000; // 30 seconds without modification = completed
const POLL_INTERVAL_MS = 2000;

const tasks = new Map<string, BackgroundTask>();
let broadcastCallback: ((task: BackgroundTask) => void) | null = null;

function inferDescription(content: string, filename: string): string {
  // Pattern matching for common task types
  const patterns: [RegExp, string][] = [
    [/npm (run |install|start|test)/i, "npm operation"],
    [/bun (run |install|test)/i, "bun operation"],
    [/git (push|pull|commit|clone|checkout)/i, "git operation"],
    [/docker (build|run|compose|push)/i, "docker operation"],
    [/curl|fetch|http/i, "HTTP request"],
    [/test|jest|vitest|pytest/i, "running tests"],
    [/build|compile|tsc/i, "building project"],
    [/deploy|vercel|cloudflare/i, "deployment"],
    [/grep|rg|find|search/i, "searching files"],
    [/server|listen|serve/i, "running server"],
  ];

  for (const [pattern, desc] of patterns) {
    if (pattern.test(content)) return desc;
  }

  // Fallback: use first non-empty line
  const firstLine = content.split("\n").find((l) => l.trim());
  if (firstLine) return firstLine.slice(0, 60);

  return `Task ${filename}`;
}

function detectFormat(content: string): "jsonl" | "text" {
  const firstLine = content.split("\n").find((l) => l.trim());
  if (!firstLine) return "text";
  try {
    JSON.parse(firstLine);
    return "jsonl";
  } catch {
    return "text";
  }
}

function processTaskFile(filePath: string, filename: string): void {
  try {
    const stat = statSync(filePath);
    const taskId = filename.replace(/\.output$/, "");
    const existing = tasks.get(taskId);

    // Read content for description inference
    let content = "";
    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      return;
    }

    const format = detectFormat(content);
    const now = Date.now();
    const isIdle = now - stat.mtimeMs > IDLE_THRESHOLD_MS;

    const task: BackgroundTask = {
      id: taskId,
      description: existing?.description || inferDescription(content, filename),
      status: isIdle ? "completed" : "running",
      startedAt: existing?.startedAt || stat.birthtimeMs || stat.ctimeMs,
      updatedAt: stat.mtimeMs,
      outputPreview: content.slice(-500), // Last 500 chars
      format,
    };

    // Only broadcast if status changed or it's new
    const statusChanged = !existing || existing.status !== task.status || existing.updatedAt !== task.updatedAt;
    tasks.set(taskId, task);

    if (statusChanged && broadcastCallback) {
      broadcastCallback(task);
    }
  } catch {
    // File may be mid-write
  }
}

export function getTasks(): BackgroundTask[] {
  return [...tasks.values()];
}

export function getTask(id: string): BackgroundTask | undefined {
  return tasks.get(id);
}

export function getTaskOutput(id: string): string | undefined {
  const task = tasks.get(id);
  if (!task) return undefined;

  const filePath = join(TASKS_DIR, `${id}.output`);
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return undefined;
  }
}

export function startTaskWatcher(
  onTaskUpdate: (task: BackgroundTask) => void
): void {
  broadcastCallback = onTaskUpdate;

  if (!existsSync(TASKS_DIR)) {
    console.log(`[task-watcher] Tasks directory not found: ${TASKS_DIR}`);
    console.log(`[task-watcher] Will check periodically for creation...`);

    // Keep checking for directory creation
    const dirCheck = setInterval(() => {
      if (existsSync(TASKS_DIR)) {
        console.log(`[task-watcher] Tasks directory found! Starting watch.`);
        clearInterval(dirCheck);
        initWatch();
      }
    }, 5000);
    return;
  }

  initWatch();
}

function initWatch(): void {
  console.log(`[task-watcher] Watching: ${TASKS_DIR}`);

  // Scan existing files
  try {
    const files = readdirSync(TASKS_DIR).filter((f) => f.endsWith(".output"));
    for (const f of files) {
      processTaskFile(join(TASKS_DIR, f), f);
    }
    console.log(`[task-watcher] Found ${files.length} existing task files`);
  } catch {}

  // Watch for new/modified files
  try {
    watch(TASKS_DIR, { recursive: false }, (_eventType, filename) => {
      if (!filename?.endsWith(".output")) return;
      processTaskFile(join(TASKS_DIR, filename), filename);
    });
  } catch (err) {
    console.error(`[task-watcher] Watch error:`, err);
  }

  // Poll running tasks for status updates
  setInterval(() => {
    for (const [taskId, task] of tasks) {
      if (task.status === "running") {
        const filePath = join(TASKS_DIR, `${taskId}.output`);
        processTaskFile(filePath, `${taskId}.output`);
      }
    }
  }, POLL_INTERVAL_MS);
}
