// PAI Observability Server — Entry Point
// Bun.serve: HTTP REST + WebSocket /stream on port 4000

import {
  startFileIngestion,
  getRecentEvents,
  getFilterOptions,
  getEventsByAgent,
} from "./file-ingest";
import {
  startTaskWatcher,
  getTasks,
  getTask,
  getTaskOutput,
} from "./task-watcher";
import type { HookEvent, BackgroundTask } from "./types";

const PORT = parseInt(process.env.PORT || "4000");
const wsClients = new Set<any>();

function broadcastEvent(event: HookEvent): void {
  const msg = JSON.stringify({ type: "event", data: event });
  for (const ws of wsClients) {
    try {
      ws.send(msg);
    } catch {
      wsClients.delete(ws);
    }
  }
}

function broadcastTaskUpdate(task: BackgroundTask): void {
  const msg = JSON.stringify({ type: "task_update", data: task });
  for (const ws of wsClients) {
    try {
      ws.send(msg);
    } catch {
      wsClients.delete(ws);
    }
  }
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

// Start data ingestion
startFileIngestion(broadcastEvent);
startTaskWatcher(broadcastTaskUpdate);

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // WebSocket upgrade
    if (path === "/stream") {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      return undefined as any;
    }

    // REST API routes
    if (path === "/events/recent" && req.method === "GET") {
      const count = parseInt(url.searchParams.get("count") || "100");
      return jsonResponse(getRecentEvents(count));
    }

    if (path === "/events/filter-options" && req.method === "GET") {
      return jsonResponse(getFilterOptions());
    }

    if (path.startsWith("/events/by-agent/") && req.method === "GET") {
      const agentName = decodeURIComponent(path.split("/events/by-agent/")[1]);
      return jsonResponse(getEventsByAgent(agentName));
    }

    if (path === "/api/tasks" && req.method === "GET") {
      return jsonResponse(getTasks());
    }

    if (path.match(/^\/api\/tasks\/[^/]+$/) && req.method === "GET") {
      const taskId = path.split("/api/tasks/")[1];
      const task = getTask(taskId);
      if (!task) return jsonResponse({ error: "Task not found" }, 404);
      return jsonResponse(task);
    }

    if (path.match(/^\/api\/tasks\/[^/]+\/output$/) && req.method === "GET") {
      const taskId = path.split("/api/tasks/")[1].replace("/output", "");
      const output = getTaskOutput(taskId);
      if (!output) return jsonResponse({ error: "Task not found" }, 404);
      return new Response(output, {
        headers: { "Content-Type": "text/plain", ...corsHeaders() },
      });
    }

    // Health check
    if (path === "/health") {
      return jsonResponse({
        status: "ok",
        uptime: process.uptime(),
        clients: wsClients.size,
        events: getRecentEvents(0).length,
      });
    }

    // 404
    return jsonResponse({ error: "Not found" }, 404);
  },

  websocket: {
    open(ws) {
      wsClients.add(ws);
      // Send last 50 events on connect
      const initial = getRecentEvents(50);
      ws.send(JSON.stringify({ type: "initial", data: initial }));
      console.log(
        `[ws] Client connected (${wsClients.size} total). Sent ${initial.length} initial events.`
      );
    },
    message(_ws, _message) {
      // Currently one-way push — no client messages handled
    },
    close(ws) {
      wsClients.delete(ws);
      console.log(`[ws] Client disconnected (${wsClients.size} remaining)`);
    },
  },
});

console.log(`
╔═══════════════════════════════════════════════╗
║   PAI Observability Server v1.0.0             ║
║   HTTP + WebSocket on port ${PORT}              ║
║                                               ║
║   REST:      http://localhost:${PORT}/events/recent  ║
║   WebSocket: ws://localhost:${PORT}/stream      ║
║   Health:    http://localhost:${PORT}/health     ║
╚═══════════════════════════════════════════════╝
`);
