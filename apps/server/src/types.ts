// PAI Observability Server — Shared Types

export interface HookEvent {
  id: number;
  source_app: string;          // "claude-code", "engineer", "architect", etc.
  session_id: string;
  agent_name?: string;         // Enriched from agent-sessions.json
  hook_event_type: string;     // "assistant", "user", "progress", "system", "tool_use", "tool_result"
  tool_name?: string;          // For tool events: Read, Write, Bash, Grep, etc.
  tool_input?: Record<string, any>;
  payload: Record<string, any>;
  summary?: string;
  timestamp: number;           // Unix ms
  model_name?: string;
}

export interface BackgroundTask {
  id: string;
  description: string;
  status: "running" | "completed" | "failed";
  startedAt: number;
  updatedAt: number;
  outputPreview?: string;
  format: "jsonl" | "text";
}

export interface FilterOptions {
  source_apps: string[];
  session_ids: string[];
  hook_event_types: string[];
}

export interface WebSocketMessage {
  type: "initial" | "event" | "task_update";
  data: HookEvent[] | HookEvent | BackgroundTask;
}
