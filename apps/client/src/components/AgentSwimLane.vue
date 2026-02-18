<script setup lang="ts">
import { ref, computed } from 'vue'
import EventRow from './EventRow.vue'
import { useEventColors } from '../composables/useEventColors'
import type { HookEvent } from '../types'

const props = defineProps<{
  agentName: string
  events: HookEvent[]
}>()

const collapsed = ref(false)
const { getAgentColor } = useEventColors()

const agentColor = computed(() => getAgentColor(props.agentName === 'claude' ? undefined : props.agentName))

const toolBreakdown = computed(() => {
  const tools = new Map<string, number>()
  for (const e of props.events) {
    if (e.tool_name) {
      tools.set(e.tool_name, (tools.get(e.tool_name) || 0) + 1)
    }
  }
  return [...tools.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
})

const latestEvent = computed(() => {
  if (props.events.length === 0) return null
  return props.events[props.events.length - 1]
})

function timeSince(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}
</script>

<template>
  <div class="border border-tn-fg-gutter/20 rounded-lg overflow-hidden">
    <!-- Lane header -->
    <div
      class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
      :style="{ borderLeft: `3px solid ${agentColor}` }"
      @click="collapsed = !collapsed"
    >
      <!-- Agent identity -->
      <span
        class="w-3 h-3 rounded-full flex-shrink-0"
        :style="{ backgroundColor: agentColor }"
      />
      <span
        class="font-medium text-sm"
        :style="{ color: agentColor }"
      >
        {{ agentName }}
      </span>

      <!-- Event count -->
      <span class="text-xs text-tn-comment">
        {{ events.length }} events
      </span>

      <!-- Top tools -->
      <div class="flex items-center gap-1 ml-auto">
        <span
          v-for="[tool, count] in toolBreakdown"
          :key="tool"
          class="text-[10px] px-1.5 py-0.5 rounded bg-tn-bg-highlight/50 text-tn-comment"
        >
          {{ tool }}: {{ count }}
        </span>
      </div>

      <!-- Last activity -->
      <span v-if="latestEvent" class="text-xs text-tn-comment whitespace-nowrap">
        {{ timeSince(latestEvent.timestamp) }}
      </span>

      <!-- Collapse toggle -->
      <span class="text-tn-comment text-xs">
        {{ collapsed ? '&#9654;' : '&#9660;' }}
      </span>
    </div>

    <!-- Events -->
    <div v-if="!collapsed" class="max-h-64 overflow-y-auto bg-tn-bg-darker/30">
      <EventRow
        v-for="event in events"
        :key="event.id"
        :event="event"
      />
      <div v-if="events.length === 0" class="px-4 py-3 text-xs text-tn-comment text-center">
        No events yet
      </div>
    </div>
  </div>
</template>
