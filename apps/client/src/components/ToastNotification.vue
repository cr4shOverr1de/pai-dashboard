<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEventColors } from '../composables/useEventColors'
import type { HookEvent } from '../types'

const props = defineProps<{
  events: HookEvent[]
}>()

const { getAgentColor } = useEventColors()

interface Toast {
  id: number
  agentName: string
  color: string
  message: string
}

const toasts = ref<Toast[]>([])
const knownAgents = new Set<string>()
let toastId = 0

// Watch for new agents appearing in the event stream
watch(
  () => props.events.length,
  () => {
    for (const event of props.events) {
      const agent = event.agent_name || 'claude'
      if (!knownAgents.has(agent)) {
        knownAgents.add(agent)
        // Skip the first batch (initial load) — only toast for truly new agents
        if (props.events.indexOf(event) > 49) {
          const id = ++toastId
          const color = getAgentColor(agent === 'claude' ? undefined : agent)
          toasts.value.push({
            id,
            agentName: agent,
            color,
            message: `${agent} has entered the session`,
          })
          // Auto-dismiss after 4 seconds
          setTimeout(() => {
            toasts.value = toasts.value.filter(t => t.id !== id)
          }, 4000)
        }
      }
    }
  },
  { immediate: true }
)

function dismiss(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="glass-panel-elevated flex items-center gap-3 px-4 py-3 shadow-lg cursor-pointer min-w-[280px]"
          :style="{ borderLeft: `3px solid ${toast.color}` }"
          @click="dismiss(toast.id)"
        >
          <span
            class="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
            :style="{ backgroundColor: toast.color }"
          />
          <div>
            <span class="text-sm font-medium" :style="{ color: toast.color }">
              {{ toast.agentName }}
            </span>
            <p class="text-xs text-tn-comment mt-0.5">{{ toast.message }}</p>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
