// Responsive breakpoint composable — matches Tailwind defaults

import { ref, onMounted, onUnmounted } from 'vue'

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export function useMediaQuery() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)
  const isSm = ref(false)
  const isMd = ref(false)
  const isLg = ref(false)
  const isXl = ref(false)
  const is2xl = ref(false)

  function update() {
    width.value = window.innerWidth
    isSm.value = width.value >= BREAKPOINTS.sm
    isMd.value = width.value >= BREAKPOINTS.md
    isLg.value = width.value >= BREAKPOINTS.lg
    isXl.value = width.value >= BREAKPOINTS.xl
    is2xl.value = width.value >= BREAKPOINTS['2xl']
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return {
    width,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    BREAKPOINTS,
  }
}
