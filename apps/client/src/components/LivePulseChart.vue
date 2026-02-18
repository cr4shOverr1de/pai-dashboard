<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useEventColors } from '../composables/useEventColors'
import { useHeatLevel } from '../composables/useHeatLevel'
import type { HookEvent } from '../types'

const props = defineProps<{
  events: HookEvent[]
  eventsPerMinute: number
}>()

const canvas = ref<HTMLCanvasElement>()
const timeWindow = ref(2) // minutes
const { getAgentColor } = useEventColors()
const epm = computed(() => props.eventsPerMinute)
const { heatLevel, heatColor, heatEmoji } = useHeatLevel(epm)

const timeOptions = [1, 2, 4, 8, 16]

// Get unique agents from events
const agents = computed(() => {
  const agentMap = new Map<string, string>()
  for (const e of props.events) {
    const name = e.agent_name || 'claude'
    if (!agentMap.has(name)) {
      agentMap.set(name, getAgentColor(e.agent_name))
    }
  }
  return agentMap
})

function drawChart() {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = el.getBoundingClientRect()
  el.width = rect.width * dpr
  el.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = rect.height

  // Clear
  ctx.clearRect(0, 0, w, h)

  // Time range
  const now = Date.now()
  const windowMs = timeWindow.value * 60 * 1000
  const start = now - windowMs
  const barWidth = Math.max(2, w / 120) // ~120 bars across
  const gap = 1

  // Group events by time bucket
  const bucketMs = windowMs / 120
  const buckets: Map<number, Map<string, number>> = new Map()

  for (const event of props.events) {
    if (event.timestamp < start) continue
    const bucketIdx = Math.floor((event.timestamp - start) / bucketMs)
    if (!buckets.has(bucketIdx)) buckets.set(bucketIdx, new Map())
    const bucket = buckets.get(bucketIdx)!
    const agent = event.agent_name || 'claude'
    bucket.set(agent, (bucket.get(agent) || 0) + 1)
  }

  // Find max for scaling
  let maxCount = 1
  for (const bucket of buckets.values()) {
    let total = 0
    for (const count of bucket.values()) total += count
    maxCount = Math.max(maxCount, total)
  }

  // Draw bars
  for (let i = 0; i < 120; i++) {
    const bucket = buckets.get(i)
    if (!bucket) continue

    const x = (i / 120) * w
    let yOffset = 0

    for (const [agent, count] of bucket) {
      const barH = (count / maxCount) * (h - 4)
      const y = h - barH - yOffset

      ctx.fillStyle = getAgentColor(agent === 'claude' ? undefined : agent)
      ctx.globalAlpha = 0.85
      ctx.fillRect(x, y, barWidth - gap, barH)
      ctx.globalAlpha = 1

      yOffset += barH
    }
  }
}

let animFrame: number
function animate() {
  drawChart()
  animFrame = requestAnimationFrame(animate)
}

onMounted(() => {
  animFrame = requestAnimationFrame(animate)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
})

watch(() => timeWindow.value, drawChart)
</script>

<template>
  <div class="glass-panel p-3">
    <!-- Chart canvas -->
    <div class="relative h-24 mb-2">
      <canvas ref="canvas" class="w-full h-full" />
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-between text-xs">
      <div class="flex items-center gap-1">
        <button
          v-for="t in timeOptions"
          :key="t"
          @click="timeWindow = t"
          class="px-1.5 py-0.5 rounded transition-colors"
          :class="timeWindow === t
            ? 'bg-tn-blue/20 text-tn-blue border border-tn-blue/30'
            : 'text-tn-comment hover:text-tn-fg'"
        >
          {{ t }}M
        </button>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-tn-comment">
          {{ heatEmoji }} {{ eventsPerMinute }} ev/min
        </span>
        <span
          class="px-1.5 py-0.5 rounded font-medium"
          :style="{ color: heatColor, backgroundColor: heatColor + '15' }"
        >
          {{ heatLevel }}
        </span>
      </div>
    </div>

    <!-- Agent legend -->
    <div v-if="agents.size > 0" class="flex items-center gap-3 mt-2 text-xs">
      <span class="text-tn-comment">Agents:</span>
      <span
        v-for="[name, color] in agents"
        :key="name"
        class="flex items-center gap-1"
      >
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: color }" />
        <span :style="{ color }">{{ name }}</span>
      </span>
    </div>
  </div>
</template>
