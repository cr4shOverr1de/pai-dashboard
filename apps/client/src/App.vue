<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useWebSocket } from './composables/useWebSocket'
import { useEventSearch } from './composables/useEventSearch'
import { useMediaQuery } from './composables/useMediaQuery'
import FilterPanel from './components/FilterPanel.vue'
import LivePulseChart from './components/LivePulseChart.vue'
import EventTimeline from './components/EventTimeline.vue'
import AgentSwimLaneContainer from './components/AgentSwimLaneContainer.vue'
import ChatTranscript from './components/ChatTranscript.vue'
import ToastNotification from './components/ToastNotification.vue'
import IntensityBar from './components/IntensityBar.vue'
import TopToolsWidget from './components/widgets/TopToolsWidget.vue'
import EventTypesWidget from './components/widgets/EventTypesWidget.vue'
import StatBadge from './components/stats/StatBadge.vue'

const { events, tasks, connected, eventsPerMinute } = useWebSocket()
const { searchQuery, filteredEvents, matchCount, isSearching } = useEventSearch(events)
const { isLg } = useMediaQuery()

// Filter state
const sourceFilter = ref('')
const sessionFilter = ref('')
const typeFilter = ref('')

// View tabs
const activeTab = ref<'timeline' | 'swimlanes' | 'chat'>('timeline')

// Stats sidebar toggle — auto-hide on small viewports
const showStats = ref(true)
const userToggledStats = ref(false)

watchEffect(() => {
  if (!userToggledStats.value) {
    showStats.value = isLg.value
  }
})

function toggleStats() {
  userToggledStats.value = true
  showStats.value = !showStats.value
}

// Apply search filter to events passed to views
const displayEvents = computed(() => {
  if (isSearching.value) return filteredEvents.value
  return events.value
})

const tabs = [
  { id: 'timeline' as const, label: 'Timeline', color: 'blue' },
  { id: 'swimlanes' as const, label: 'Swim Lanes', color: 'magenta' },
  { id: 'chat' as const, label: 'Chat', color: 'cyan' },
]
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
        <!-- Search bar -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search events..."
            class="w-48 px-3 py-1 text-xs rounded-lg bg-tn-bg-darker/80 border border-tn-fg-gutter/30 text-tn-fg placeholder-tn-comment/50 focus:outline-none focus:border-tn-blue/40 transition-colors"
          />
          <span
            v-if="isSearching"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-tn-comment"
          >
            {{ matchCount }}
          </span>
        </div>

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
          v-for="(tab, idx) in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-2.5 py-1 text-xs transition-colors"
          :class="[
            activeTab === tab.id
              ? `bg-tn-${tab.color}/20 text-tn-${tab.color} border border-tn-${tab.color}/30`
              : 'text-tn-comment hover:text-tn-fg border border-tn-fg-gutter/30',
            idx === 0 ? 'rounded-l' : '',
            idx === tabs.length - 1 ? 'rounded-r' : '',
          ]"
          :style="activeTab === tab.id ? {
            backgroundColor: tab.color === 'blue' ? 'rgba(122,162,247,0.2)' : tab.color === 'magenta' ? 'rgba(187,154,247,0.2)' : 'rgba(125,207,255,0.2)',
            color: tab.color === 'blue' ? '#7aa2f7' : tab.color === 'magenta' ? '#bb9af7' : '#7dcfff',
            borderColor: tab.color === 'blue' ? 'rgba(122,162,247,0.3)' : tab.color === 'magenta' ? 'rgba(187,154,247,0.3)' : 'rgba(125,207,255,0.3)',
          } : {}"
        >
          {{ tab.label }}
        </button>

        <!-- Stats toggle -->
        <button
          @click="toggleStats()"
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
          :events="displayEvents"
          :source-filter="sourceFilter"
          :session-filter="sessionFilter"
          :type-filter="typeFilter"
        />
        <AgentSwimLaneContainer
          v-else-if="activeTab === 'swimlanes'"
          :events="displayEvents"
          :source-filter="sourceFilter"
          :session-filter="sessionFilter"
          :type-filter="typeFilter"
        />
        <ChatTranscript
          v-else
          :events="displayEvents"
          :session-filter="sessionFilter"
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
