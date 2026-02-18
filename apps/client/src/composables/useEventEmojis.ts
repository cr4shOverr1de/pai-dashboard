// Tool and event type emoji indicators

export function useEventEmojis() {
  const toolEmojis: Record<string, string> = {
    Read: '📖',
    Write: '✍️',
    Edit: '✏️',
    Bash: '💻',
    Grep: '🔍',
    Glob: '📁',
    WebSearch: '🌐',
    WebFetch: '🌐',
    Task: '🤖',
    Skill: '⚡',
    TaskCreate: '📋',
    TaskUpdate: '✅',
    TaskList: '📊',
    AskUserQuestion: '❓',
    EnterPlanMode: '📐',
    ExitPlanMode: '🚪',
    NotebookEdit: '📓',
    SendMessage: '💬',
    TeamCreate: '👥',
  }

  const eventTypeEmojis: Record<string, string> = {
    user: '👤',
    assistant: '🤖',
    tool_use: '🔧',
    tool_result: '📦',
    progress: '⏳',
    hook_progress: '↪️',
    system: '⚙️',
    completed: '✅',
    stop: '🛑',
  }

  function getToolEmoji(toolName?: string): string {
    if (!toolName) return '🔧'
    return toolEmojis[toolName] || '🔧'
  }

  function getEventEmoji(eventType: string): string {
    return eventTypeEmojis[eventType] || '📌'
  }

  return { getToolEmoji, getEventEmoji }
}
