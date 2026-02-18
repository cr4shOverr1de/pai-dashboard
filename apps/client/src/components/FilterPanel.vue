<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { FilterOptions } from '../types'

const emit = defineEmits<{
  (e: 'update:source', val: string): void
  (e: 'update:session', val: string): void
  (e: 'update:type', val: string): void
}>()

const props = defineProps<{
  source: string
  session: string
  type: string
}>()

const options = ref<FilterOptions>({
  source_apps: [],
  session_ids: [],
  hook_event_types: [],
})

async function fetchOptions() {
  try {
    const res = await fetch('http://localhost:4000/events/filter-options')
    if (res.ok) {
      options.value = await res.json()
    }
  } catch {
    // Server might not be running yet
  }
}

// Refresh options periodically
onMounted(fetchOptions)
setInterval(fetchOptions, 10000)

function shortSession(id: string): string {
  return id.slice(0, 8) + '...'
}
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-2 glass-panel">
    <span class="text-xs text-tn-comment">Filters:</span>

    <select
      :value="props.source"
      @change="emit('update:source', ($event.target as HTMLSelectElement).value)"
      class="bg-tn-bg-dark border border-tn-fg-gutter/30 rounded px-2 py-1 text-xs text-tn-fg outline-none focus:border-tn-blue/50"
    >
      <option value="">All Sources</option>
      <option v-for="s in options.source_apps" :key="s" :value="s">{{ s }}</option>
    </select>

    <select
      :value="props.session"
      @change="emit('update:session', ($event.target as HTMLSelectElement).value)"
      class="bg-tn-bg-dark border border-tn-fg-gutter/30 rounded px-2 py-1 text-xs text-tn-fg outline-none focus:border-tn-blue/50"
    >
      <option value="">All Sessions</option>
      <option v-for="s in options.session_ids" :key="s" :value="s">{{ shortSession(s) }}</option>
    </select>

    <select
      :value="props.type"
      @change="emit('update:type', ($event.target as HTMLSelectElement).value)"
      class="bg-tn-bg-dark border border-tn-fg-gutter/30 rounded px-2 py-1 text-xs text-tn-fg outline-none focus:border-tn-blue/50"
    >
      <option value="">All Types</option>
      <option v-for="t in options.hook_event_types" :key="t" :value="t">{{ t }}</option>
    </select>

    <button
      v-if="props.source || props.session || props.type"
      @click="emit('update:source', ''); emit('update:session', ''); emit('update:type', '')"
      class="text-xs text-tn-red hover:text-tn-red-bright transition-colors"
    >
      Clear
    </button>
  </div>
</template>
