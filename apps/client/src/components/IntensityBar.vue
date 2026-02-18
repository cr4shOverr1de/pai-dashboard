<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useHeatLevel } from '../composables/useHeatLevel'

const props = defineProps<{
  eventsPerMinute: number
}>()

const epm = computed(() => props.eventsPerMinute)
const { heatLevel, heatColor, heatEmoji, HEAT_LEVELS } = useHeatLevel(epm)
const pulse = ref(false)

// Pulse on heat level change
watch(heatLevel, () => {
  pulse.value = true
  setTimeout(() => { pulse.value = false }, 600)
})

// Width percentage based on log scale (max at ~128 ev/min = Inferno)
const fillPercent = computed(() => {
  if (props.eventsPerMinute === 0) return 0
  const maxLog = Math.log2(128) // Inferno threshold
  const currentLog = Math.log2(Math.min(props.eventsPerMinute, 128))
  return Math.max(2, (currentLog / maxLog) * 100)
})
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Bar container -->
    <div class="flex-1 h-2 rounded-full bg-tn-bg-darker/80 overflow-hidden relative">
      <!-- Tick marks for heat levels -->
      <div
        v-for="level in HEAT_LEVELS.slice(1)"
        :key="level.level"
        class="absolute top-0 bottom-0 w-px opacity-30"
        :style="{
          left: `${(Math.log2(Math.max(level.threshold, 1)) / Math.log2(128)) * 100}%`,
          backgroundColor: level.color
        }"
      />
      <!-- Fill bar -->
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :class="{ 'animate-pulse': pulse }"
        :style="{
          width: `${fillPercent}%`,
          background: `linear-gradient(90deg, ${HEAT_LEVELS[0].color}, ${heatColor})`
        }"
      />
    </div>

    <!-- Label -->
    <span
      class="text-xs font-medium whitespace-nowrap min-w-[70px] text-right"
      :style="{ color: heatColor }"
    >
      {{ heatEmoji }} {{ heatLevel }}
    </span>
  </div>
</template>
