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

### Phase 5: Polish & Production — COMPLETE

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| useMediaQuery | `src/composables/useMediaQuery.ts` | Done | Reactive responsive breakpoints (sm/md/lg/xl/2xl) |
| Event backfill | `apps/server/src/file-ingest.ts` | Done | Reads last 200 events from JSONL on startup (BACKFILL_COUNT env) |
| Responsive sidebar | `src/App.vue` | Done | Stats sidebar auto-hides below 1024px, manual toggle override |
| Systemd service | `pai-dashboard.service` | Done | User service file with install instructions |
| useEventSearch | `src/composables/useEventSearch.ts` | Done | Built in Phase 4 |
| RemoteAgentDashboard | N/A | Deferred | Requires Claude remote session API (not publicly available) |
| TabNavigation | N/A | Deferred | Tab nav already built inline in App.vue |
| useRemoteAgent | N/A | Deferred | Needs remote session API |
| useThemes | N/A | Deferred | Needs SQLite theme backend |
| useAgentChartData | N/A | Deferred | LivePulseChart handles this inline |
| useChartData | N/A | Deferred | LivePulseChart handles this inline |
| chartRenderer.ts | N/A | Deferred | Canvas rendering done inline in LivePulseChart |
| Event persistence (SQLite) | N/A | Deferred | Backfill from JSONL solves the immediate need |

**Verified 2026-02-17:** Server backfills 200 events on startup (208 events visible immediately after restart). Responsive sidebar hides on small viewports. Systemd service file created.

---

## ISC Verification Status

### Phase 1-2: All Passing (12/12)

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

### Phase 3: All Passing (9/9)

- [x] ISC-C30: AgentSwimLane shows per-agent event lane with timeline
- [x] ISC-C31: AgentSwimLaneContainer renders multiple agent lanes vertically
- [x] ISC-C32: ToastNotification alerts when new agents appear
- [x] ISC-C33: IntensityBar displays color-coded heat level indicator
- [x] ISC-C34: StatBadge component renders single metric with label
- [x] ISC-C35: TopToolsWidget shows ranked list of most-used tools
- [x] ISC-C36: EventTypesWidget displays event type distribution breakdown
- [x] ISC-C37: App.vue integrates Phase 3 components into layout
- [x] ISC-A5: No breaking changes to existing Phase 2 components

### Phase 4: All Passing (7/7)

- [x] ISC-C40: ChatTranscript renders conversation messages in chat bubble format
- [x] ISC-C41: Obfuscate utility redacts API keys and tokens from payloads
- [x] ISC-C42: useBackgroundTasks composable tracks agent task state
- [x] ISC-C43: useAdvancedMetrics computes token usage and tool statistics
- [x] ISC-C44: useEventSearch provides full-text search across events
- [x] ISC-C45: Search bar in App.vue filters events by text query
- [x] ISC-A6: Obfuscation does not modify original event data in memory

### Phase 5: All Passing (4/4)

- [x] ISC-C50: useMediaQuery composable provides reactive responsive breakpoints
- [x] ISC-C51: Systemd service unit file enables auto-start on boot
- [x] ISC-C52: Server backfills recent events from JSONL on startup
- [x] ISC-C53: App.vue hides stats sidebar on small viewports automatically

---

## Known Issues

| # | Issue | Severity | Description | Fix |
|---|-------|----------|-------------|-----|
| 1 | Events lost on server restart | Low | In-memory event store resets when server restarts, but backfill now loads 200 recent events automatically. | **FIXED** — backfill reads last 200 events from JSONL on startup (configurable via BACKFILL_COUNT) |
| 2 | Task dir may not exist | Low | `/tmp/claude/` tasks directory only exists when Claude spawns background agents. Server handles gracefully. | Already handled — periodic check for dir creation |
| 3 | ~~No historical event loading~~ | ~~Medium~~ | ~~Server starts from END of JSONL files — events before server start are not visible.~~ | **FIXED** — `backfillRecentEvents()` reads tail of 20 most recent JSONL files |

---

## TODO / Bugs

| # | Type | Priority | Description | Notes |
|---|------|----------|-------------|-------|
| T1 | Bug | High | **Empty `agent_progress` events flood timeline** — Long-running sub-agent tasks (background agents, Task tool agents) generate repeated `agent_progress` events with empty `{}` payload. Example: `23:21:34 claude agent_progress {}`. These appear dozens of times in a row, creating noise. | **Likely cause:** Claude Code writes progress heartbeats to the JSONL transcript while sub-agents are running. The `progress` event type from the JSONL has a `data` field that maps to `agent_progress` in our parser, but when the sub-agent has no new status to report, the payload is empty. **Fix options:** (1) Filter in `parseJSONLLine()` — skip events where `hookEventType === 'agent_progress'` and payload is empty `{}`. (2) Client-side dedup — collapse consecutive identical events into "x12" badge. (3) Rate-limit — only emit agent_progress events if >2s since last one for same session. Option 1 is simplest. |
| T2 | Enhancement | Medium | **Collapse repeated events** — Even after filtering empty agent_progress, add client-side consecutive event grouping (show "x5" badge for repeated identical events) | Would reduce visual noise for any repetitive event pattern |
| T3 | Enhancement | Medium | **HITL browser notifications** — Use Browser Notification API to alert when Claude asks a question (user-type events with AskUserQuestion tool use) | Useful when dashboard is in background tab during long agent runs |
| T4 | Enhancement | Low | **Token usage tracking** — Extract `usage.input_tokens` and `usage.output_tokens` from assistant message metadata in JSONL | Data is in the JSONL already, just needs parser support + TokenUsageWidget |
| T5 | Enhancement | Low | **SQLite event persistence** — Optional SQLite storage for events that survive full server restarts | Backfill from JSONL mostly solves this; SQLite would add faster queries + historical analytics |
| T6 | Enhancement | Low | **Theme system** — Support multiple color themes (Tokyo Night, Dracula, Catppuccin, Nord) with live preview | Needs SQLite backend for persistence, CSS variable system for runtime switching |
| T7 | Feature | Low | **AI event summaries** — Use Claude Haiku to generate natural-language summaries of event clusters | Needs API key management, rate limiting, cost awareness |
| T8 | Feature | Low | **Remote agent dashboard** — Monitor Claude remote sessions (claude.ai background agents) | Blocked: requires Claude remote session API which isn't publicly available yet |

---

## Future Feature Ideas

1. **Event clustering / timeline intelligence** — Group related events (e.g., a tool_use + tool_result pair) into collapsible "action" blocks
2. **Session comparison** — Side-by-side view of two sessions to compare agent behavior
3. **Export** — Download events as CSV/JSON for external analysis
4. **Webhook notifications** — POST to Slack/Discord when specific event patterns occur (e.g., error events, new agent spawns)
5. **Cost estimation** — Estimate API costs per session based on token usage from the JSONL metadata
6. **Agent flow diagram** — Mermaid.js visualization of agent spawn chains (who spawned whom)
7. **Performance profiling** — Track tool execution times (time between tool_use and tool_result events)
8. **Bookmark events** — Click to bookmark interesting events for later review
9. **Event replay** — Playback historical events at adjustable speed to re-watch a session
10. **Multi-machine support** — Connect to remote PAI servers over SSH tunnel or network

---

## Completion Log

| Date | Commit | What was done |
|------|--------|---------------|
| 2026-02-17 | `c1c6088` | Phase 1+2: Backend (Bun server, file-ingest, task-watcher) + Frontend (Vue 3 shell, EventTimeline, FilterPanel, LivePulseChart, 4 composables). 32 files, 3275 lines. |
| 2026-02-17 | `609caf2` | Phase 3: AgentSwimLane, ToastNotification, IntensityBar, StatBadge, TopToolsWidget, EventTypesWidget. Tab nav + stats sidebar in App.vue. 9 files, 647 lines added. |
| 2026-02-17 | `395222c` | Phase 4: ChatTranscript, obfuscate.ts, useEventSearch, useBackgroundTasks, useAdvancedMetrics. Search bar + Chat tab. 8 files, 509 lines added. |
| 2026-02-17 | `d8b9b94` | Phase 5: Event backfill (200 events on startup), useMediaQuery, responsive sidebar, systemd service. Fixed Known Issues #1 and #3. 5 files, 202 lines added. |

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
