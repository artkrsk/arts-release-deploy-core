import { useEffect, useRef } from 'react'

/**
 * Hook for managing polling intervals with automatic cleanup
 * Ensures intervals are properly cleaned up to prevent memory leaks
 */
export function usePolling(
  callback: () => void,
  interval: number,
  enabled: boolean = true
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    // Clear any existing interval
    /* v8 ignore next 3 -- @preserve */
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Start new interval if enabled
    if (enabled && interval > 0) {
      intervalRef.current = setInterval(() => {
        callbackRef.current()
      }, interval)
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [interval, enabled])

  /**
   * Manually stop the polling
   */
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  /**
   * Manually trigger the callback
   */
  const trigger = () => {
    callbackRef.current()
  }

  return {
    stopPolling,
    trigger
  }
}

/**
 * Hook for managing multiple timeouts with automatic cleanup
 * Useful for components that need to manage multiple delayed operations
 */
export function useTimeouts() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  /**
   * Set a tracked timeout that will be automatically cleaned up
   */
  const setTrackedTimeout = (callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      callback()
      timeoutsRef.current.delete(timeoutId)
    }, delay)

    timeoutsRef.current.add(timeoutId)
    return timeoutId
  }

  /**
   * Clear a specific timeout
   */
  const clearTrackedTimeout = (timeoutId: NodeJS.Timeout) => {
    clearTimeout(timeoutId)
    timeoutsRef.current.delete(timeoutId)
  }

  /**
   * Clear all tracked timeouts
   */
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current.clear()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts()
    }
  }, [])

  return {
    setTrackedTimeout,
    clearTrackedTimeout,
    clearAllTimeouts
  }
}
