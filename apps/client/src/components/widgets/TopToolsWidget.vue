<script setup lang="ts">
import { computed } from 'vue'
import { useEventColors } from '../../composables/useEventColors'
import { useEventEmojis } from '../../composables/useEventEmojis'
import type { HookEvent } from '../../types'

const props = defineProps<{
  events: HookEvent[]
}>()

const { getEventColor } = useEventColors()
const { getToolEmoji } = useEventEmojis()

const topTools = computed(() => {
  const tools = new Map<string, number>()
  for (const e of props.events) {
    if (e.tool_name) {
      tools.set(e.tool_name, (tools.get(e.tool_name) || 0) + 1)
    }
  }
  const sorted = [...tools.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1
  return sorted.map(([name, count]) => ({
    name,
    count,
    percent: (count / maxCount) * 100,
    emoji: getToolEmoji(name),
  }))
})

const totalToolUses = computed(() => {
  return props.events.filter(e => e.tool_name).length
})
</script>

<template>
  <div class="glass-panel p-3">
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs font-medium text-tn-fg">Top Tools</span>
      <span class="text-[10px] text-tn-comment">{{ totalToolUses }} total uses</span>
    </div>

    <div class="flex flex-col gap-1.5">
      <div
        v-for="tool in topTools"
        :key="tool.name"
        class="flex items-center gap-2"
      >
        <span class="text-xs w-4 text-center">{{ tool.emoji }}</span>
        <span class="text-xs text-tn-fg-dark w-20 truncate">{{ tool.name }}</span>
        <div class="flex-1 h-3 bg-tn-bg-darker/50 rounded-sm overflow-hidden">
          <div
            class="h-full rounded-sm transition-all duration-300"
            :style="{
              width: `${tool.percent}%`,
              backgroundColor: getEventColor('tool_use') + '80'
            }"
          />
        </div>
        <span class="text-[10px] text-tn-comment tabular-nums w-6 text-right">{{ tool.count }}</span>
      </div>
    </div>

    <div v-if="topTools.length === 0" class="text-xs text-tn-comment text-center py-4">
      No tool uses yet
    </div>
  </div>
</template>
