<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  color?: string
  icon?: string
  trend?: 'up' | 'down' | 'flat'
}>()
</script>

<template>
  <div class="glass-panel px-3 py-2 flex flex-col gap-1 min-w-[100px]">
    <span class="text-[10px] text-tn-comment uppercase tracking-wider">
      {{ icon }} {{ label }}
    </span>
    <div class="flex items-baseline gap-1.5">
      <span
        class="text-lg font-bold tabular-nums"
        :style="{ color: color || '#c0caf5' }"
      >
        {{ value }}
      </span>
      <span v-if="trend === 'up'" class="text-tn-green text-xs">&#9650;</span>
      <span v-else-if="trend === 'down'" class="text-tn-red text-xs">&#9660;</span>
      <span v-else-if="trend === 'flat'" class="text-tn-comment text-xs">&#9654;</span>
    </div>
  </div>
</template>
