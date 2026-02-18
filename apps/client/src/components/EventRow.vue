<script setup lang="ts">
import { ref } from 'vue'
import { useEventColors } from '../composables/useEventColors'
import { useEventEmojis } from '../composables/useEventEmojis'
import type { HookEvent } from '../types'

const props = defineProps<{ event: HookEvent }>()
const expanded = ref(false)
const { getEventColor, getAgentColor } = useEventColors()
const { getToolEmoji, getEventEmoji } = useEventEmojis()

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false })
}

function formatPayload(payload: Record<string, any>): string {
  return JSON.stringify(payload, null, 2)
}

function getDisplayType(event: HookEvent): string {
  if (event.tool_name) return event.tool_name
  return event.hook_event_type
}

function getEmoji(event: HookEvent): string {
  if (event.tool_name) return getToolEmoji(event.tool_name)
  return getEventEmoji(event.hook_event_type)
}

function getPreview(event: HookEvent): string {
  if (event.tool_name && event.payload?.input_preview) {
    const input = event.payload.input_preview
    if (input.command) return input.command.slice(0, 80)
    if (input.file_path) return input.file_path
    if (input.pattern) return `pattern: "${input.pattern}"`
    if (input.query) return `"${input.query}"`
    if (input.prompt) return input.prompt.slice(0, 80)
    return Object.values(input).filter(v => typeof v === 'string').join(' ').slice(0, 80)
  }
  if (event.payload?.text_preview) return event.payload.text_preview.slice(0, 100)
  if (event.payload?.hookName) return event.payload.hookName
  if (event.payload?.result_preview) return event.payload.result_preview.slice(0, 80)
  return ''
}
</script>

<template>
  <div
    class="event-row flex items-start gap-2 px-3 py-1.5 hover:bg-white/[0.02] cursor-pointer transition-colors text-sm"
    :class="{ 'bg-white/[0.03]': expanded }"
    @click="expanded = !expanded"
  >
    <!-- Timestamp -->
    <span class="text-tn-comment text-xs font-mono whitespace-nowrap mt-0.5">
      {{ formatTime(event.timestamp) }}
    </span>

    <!-- Agent dot + name -->
    <span class="flex items-center gap-1 min-w-[90px]">
      <span
        class="w-2 h-2 rounded-full inline-block flex-shrink-0"
        :style="{ backgroundColor: getAgentColor(event.agent_name) }"
      />
      <span
        class="text-xs font-medium truncate"
        :style="{ color: getAgentColor(event.agent_name) }"
      >
        {{ event.agent_name || 'claude' }}
      </span>
    </span>

    <!-- Event type badge -->
    <span
      class="px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap"
      :style="{
        color: getEventColor(event.hook_event_type),
        backgroundColor: getEventColor(event.hook_event_type) + '15',
        border: `1px solid ${getEventColor(event.hook_event_type)}30`
      }"
    >
      {{ getEmoji(event) }} {{ getDisplayType(event) }}
    </span>

    <!-- Preview -->
    <span class="text-tn-fg-dark text-xs truncate flex-1 opacity-70">
      {{ getPreview(event) }}
    </span>
  </div>

  <!-- Expanded payload -->
  <div v-if="expanded" class="px-6 py-2 bg-tn-bg-darker/50 border-t border-tn-fg-gutter/20">
    <pre class="text-xs text-tn-fg-dark font-mono overflow-x-auto max-h-48 overflow-y-auto">{{ formatPayload(event.payload) }}</pre>
    <div v-if="event.tool_input" class="mt-2">
      <span class="text-xs text-tn-comment">Tool Input:</span>
      <pre class="text-xs text-tn-fg-dark font-mono overflow-x-auto max-h-32 overflow-y-auto mt-1">{{ formatPayload(event.tool_input) }}</pre>
    </div>
  </div>
</template>
