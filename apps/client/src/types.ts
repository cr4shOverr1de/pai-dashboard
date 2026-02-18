// PAI Observability Client — Types

export interface HookEvent {
  id: number
  source_app: string
  session_id: string
  agent_name?: string
  hook_event_type: string
  tool_name?: string
  tool_input?: Record<string, any>
  payload: Record<string, any>
  summary?: string
  timestamp: number
  model_name?: string
}

export interface BackgroundTask {
  id: string
  description: string
  status: 'running' | 'completed' | 'failed'
  startedAt: number
  updatedAt: number
  outputPreview?: string
  format: 'jsonl' | 'text'
}

export interface FilterOptions {
  source_apps: string[]
  session_ids: string[]
  hook_event_types: string[]
}

export type HeatLevel = 'Cold' | 'Cool' | 'Warm' | 'Hot' | 'Fire' | 'Inferno'

export interface WebSocketMessage {
  type: 'initial' | 'event' | 'task_update'
  data: HookEvent[] | HookEvent | BackgroundTask
}
