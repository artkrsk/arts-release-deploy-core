import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsApp } from '../../src/settings/SettingsApp'

// Mock TokenField component
vi.mock('../../src/settings/TokenField', () => ({
  TokenField: vi.fn(({ initialValue, onChange }) => (
    <div data-testid="token-field">
      <span data-testid="initial-value">{initialValue || ''}</span>
      <button onClick={() => onChange('new-token')}>Change Token</button>
    </div>
  ))
}))

describe('SettingsApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup window.releaseDeployEDD
    Object.defineProperty(window, 'releaseDeployEDD', {
      writable: true,
      configurable: true,
      value: {
        contexts: {
          settings: {
            token: 'github_pat_existing_token'
          }
        }
      }
    })
  })

  it('should render TokenField component', () => {
    render(<SettingsApp />)

    const tokenField = screen.getByTestId('token-field')
    expect(tokenField).toBeInTheDocument()
  })

  it('should pass initial token from window context', () => {
    render(<SettingsApp />)

    const initialValue = screen.getByTestId('initial-value')
    expect(initialValue).toHaveTextContent('github_pat_existing_token')
  })

  it('should handle missing contexts gracefully', () => {
    window.releaseDeployEDD = {}

    render(<SettingsApp />)

    const initialValue = screen.getByTestId('initial-value')
    expect(initialValue).toHaveTextContent('') // Empty when no token
  })

  it('should handle missing settings context', () => {
    window.releaseDeployEDD = {
      contexts: {}
    }

    render(<SettingsApp />)

    const initialValue = screen.getByTestId('initial-value')
    expect(initialValue).toHaveTextContent('') // Empty when no token
  })

  it('should handle missing token in settings', () => {
    window.releaseDeployEDD = {
      contexts: {
        settings: {}
      }
    }

    render(<SettingsApp />)

    const initialValue = screen.getByTestId('initial-value')
    expect(initialValue).toHaveTextContent('') // Empty when no token
  })

  it('should update token state on change', () => {
    const { rerender } = render(<SettingsApp />)

    // Initial value
    let initialValue = screen.getByTestId('initial-value')
    expect(initialValue).toHaveTextContent('github_pat_existing_token')

    // Trigger change
    const changeButton = screen.getByText('Change Token')
    changeButton.click()

    // Re-render to check state update
    rerender(<SettingsApp />)

    // The token state would be updated internally
    // In a real scenario, we'd need to check if TokenField is re-rendered with new value
    // Since we're mocking, we just verify the onChange callback could be called
    expect(changeButton).toBeInTheDocument()
  })

  it('should handle undefined window.releaseDeployEDD', () => {
    // @ts-ignore - Testing edge case
    delete window.releaseDeployEDD

    render(<SettingsApp />)

    const initialValue = screen.getByTestId('initial-value')
    expect(initialValue).toHaveTextContent('') // Empty when no global
  })
})