<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useEventColors } from '../composables/useEventColors'
import { obfuscateString } from '../utils/obfuscate'
import type { HookEvent } from '../types'

const props = defineProps<{
  events: HookEvent[]
  sessionFilter: string
}>()

const { getAgentColor } = useEventColors()
const container = ref<HTMLElement>()
const stickToBottom = ref(true)

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  agentName: string
  timestamp: number
  toolName?: string
  model?: string
}

const messages = computed<ChatMessage[]>(() => {
  const result: ChatMessage[] = []
  for (const e of props.events) {
    // Filter by session if set
    if (props.sessionFilter && e.session_id !== props.sessionFilter) continue

    if (e.hook_event_type === 'user' && e.payload?.text_preview) {
      result.push({
        id: e.id,
        role: 'user',
        text: e.payload.text_preview,
        agentName: 'You',
        timestamp: e.timestamp,
      })
    } else if (e.hook_event_type === 'assistant' && e.payload?.text_preview) {
      result.push({
        id: e.id,
        role: 'assistant',
        text: e.payload.text_preview,
        agentName: e.agent_name || 'Claude',
        timestamp: e.timestamp,
        model: e.model_name,
      })
    } else if (e.hook_event_type === 'tool_use' && e.tool_name) {
      result.push({
        id: e.id,
        role: 'assistant',
        text: `Used tool: ${e.tool_name}`,
        agentName: e.agent_name || 'Claude',
        timestamp: e.timestamp,
        toolName: e.tool_name,
      })
    }
  }
  return result
})

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false })
}

// Auto-scroll
watch(
  () => messages.value.length,
  async () => {
    if (stickToBottom.value && container.value) {
      await nextTick()
      container.value.scrollTop = container.value.scrollHeight
    }
  }
)

function onScroll() {
  if (!container.value) return
  const { scrollTop, scrollHeight, clientHeight } = container.value
  stickToBottom.value = scrollHeight - scrollTop - clientHeight < 50
}
</script>

<template>
  <div class="glass-panel flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-tn-fg-gutter/20">
      <span class="text-sm font-medium text-tn-fg">
        Chat Transcript
        <span class="text-tn-comment text-xs ml-2">{{ messages.length }} messages</span>
      </span>
      <button
        @click="stickToBottom = !stickToBottom"
        class="text-xs px-2 py-1 rounded transition-colors"
        :class="stickToBottom
          ? 'bg-tn-blue/20 text-tn-blue border border-tn-blue/30'
          : 'text-tn-comment hover:text-tn-fg'"
      >
        {{ stickToBottom ? '&#11015; Auto-scroll' : '&#11015; Scroll' }}
      </button>
    </div>

    <!-- Messages -->
    <div
      ref="container"
      class="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      @scroll="onScroll"
    >
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="flex flex-col max-w-[85%]"
        :class="msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'"
      >
        <!-- Sender + time -->
        <div class="flex items-center gap-2 mb-1">
          <span
            v-if="msg.role === 'assistant'"
            class="w-2 h-2 rounded-full"
            :style="{ backgroundColor: getAgentColor(msg.agentName === 'Claude' ? undefined : msg.agentName) }"
          />
          <span
            class="text-[10px] font-medium"
            :style="{ color: msg.role === 'user' ? '#7dcfff' : getAgentColor(msg.agentName === 'Claude' ? undefined : msg.agentName) }"
          >
            {{ msg.agentName }}
          </span>
          <span class="text-[10px] text-tn-comment">{{ formatTime(msg.timestamp) }}</span>
          <span v-if="msg.model" class="text-[10px] text-tn-comment/50">{{ msg.model }}</span>
        </div>

        <!-- Message bubble -->
        <div
          class="px-3 py-2 rounded-lg text-sm"
          :class="msg.role === 'user'
            ? 'bg-tn-cyan/10 border border-tn-cyan/20 text-tn-fg'
            : msg.toolName
              ? 'bg-tn-yellow/10 border border-tn-yellow/20 text-tn-fg-dark font-mono text-xs'
              : 'bg-tn-bg-highlight/50 border border-tn-fg-gutter/20 text-tn-fg-dark'"
        >
          {{ obfuscateString(msg.text) }}
        </div>
      </div>

      <div v-if="messages.length === 0" class="flex items-center justify-center h-32 text-tn-comment text-sm">
        No chat messages captured yet
      </div>
    </div>
  </div>
</template>
