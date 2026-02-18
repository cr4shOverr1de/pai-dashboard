// Full-text event search composable with debounced input

import { ref, computed, watch, type Ref } from 'vue'
import type { HookEvent } from '../types'

export function useEventSearch(events: Ref<HookEvent[]>) {
  const searchQuery = ref('')
  const debouncedQuery = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Debounce search input by 200ms
  watch(searchQuery, (val) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debouncedQuery.value = val.toLowerCase().trim()
    }, 200)
  })

  // Search across event fields
  function matchesQuery(event: HookEvent, query: string): boolean {
    if (!query) return true

    // Search in tool name
    if (event.tool_name?.toLowerCase().includes(query)) return true

    // Search in agent name
    if (event.agent_name?.toLowerCase().includes(query)) return true

    // Search in event type
    if (event.hook_event_type.toLowerCase().includes(query)) return true

    // Search in payload string values
    if (event.payload) {
      for (const value of Object.values(event.payload)) {
        if (typeof value === 'string' && value.toLowerCase().includes(query)) return true
      }
    }

    // Search in tool input string values
    if (event.tool_input) {
      for (const value of Object.values(event.tool_input)) {
        if (typeof value === 'string' && value.toLowerCase().includes(query)) return true
      }
    }

    return false
  }

  const filteredEvents = computed(() => {
    const q = debouncedQuery.value
    if (!q) return events.value
    return events.value.filter(e => matchesQuery(e, q))
  })

  const matchCount = computed(() => {
    if (!debouncedQuery.value) return events.value.length
    return filteredEvents.value.length
  })

  const isSearching = computed(() => debouncedQuery.value.length > 0)

  return {
    searchQuery,
    filteredEvents,
    matchCount,
    isSearching,
  }
}
