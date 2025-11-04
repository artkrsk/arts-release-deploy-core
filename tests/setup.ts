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

// Mock WordPress globals with enhanced component support
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
    TextControl: vi.fn(({ value, onChange, type = 'text', label, disabled = false, ...props }) => {
      return React.createElement('input', {
        'data-testid': 'text-control',
        type,
        value: value || '',
        disabled,
        onChange: (e: any) => onChange && onChange(e.target.value),
        ...props
      })
    }),
    Button: vi.fn(({ children, onClick, variant = 'primary', disabled = false, ...props }) => {
      return React.createElement('button', {
        'data-testid': `button-${variant}`,
        onClick,
        disabled,
        ...props
      }, children)
    }),
    Notice: vi.fn(({ children, status = 'info', onRemove, ...props }) => {
      return React.createElement('div', {
        'data-testid': `notice-${status}`,
        className: `components-notice is-${status}`,
        ...props
      }, children)
    }),
    BaseControl: vi.fn(({ label, children, ...props }) => {
      return React.createElement('div', {
        'data-testid': 'base-control',
        ...props
      }, [label && React.createElement('label', { key: 'label' }, label), children])
    })
  }
}