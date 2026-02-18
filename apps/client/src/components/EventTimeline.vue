<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import EventRow from './EventRow.vue'
import type { HookEvent } from '../types'

const props = defineProps<{
  events: HookEvent[]
  sourceFilter: string
  sessionFilter: string
  typeFilter: string
}>()

const container = ref<HTMLElement>()
const stickToBottom = ref(true)

const filteredEvents = computed(() => {
  return props.events.filter(e => {
    if (props.sourceFilter && e.source_app !== props.sourceFilter) return false
    if (props.sessionFilter && e.session_id !== props.sessionFilter) return false
    if (props.typeFilter && e.hook_event_type !== props.typeFilter) return false
    return true
  })
})

// Auto-scroll to bottom when new events arrive
watch(
  () => filteredEvents.value.length,
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
        Events
        <span class="text-tn-comment text-xs ml-2">{{ filteredEvents.length }}</span>
      </span>
      <button
        @click="stickToBottom = !stickToBottom"
        class="text-xs px-2 py-1 rounded transition-colors"
        :class="stickToBottom
          ? 'bg-tn-blue/20 text-tn-blue border border-tn-blue/30'
          : 'text-tn-comment hover:text-tn-fg'"
      >
        {{ stickToBottom ? '⬇ Auto-scroll' : '⬇ Scroll' }}
      </button>
    </div>

    <!-- Event list -->
    <div
      ref="container"
      class="flex-1 overflow-y-auto"
      @scroll="onScroll"
    >
      <EventRow
        v-for="event in filteredEvents"
        :key="event.id"
        :event="event"
      />
      <div v-if="filteredEvents.length === 0" class="flex items-center justify-center h-32 text-tn-comment text-sm">
        Waiting for events...
      </div>
    </div>
  </div>
</template>
