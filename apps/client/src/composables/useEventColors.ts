// Tokyo Night color system for events and agents

export function useEventColors() {
  const eventTypeColors: Record<string, string> = {
    user: '#7dcfff',           // Cyan
    assistant: '#7aa2f7',      // Blue
    tool_use: '#e0af68',       // Yellow
    tool_result: '#ff9e64',    // Orange
    progress: '#bb9af7',       // Magenta
    hook_progress: '#bb9af7',  // Magenta
    system: '#565f89',         // Storm gray
    'queue-operation': '#565f89',
    completed: '#9ece6a',      // Green
    stop: '#f7768e',           // Red
  }

  const agentColors: Record<string, string> = {
    Vera: '#7aa2f7',           // Blue
    Engineer: '#3B82F6',       // Blue
    Architect: '#9d7cd8',      // Purple
    Researcher: '#EAB308',     // Yellow
    Designer: '#A855F7',       // Purple
    Pentester: '#EF4444',      // Red
    Intern: '#06B6D4',         // Cyan
    Explorer: '#10B981',       // Emerald
    Planner: '#F97316',        // Orange
  }

  // Generate consistent color for unknown agents
  function hashColor(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const palette = [
      '#7aa2f7', '#bb9af7', '#7dcfff', '#9ece6a',
      '#e0af68', '#ff9e64', '#f7768e', '#9d7cd8',
      '#1abc9c', '#06B6D4',
    ]
    return palette[Math.abs(hash) % palette.length]
  }

  function getEventColor(eventType: string): string {
    return eventTypeColors[eventType] || '#565f89'
  }

  function getAgentColor(agentName?: string): string {
    if (!agentName) return '#565f89'
    return agentColors[agentName] || hashColor(agentName)
  }

  return { getEventColor, getAgentColor, eventTypeColors, agentColors }
}
