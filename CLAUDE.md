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

**Explicitly NOT using:** Pinia, shadcn-vue, Chart.js, Socket.io, Express, SQLite (deferred).

## File Structure

```
pai-dashboard/
├── CLAUDE.md                     ← You are here
├── PROGRESS.md                   ← Implementation progress + ideas + todos
├── PRD-20260217-*.md             ← Full PRD with research + architecture
├── manage.sh                     ← start/stop/restart/status
├── pai-dashboard.service         ← systemd user service for auto-start
├── public/favicon.svg
├── apps/
│   ├── server/                   ← Bun backend (port 4000)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts          ← Bun.serve: HTTP REST + WebSocket /stream
│   │       ├── file-ingest.ts    ← Watches JSONL, parses to HookEvent, backfills 200 on startup
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
│           ├── App.vue           ← Root: 3 tabs (Timeline/SwimLanes/Chat), search, stats sidebar
│           ├── main.ts
│           ├── types.ts          ← Client-side HookEvent, BackgroundTask, HeatLevel
│           ├── style.css         ← Tailwind + glass morphism + scrollbar styling
│           ├── vite-env.d.ts
│           ├── utils/
│           │   └── obfuscate.ts        ← Redacts API keys, tokens, PII from display
│           ├── composables/
│           │   ├── useWebSocket.ts     ← Auto-connect, reconnect, event buffering
│           │   ├── useEventColors.ts   ← Tokyo Night palette for events + agents
│           │   ├── useHeatLevel.ts     ← 6-level intensity: Cold→Inferno
│           │   ├── useEventEmojis.ts   ← Tool/event emoji indicators
│           │   ├── useEventSearch.ts   ← Full-text search with 200ms debounce
│           │   ├── useBackgroundTasks.ts ← Reactive task state composable
│           │   ├── useAdvancedMetrics.ts ← Aggregate stats: tools, agents, trends
│           │   └── useMediaQuery.ts    ← Responsive breakpoints (sm/md/lg/xl)
│           └── components/
│               ├── EventRow.vue            ← Single event with expandable payload (obfuscated)
│               ├── EventTimeline.vue       ← Scrollable event feed with auto-scroll
│               ├── FilterPanel.vue         ← Source/session/type dropdown filters
│               ├── LivePulseChart.vue      ← Canvas activity bars, heat level, agent legend
│               ├── AgentSwimLane.vue       ← Per-agent event lane with tool breakdown
│               ├── AgentSwimLaneContainer.vue ← Multi-agent swim lane view
│               ├── ChatTranscript.vue      ← Chat bubble view of conversation
│               ├── ToastNotification.vue   ← Agent appearance alerts
│               ├── IntensityBar.vue        ← Heat level gradient bar
│               ├── stats/
│               │   └── StatBadge.vue       ← Metric badge (value + label + trend)
│               └── widgets/
│                   ├── TopToolsWidget.vue  ← Ranked tool usage bars
│                   └── EventTypesWidget.vue ← Event type distribution
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

## Key Features

- **3 view tabs:** Timeline (chronological event feed), Swim Lanes (per-agent grouped view), Chat (conversation bubble view)
- **Full-text search:** Debounced search across tool names, agent names, event types, and payload text
- **Event backfill:** Server loads 200 recent events from JSONL on startup (configurable: `BACKFILL_COUNT=N`)
- **Secret redaction:** `obfuscate.ts` redacts API keys, bearer tokens, JWTs, emails, hex secrets in displayed payloads
- **Stats sidebar:** 4 stat badges (events, ev/min, tasks, sessions) + Top Tools + Event Types widgets
- **Heat level system:** 6-level intensity (Cold→Inferno) with logarithmic thresholds and color gradient bar
- **Toast notifications:** Alerts when new agents appear in the event stream
- **Responsive design:** Stats sidebar auto-hides below 1024px viewport with manual override

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKFILL_COUNT` | `200` | Number of historical events to load from JSONL on server startup |
| `USER` | `cr4sh` | Username for constructing JSONL paths |

## Known Issues

1. **Empty `agent_progress` events** — Long-running sub-agent tasks generate repeated `agent_progress` events with empty `{}` payload. These flood the timeline. See PROGRESS.md TODO section for fix plan.
2. **Task watcher path** — Watches `/tmp/claude/-home-{USER}--claude/tasks/` which may not exist until Claude spawns background tasks. Server handles this gracefully with periodic directory checks.

## Future Ideas

See PROGRESS.md for full ideas list. Top priorities:
- Filter/suppress empty `agent_progress` events (noise reduction)
- HITL browser notifications (alert when agents ask questions)
- SQLite persistence for events surviving full restarts
- Theme system (Tokyo Night is hardcoded; add Dracula, Catppuccin, etc.)
- Token usage tracking (extract from JSONL model response metadata)
- Remote agent dashboard (when Claude remote session API becomes available)

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
