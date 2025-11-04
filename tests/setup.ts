import { expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import React from 'react'

// Ensure timer globals are available for jsdom cleanup
// Don't mock them here - let individual tests use vi.useFakeTimers() when needed
if (typeof global.clearInterval === 'undefined') {
  global.clearInterval = vi.fn()
}
if (typeof window.clearInterval === 'undefined') {
  Object.defineProperty(window, 'clearInterval', {
    value: vi.fn(),
    writable: true
  })
}

// Mock WordPress globals
global.wp = {
  element: {
    useState: React.useState,
    useEffect: React.useEffect,
    useCallback: React.useCallback,
    useRef: React.useRef,
    createElement: React.createElement,
    render: vi.fn(),
    unmountComponentAtNode: vi.fn()
  },
  components: {
    TextControl: vi.fn(() => React.createElement('div', {},
      React.createElement('input', {
        'data-testid': 'text-control',
        type: 'password'
      })
    )),
    Button: vi.fn(({ children, variant }) => React.createElement('button', {
      'data-testid': `button-${variant || 'link'}`
    }, children || `▶ token.howToCreate`)),
    Notice: vi.fn(({ children }) => React.createElement('div', {
      'data-testid': 'notice-info',
      className: 'components-notice'
    }, children))
  }
}