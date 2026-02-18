<script setup lang="ts">
import { ref } from 'vue'
import { useWebSocket } from './composables/useWebSocket'
import FilterPanel from './components/FilterPanel.vue'
import LivePulseChart from './components/LivePulseChart.vue'
import EventTimeline from './components/EventTimeline.vue'

const { events, connected, eventsPerMinute } = useWebSocket()

// Filter state
const sourceFilter = ref('')
const sessionFilter = ref('')
const typeFilter = ref('')
</script>

<template>
  <div class="relative z-10 h-full flex flex-col p-4 gap-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold">
          <span class="text-tn-blue">PAI</span>
          <span class="text-tn-fg-dark ml-1">Observability</span>
        </h1>
        <span
          class="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
          :class="connected
            ? 'bg-tn-green/10 text-tn-green border border-tn-green/20'
            : 'bg-tn-red/10 text-tn-red border border-tn-red/20'"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="connected ? 'bg-tn-green animate-pulse' : 'bg-tn-red'" />
          {{ connected ? 'Connected' : 'Disconnected' }}
        </span>
      </div>

      <div class="flex items-center gap-3 text-xs text-tn-comment">
        <span>{{ events.length }} events</span>
        <span>{{ eventsPerMinute }} ev/min</span>
      </div>
    </div>

    <!-- Filters -->
    <FilterPanel
      :source="sourceFilter"
      :session="sessionFilter"
      :type="typeFilter"
      @update:source="sourceFilter = $event"
      @update:session="sessionFilter = $event"
      @update:type="typeFilter = $event"
    />

    <!-- Pulse Chart -->
    <LivePulseChart
      :events="events"
      :events-per-minute="eventsPerMinute"
    />

    <!-- Event Timeline (takes remaining space) -->
    <div class="flex-1 min-h-0">
      <EventTimeline
        :events="events"
        :source-filter="sourceFilter"
        :session-filter="sessionFilter"
        :type-filter="typeFilter"
      />
    </div>
  </div>
</template>
