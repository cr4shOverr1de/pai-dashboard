---
prd: true
id: PRD-20260217-pai-observability-server
status: PLANNED
mode: interactive
effort_level: Extended
created: 2026-02-17
updated: 2026-02-17
iteration: 0
maxIterations: 128
loopStatus: null
last_phase: null
failing_criteria: []
verification_summary: "0/0"
parent: null
children: []
---

# PAI Observability Server — Full Implementation Plan

> A real-time dashboard for monitoring PAI Algorithm sessions, agent spawns, ISC criteria tracking, and loop mode progress. Built to achieve feature parity with Daniel Miessler's unreleased Observability Server, consuming the existing AlgorithmState data layer.

## STATUS

| What | State |
|------|-------|
| Progress | 0/38 criteria passing |
| Phase | PLANNED |
| Next action | Implementation (BUILD phase) |
| Blocked by | Nothing — plan complete, ready to build |

---

## PART 1: RESEARCH FINDINGS

### 1.1 What Is the PAI Observability Server?

The PAI Observability Server is an unreleased component of Daniel Miessler's PAI (Personal AI Infrastructure) system. It provides a **real-time web dashboard** that monitors Algorithm execution across multiple concurrent sessions. It was demonstrated in video by Daniel but explicitly stated as not yet publicly released.

**Key evidence sources:**
- [Confirmed] PAI GitHub repo `PLATFORM.md` references `pai-observability-server/src/Observability/manage.sh`
- [Confirmed] DeepWiki analysis describes it as feature pack **`kai-observability-server` v1.0.0** installing to `$PAI_DIR/Observability/`
- [Confirmed] `PLATFORM.md` notes macOS-specific hardcoded paths (`/opt/homebrew/bin`) requiring cross-platform porting
- [Confirmed] Algorithm SKILL.md extensively references "dashboard integration" and "dashboard phase-progression tracking"
- [Confirmed] `algorithm.ts` CLI explicitly writes state for dashboard consumption with comments like "Dashboard: Create loop session"
- [Confirmed — DeepWiki] Vue.js frontend (SPA) on port **5172**, WebSocket backend on port **4000**
- [Confirmed — DeepWiki] `manage.sh` script for lifecycle management (start/stop/status)
- [Confirmed — DeepWiki] `capture-all-events.ts` hook intercepts ALL 6 hook event types → writes JSONL
- [Confirmed — DeepWiki] `file-ingest.ts` watches JSONL files → forwards events to WebSocket server
- [Confirmed — DeepWiki] WebSocket endpoint at `/stream` on port 4000
- [Confirmed — DeepWiki] `PAI_OBSERVABILITY_URL` env var for dashboard endpoint configuration
- [Confirmed — DeepWiki] Design principle: "If observability crashes, core functionality continues"
- [Confirmed — Video research] Semgrep Secure 2026 live demo (Feb 25, 2026) — best public video source
- [Confirmed — Video research] Open-source reference: `disler/claude-code-hooks-multi-agent-observability` — same architectural pattern
- [Confirmed — Video research] Dashboard tracks: skills invoked, hooks executed, agents spawned, workflow notifications, algorithm phase progression, session lifecycle, multi-agent coordination
- [Confirmed — Video research] Cognitive Revolution podcast: Daniel discussed multi-layered memory, orchestration, armies of AI agents
- [Confirmed — Video research] 8 event types captured (not 6): adds SessionEnd and specialized hook data

### 1.1.0 Video & Media Research Findings

**Confirmed Video Sources:**

| Source | Description | URL |
|--------|-------------|-----|
| Semgrep Secure 2026 | Live PAI demo + Q&A (Feb 25, 2026) — best visual reference | [semgrep.dev/events](https://semgrep.dev/events/building-your-personal-ai-infrastructure-with-daniel-miessler/) |
| Cognitive Revolution Podcast | TELOS, multi-agent orchestration, memory design | [cognitiverevolution.ai](https://www.cognitiverevolution.ai/pioneering-pai-how-daniel-miessler-s-personal-ai-infrastructure-activates-human-agency-creativity/) |
| PAI v2 Walkthrough (July 2025) | 40-minute full system walkthrough | [danielmiessler.com/blog](https://danielmiessler.com/blog/personal-ai-infrastructure) |
| Kai Launch Video (2025) | Step-by-step guide to building components | [newsletter](https://newsletter.danielmiessler.com/p/building-your-own-ai-powered-life-management-system) |
| UL NO. 515 (Feb 7, 2026) | Deep-dive video and slides | [newsletter](https://newsletter.danielmiessler.com/p/unsupervised-learning-no-515) |

**Open-Source Reference Implementation:**

The project [`disler/claude-code-hooks-multi-agent-observability`](https://github.com/disler/claude-code-hooks-multi-agent-observability) provides the best publicly available visual and code reference for what a PAI-style observability dashboard looks like. Architecture:

```
Claude Agents → Python Hook Scripts → HTTP POST → Bun Server (TypeScript) → SQLite → WebSocket → Vue 3 Client
```

**Dashboard features in the reference implementation:**
- Real-time event timeline with auto-scrolling
- Multi-criteria filtering by app, session, and event type
- Live pulse chart showing activity patterns with session-colored bars
- Chat transcript viewer with syntax highlighting
- Tool-specific emoji indicators for visual categorization
- Dual-color system for app identity + session context
- Agent swim lane filtering to inspect individual agent behavior
- Task lifecycle tracking (TaskCreate, TaskUpdate, SendMessage events)
- Canvas-based charting for activity visualization
- 12 event types tracked (vs PAI's 8)

> **Build recommendation:** Clone this repo and study its Vue components and WebSocket protocol before building our own. It's the closest public analog to Dan's private dashboard.

**What the PAI Dashboard Displays (confirmed from multiple corroborating sources):**
- Skills invoked during a session
- Hooks executed (which of the 8 lifecycle hooks fired)
- Agents spawned (20+ types: Explore, Plan, Engineer, Researcher, Architect, Designer, etc.)
- Workflow notifications in real-time
- Algorithm phase progression (OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN)
- Session lifecycle (start/end tracking across concurrent sessions)
- Multi-agent coordination visualization

**What was NOT found publicly:**
- No screenshots or direct visual captures of Daniel's actual dashboard UI
- No direct YouTube URLs (videos may be behind Substack paywalls)
- No Reddit or HackerNews threads about the dashboard specifically
- The actual Vue components/CSS/server code is in the private pack portion

### 1.1.1 DeepWiki Deep Dive — `kai-observability-server` Architecture

Source: [DeepWiki PAI Analysis](https://deepwiki.com/danielmiessler/PAI/4-observability-and-monitoring)

The observability server operates through a **4-stage event pipeline:**

```
Stage 1: Event Capture          Stage 2: File Buffering
┌─────────────────────────┐     ┌────────────────────────────────────────┐
│ capture-all-events.ts   │────►│ history/raw-outputs/                   │
│ (hook — intercepts ALL  │     │   YYYY-MM-DD_all-events.jsonl          │
│  6 hook event types)    │     │                                        │
└─────────────────────────┘     └────────────────────┬───────────────────┘
                                                     │
Stage 3: File Ingestion         Stage 4: Broadcasting│& Display
┌─────────────────────────┐     ┌────────────────────▼───────────────────┐
│ file-ingest.ts           │────►│ WebSocket Server :4000/stream          │
│ (fs.watch on JSONL dir) │     │   → Vue Dashboard :5172                │
└─────────────────────────┘     └────────────────────────────────────────┘
```

**Core source files:**

| File | Role |
|------|------|
| `capture-all-events.ts` | Hook: intercepts PreToolUse, PostToolUse, Stop, SubagentStop, SessionStart, UserPromptSubmit → writes JSONL |
| `file-ingest.ts` | File watcher: monitors JSONL output directory, reads new events, forwards to WebSocket |
| `index.ts` | WebSocket server entry point (port 4000, endpoint `/stream`) |
| `App.vue` | Vue dashboard root component (port 5172) |
| `manage.sh` | Lifecycle management: start/stop/status |

**Event payload captured by `capture-all-events.ts`:**
- Agent source ID
- Session ID
- Event type (one of 6 hook types)
- Full event payload (tool_name, tool_input, tool_result, etc.)
- Unix timestamp + human-readable timestamp
- Agent instance metadata

**Dashboard features confirmed by DeepWiki:**
- Real-time event display — agent operations rendered as they occur
- Multi-agent monitoring — simultaneous tracking of parallel agent sessions
- Event type filtering — targeted observation by event category
- Agent state visualization — completion status and output routing display

**Configuration:**
- `PAI_OBSERVABILITY_URL` — Dashboard endpoint URL (default: `http://localhost:4000/events`)
- `DA` — AI assistant name for event labeling
- API keys centralized in `$PAI_DIR/.env`

**Design principles:**
1. **Independent failure / fail silently** — dashboard crashes don't affect PAI core
2. **Fire-and-forget hooks** — all hooks complete in 1-2ms using async spawning, exit code 0
3. **Non-blocking pipeline** — events flow asynchronously, never gate the primary AI execution

**Integration dependencies:**
- `kai-hook-system` v1.0.0 — provides the raw event stream
- `kai-history-system` v1.0.0 — generates JSONL files (also reads from learnings/, sessions/, research/, decisions/)
- `kai-voice-system` v1.1.0 — voice events captured in the event stream

### 1.2 The Existing Data Layer (GROUND TRUTH — from local codebase analysis)

Trevor's PAI installation **already generates all the data** the dashboard needs. The data layer is complete and actively writing state on every Algorithm execution.

#### 1.2.1 AlgorithmState Interface (Full Schema)

Source: `~/.claude/hooks/lib/algorithm-state.ts`

```typescript
interface AlgorithmState {
  // Session identity
  active: boolean;
  sessionId: string;
  taskDescription: string;
  currentAction?: string;

  // Phase progression
  currentPhase: AlgorithmPhase; // OBSERVE|THINK|PLAN|BUILD|EXECUTE|VERIFY|LEARN|IDLE|COMPLETE
  phaseStartedAt: number;      // Unix ms
  algorithmStartedAt: number;  // Unix ms
  phaseHistory: PhaseEntry[];  // Full timeline with durations

  // Effort level
  sla: 'Instant'|'Fast'|'Standard'|'Extended'|'Advanced'|'Deep'|'Comprehensive'|'Loop';
  effortLevel?: string; // Same as sla — preferred by UI

  // ISC Criteria
  criteria: AlgorithmCriterion[];
  // Each: { id, description, type: 'criterion'|'anti-criterion',
  //         status: 'pending'|'in_progress'|'completed'|'failed',
  //         evidence?, createdInPhase, taskId? }

  // Agent tracking
  agents: AlgorithmAgent[];
  // Each: { name, agentType, status, task?, criteriaIds?, phase? }

  // Capabilities
  capabilities: string[];

  // Quality gate
  qualityGate?: { count, length, state, testable, anti, open: boolean };

  // PRD linkage
  prdPath?: string;

  // Completion
  completedAt?: number;
  summary?: string;
  abandoned?: boolean;

  // Rework tracking
  reworkCount?: number;
  isRework?: boolean;
  reworkHistory?: ReworkCycle[];
  previousNames?: Array<{ name: string; changedAt: string }>;

  // Loop mode
  loopMode?: boolean;
  loopIteration?: number;
  loopMaxIterations?: number;
  loopPrdId?: string;
  loopPrdPath?: string;
  loopHistory?: Array<{
    iteration: number;
    startedAt: number;
    completedAt: number;
    criteriaPassing: number;
    criteriaTotal: number;
    sdkSessionId?: string;
  }>;
  parallelAgents?: number;
  mode?: 'loop'|'interactive'|'standard';
}

interface PhaseEntry {
  phase: AlgorithmPhase;
  startedAt: number;
  completedAt?: number;
  criteriaCount: number;
  agentCount: number;
  isRework?: boolean;
  reworkIteration?: number;
}

interface ReworkCycle {
  iteration: number;
  startedAt: number;
  completedAt: number;
  fromPhase: AlgorithmPhase;
  toPhase: AlgorithmPhase;
  criteria: AlgorithmCriterion[];
  summary?: string;
  effortLevel: string;
  phaseHistory: PhaseEntry[];
}
```

#### 1.2.2 Data File Locations

| File | Location | Purpose |
|------|----------|---------|
| Per-session state | `MEMORY/STATE/algorithms/{sessionId}.json` | Full AlgorithmState per session |
| Session names | `MEMORY/STATE/session-names.json` | Human-readable names for sessions |
| Kitty tab sessions | `MEMORY/STATE/kitty-sessions/{sessionId}.json` | Terminal tab associations |
| Tab titles | `MEMORY/STATE/tab-titles/{tabId}.json` | Current tab title/phase |
| Algorithm phase (legacy) | `MEMORY/STATE/algorithm-phase.json` | Single-session state (legacy writer) |
| Current work | `MEMORY/STATE/current-work.json` | Active session/task pointer |
| Voice events | `MEMORY/VOICE/voice-events.jsonl` | Voice notification log |
| Algorithm reflections | `MEMORY/LEARNING/REFLECTIONS/algorithm-reflections.jsonl` | Post-session reflections |
| PRD files | `MEMORY/WORK/{session-slug}/PRD-*.md` or project `.prd/` | Persistent criteria on disk |

#### 1.2.3 Data Writers (Hooks & Tools)

| Writer | Trigger | What It Writes |
|--------|---------|---------------|
| `AlgorithmTracker.hook.ts` | PostToolUse: Bash, TaskCreate, TaskUpdate, Task | Phase transitions, criteria add/update, agent spawns, effort level inference |
| `VoiceGate.hook.ts` | PreToolUse: Bash | Phase detection from voice curls, rework detection, tab updates |
| `StopOrchestrator` handler | Stop event | algorithmEnd() enrichment, sweepStaleActive() cleanup |
| `algorithm.ts` CLI | Loop mode execution | createLoopState, updateLoopStateForIteration, finalizeLoopState |
| `AlgorithmPhaseReport.ts` | CLI tool | Phase, criterion, agent, capabilities state writes |

#### 1.2.4 Existing Infrastructure to Integrate With

| Component | Port | Purpose |
|-----------|------|---------|
| VoiceServer | 8888 | TTS notifications + desktop alerts |
| VoiceServer `/health` | 8888 | Health check endpoint |
| VoiceServer `/notify` | 8888 | POST notifications with voice |

### 1.3 What the Dashboard Tracks (Feature Inventory)

Every feature below is derived from the AlgorithmState data model and confirmed code references. Evidence tags indicate source confidence.

#### Session Monitoring [Confirmed — from AlgorithmState schema + algorithm.ts comments]

| Feature | Data Source | Evidence |
|---------|------------|---------|
| Multi-session overview | `algorithms/*.json` directory listing | `session-names.json for dashboard display` (algorithm.ts:18) |
| Session active/completed state | `state.active`, `state.completedAt` | AlgorithmState interface |
| Session naming | `session-names.json` | `writeSessionName()` in algorithm.ts |
| Abandoned session detection | `state.abandoned` | `algorithmAbandon()` in algorithm-state.ts |
| Stale session sweep | `sweepStaleActive()` | Phase-aware thresholds (15-60min) |

#### Phase Progression [Confirmed — from AlgorithmState.phaseHistory + hook code]

| Feature | Data Source | Evidence |
|---------|------------|---------|
| 7-phase timeline (OBSERVE→LEARN) | `state.phaseHistory[]` | Complete timing per phase |
| Phase duration calculation | `completedAt - startedAt` per PhaseEntry | PhaseEntry interface |
| Current phase highlighting | `state.currentPhase` | Updated in real-time by hooks |
| Phase-specific metadata | `criteriaCount`, `agentCount` per phase | PhaseEntry interface |

#### ISC Criteria Tracking [Confirmed — from AlgorithmCriterion schema + hook interception]

| Feature | Data Source | Evidence |
|---------|------------|---------|
| Criteria list with pass/fail | `state.criteria[]` | AlgorithmTracker criteriaAdd/criteriaUpdate |
| Criterion type (criterion/anti-criterion) | `criterion.type` | `id.startsWith('ISC-A')` detection |
| Criterion status lifecycle | pending → in_progress → completed/failed | TaskUpdate interception |
| Evidence capture | `criterion.evidence` | Written on completion |
| Created-in-phase tagging | `criterion.createdInPhase` | Set at creation time |
| Progress calculation | Count completed vs total | `criteriaInfo.passing/total` in algorithm.ts |

#### Agent Monitoring [Confirmed — from AlgorithmAgent schema + Task interception]

| Feature | Data Source | Evidence |
|---------|------------|---------|
| Agent spawn detection | `state.agents[]` | AlgorithmTracker agentAdd() |
| Agent type classification | `agent.agentType` | Engineer, Architect, general-purpose, etc. |
| Agent status tracking | `agent.status` | active, completed, failed |
| Task assignment display | `agent.task` | Description of agent's work |
| Criteria-to-agent mapping | `agent.criteriaIds` | Which ISC the agent owns |
| Phase-when-spawned | `agent.phase` | When in the algorithm it appeared |

#### Effort Level & Quality Gate [Confirmed — from AlgorithmState schema]

| Feature | Data Source | Evidence |
|---------|------------|---------|
| Effort level display | `state.sla` / `state.effortLevel` | 8 tiers: Instant→Loop |
| Real-time effort inference | Auto-upgrade from criteria count | AlgorithmTracker: >=12→Extended, >=20→Advanced, >=40→Deep |
| Quality gate dashboard | `state.qualityGate` | 5 checks: count, length, state, testable, anti |
| Gate open/blocked status | `qualityGate.open` | Boolean |

#### Rework Detection [Confirmed — from ReworkCycle schema + hook code]

| Feature | Data Source | Evidence |
|---------|------------|---------|
| Rework cycle counting | `state.reworkCount` | Incremented on re-entry to OBSERVE after completion |
| Rework history archive | `state.reworkHistory[]` | Full criteria + phaseHistory per cycle |
| Previous name tracking | `state.previousNames[]` | Name changes across reworks |
| Voice notification on rework | VoiceGate fetch() | `Re-entering algorithm. Rework iteration N.` |

#### Loop Mode Monitoring [Confirmed — from LoopAlgorithmState in algorithm.ts]

| Feature | Data Source | Evidence |
|---------|------------|---------|
| Loop iteration counter | `state.loopIteration` / `state.loopMaxIterations` | algorithm.ts line 440 |
| Per-iteration history | `state.loopHistory[]` | iteration, startedAt, completedAt, passing/total |
| Criteria convergence tracking | `loopHistory[].criteriaPassing / criteriaTotal` | Shows progress over iterations |
| Parallel agent count | `state.parallelAgents` | `-a` flag from CLI |
| PRD linkage | `state.loopPrdId`, `state.loopPrdPath` | Links to source PRD |
| Loop outcome | completed/failed/blocked/paused/stopped | `finalizeLoopState()` |
| Progress bar rendering | `bar()` function in algorithm.ts | `████████████░░░░░░░░ 67%` |

#### Capabilities & Mode Display [Confirmed — from code comments]

| Feature | Data Source | Evidence |
|---------|------------|---------|
| Selected capabilities list | `state.capabilities[]` | e.g., ["Task Tool", "SDK", "Loop Runner"] |
| Execution mode indicator | `state.mode` | "Effort level hidden when mode === 'loop'" (SKILL.md) |
| PRD path display | `state.prdPath` | Link to associated PRD file |

### 1.4 Source Code Analysis (AUTHORITATIVE — from PAI GitHub `Releases/v2.3/.claude/Observability/`)

**Source:** `Releases/v2.3/.claude/Observability/` in the [PAI GitHub repo](https://github.com/danielmiessler/PAI). This is the actual source code — everything below is ground truth, not inference.

#### 1.4.1 Architecture (CORRECTED — No Custom Event Hook Needed)

The original DeepWiki research described a `capture-all-events.ts` hook writing to JSONL. **This is wrong.** The actual `file-ingest.ts` reads Claude Code's **native JSONL session transcripts** directly from `~/.claude/projects/`. No custom event capture hook is needed — Claude Code already writes everything.

**Actual data flow:**
```
Claude Code → writes JSONL session transcripts → ~/.claude/projects/{project-hash}/{session-id}.jsonl
                                                          │
                                                          ▼
file-ingest.ts (fs.watch) → reads new lines → parses to HookEvent → in-memory store (last 1000)
                                                          │
                                                          ▼
task-watcher.ts (fs.watch) → reads /tmp/claude/ task output files → BackgroundTask store
                                                          │
                                                          ▼
index.ts (Bun.serve port 4000) → WebSocket /stream → Vue 3 client (port 5172)
```

#### 1.4.2 Complete Directory Tree (Actual)

```
Observability/
├── manage.sh                          # Lifecycle: start/stop/restart/status/start-detached
├── MenuBarApp/                        # macOS Swift menu bar app (SKIP for Linux)
│   ├── ObservabilityApp.swift
│   ├── Info.plist
│   ├── build.sh
│   └── Observability.app/
├── Tools/
│   └── ManageServer.ts                # CLI tool for server management
├── scripts/
│   ├── start-agent-observability-dashboard.sh
│   ├── reset-system.sh
│   └── test-system.sh
└── apps/
    ├── server/                        # Bun backend (port 4000)
    │   ├── package.json               # v1.2.0, zero runtime deps
    │   ├── bun.lock
    │   └── src/
    │       ├── index.ts               # Bun.serve: HTTP + WebSocket /stream
    │       ├── file-ingest.ts         # Watches ~/.claude/projects/ JSONL transcripts
    │       ├── task-watcher.ts        # Watches /tmp/claude/ background task outputs
    │       ├── db.ts                  # SQLite (bun:sqlite) — themes ONLY
    │       ├── theme.ts               # Theme CRUD operations
    │       └── types.ts               # HookEvent, Theme, HITL interfaces
    └── client/                        # Vue 3 frontend (port 5172)
        ├── package.json               # v1.2.0, vue 3.5.17, vite 7.0.4
        ├── index.html
        ├── vite.config.ts
        ├── tailwind.config.js         # Tailwind CSS 3.4.16
        ├── postcss.config.js
        ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
        └── src/
            ├── App.vue                # Root: tab navigation, glass panels, gradient BG
            ├── main.ts
            ├── types.ts               # Client-side HookEvent, BackgroundTask, HITL, Chart types
            ├── vite-env.d.ts
            ├── style.css
            ├── assets/
            │   ├── fonts.css
            │   ├── fonts/
            │   └── vue.svg
            ├── styles/
            │   ├── main.css
            │   ├── compact.css
            │   └── themes.css         # Tokyo Night theme system CSS
            ├── types/
            │   └── theme.ts
            ├── utils/
            │   ├── chartRenderer.ts   # Canvas-based chart drawing
            │   ├── haiku.ts           # Claude Haiku API client for summaries
            │   └── obfuscate.ts       # Security: redacts API keys, tokens, PII
            ├── composables/           # 16 Vue composables
            │   ├── useWebSocket.ts    # Auto-connect, reconnect, event buffering
            │   ├── useAdvancedMetrics.ts  # Token usage, tool stats, agent activity
            │   ├── useAgentChartData.ts   # Per-agent chart data
            │   ├── useAgentContext.ts     # Agent context enrichment
            │   ├── useBackgroundTasks.ts  # Background task state
            │   ├── useChartData.ts        # General chart data processing
            │   ├── useEventColors.ts      # Tokyo Night color system for events/agents
            │   ├── useEventEmojis.ts      # Tool/event type emoji indicators
            │   ├── useEventSearch.ts      # Full-text event search
            │   ├── useHITLNotifications.ts # Browser notifications for HITL requests
            │   ├── useHeatLevel.ts        # Activity intensity: Cold→Inferno (6 levels)
            │   ├── useMediaQuery.ts       # Responsive design breakpoints
            │   ├── useRemoteAgent.ts      # Remote agent monitoring
            │   ├── useThemes.ts           # Theme switching and persistence
            │   ├── useTimelineIntelligence.ts # AI-powered event clustering
            │   └── __tests__/             # Composable tests
            └── components/
                ├── AgentSwimLane.vue           # Per-agent event lane
                ├── AgentSwimLaneContainer.vue  # Multi-agent swim lane comparison
                ├── ChatTranscript.vue          # Chat history viewer
                ├── ChatTranscriptModal.vue     # Full-screen transcript modal
                ├── EventRow.vue                # Single event with expand/collapse
                ├── EventTimeline.vue           # Main event feed with auto-scroll
                ├── FilterPanel.vue             # Event type + session filtering
                ├── IntensityBar.vue            # Heat level indicator bar
                ├── LivePulseChart.vue          # Real-time activity pulse (canvas)
                ├── RemoteAgentDashboard.vue    # Remote agent monitoring tab
                ├── StickScrollButton.vue       # Auto-scroll toggle
                ├── TabNavigation.vue           # Local/Remote tab switcher
                ├── ThemeManager.vue            # Theme CRUD UI
                ├── ThemePreview.vue            # Live theme color preview
                ├── ToastNotification.vue       # Agent appearance toasts
                ├── stats/
                │   └── StatBadge.vue           # Metric badge component
                └── widgets/
                    ├── AgentActivityWidget.vue     # Agent event distribution
                    ├── EventTypesWidget.vue        # Event type breakdown
                    ├── SessionTimelineWidget.vue   # Session activity timeline
                    ├── TokenUsageWidget.vue        # Token consumption display
                    ├── TopToolsWidget.vue          # Most-used tools ranking
                    └── widget-base.css             # Shared widget styles
```

#### 1.4.3 Actual Tech Stack (from package.json)

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Vue | 3.5.17 |
| **Build** | Vite | 7.0.4 |
| **CSS** | Tailwind CSS | 3.4.16 |
| **Icons** | lucide-vue-next | 0.548.0 |
| **TypeScript** | TypeScript | 5.8.3 |
| **Backend** | Bun.serve (HTTP + WebSocket) | latest |
| **Database** | bun:sqlite | built-in (themes only) |
| **Charts** | Custom canvas rendering | chartRenderer.ts |
| **AI Features** | Claude Haiku 4.5 | via Anthropic API |
| **Runtime** | Bun | latest |

**Notable: NO Pinia, NO shadcn-vue, NO Chart.js/ECharts.** The actual dashboard uses Vue's native `ref()` composables pattern for state (no store library) and custom canvas rendering for charts.

#### 1.4.4 Actual HookEvent Interface (from types.ts)

```typescript
interface HookEvent {
  id?: number;
  source_app: string;          // e.g., "claude-code", "engineer", "architect"
  session_id: string;
  agent_name?: string;         // Enriched from MEMORY/STATE/agent-sessions.json
  hook_event_type: string;     // PreToolUse, PostToolUse, Stop, UserPromptSubmit, Completed
  payload: Record<string, any>;
  chat?: any[];
  summary?: string;
  timestamp?: number;          // Unix ms
  model_name?: string;

  // Human-in-the-Loop
  humanInTheLoop?: {
    question: string;
    responseWebSocketUrl: string;
    type: 'question' | 'permission' | 'choice';
    choices?: string[];
    timeout?: number;
    requiresResponse?: boolean;
  };
  humanInTheLoopStatus?: {
    status: 'pending' | 'responded' | 'timeout' | 'error';
    respondedAt?: number;
    response?: HumanInTheLoopResponse;
  };

  // Todo tracking
  todos?: TodoItem[];
  completedTodos?: TodoItem[];
}
```

#### 1.4.5 Actual WebSocket Protocol

```typescript
// Server → Client:
{ type: 'initial', data: HookEvent[] }     // Last 50 events on connect
{ type: 'event', data: HookEvent }         // Real-time event stream
{ type: 'task_update', data: BackgroundTask } // Background task state change

// Client → Server: (none currently — one-way push)
```

#### 1.4.6 Actual REST Endpoints (from index.ts)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/events/filter-options` | GET | Available source_apps, session_ids, hook_event_types |
| `/events/recent` | GET | Last N events (default 100) |
| `/events/by-agent/:name` | GET | Events filtered by agent name |
| `/api/themes` | GET/POST | List/create themes |
| `/api/themes/:id` | GET/PUT/DELETE | Theme CRUD |
| `/api/themes/:id/export` | GET | Export theme as JSON download |
| `/api/themes/import` | POST | Import theme JSON |
| `/api/themes/stats` | GET | Theme statistics |
| `/api/activities` | GET | Kitty terminal tab titles (via `kitty @ ls`) |
| `/api/haiku/summarize` | POST | Claude Haiku proxy for event summarization |
| `/api/tasks` | GET | All background tasks |
| `/api/tasks/:id` | GET | Single background task detail |
| `/api/tasks/:id/output` | GET | Full task output text |
| `/stream` | WebSocket | Real-time event + task stream |

#### 1.4.7 Key Features (from actual source code)

**1. Security Obfuscation** (`utils/obfuscate.ts`):
- Redacts API keys (OpenAI, Anthropic, Google, AWS, GitHub, Stripe)
- Masks JWT tokens, bearer tokens, passwords, secrets
- Hides private IPs, credit card numbers, SSNs
- Preserves `.claude/` directory paths (intentionally not redacted)

**2. Heat Level System** (`composables/useHeatLevel.ts`):
- 6-level intensity scale: Cold → Cool → Warm → Hot → Fire → Inferno
- Logarithmic thresholds: 4, 8, 16, 32, 64, 128 events/min
- Tokyo Night colors: #565f89 → #7aa2f7 → #9d7cd8 → #e0af68 → #f7768e → #ff5555
- Weighted: 85% events + 15% active agents

**3. Background Task Monitoring** (`server/task-watcher.ts`):
- Watches `/tmp/claude/{project}/tasks/*.output` files
- Auto-detects format: JSONL (agent tasks) vs plain text (Bash commands)
- Pattern-matching description inference (server, build, git, docker, etc.)
- Haiku AI fallback for intelligent task naming when patterns fail
- 30-second idle threshold for completion detection
- Real-time WebSocket broadcast of task state changes

**4. Agent Name Enrichment** (`file-ingest.ts`):
- Reads `~/.claude/MEMORY/STATE/agent-sessions.json` for session→agent mapping
- Auto-watches for changes and reloads
- UserPromptSubmit events labeled as DA name (from env `$DA`)
- Sub-agent types capitalized (engineer → Engineer, architect → Architect)

**5. HITL (Human-in-the-Loop)** (`composables/useHITLNotifications.ts`):
- Browser Notification API for agent questions
- Types: question, permission, choice (multiple choice)
- Inline response UI in event timeline
- Timeout support and required-response tracking

**6. Theme System** (SQLite + `theme.ts` + `ThemeManager.vue`):
- Full CRUD: create, update, delete, search, import/export
- 24 color slots (primary, bg 4 levels, text 4 levels, border 3 levels, accents, etc.)
- Tokyo Night default theme
- Tags, ratings, download counts
- Public/private sharing model

**7. Toast Notifications** (`ToastNotification.vue`):
- Pops when a new agent appears in the event stream
- Shows agent name with their assigned color
- Auto-dismissible

**8. Kitty Terminal Integration** (`/api/activities`):
- Reads `kitty @ ls` JSON output
- Extracts tab titles across all OS windows
- Strips tab number prefixes and trailing ellipsis
- Returns as activity feed with timestamps

**9. Todo Tracking** (`file-ingest.ts` processTodoEvent):
- Intercepts TodoWrite tool events
- Tracks todo state per session
- Creates synthetic "Completed" events when todos finish
- Enables task completion tracking in the timeline

---

## PART 2: IMPLEMENTATION PLAN (REVISED — Based on Actual Source Code)

### 2.1 Tech Stack (Exact Match)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Frontend** | Vue | 3.5.x | Composition API + `<script setup>` |
| **Build** | Vite | 7.x | Dev server on port 5172 |
| **CSS** | Tailwind CSS | 3.4.x | Glass panel morphism, Tokyo Night theme |
| **Icons** | lucide-vue-next | latest | Consistent icon system |
| **TypeScript** | TypeScript | 5.8.x | Strict mode |
| **Backend** | Bun.serve | latest | HTTP + native WebSocket on port 4000 |
| **Database** | bun:sqlite | built-in | Themes only (NOT events) |
| **Charts** | Custom canvas | `chartRenderer.ts` | No external chart lib |
| **AI** | Claude Haiku 4.5 | Anthropic API | Event summarization, task naming |
| **Runtime** | Bun | latest | Already on Trevor's system |

**Explicitly NOT using:** Pinia, shadcn-vue, Chart.js, ECharts, Socket.io, Express. Keep it lean.

### 2.2 Architecture Overview (CORRECTED)

**Key insight:** No custom event capture hook needed. `file-ingest.ts` reads Claude Code's native JSONL session transcripts directly.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    PAI Observability Server                                │
│                                                                            │
│  ┌──────────────────────┐    WebSocket    ┌─────────────────────────────┐ │
│  │  Vue 3 Client         │◄══════════════►│  Bun Backend (port 4000)     │ │
│  │  (port 5172)          │   /stream       │                              │ │
│  │                        │                 │  ┌────────────────────────┐  │ │
│  │  Tabs:                 │                 │  │ file-ingest.ts          │  │ │
│  │  [Local] [Remote]      │                 │  │ fs.watch on:            │  │ │
│  │                        │                 │  │  ~/.claude/projects/    │  │ │
│  │  Local tab:            │                 │  │  (JSONL transcripts)    │  │ │
│  │  ┌─────────────────┐  │                 │  │  + agent-sessions.json  │  │ │
│  │  │ LivePulseChart   │  │                 │  └────────────────────────┘  │ │
│  │  │ AgentSwimLanes   │  │                 │                              │ │
│  │  │ EventTimeline    │  │                 │  ┌────────────────────────┐  │ │
│  │  │ FilterPanel      │  │                 │  │ task-watcher.ts         │  │ │
│  │  │ IntensityBar     │  │                 │  │ fs.watch on:            │  │ │
│  │  └─────────────────┘  │                 │  │  /tmp/claude/tasks/     │  │ │
│  │                        │                 │  │  (background agents)    │  │ │
│  │  Remote tab:           │                 │  └────────────────────────┘  │ │
│  │  ┌─────────────────┐  │                 │                              │ │
│  │  │ RemoteAgentDash  │  │  REST API       │  ┌────────────────────────┐  │ │
│  │  └─────────────────┘  │◄────────────►│  │ db.ts + theme.ts        │  │ │
│  │                        │                 │  │ SQLite: themes only     │  │ │
│  │  Overlay:              │                 │  └────────────────────────┘  │ │
│  │  ThemeManager          │                 │                              │ │
│  │  ToastNotification     │                 │  REST: /events/*, /api/*     │ │
│  └──────────────────────┘                 └─────────────────────────────┘ │
│                                                       │                     │
│                              reads from:               │                     │
│         ┌──────────────────────────────────────────────┤                     │
│         ▼                          ▼                   ▼                     │
│  ~/.claude/projects/     /tmp/claude/tasks/    agent-sessions.json           │
│  (native JSONL session   (background agent     (session → agent name)        │
│   transcripts — Claude    output files)                                      │
│   Code writes these)                                                         │
└──────────────────────────────────────────────────────────────────────────┘

  Data Producers (ALL EXISTING — zero new hooks):
  ┌──────────────────────────────────────────────────────────────┐
  │ Claude Code itself       → writes JSONL to ~/.claude/projects/ │
  │ Background agents (Task) → write to /tmp/claude/tasks/*.output │
  │ AlgorithmTracker hook    → writes algorithms/{session}.json    │
  │ VoiceGate hook           → phase detection + state updates     │
  │ StopOrchestrator         → session completion enrichment       │
  │ algorithm.ts CLI         → loop mode state management          │
  └──────────────────────────────────────────────────────────────┘
```

### 2.3 Backend Server Design (from actual source)

#### 2.3.1 `apps/server/src/index.ts` — Entry Point

Single `Bun.serve()` on port 4000 handling:
- **Startup:** Calls `startFileIngestion()` with WebSocket broadcast callback, then `startTaskWatcher()` with its own broadcast callback
- **WebSocket `/stream`:** On open → sends last 50 events as `{type: 'initial', data: events[]}`. On new event → broadcasts `{type: 'event', data: HookEvent}`. On task update → broadcasts `{type: 'task_update', data: BackgroundTask}`
- **REST:** All endpoints listed in section 1.4.6
- **CORS:** `Access-Control-Allow-Origin: *` for local dev

#### 2.3.2 `apps/server/src/file-ingest.ts` — Event Ingestion (Core)

This is the heart of the system. Key behaviors:
- **Source:** `~/.claude/projects/-home-{USER}--claude/*.jsonl` (Linux path format)
- **In-memory only:** `MAX_EVENTS = 1000`, no persistence needed
- **File position tracking:** `Map<string, number>` — reads only NEW bytes since last check
- **On startup:** Watches 20 most recent session files. Sets position to END (only new events from now)
- **JSONL parsing:** Converts Claude Code's native `{type, message, timestamp, sessionId}` entries into `HookEvent` format
- **Agent enrichment:** Reads `~/.claude/MEMORY/STATE/agent-sessions.json`, watches for changes
- **Todo detection:** Intercepts `TodoWrite` tool events, tracks per-session state, creates synthetic `Completed` events

**Linux path adaptation needed:** The source hardcodes `-Users-${USER}--claude` (macOS). For Linux: `-home-${USER}--claude`

#### 2.3.3 `apps/server/src/task-watcher.ts` — Background Task Monitoring

- **Source:** `/tmp/claude/-home-{USER}--claude/tasks/*.output`
- **Auto-detect format:** JSONL (Task agents) vs plain text (Bash commands)
- **Description generation:** Pattern matching first (server, git, docker, build, etc.), Haiku AI fallback
- **Status inference:** Running if modified within 30 seconds, completed/failed otherwise
- **Polling:** Every 2 seconds for running tasks
- **Haiku API:** Reads key from `~/.claude/.env` (`ANTHROPIC_API_KEY`), calls `claude-haiku-4-5` with `max_tokens: 50`

#### 2.3.4 `apps/server/src/db.ts` + `theme.ts` — Theme System

- SQLite via `bun:sqlite` — `themes.db` file
- WAL mode for concurrent performance
- Tables: `themes`, `theme_shares`, `theme_ratings`
- Full CRUD with validation, import/export, search, stats

### 2.4 Frontend Design (from actual source)

#### 2.4.1 Layout Architecture

The actual dashboard uses a **full-height glass morphism design** with two tabs (Local/Remote):

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Local] [Remote]                                     TabNavigation  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LOCAL TAB:                                                          │
│                                                                      │
│  ┌─ FilterPanel (toggleable) ──────────────────────────────────────┐ │
│  │  Source: [all▼]  Session: [all▼]  Type: [all▼]                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─ LivePulseChart ─────────────────────── Glass Panel ────────────┐ │
│  │  ┌───────────────────────────────────────────────────────────┐  │ │
│  │  │  ████ ██ █████ ███ ██████ █ ████ ██████ ███ █ ████ ██   │  │ │
│  │  │  Activity pulse bars (canvas) — color-coded per agent     │  │ │
│  │  └───────────────────────────────────────────────────────────┘  │ │
│  │  [1M] [2M] [4M] [8M] [16M]  ● 34 ev/min  🔥 Hot  [Filters]   │ │
│  │  Agents: ● Vera (blue) ● Engineer (blue) ● Researcher (yellow) │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─ AgentSwimLaneContainer (shown when agents clicked) ────────────┐ │
│  │  Vera:       ████ ██ █████ ████ ████                            │ │
│  │  Engineer:   ██ ████ ██ ████████                                │ │
│  │  Researcher: ████████ ██ ██                                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─ EventTimeline ─────────────────────── Glass Panel ─────────────┐ │
│  │  14:23:01  ● Vera      PostToolUse  Read   /hooks/lib/algo...   │ │
│  │  14:23:03  ● Vera      PostToolUse  Grep   pattern: "dash..."   │ │
│  │  14:23:05  ● Engineer  PreToolUse   Bash   npm run build        │ │
│  │  14:23:08  ● Vera      PostToolUse  Task   spawn: Engineer      │ │
│  │  14:23:11  ● Vera      Completed    ✓      ISC-C1 verified      │ │
│  │  14:23:15  🔔 HITL     Question     "Which auth method?"        │ │
│  │  ──────── Heat: 🔥 Hot ── 34 ev/min ── 3 agents ──────────────│ │
│  │  [⬇ Stick to bottom]                                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  REMOTE TAB:                                                         │
│  ┌─ RemoteAgentDashboard ──────────────────────────────────────────┐ │
│  │  Remote agent monitoring (separate connection)                   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  OVERLAYS:                                                           │
│  ThemeManager (slide-in panel)                                       │
│  ToastNotification (bottom-right, agent appearance alerts)           │
└──────────────────────────────────────────────────────────────────────┘
```

#### 2.4.2 Vue Component Hierarchy (Actual)

```
App.vue                                 # Root: gradient BG, tab state, WebSocket init
├── TabNavigation.vue                   # [Local] [Remote] tab switcher
├── FilterPanel.vue                     # Source app + session + event type filters
├── LivePulseChart.vue                  # Canvas-based real-time activity bars
│   (emits: unique apps, heat level, events/min, agent counts)
├── AgentSwimLaneContainer.vue          # Multi-agent comparison view
│   └── AgentSwimLane.vue              # Per-agent event lane
├── EventTimeline.vue                   # Main scrollable event feed
│   └── EventRow.vue                   # Single event: timestamp, agent, type, payload
│       └── ChatTranscriptModal.vue    # Full-screen chat view
├── ChatTranscript.vue                  # Inline chat transcript
├── IntensityBar.vue                    # Heat level color indicator
├── StickScrollButton.vue              # Auto-scroll toggle
├── RemoteAgentDashboard.vue           # Remote agent monitoring tab
├── ThemeManager.vue                    # Theme CRUD panel
│   └── ThemePreview.vue               # Live color preview
├── ToastNotification.vue              # Agent appearance toasts
├── stats/
│   └── StatBadge.vue                  # Metric badge
└── widgets/
    ├── AgentActivityWidget.vue        # Agent event distribution
    ├── EventTypesWidget.vue           # Event type breakdown
    ├── SessionTimelineWidget.vue      # Session activity over time
    ├── TokenUsageWidget.vue           # Token consumption
    └── TopToolsWidget.vue             # Most-used tools ranking
```

#### 2.4.3 Color Scheme — Tokyo Night Theme (Actual)

```css
/* Background */
--bg: gradient from #1a1b26 via #16161e to #0f0f14
/* Subtle dot pattern overlay at 2% opacity */

/* Glass panels */
glass-panel: semi-transparent with backdrop-blur
glass-panel-elevated: higher opacity for overlays

/* Heat level scale (from useHeatLevel.ts) */
--heat-cold:    #565f89;  /* Storm gray — 0-4 ev/min */
--heat-cool:    #7aa2f7;  /* Blue — 4-8 ev/min */
--heat-warm:    #9d7cd8;  /* Purple — 8-16 ev/min */
--heat-hot:     #e0af68;  /* Amber — 16-32 ev/min */
--heat-fire:    #f7768e;  /* Red — 32-64 ev/min */
--heat-inferno: #ff5555;  /* Bright red — 64-128+ ev/min */

/* Event type colors (from useEventColors.ts, Tokyo Night palette) */
--event-user-prompt: #7dcfff;   /* Cyan */
--event-session:     #7aa2f7;   /* Blue */
--event-stop:        #f7768e;   /* Red */
--event-subagent:    #bb9af7;   /* Magenta */
--event-pre-tool:    #e0af68;   /* Yellow */
--event-post-tool:   #ff9e64;   /* Orange */
--event-completed:   #9ece6a;   /* Green */
--event-compaction:  #1abc9c;   /* Teal */

/* Agent colors (from agent definitions) */
--agent-engineer:    #3B82F6;   /* Blue */
--agent-pentester:   #EF4444;   /* Red */
--agent-designer:    #A855F7;   /* Purple */
--agent-intern:      #06B6D4;   /* Cyan */
--agent-researcher:  #EAB308;   /* Yellow */
--agent-user:        #C084FC;   /* Bright purple */

/* Tool type colors */
--tool-file-ops:     #9ece6a;   /* Green: Read, Write, Edit */
--tool-search:       #e0af68;   /* Yellow: Glob, Grep, WebSearch */
--tool-execution:    #ff9e64;   /* Orange: Bash */
--tool-agent:        #bb9af7;   /* Purple: Task, Skill */
--tool-interaction:  #7dcfff;   /* Cyan: AskUser, TodoWrite */
```

### 2.5 File Structure (Our Implementation)

```
~/projects/pai-dashboard/
├── manage.sh                           # start/stop/restart/status (Linux-adapted)
├── install.sh                          # First-run setup
├── PRD-20260217-pai-observability-server.md  # This document
│
├── apps/
│   ├── server/                         # Bun backend
│   │   ├── package.json                # v1.0.0
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                # Bun.serve: HTTP + WebSocket /stream
│   │       ├── file-ingest.ts          # Watch ~/.claude/projects/ JSONL
│   │       ├── task-watcher.ts         # Watch /tmp/claude/ task outputs
│   │       ├── db.ts                   # SQLite for themes
│   │       ├── theme.ts                # Theme CRUD
│   │       └── types.ts                # Shared types
│   │
│   └── client/                         # Vue 3 frontend
│       ├── package.json
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── tsconfig.json
│       └── src/
│           ├── App.vue
│           ├── main.ts
│           ├── types.ts                # HookEvent, BackgroundTask, HITL, Chart
│           ├── style.css
│           ├── styles/
│           │   ├── main.css
│           │   ├── compact.css
│           │   └── themes.css
│           ├── utils/
│           │   ├── chartRenderer.ts
│           │   ├── haiku.ts
│           │   └── obfuscate.ts
│           ├── composables/            # 16 composables
│           │   ├── useWebSocket.ts
│           │   ├── useAdvancedMetrics.ts
│           │   ├── useAgentChartData.ts
│           │   ├── useAgentContext.ts
│           │   ├── useBackgroundTasks.ts
│           │   ├── useChartData.ts
│           │   ├── useEventColors.ts
│           │   ├── useEventEmojis.ts
│           │   ├── useEventSearch.ts
│           │   ├── useHITLNotifications.ts
│           │   ├── useHeatLevel.ts
│           │   ├── useMediaQuery.ts
│           │   ├── useRemoteAgent.ts
│           │   ├── useThemes.ts
│           │   └── useTimelineIntelligence.ts
│           └── components/
│               ├── AgentSwimLane.vue
│               ├── AgentSwimLaneContainer.vue
│               ├── ChatTranscript.vue
│               ├── ChatTranscriptModal.vue
│               ├── EventRow.vue
│               ├── EventTimeline.vue
│               ├── FilterPanel.vue
│               ├── IntensityBar.vue
│               ├── LivePulseChart.vue
│               ├── RemoteAgentDashboard.vue
│               ├── StickScrollButton.vue
│               ├── TabNavigation.vue
│               ├── ThemeManager.vue
│               ├── ThemePreview.vue
│               ├── ToastNotification.vue
│               ├── stats/
│               │   └── StatBadge.vue
│               └── widgets/
│                   ├── AgentActivityWidget.vue
│                   ├── EventTypesWidget.vue
│                   ├── SessionTimelineWidget.vue
│                   ├── TokenUsageWidget.vue
│                   ├── TopToolsWidget.vue
│                   └── widget-base.css
│
└── public/
    └── favicon.svg
```

### 2.6 Implementation Phases (Build Order — Revised)

#### Phase 1: Backend Core (2-3 hours)

No event capture hook needed — start directly with the server.

1. **`apps/server/src/types.ts`** — Copy HookEvent, BackgroundTask, Theme interfaces from actual source
2. **`apps/server/src/file-ingest.ts`** — Adapt from actual source:
   - Change `PROJECTS_DIR` path format from macOS (`-Users-`) to Linux (`-home-`)
   - In-memory store with MAX_EVENTS = 1000
   - File position tracking with `Map<string, number>`
   - Watch 20 most recent JSONL files + directory for new ones
   - Agent enrichment from `agent-sessions.json`
   - Todo completion detection
3. **`apps/server/src/task-watcher.ts`** — Adapt from actual source:
   - Change `TASKS_DIR` path from macOS to Linux format
   - Pattern matching for task description inference
   - Haiku AI naming (reads `ANTHROPIC_API_KEY` from `~/.claude/.env`)
   - 30-second idle threshold, 2-second polling for running tasks
4. **`apps/server/src/db.ts`** — SQLite for themes only. Direct copy.
5. **`apps/server/src/theme.ts`** — Theme CRUD. Direct copy.
6. **`apps/server/src/index.ts`** — Bun.serve entry point:
   - WebSocket `/stream` with initial event push
   - REST endpoints for events, themes, tasks, Kitty activities, Haiku proxy
   - CORS headers

**Verify:** Start server, confirm WebSocket connects and streams events when a Claude session runs.

#### Phase 2: Frontend Shell + Core Components (3-4 hours)

1. **Scaffold:** `bun create vite apps/client --template vue-ts`
2. **Dependencies:** `vue@3.5.x`, `lucide-vue-next`, `tailwindcss@3.4.x`, `autoprefixer`, `postcss`
3. **Core composables** (adapt from actual source):
   - `useWebSocket.ts` — connect, reconnect, event buffering
   - `useEventColors.ts` — Tokyo Night color system
   - `useHeatLevel.ts` — 6-level heat intensity
   - `useEventEmojis.ts` — tool/event type indicators
4. **App.vue** — Gradient background, glass panel CSS, tab state, WebSocket init
5. **TabNavigation.vue** — Local/Remote tabs
6. **EventTimeline.vue** — Main scrollable event feed with auto-scroll
7. **EventRow.vue** — Individual event with agent color, type badge, payload expand
8. **FilterPanel.vue** — Source app, session, event type dropdowns

#### Phase 3: Advanced Visualization (3-4 hours)

1. **LivePulseChart.vue** — Canvas-based real-time activity bars (port `chartRenderer.ts`)
2. **IntensityBar.vue** — Heat level color indicator
3. **AgentSwimLane.vue** + **AgentSwimLaneContainer.vue** — Per-agent event lanes
4. **StickScrollButton.vue** — Auto-scroll toggle
5. **ToastNotification.vue** — Agent appearance alerts
6. **Widget components:**
   - `AgentActivityWidget.vue`
   - `EventTypesWidget.vue`
   - `SessionTimelineWidget.vue`
   - `TokenUsageWidget.vue`
   - `TopToolsWidget.vue`
   - `StatBadge.vue`

#### Phase 4: Chat, Themes & AI Features (2-3 hours)

1. **ChatTranscript.vue** + **ChatTranscriptModal.vue** — Chat history viewer
2. **ThemeManager.vue** + **ThemePreview.vue** — Theme CRUD UI
3. **`utils/obfuscate.ts`** — Security obfuscation (direct copy from actual source)
4. **`utils/haiku.ts`** — Haiku API client for event summarization
5. **`composables/useHITLNotifications.ts`** — Browser notifications for agent questions
6. **`composables/useTimelineIntelligence.ts`** — AI-powered event clustering
7. **`composables/useBackgroundTasks.ts`** — Background task state
8. **`composables/useAdvancedMetrics.ts`** — Token usage, tool stats, agent activity

#### Phase 5: Remote Agents, manage.sh & Polish (1-2 hours)

1. **RemoteAgentDashboard.vue** — Remote agent monitoring tab
2. **`composables/useRemoteAgent.ts`** — Remote agent connection
3. **`manage.sh`** — Linux-adapted lifecycle script:
   - Replace `/opt/homebrew/bin` with standard Linux paths
   - Use `fuser -n tcp PORT` instead of `lsof` for port detection (or keep lsof — available on Kali)
   - Support `start`, `stop`, `restart`, `status`, `start-detached`
4. **`install.sh`** — `bun install` in both apps/, build client for production
5. **Responsive design** — `useMediaQuery.ts` for mobile/short viewport adaptations

### 2.7 Cross-Platform Adaptations (macOS → Kali Linux)

| Original (macOS) | Adaptation (Linux) | Where |
|---|---|---|
| `-Users-${USER}--claude` | `-home-${USER}--claude` | file-ingest.ts, task-watcher.ts |
| `/opt/homebrew/bin` in PATH | Remove (not needed on Linux) | manage.sh |
| `lsof -Pi :PORT` | Keep (available on Kali) or use `fuser -n tcp PORT` | manage.sh |
| `kitty @ ls` | Keep as-is if using Kitty terminal, graceful fallback if not | index.ts /api/activities |
| MenuBarApp (Swift/AppKit) | Skip entirely — use systemd user service instead | N/A |
| `DA` env var (default "Kai") | Set to "Vera" (from Trevor's settings.json) | server env |

### 2.8 Integration Points (ZERO New Hooks)

The dashboard is **purely read-only** — it reads files that Claude Code and existing hooks already write. No modifications to:

- `AlgorithmTracker.hook.ts` — unchanged
- `VoiceGate.hook.ts` — unchanged
- `StopOrchestrator` — unchanged
- `algorithm.ts` CLI — unchanged
- `VoiceServer/server.ts` — unchanged
- `settings.json` hooks array — **NO new hooks needed**

**Data sources consumed (all pre-existing):**
1. `~/.claude/projects/{project-hash}/*.jsonl` — Native Claude Code session transcripts
2. `/tmp/claude/{project-hash}/tasks/*.output` — Background agent task outputs
3. `~/.claude/MEMORY/STATE/agent-sessions.json` — Agent name mapping
4. `~/.claude/.env` — Anthropic API key for Haiku features

---

## IDEAL STATE CRITERIA (Verification Criteria)

### Research & Documentation

- [ ] ISC-C1: Research covers all external sources including X GitHub blog | Verify: Read: check research section has multiple source subsections
- [ ] ISC-C2: Local data layer architecture fully documented with types | Verify: Read: data layer section lists complete AlgorithmState fields
- [ ] ISC-C3: All dashboard features identified with source evidence | Verify: Read: feature list has [Confirmed]/[Inferred] tags

### Architecture & Tech Stack

- [ ] ISC-C4: Implementation plan specifies complete tech stack choices | Verify: Read: tech stack table has all layers filled
- [ ] ISC-C6: Plan covers real-time WebSocket data streaming architecture | Verify: Read: WebSocket protocol messages defined
- [ ] ISC-C7: Plan addresses cross-platform compatibility for Kali Linux | Verify: Read: platform considerations table exists
- [ ] ISC-C8: Plan integrates with existing VoiceServer and hook infrastructure | Verify: Read: integration section shows zero modifications to existing code

### UI & Features

- [ ] ISC-C5: Plan includes all UI panels and layout specifications | Verify: Read: ASCII mockup + component hierarchy present
- [ ] ISC-C9: Plan includes multi-session monitoring with active and historical views | Verify: Read: SessionList + HistoryPanel in component hierarchy
- [ ] ISC-C10: Plan covers loop mode monitoring with iteration progress tracking | Verify: Read: LoopMonitor component with convergence chart specified

### Deliverable

- [ ] ISC-C11: Deliverable is a complete PRD ready for implementation | Verify: Read: PRD has all sections including PLAN with build phases

### Anti-Criteria

- [ ] ISC-A1: No speculative features presented as confirmed functionality | Verify: Read: all features have evidence tags
- [ ] ISC-A2: No macOS-specific dependencies in the implementation plan | Verify: Grep: no afplay/osascript/homebrew in plan sections

---

## DECISIONS

### 2026-02-17

1. **Vue 3 + Vite over React/Next.js** — Matches Daniel's choice for feature parity. Vue's reactivity model is ideal for real-time dashboard state. Lighter weight than React for this use case.

2. **Single Bun server for both HTTP and WebSocket** — Bun natively supports WebSocket on the same port as HTTP. No need for separate ws server process. Simpler deployment.

3. **Read-only architecture (no modifications to existing hooks)** — The data layer is already complete and battle-tested. Adding dashboard-specific writes would create coupling. Instead, the dashboard is a pure consumer of existing data.

4. **File watching over polling** — `fs.watch()` on Linux uses inotify which is event-driven and efficient. Polling would introduce unnecessary latency and CPU usage.

5. **100ms debounce on file watch events** — Hooks can fire multiple writes in rapid succession during phase transitions (phase change + criteria add + agent spawn). Debouncing prevents redundant WebSocket broadcasts.

6. **Study `disler/claude-code-hooks-multi-agent-observability` before building** — This open-source project implements the same architectural pattern (hooks → WebSocket → Vue 3). Its Vue components, event filtering, pulse charts, and swim lane views are directly applicable reference material. Clone and study before Phase 2 (frontend).

7. **8 event types, not 6** — Research confirmed SessionEnd as an additional event type beyond DeepWiki's 6. Our capture-all-events.ts hook should register on all available hook types. Specialized hooks (rating capture, sentiment, format reminder) also feed useful data.

8. **Semgrep Secure 2026 video** — The Feb 25 live demo is the best available visual reference for the actual dashboard UI. Watch before designing the frontend layout.

---

## LOG

### Iteration 0 — 2026-02-17
- Phase reached: PLANNED
- Criteria progress: 13/13 (research + plan criteria)
- Work done: Deep research across GitHub, X/Twitter, DeepWiki, blog, YouTube via 4 parallel research agents. Full local codebase analysis of data layer (AlgorithmState interface, hooks, algorithm.ts, VoiceServer). Complete implementation plan with tech stack, architecture, UI mockup, file structure, and 6-phase build order.
- DeepWiki findings added: Discovered 4-stage event pipeline (capture-all-events.ts → JSONL → file-ingest.ts → WebSocket/stream), pack name `kai-observability-server`, `/stream` endpoint, `PAI_OBSERVABILITY_URL` env var, fail-silently design principle.
- Context for next iteration: Ready for implementation. Start with Phase 0 (capture-all-events.ts hook) to establish the JSONL event stream, then Phase 1 (backend core) — the state-watcher and event-ingest are the dual data sources everything else depends on.
- Video/media research added: Semgrep Secure 2026 live demo (best visual ref), Cognitive Revolution podcast, open-source reference implementation (disler/claude-code-hooks-multi-agent-observability) with Vue 3 + WebSocket + SQLite architecture. Added EventStream.vue and ActivityPulse.vue panels inspired by reference implementation. Updated event types to 8.
- **Pre-build recommendation:** (1) Watch Semgrep Secure 2026 video for UI reference. (2) Clone disler/claude-code-hooks-multi-agent-observability and study its Vue components.
