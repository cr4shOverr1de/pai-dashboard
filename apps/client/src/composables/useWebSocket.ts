// WebSocket composable — auto-connect, reconnect, event buffering

import { ref, onUnmounted } from 'vue'
import type { HookEvent, BackgroundTask, WebSocketMessage } from '../types'

const WS_URL = 'ws://localhost:4000/stream'
const RECONNECT_DELAY = 3000

export function useWebSocket() {
  const events = ref<HookEvent[]>([])
  const tasks = ref<BackgroundTask[]>([])
  const connected = ref(false)
  const eventsPerMinute = ref(0)

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let eventTimestamps: number[] = []

  function connect() {
    if (ws?.readyState === WebSocket.OPEN) return

    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      connected.value = true
      console.log('[ws] Connected to PAI Observability Server')
    }

    ws.onmessage = (event) => {
      try {
        const msg: WebSocketMessage = JSON.parse(event.data)

        if (msg.type === 'initial') {
          events.value = msg.data as HookEvent[]
        } else if (msg.type === 'event') {
          const hookEvent = msg.data as HookEvent
          events.value.push(hookEvent)
          // Keep last 1000 events in client
          if (events.value.length > 1000) {
            events.value = events.value.slice(-1000)
          }
          // Track events/min
          eventTimestamps.push(Date.now())
        } else if (msg.type === 'task_update') {
          const task = msg.data as BackgroundTask
          const idx = tasks.value.findIndex(t => t.id === task.id)
          if (idx >= 0) {
            tasks.value[idx] = task
          } else {
            tasks.value.push(task)
          }
        }
      } catch (err) {
        console.error('[ws] Parse error:', err)
      }
    }

    ws.onclose = () => {
      connected.value = false
      console.log('[ws] Disconnected. Reconnecting...')
      scheduleReconnect()
    }

    ws.onerror = () => {
      connected.value = false
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connect, RECONNECT_DELAY)
  }

  // Calculate events per minute every 5 seconds
  setInterval(() => {
    const now = Date.now()
    const oneMinuteAgo = now - 60_000
    eventTimestamps = eventTimestamps.filter(t => t > oneMinuteAgo)
    eventsPerMinute.value = eventTimestamps.length
  }, 5000)

  onUnmounted(() => {
    ws?.close()
    if (reconnectTimer) clearTimeout(reconnectTimer)
  })

  // Auto-connect
  connect()

  return {
    events,
    tasks,
    connected,
    eventsPerMinute,
    connect,
  }
}
