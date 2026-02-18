// Advanced metrics composable — aggregate statistics from events

import { computed, type Ref } from 'vue'
import type { HookEvent } from '../types'

export function useAdvancedMetrics(events: Ref<HookEvent[]>) {
  // Total tool uses
  const totalToolUses = computed(() =>
    events.value.filter(e => e.tool_name).length
  )

  // Tool distribution: tool name → count
  const toolDistribution = computed(() => {
    const dist = new Map<string, number>()
    for (const e of events.value) {
      if (e.tool_name) {
        dist.set(e.tool_name, (dist.get(e.tool_name) || 0) + 1)
      }
    }
    return [...dist.entries()].sort((a, b) => b[1] - a[1])
  })

  // Events per agent
  const eventsPerAgent = computed(() => {
    const agents = new Map<string, number>()
    for (const e of events.value) {
      const name = e.agent_name || 'claude'
      agents.set(name, (agents.get(name) || 0) + 1)
    }
    return [...agents.entries()].sort((a, b) => b[1] - a[1])
  })

  // Unique agent count
  const agentCount = computed(() => {
    const agents = new Set<string>()
    for (const e of events.value) {
      agents.add(e.agent_name || 'claude')
    }
    return agents.size
  })

  // Unique session count
  const sessionCount = computed(() => {
    const sessions = new Set<string>()
    for (const e of events.value) {
      sessions.add(e.session_id)
    }
    return sessions.size
  })

  // Session duration (time span of captured events)
  const sessionDuration = computed(() => {
    if (events.value.length < 2) return 0
    const first = events.value[0].timestamp
    const last = events.value[events.value.length - 1].timestamp
    return last - first
  })

  const sessionDurationFormatted = computed(() => {
    const ms = sessionDuration.value
    if (ms === 0) return '0s'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainSec = seconds % 60
    if (minutes < 60) return `${minutes}m ${remainSec}s`
    const hours = Math.floor(minutes / 60)
    const remainMin = minutes % 60
    return `${hours}h ${remainMin}m`
  })

  // Event type distribution
  const eventTypeDistribution = computed(() => {
    const types = new Map<string, number>()
    for (const e of events.value) {
      types.set(e.hook_event_type, (types.get(e.hook_event_type) || 0) + 1)
    }
    return [...types.entries()].sort((a, b) => b[1] - a[1])
  })

  // Events per minute trend (last 5 minute windows)
  const epmTrend = computed(() => {
    const now = Date.now()
    const windows: number[] = []
    for (let i = 4; i >= 0; i--) {
      const windowStart = now - (i + 1) * 60_000
      const windowEnd = now - i * 60_000
      const count = events.value.filter(
        e => e.timestamp >= windowStart && e.timestamp < windowEnd
      ).length
      windows.push(count)
    }
    return windows
  })

  return {
    totalToolUses,
    toolDistribution,
    eventsPerAgent,
    agentCount,
    sessionCount,
    sessionDuration,
    sessionDurationFormatted,
    eventTypeDistribution,
    epmTrend,
  }
}
