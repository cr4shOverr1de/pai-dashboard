# PAI Observability Server — Progress Tracker

Last updated: 2026-02-17

## Implementation Phases

### Phase 1: Backend Core — COMPLETE

| Component | File | Status | Evidence |
|-----------|------|--------|----------|
| Types | `apps/server/src/types.ts` | Done | HookEvent, BackgroundTask, FilterOptions, WebSocketMessage |
| File Ingestion | `apps/server/src/file-ingest.ts` | Done | Watches 20 JSONL files, byte-position tracking, agent enrichment |
| Task Watcher | `apps/server/src/task-watcher.ts` | Done | Monitors /tmp/claude/ tasks, pattern-based description inference |
| HTTP + WebSocket Server | `apps/server/src/index.ts` | Done | Bun.serve on port 4000, REST + WebSocket /stream |
| Lifecycle Script | `manage.sh` | Done | start/stop/restart/status for both server + client |

**Verified:** Server starts cleanly, captures real-time events from active Claude sessions, REST endpoints respond correctly, WebSocket sends initial event payload.

**Bug fixed during build:** `file-ingest.ts` originally used `String.slice(bytePosition)` for reading new content — but `stat.size` returns bytes while `String.slice()` operates on characters. Fixed to use `Buffer.subarray()` for byte-accurate reads.

### Phase 2: Frontend Shell + Core Components — COMPLETE

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Vue 3 + Vite scaffold | `apps/client/` | Done | Compiles, starts on port 5172 in ~660ms |
| Tailwind + Tokyo Night | `tailwind.config.js`, `style.css` | Done | Full Tokyo Night palette, glass morphism |
| Client types | `src/types.ts` | Done | HookEvent, BackgroundTask, HeatLevel |
| WebSocket composable | `src/composables/useWebSocket.ts` | Done | Auto-connect, reconnect, event buffering |
| Event colors | `src/composables/useEventColors.ts` | Done | Tokyo Night palette for events + agents |
| Heat level | `src/composables/useHeatLevel.ts` | Done | 6-level: Cold→Cool→Warm→Hot→Fire→Inferno |
| Event emojis | `src/composables/useEventEmojis.ts` | Done | Tool + event type emoji indicators |
| EventRow | `src/components/EventRow.vue` | Done | Timestamp, agent dot, type badge, preview, expandable payload |
| EventTimeline | `src/components/EventTimeline.vue` | Done | Filtered scrollable feed with auto-scroll toggle |
| FilterPanel | `src/components/FilterPanel.vue` | Done | Source/session/type dropdowns with clear button |
| LivePulseChart | `src/components/LivePulseChart.vue` | Done | Canvas bars per agent, time windows, heat display |
| App.vue | `src/App.vue` | Done | Root layout: header, filters, chart, timeline |

**Verified 2026-02-17:** All 4 browser criteria confirmed via screenshot:
- [x] WebSocket connects and receives events (green "Connected" indicator)
- [x] EventTimeline renders events with color-coded agents (50+ events with agent dots, type badges)
- [x] FilterPanel dropdowns populate and filter correctly (3 dropdown filters visible)
- [x] LivePulseChart canvas renders activity visualization (bars, time windows, heat level, legend)

---

### Phase 3: Advanced Visualization — COMPLETE

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| AgentSwimLane | `src/components/AgentSwimLane.vue` | Done | Per-agent event lane with collapsible view, tool breakdown, last activity |
| AgentSwimLaneContainer | `src/components/AgentSwimLaneContainer.vue` | Done | Multi-agent comparison view with filter support |
| ToastNotification | `src/components/ToastNotification.vue` | Done | Agent appearance alerts with auto-dismiss, Teleport to body |
| IntensityBar | `src/components/IntensityBar.vue` | Done | Log-scale heat level bar with tick marks and pulse animation |
| StatBadge | `src/components/stats/StatBadge.vue` | Done | Metric badge with value, label, icon, optional trend |
| EventTypesWidget | `src/components/widgets/EventTypesWidget.vue` | Done | Event type distribution with horizontal bars and percentages |
| TopToolsWidget | `src/components/widgets/TopToolsWidget.vue` | Done | Top 10 most-used tools ranked bar chart |
| StickScrollButton | `src/components/StickScrollButton.vue` | Deferred | Functionality built into EventTimeline already |
| AgentActivityWidget | `src/components/widgets/AgentActivityWidget.vue` | Deferred | Covered by AgentSwimLane tool breakdown |
| SessionTimelineWidget | `src/components/widgets/SessionTimelineWidget.vue` | Deferred | Phase 4 |
| TokenUsageWidget | `src/components/widgets/TokenUsageWidget.vue` | Deferred | Needs token data from JSONL (Phase 4) |

**Also added to App.vue:**
- Tab navigation (Timeline / Swim Lanes) with toggle buttons
- Stats sidebar with 4 StatBadges + TopToolsWidget + EventTypesWidget
- IntensityBar in header
- ToastNotification for new agent detection

**Verified 2026-02-17:** All components rendering correctly, both views functional, no Phase 2 regressions.

### Phase 4: Chat, Search & Security — COMPLETE

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| ChatTranscript | `src/components/ChatTranscript.vue` | Done | Chat bubble view with user/assistant/tool messages, obfuscation |
| obfuscate.ts | `src/utils/obfuscate.ts` | Done | Redacts API keys, bearer tokens, JWTs, emails, hex secrets |
| useBackgroundTasks | `src/composables/useBackgroundTasks.ts` | Done | Reactive task state with status filtering |
| useAdvancedMetrics | `src/composables/useAdvancedMetrics.ts` | Done | Aggregate metrics: tools, agents, sessions, duration, trend |
| useEventSearch | `src/composables/useEventSearch.ts` | Done | Full-text search with 200ms debounce across event fields |
| Search bar | `src/App.vue` | Done | Header search input integrated with useEventSearch |
| Chat tab | `src/App.vue` | Done | Third view tab alongside Timeline and Swim Lanes |
| ChatTranscriptModal | `src/components/ChatTranscriptModal.vue` | Deferred | Full-screen chat (ChatTranscript inline is sufficient) |
| ThemeManager | `src/components/ThemeManager.vue` | Deferred | Needs SQLite backend |
| ThemePreview | `src/components/ThemePreview.vue` | Deferred | Needs theme system |
| db.ts | `apps/server/src/db.ts` | Deferred | SQLite persistence (Phase 5) |
| theme.ts | `apps/server/src/theme.ts` | Deferred | Needs db.ts |
| haiku.ts | `src/utils/haiku.ts` | Deferred | Needs API key management |
| useHITLNotifications | `src/composables/useHITLNotifications.ts` | Deferred | Browser Notification API (Phase 5) |
| useTimelineIntelligence | `src/composables/useTimelineIntelligence.ts` | Deferred | AI clustering (Phase 5) |

**Verified 2026-02-17:** Chat transcript renders messages in bubble format, search filters events across all views, obfuscation redacts secrets in expanded payloads.

### Phase 5: Remote Agents, Polish & Production — NOT STARTED

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| RemoteAgentDashboard | `src/components/RemoteAgentDashboard.vue` | Todo | Remote agent monitoring tab |
| TabNavigation | `src/components/TabNavigation.vue` | Todo | Local/Remote tab switcher |
| useRemoteAgent | `src/composables/useRemoteAgent.ts` | Todo | Remote agent connection |
| useMediaQuery | `src/composables/useMediaQuery.ts` | Todo | Responsive breakpoints |
| useEventSearch | `src/composables/useEventSearch.ts` | Todo | Full-text event search |
| useThemes | `src/composables/useThemes.ts` | Todo | Theme switching/persistence |
| useAgentChartData | `src/composables/useAgentChartData.ts` | Todo | Per-agent chart data |
| useAgentContext | `src/composables/useAgentContext.ts` | Todo | Agent context enrichment |
| useChartData | `src/composables/useChartData.ts` | Todo | General chart data processing |
| chartRenderer.ts | `src/utils/chartRenderer.ts` | Todo | Reusable canvas chart drawing |
| Systemd service | N/A | Todo | Auto-start on boot |
| Event persistence | N/A | Todo | Optional SQLite for surviving restarts |

---

## ISC Verification Status

### All Passing (12/12)

- [x] ISC-C14: Bun server starts on port 4000 without errors
- [x] ISC-C15: WebSocket /stream accepts connections and sends initial events
- [x] ISC-C16: file-ingest watches JSONL transcripts from Claude projects
- [x] ISC-C17: REST endpoint /events/recent returns JSON event data
- [x] ISC-C18: task-watcher monitors /tmp/claude/ for background tasks
- [x] ISC-C19: Vue 3 dev server starts on port 5172 without errors
- [x] ISC-C20: WebSocket composable connects to backend and receives events
- [x] ISC-C21: EventTimeline renders real-time events with agent colors
- [x] ISC-C22: FilterPanel filters events by source session and type
- [x] ISC-C23: LivePulseChart shows canvas-based real-time activity visualization
- [x] ISC-A3: No macOS-specific code in any implementation file
- [x] ISC-A4: No modifications to existing PAI hooks or infrastructure

---

## Known Issues

| # | Issue | Severity | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Events lost on server restart | Medium | In-memory event store resets when server restarts. Page refresh after restart shows fewer/no events. | Add optional SQLite persistence (Phase 5) or read recent history on startup |
| 2 | Task dir may not exist | Low | `/tmp/claude/` tasks directory only exists when Claude spawns background agents. Server handles gracefully. | Already handled — periodic check for dir creation |
| 3 | No historical event loading | Medium | Server starts from END of JSONL files — events before server start are not visible. | Option to backfill N events from most recent files on startup |

---

## Key Decisions

1. **Zero custom hooks** — Dashboard reads Claude Code's native JSONL transcripts directly via `file-ingest.ts`. No new hooks added to settings.json.
2. **In-memory first** — Events stored in-memory (max 1000) for simplicity. SQLite persistence deferred to Phase 5.
3. **Byte-position tracking** — Uses `Buffer.subarray()` not `String.slice()` for reading new JSONL content. Critical fix for correct byte-offset tracking.
4. **2-second polling backup** — `fs.watch` + 2-second `setInterval` polling as fallback. Linux inotify can miss rapid writes.
5. **Vue 3 Composition API** — No Pinia (state library). All state via `ref()` composables. Matches Daniel's original architecture.

---

## Reference

- **Full PRD:** `PRD-20260217-pai-observability-server.md` (1100 lines — complete architecture from actual PAI source)
- **Original source:** `Releases/v2.3/.claude/Observability/` in github.com/danielmiessler/PAI
- **Reference impl:** github.com/disler/claude-code-hooks-multi-agent-observability
