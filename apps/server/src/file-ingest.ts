// PAI Observability Server — File Ingestion
// Watches Claude Code JSONL session transcripts and converts to HookEvents

import { watch, readdirSync, statSync, readFileSync, existsSync, openSync, readSync, closeSync } from "fs";
import { join } from "path";
import type { HookEvent } from "./types";

const USER = process.env.USER || "cr4sh";
const PROJECTS_DIR = join(
  process.env.HOME || `/home/${USER}`,
  ".claude",
  "projects",
  `-home-${USER}--claude`
);
const AGENT_SESSIONS_PATH = join(
  process.env.HOME || `/home/${USER}`,
  ".claude",
  "MEMORY",
  "STATE",
  "agent-sessions.json"
);

const MAX_EVENTS = 1000;
let eventCounter = 0;
const events: HookEvent[] = [];
const filePositions = new Map<string, number>();
let agentSessions: Record<string, string> = {};
let broadcastCallback: ((event: HookEvent) => void) | null = null;

function loadAgentSessions(): void {
  try {
    if (existsSync(AGENT_SESSIONS_PATH)) {
      const data = readFileSync(AGENT_SESSIONS_PATH, "utf-8");
      agentSessions = JSON.parse(data);
    }
  } catch {
    // Silent — agent sessions are optional enrichment
  }
}

function getAgentName(sessionId: string, sourceApp: string): string | undefined {
  if (agentSessions[sessionId]) return agentSessions[sessionId];

  // Capitalize known agent types from source_app
  const agentTypes: Record<string, string> = {
    engineer: "Engineer",
    architect: "Architect",
    researcher: "Researcher",
    designer: "Designer",
    pentester: "Pentester",
    intern: "Intern",
    explorer: "Explorer",
    planner: "Planner",
  };
  if (agentTypes[sourceApp.toLowerCase()]) {
    return agentTypes[sourceApp.toLowerCase()];
  }
  return undefined;
}

function parseJSONLLine(line: string): HookEvent | null {
  try {
    const raw = JSON.parse(line);

    // Skip file-history-snapshot and queue-operation events
    if (raw.type === "file-history-snapshot" || raw.type === "queue-operation") {
      return null;
    }

    const sessionId = raw.sessionId || "unknown";
    const timestamp = raw.timestamp
      ? new Date(raw.timestamp).getTime()
      : Date.now();

    // Determine event type and extract relevant data
    let hookEventType = raw.type || "unknown";
    let toolName: string | undefined;
    let toolInput: Record<string, any> | undefined;
    let payload: Record<string, any> = {};
    let sourceApp = "claude-code";
    let modelName: string | undefined;

    if (raw.type === "assistant") {
      const msg = raw.message || {};
      modelName = msg.model;
      const content = msg.content || [];

      // Look for tool_use blocks in content
      for (const block of content) {
        if (block?.type === "tool_use") {
          hookEventType = "tool_use";
          toolName = block.name;
          toolInput = block.input;
          payload = {
            tool_use_id: block.id,
            name: block.name,
            input_preview: truncateInput(block.input),
          };
          break; // Take first tool use
        }
      }

      // If no tool use, it's a text response
      if (hookEventType === "assistant") {
        const textBlocks = content.filter((b: any) => b?.type === "text");
        const text = textBlocks.map((b: any) => b.text || "").join("\n");
        payload = {
          text_preview: text.slice(0, 200),
          stop_reason: msg.stop_reason,
        };

        // Detect if this is a tool result (has tool_use_id in content)
        for (const block of content) {
          if (block?.type === "tool_result") {
            hookEventType = "tool_result";
            toolName = block.tool_name;
            payload = {
              tool_use_id: block.tool_use_id,
              status: block.is_error ? "error" : "success",
            };
            break;
          }
        }
      }
    } else if (raw.type === "user") {
      hookEventType = "user";
      const msg = raw.message || {};
      const content = msg.content || [];

      // User messages may contain tool results
      for (const block of content) {
        if (block?.type === "tool_result") {
          hookEventType = "tool_result";
          toolName = block.tool_name || "unknown";
          const resultContent = Array.isArray(block.content)
            ? block.content.map((c: any) => (c?.text || "").slice(0, 100)).join(" ")
            : String(block.content || "").slice(0, 200);
          payload = {
            tool_use_id: block.tool_use_id,
            is_error: block.is_error || false,
            result_preview: resultContent,
          };
          break;
        }
        if (block?.type === "text") {
          payload = { text_preview: (block.text || "").slice(0, 200) };
        }
      }
    } else if (raw.type === "progress") {
      const data = raw.data || {};
      hookEventType = data.type || "progress";
      payload = {
        hookEvent: data.hookEvent,
        hookName: data.hookName,
        command: data.command,
      };
    } else if (raw.type === "system") {
      hookEventType = "system";
      payload = raw.data || {};
    }

    const agentName = getAgentName(sessionId, sourceApp);

    return {
      id: ++eventCounter,
      source_app: sourceApp,
      session_id: sessionId,
      agent_name: agentName,
      hook_event_type: hookEventType,
      tool_name: toolName,
      tool_input: toolInput,
      payload,
      timestamp,
      model_name: modelName,
    };
  } catch {
    return null;
  }
}

function truncateInput(input: any): Record<string, any> {
  if (!input || typeof input !== "object") return {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && value.length > 200) {
      result[key] = value.slice(0, 200) + "...";
    } else {
      result[key] = value;
    }
  }
  return result;
}

function addEvent(event: HookEvent): void {
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  broadcastCallback?.(event);
}

function processFile(filePath: string): void {
  try {
    const stat = statSync(filePath);
    const currentPos = filePositions.get(filePath) || 0;

    if (stat.size <= currentPos) return;

    // Read only new bytes using Buffer to handle byte positions correctly
    const buf = readFileSync(filePath);
    const newBytes = buf.subarray(currentPos);
    const newContent = newBytes.toString("utf-8");
    filePositions.set(filePath, stat.size);

    // Parse each new line
    const lines = newContent.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      const event = parseJSONLLine(line);
      if (event) addEvent(event);
    }
  } catch {
    // File may be in process of being written — retry next cycle
  }
}

function getRecentJSONLFiles(dir: string, count: number): string[] {
  try {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => ({
        name: f,
        path: join(dir, f),
        mtime: statSync(join(dir, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, count);
    return files.map((f) => f.path);
  } catch {
    return [];
  }
}

export function getEvents(): HookEvent[] {
  return events;
}

export function getRecentEvents(count = 100): HookEvent[] {
  return events.slice(-count);
}

export function getFilterOptions() {
  const sourceApps = new Set<string>();
  const sessionIds = new Set<string>();
  const eventTypes = new Set<string>();

  for (const event of events) {
    sourceApps.add(event.source_app);
    sessionIds.add(event.session_id);
    eventTypes.add(event.hook_event_type);
  }

  return {
    source_apps: [...sourceApps],
    session_ids: [...sessionIds],
    hook_event_types: [...eventTypes],
  };
}

export function getEventsByAgent(agentName: string): HookEvent[] {
  return events.filter(
    (e) => e.agent_name?.toLowerCase() === agentName.toLowerCase()
  );
}

const BACKFILL_COUNT = parseInt(process.env.BACKFILL_COUNT || "200", 10);

/**
 * Backfill recent events from JSONL files by reading from the tail.
 * Reads the last ~100KB of each recent file and parses the last N lines.
 * Events are added silently (no broadcast) so they don't trigger WebSocket sends.
 */
function backfillRecentEvents(files: string[], maxEvents: number): void {
  const TAIL_BYTES = 100 * 1024; // Read last 100KB of each file
  const allEvents: HookEvent[] = [];

  for (const filePath of files) {
    try {
      const stat = statSync(filePath);
      if (stat.size === 0) continue;

      const readStart = Math.max(0, stat.size - TAIL_BYTES);
      const readLength = stat.size - readStart;
      const buf = Buffer.alloc(readLength);
      const fd = openSync(filePath, "r");
      readSync(fd, buf, 0, readLength, readStart);
      closeSync(fd);

      const content = buf.toString("utf-8");
      const lines = content.split("\n").filter((l) => l.trim());

      // If we started mid-file, skip the first line (likely partial)
      const startIdx = readStart > 0 ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const event = parseJSONLLine(lines[i]);
        if (event) allEvents.push(event);
      }
    } catch {
      // File may not be readable
    }
  }

  // Sort by timestamp and take the last N
  allEvents.sort((a, b) => a.timestamp - b.timestamp);
  const backfilled = allEvents.slice(-maxEvents);

  // Reset event counter to account for backfilled events
  eventCounter = 0;
  for (const event of backfilled) {
    event.id = ++eventCounter;
    events.push(event);
  }

  if (backfilled.length > 0) {
    console.log(`[file-ingest] Backfilled ${backfilled.length} recent events from ${files.length} files`);
  }
}

export function startFileIngestion(
  onEvent: (event: HookEvent) => void
): void {
  broadcastCallback = onEvent;
  loadAgentSessions();

  console.log(`[file-ingest] Watching: ${PROJECTS_DIR}`);

  if (!existsSync(PROJECTS_DIR)) {
    console.warn(`[file-ingest] Projects directory not found: ${PROJECTS_DIR}`);
    return;
  }

  // Watch 20 most recent JSONL files — set positions to END (only new events)
  const recentFiles = getRecentJSONLFiles(PROJECTS_DIR, 20);

  // Backfill recent events from existing files (fixes empty dashboard on startup)
  if (BACKFILL_COUNT > 0) {
    backfillRecentEvents(recentFiles, BACKFILL_COUNT);
  }

  for (const filePath of recentFiles) {
    try {
      const stat = statSync(filePath);
      filePositions.set(filePath, stat.size); // Start at END
      console.log(
        `[file-ingest] Tracking: ${filePath.split("/").pop()} (${(stat.size / 1024).toFixed(0)}KB)`
      );
    } catch {}
  }

  // Watch for changes in existing files and new files
  try {
    watch(PROJECTS_DIR, { recursive: false }, (eventType, filename) => {
      if (!filename?.endsWith(".jsonl")) return;
      const filePath = join(PROJECTS_DIR, filename);

      // New file — start from beginning
      if (!filePositions.has(filePath)) {
        filePositions.set(filePath, 0);
        console.log(`[file-ingest] New session: ${filename}`);
      }

      processFile(filePath);
    });
  } catch (err) {
    console.error(`[file-ingest] Watch error:`, err);
  }

  // Watch agent-sessions.json for enrichment updates
  try {
    if (existsSync(AGENT_SESSIONS_PATH)) {
      watch(AGENT_SESSIONS_PATH, () => {
        loadAgentSessions();
      });
    }
  } catch {}

  // Poll every 2 seconds as backup (inotify can miss events under load)
  setInterval(() => {
    for (const filePath of filePositions.keys()) {
      processFile(filePath);
    }
    // Check for new files
    const currentFiles = getRecentJSONLFiles(PROJECTS_DIR, 5);
    for (const f of currentFiles) {
      if (!filePositions.has(f)) {
        filePositions.set(f, 0);
        processFile(f);
      }
    }
  }, 2000);
}
