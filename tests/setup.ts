import { expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import React from 'react'

// Mock timer globals to prevent unhandled errors during jsdom cleanup
const mockClearInterval = vi.fn()
global.clearInterval = mockClearInterval
// Also add to window object for jsdom cleanup
Object.defineProperty(window, 'clearInterval', {
  value: mockClearInterval,
  writable: true
})

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