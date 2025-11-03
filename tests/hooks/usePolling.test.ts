import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePolling, useTimeouts } from '../../src/hooks/usePolling'

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should call callback at specified interval when enabled', () => {
    const callback = vi.fn()
    renderHook(() => usePolling(callback, 1000, true))

    // Should not call immediately
    expect(callback).not.toHaveBeenCalled()

    // After 1 second
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    // After 3 seconds total
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('should not call callback when disabled', () => {
    const callback = vi.fn()
    renderHook(() => usePolling(callback, 1000, false))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should stop polling when enabled changes to false', () => {
    const callback = vi.fn()
    const { rerender } = renderHook(
      ({ enabled }) => usePolling(callback, 1000, enabled),
      { initialProps: { enabled: true } }
    )

    // Polling should work
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    // Disable polling
    rerender({ enabled: false })
    callback.mockClear()

    // Should not poll anymore
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(callback).not.toHaveBeenCalled()
  })

  it('should restart polling when interval changes', () => {
    const callback = vi.fn()
    const { rerender } = renderHook(
      ({ interval }) => usePolling(callback, interval, true),
      { initialProps: { interval: 1000 } }
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    // Change interval
    callback.mockClear()
    rerender({ interval: 500 })

    // Should use new interval
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should update callback without restarting interval', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const { rerender } = renderHook(
      ({ cb }) => usePolling(cb, 1000, true),
      { initialProps: { cb: callback1 } }
    )

    // First callback should be called
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).not.toHaveBeenCalled()

    // Change callback
    rerender({ cb: callback2 })

    // Second callback should be called on next tick
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback1).toHaveBeenCalledTimes(1) // Not called again
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('should manually stop polling via stopPolling', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => usePolling(callback, 1000, true))

    // Should poll normally
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    // Manually stop
    act(() => {
      result.current.stopPolling()
    })
    callback.mockClear()

    // Should not poll anymore
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(callback).not.toHaveBeenCalled()
  })

  it('should manually trigger callback via trigger', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => usePolling(callback, 10000, true))

    // Trigger manually before interval
    act(() => {
      result.current.trigger()
    })
    expect(callback).toHaveBeenCalledTimes(1)

    // Should still poll on interval
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should cleanup interval on unmount', () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => usePolling(callback, 1000, true))

    unmount()

    // Should not call after unmount
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(callback).not.toHaveBeenCalled()
  })

  it('should not start interval when interval is zero or negative', () => {
    const callback = vi.fn()
    renderHook(() => usePolling(callback, 0, true))

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(callback).not.toHaveBeenCalled()
  })

  it('should handle stopPolling when no interval is active', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => usePolling(callback, 1000, false))

    // No interval is active since enabled is false
    act(() => {
      result.current.stopPolling()
    })

    // Should not throw and should not affect anything
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(callback).not.toHaveBeenCalled()
  })

  it('should clear existing interval when changing from active to disabled', () => {
    const callback = vi.fn()
    const { rerender } = renderHook(
      ({ interval }) => usePolling(callback, interval, true),
      { initialProps: { interval: 1000 } }
    )

    // Let interval be created and fire once
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    // Change interval while polling is active - this should clear the old interval
    rerender({ interval: 2000 })

    // Reset callback to verify the new interval is used
    callback.mockClear()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should clear and restart interval when both interval and enabled change', () => {
    const callback = vi.fn()
    const { rerender } = renderHook(
      ({ interval, enabled }) => usePolling(callback, interval, enabled),
      { initialProps: { interval: 1000, enabled: true } }
    )

    // Wait for first tick to ensure interval is active
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Change both interval and keep enabled - should clear old interval and start new one
    act(() => {
      rerender({ interval: 500, enabled: true })
    })

    callback.mockClear()
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('useTimeouts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should execute timeout callback after delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useTimeouts())

    act(() => {
      result.current.setTrackedTimeout(callback, 1000)
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should track multiple timeouts independently', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const { result } = renderHook(() => useTimeouts())

    act(() => {
      result.current.setTrackedTimeout(callback1, 500)
      result.current.setTrackedTimeout(callback2, 1000)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('should clear specific timeout', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useTimeouts())

    let timeoutId: NodeJS.Timeout
    act(() => {
      timeoutId = result.current.setTrackedTimeout(callback, 1000)
    })

    act(() => {
      result.current.clearTrackedTimeout(timeoutId)
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should clear all timeouts', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const callback3 = vi.fn()
    const { result } = renderHook(() => useTimeouts())

    act(() => {
      result.current.setTrackedTimeout(callback1, 500)
      result.current.setTrackedTimeout(callback2, 1000)
      result.current.setTrackedTimeout(callback3, 1500)
    })

    act(() => {
      result.current.clearAllTimeouts()
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).not.toHaveBeenCalled()
    expect(callback3).not.toHaveBeenCalled()
  })

  it('should cleanup all timeouts on unmount', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const { result, unmount } = renderHook(() => useTimeouts())

    act(() => {
      result.current.setTrackedTimeout(callback1, 500)
      result.current.setTrackedTimeout(callback2, 1000)
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).not.toHaveBeenCalled()
  })

  it('should auto-remove timeout from tracking after execution', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useTimeouts())

    act(() => {
      result.current.setTrackedTimeout(callback, 500)
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(1)

    // clearAllTimeouts should not affect already-executed timeout
    act(() => {
      result.current.clearAllTimeouts()
    })

    // Callback was already called once
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
