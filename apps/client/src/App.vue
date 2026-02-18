<script setup lang="ts">
import { ref } from 'vue'
import { useWebSocket } from './composables/useWebSocket'
import FilterPanel from './components/FilterPanel.vue'
import LivePulseChart from './components/LivePulseChart.vue'
import EventTimeline from './components/EventTimeline.vue'
import AgentSwimLaneContainer from './components/AgentSwimLaneContainer.vue'
import ToastNotification from './components/ToastNotification.vue'
import IntensityBar from './components/IntensityBar.vue'
import TopToolsWidget from './components/widgets/TopToolsWidget.vue'
import EventTypesWidget from './components/widgets/EventTypesWidget.vue'
import StatBadge from './components/stats/StatBadge.vue'

const { events, tasks, connected, eventsPerMinute } = useWebSocket()

// Filter state
const sourceFilter = ref('')
const sessionFilter = ref('')
const typeFilter = ref('')

// View tabs
const activeTab = ref<'timeline' | 'swimlanes'>('timeline')

// Stats sidebar toggle
const showStats = ref(true)
</script>

<template>
  <div class="relative z-10 h-full flex flex-col p-4 gap-3">
    <!-- Toast Notifications -->
    <ToastNotification :events="events" />

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

      <div class="flex items-center gap-3">
        <!-- Intensity bar -->
        <div class="w-40 hidden sm:block">
          <IntensityBar :events-per-minute="eventsPerMinute" />
        </div>

        <div class="flex items-center gap-3 text-xs text-tn-comment">
          <span>{{ events.length }} events</span>
          <span>{{ eventsPerMinute }} ev/min</span>
        </div>
      </div>
    </div>

    <!-- Filters + View Tabs -->
    <div class="flex items-center justify-between gap-3">
      <FilterPanel
        :source="sourceFilter"
        :session="sessionFilter"
        :type="typeFilter"
        @update:source="sourceFilter = $event"
        @update:session="sessionFilter = $event"
        @update:type="typeFilter = $event"
      />

      <div class="flex items-center gap-1">
        <!-- View tabs -->
        <button
          @click="activeTab = 'timeline'"
          class="px-2.5 py-1 text-xs rounded-l transition-colors"
          :class="activeTab === 'timeline'
            ? 'bg-tn-blue/20 text-tn-blue border border-tn-blue/30'
            : 'text-tn-comment hover:text-tn-fg border border-tn-fg-gutter/30'"
        >
          Timeline
        </button>
        <button
          @click="activeTab = 'swimlanes'"
          class="px-2.5 py-1 text-xs rounded-r transition-colors"
          :class="activeTab === 'swimlanes'
            ? 'bg-tn-magenta/20 text-tn-magenta border border-tn-magenta/30'
            : 'text-tn-comment hover:text-tn-fg border border-tn-fg-gutter/30'"
        >
          Swim Lanes
        </button>

        <!-- Stats toggle -->
        <button
          @click="showStats = !showStats"
          class="ml-2 px-2 py-1 text-xs rounded transition-colors"
          :class="showStats
            ? 'bg-tn-yellow/20 text-tn-yellow border border-tn-yellow/30'
            : 'text-tn-comment hover:text-tn-fg border border-tn-fg-gutter/30'"
        >
          Stats
        </button>
      </div>
    </div>

    <!-- Pulse Chart -->
    <LivePulseChart
      :events="events"
      :events-per-minute="eventsPerMinute"
    />

    <!-- Main content area -->
    <div class="flex-1 min-h-0 flex gap-3">
      <!-- Primary view -->
      <div class="flex-1 min-w-0">
        <EventTimeline
          v-if="activeTab === 'timeline'"
          :events="events"
          :source-filter="sourceFilter"
          :session-filter="sessionFilter"
          :type-filter="typeFilter"
        />
        <AgentSwimLaneContainer
          v-else
          :events="events"
          :source-filter="sourceFilter"
          :session-filter="sessionFilter"
          :type-filter="typeFilter"
        />
      </div>

      <!-- Stats sidebar -->
      <div
        v-if="showStats"
        class="w-64 flex-shrink-0 flex flex-col gap-3 overflow-y-auto"
      >
        <!-- Quick stats -->
        <div class="grid grid-cols-2 gap-2">
          <StatBadge
            label="Events"
            :value="events.length"
            color="#7aa2f7"
            icon="&#128202;"
          />
          <StatBadge
            label="ev/min"
            :value="eventsPerMinute"
            color="#9ece6a"
            icon="&#9889;"
          />
          <StatBadge
            label="Tasks"
            :value="tasks.length"
            color="#bb9af7"
            icon="&#128295;"
          />
          <StatBadge
            label="Sessions"
            :value="new Set(events.map(e => e.session_id)).size"
            color="#7dcfff"
            icon="&#128279;"
          />
        </div>

        <!-- Widgets -->
        <TopToolsWidget :events="events" />
        <EventTypesWidget :events="events" />
      </div>
    </div>
  </div>
</template>
