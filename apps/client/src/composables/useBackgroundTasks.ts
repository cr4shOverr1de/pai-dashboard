// Background task state composable — reactive task tracking

import { computed, type Ref } from 'vue'
import type { BackgroundTask } from '../types'

export function useBackgroundTasks(tasks: Ref<BackgroundTask[]>) {
  const runningTasks = computed(() =>
    tasks.value.filter(t => t.status === 'running')
  )

  const completedTasks = computed(() =>
    tasks.value.filter(t => t.status === 'completed')
  )

  const failedTasks = computed(() =>
    tasks.value.filter(t => t.status === 'failed')
  )

  const runningCount = computed(() => runningTasks.value.length)
  const completedCount = computed(() => completedTasks.value.length)
  const failedCount = computed(() => failedTasks.value.length)
  const totalCount = computed(() => tasks.value.length)

  function getTask(id: string): BackgroundTask | undefined {
    return tasks.value.find(t => t.id === id)
  }

  function getTasksByStatus(status: BackgroundTask['status']): BackgroundTask[] {
    return tasks.value.filter(t => t.status === status)
  }

  return {
    tasks,
    runningTasks,
    completedTasks,
    failedTasks,
    runningCount,
    completedCount,
    failedCount,
    totalCount,
    getTask,
    getTasksByStatus,
  }
}
