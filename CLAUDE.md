# PAI Observability Server

Real-time dashboard for monitoring PAI Algorithm sessions, agent spawns, ISC criteria tracking, and loop mode progress. Consumes Claude Code's native JSONL session transcripts — zero custom hooks needed.

## Quick Start

```bash
# Install (first time only):
cd apps/server && bun install
cd ../client && bun install

# Launch both:
./manage.sh start
# Server: http://localhost:4000 (REST + WebSocket)
# Client: http://localhost:5172 (Vue dashboard)

# Stop:
./manage.sh stop
```

## Architecture

```
Claude Code → writes JSONL transcripts → ~/.claude/projects/-home-{USER}--claude/*.jsonl
                                                   │
                                                   ▼
                    file-ingest.ts (fs.watch + 2s poll) → parses to HookEvent → in-memory (max 1000)
                                                   │
                                                   ▼
                    index.ts (Bun.serve :4000) → WebSocket /stream → Vue 3 client (:5172)
                                                   │
                    task-watcher.ts (fs.watch) → /tmp/claude/ task outputs → BackgroundTask store
```

**Key design principle:** The dashboard is a **read-only consumer**. It reads files that Claude Code and existing PAI hooks already write. No modifications to AlgorithmTracker, VoiceGate, StopOrchestrator, VoiceServer, or settings.json.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Vue 3 (Composition API + `<script setup>`) | 3.5.x |
| Build | Vite | 6.x |
| CSS | Tailwind CSS (Tokyo Night theme) | 3.4.x |
| Icons | lucide-vue-next | 0.548.x |
| Backend | Bun.serve (HTTP + native WebSocket) | 1.3.x |
| Runtime | Bun | 1.3.9 |

**Explicitly NOT using:** Pinia, shadcn-vue, Chart.js, Socket.io, Express, SQLite (deferred to Phase 4).

## File Structure

```
pai-dashboard/
├── CLAUDE.md                     ← You are here
├── PROGRESS.md                   ← Implementation progress tracker
├── PRD-20260217-*.md             ← Full PRD with research + architecture
├── manage.sh                     ← start/stop/restart/status
├── public/favicon.svg
├── apps/
│   ├── server/                   ← Bun backend (port 4000)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts          ← Bun.serve: HTTP REST + WebSocket /stream
│   │       ├── file-ingest.ts    ← Watches JSONL transcripts, parses to HookEvent
│   │       ├── task-watcher.ts   ← Watches /tmp/claude/ background task outputs
│   │       └── types.ts          ← HookEvent, BackgroundTask, FilterOptions
│   └── client/                   ← Vue 3 frontend (port 5172)
│       ├── package.json
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js    ← Tokyo Night color tokens
│       ├── postcss.config.js
│       ├── tsconfig.json / tsconfig.node.json
│       └── src/
│           ├── App.vue           ← Root: header, filters, chart, timeline
│           ├── main.ts
│           ├── types.ts          ← Client-side HookEvent, BackgroundTask, HeatLevel
│           ├── style.css         ← Tailwind + glass morphism + scrollbar styling
│           ├── vite-env.d.ts
│           ├── composables/
│           │   ├── useWebSocket.ts     ← Auto-connect, reconnect, event buffering
│           │   ├── useEventColors.ts   ← Tokyo Night palette for events + agents
│           │   ├── useHeatLevel.ts     ← 6-level intensity: Cold→Inferno
│           │   └── useEventEmojis.ts   ← Tool/event emoji indicators
│           └── components/
│               ├── EventRow.vue        ← Single event: timestamp, agent, type, payload
│               ├── EventTimeline.vue   ← Scrollable event feed with auto-scroll
│               ├── FilterPanel.vue     ← Source/session/type dropdown filters
│               └── LivePulseChart.vue  ← Canvas activity bars, heat level, agent legend
```

## REST API (port 4000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Server status, uptime, client count, event count |
| `/events/recent?count=N` | GET | Last N events (default 100) |
| `/events/filter-options` | GET | Available source_apps, session_ids, hook_event_types |
| `/events/by-agent/:name` | GET | Events filtered by agent name |
| `/api/tasks` | GET | All background tasks |
| `/api/tasks/:id` | GET | Single task detail |
| `/api/tasks/:id/output` | GET | Full task output text |
| `/stream` | WebSocket | Real-time event + task stream |

## WebSocket Protocol

```
Server → Client on connect:  { type: "initial", data: HookEvent[] }  // Last 50 events
Server → Client on event:    { type: "event", data: HookEvent }      // Real-time
Server → Client on task:     { type: "task_update", data: BackgroundTask }
```

## Data Sources (all pre-existing, read-only)

| Source | Location | What |
|--------|----------|------|
| Session transcripts | `~/.claude/projects/-home-{USER}--claude/*.jsonl` | Claude Code's native JSONL — all messages, tool uses, hook events |
| Background tasks | `/tmp/claude/-home-{USER}--claude/tasks/*.output` | Task agent output files |
| Agent names | `~/.claude/MEMORY/STATE/agent-sessions.json` | Session→agent name mapping |
| Algorithm state | `~/.claude/MEMORY/STATE/algorithms/{sessionId}.json` | Phase, criteria, agents per session |

## Known Issues

1. **Events reset on server restart** — In-memory only (no persistence). Server starts tracking from END of files, so historical events before server start are not captured. A page refresh while server is running keeps events; a refresh after server restart loses them.
2. **Task watcher path** — Watches `/tmp/claude/-home-{USER}--claude/tasks/` which may not exist until Claude spawns background tasks. Server handles this gracefully with periodic directory checks.

## Development

```bash
# Server with hot reload:
cd apps/server && bun run dev

# Client with hot reload:
cd apps/client && bun run dev

# Both (separate terminals, or use manage.sh start)
```

## Reference

- Full PRD with research: `PRD-20260217-pai-observability-server.md`
- Original PAI source: `Releases/v2.3/.claude/Observability/` in github.com/danielmiessler/PAI
- Reference implementation: github.com/disler/claude-code-hooks-multi-agent-observability
