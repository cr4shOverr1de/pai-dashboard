// Heat level system — 6-level intensity scale for activity monitoring

import { computed, type Ref } from 'vue'
import type { HeatLevel } from '../types'

interface HeatConfig {
  level: HeatLevel
  color: string
  threshold: number
  emoji: string
}

const HEAT_LEVELS: HeatConfig[] = [
  { level: 'Cold',    color: '#565f89', threshold: 0,   emoji: '🧊' },
  { level: 'Cool',    color: '#7aa2f7', threshold: 4,   emoji: '❄️' },
  { level: 'Warm',    color: '#9d7cd8', threshold: 8,   emoji: '🌤️' },
  { level: 'Hot',     color: '#e0af68', threshold: 16,  emoji: '🔥' },
  { level: 'Fire',    color: '#f7768e', threshold: 32,  emoji: '🔥' },
  { level: 'Inferno', color: '#ff5555', threshold: 64,  emoji: '💥' },
]

export function useHeatLevel(eventsPerMinute: Ref<number>) {
  const currentHeat = computed<HeatConfig>(() => {
    let result = HEAT_LEVELS[0]
    for (const level of HEAT_LEVELS) {
      if (eventsPerMinute.value >= level.threshold) {
        result = level
      }
    }
    return result
  })

  const heatLevel = computed(() => currentHeat.value.level)
  const heatColor = computed(() => currentHeat.value.color)
  const heatEmoji = computed(() => currentHeat.value.emoji)

  return { heatLevel, heatColor, heatEmoji, HEAT_LEVELS }
}
