<script setup lang="ts">
import { computed } from 'vue'
import AgentSwimLane from './AgentSwimLane.vue'
import type { HookEvent } from '../types'

const props = defineProps<{
  events: HookEvent[]
  sourceFilter: string
  sessionFilter: string
  typeFilter: string
}>()

const filteredEvents = computed(() => {
  return props.events.filter(e => {
    if (props.sourceFilter && e.source_app !== props.sourceFilter) return false
    if (props.sessionFilter && e.session_id !== props.sessionFilter) return false
    if (props.typeFilter && e.hook_event_type !== props.typeFilter) return false
    return true
  })
})

// Group events by agent
const agentGroups = computed(() => {
  const groups = new Map<string, HookEvent[]>()
  for (const event of filteredEvents.value) {
    const agent = event.agent_name || 'claude'
    if (!groups.has(agent)) groups.set(agent, [])
    groups.get(agent)!.push(event)
  }
  // Sort by event count descending (most active agent first)
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
})
</script>

<template>
  <div class="glass-panel flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-tn-fg-gutter/20">
      <span class="text-sm font-medium text-tn-fg">
        Agent Swim Lanes
        <span class="text-tn-comment text-xs ml-2">{{ agentGroups.length }} agents</span>
      </span>
      <span class="text-xs text-tn-comment">
        {{ filteredEvents.length }} events
      </span>
    </div>

    <!-- Lanes -->
    <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
      <AgentSwimLane
        v-for="[agentName, agentEvents] in agentGroups"
        :key="agentName"
        :agent-name="agentName"
        :events="agentEvents"
      />
      <div v-if="agentGroups.length === 0" class="flex items-center justify-center h-32 text-tn-comment text-sm">
        Waiting for agent events...
      </div>
    </div>
  </div>
</template>
