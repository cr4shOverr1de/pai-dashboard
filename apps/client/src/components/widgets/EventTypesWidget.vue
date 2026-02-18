<script setup lang="ts">
import { computed } from 'vue'
import { useEventColors } from '../../composables/useEventColors'
import { useEventEmojis } from '../../composables/useEventEmojis'
import type { HookEvent } from '../../types'

const props = defineProps<{
  events: HookEvent[]
}>()

const { getEventColor } = useEventColors()
const { getEventEmoji } = useEventEmojis()

const eventTypes = computed(() => {
  const types = new Map<string, number>()
  for (const e of props.events) {
    types.set(e.hook_event_type, (types.get(e.hook_event_type) || 0) + 1)
  }
  const total = props.events.length || 1
  const sorted = [...types.entries()].sort((a, b) => b[1] - a[1])
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1
  return sorted.map(([type, count]) => ({
    type,
    count,
    percent: (count / total) * 100,
    barPercent: (count / maxCount) * 100,
    color: getEventColor(type),
    emoji: getEventEmoji(type),
  }))
})
</script>

<template>
  <div class="glass-panel p-3">
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs font-medium text-tn-fg">Event Types</span>
      <span class="text-[10px] text-tn-comment">{{ events.length }} total</span>
    </div>

    <div class="flex flex-col gap-1.5">
      <div
        v-for="et in eventTypes"
        :key="et.type"
        class="flex items-center gap-2"
      >
        <span class="text-xs w-4 text-center">{{ et.emoji }}</span>
        <span
          class="text-xs w-24 truncate"
          :style="{ color: et.color }"
        >
          {{ et.type }}
        </span>
        <div class="flex-1 h-3 bg-tn-bg-darker/50 rounded-sm overflow-hidden">
          <div
            class="h-full rounded-sm transition-all duration-300"
            :style="{
              width: `${et.barPercent}%`,
              backgroundColor: et.color + '60'
            }"
          />
        </div>
        <span class="text-[10px] text-tn-comment tabular-nums w-10 text-right">
          {{ et.percent.toFixed(0) }}%
        </span>
        <span class="text-[10px] text-tn-comment tabular-nums w-6 text-right">{{ et.count }}</span>
      </div>
    </div>

    <div v-if="eventTypes.length === 0" class="text-xs text-tn-comment text-center py-4">
      No events yet
    </div>
  </div>
</template>
