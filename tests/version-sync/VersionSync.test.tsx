import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VersionSync } from '../../src/version-sync/VersionSync'

// Mock ProBadge component
vi.mock('../../src/components/ProBadge', () => ({
  ProBadge: vi.fn(({ label, icon, showWrapper, renderAsLink, href, text }) => (
    <div data-testid="pro-badge">
      <span data-testid="label">{label}</span>
      <span data-testid="icon">{icon}</span>
      <span data-testid="showWrapper">{String(showWrapper)}</span>
      <span data-testid="renderAsLink">{String(renderAsLink)}</span>
      <span data-testid="href">{href}</span>
      <span data-testid="text">{text}</span>
    </div>
  ))
}))

// Mock getString
vi.mock('../../src/utils/getString', () => ({
  getString: vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'sync.autoVersionSync': 'Auto Version Sync'
    }
    return translations[key] || key
  })
}))

describe('VersionSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup window.releaseDeployEDD properly
    Object.defineProperty(window, 'releaseDeployEDD', {
      writable: true,
      configurable: true,
      value: {
        purchaseUrl: 'https://example.com/buy-pro'
      }
    })
  })

  it('should render ProBadge with correct props', () => {
    render(<VersionSync />)

    const proBadge = screen.getByTestId('pro-badge')
    expect(proBadge).toBeInTheDocument()
  })

  it('should pass correct label from getString', () => {
    render(<VersionSync />)

    const label = screen.getByTestId('label')
    expect(label).toHaveTextContent('Auto Version Sync')
  })

  it('should pass correct icon', () => {
    render(<VersionSync />)

    const icon = screen.getByTestId('icon')
    expect(icon).toHaveTextContent('dashicons-update')
  })

  it('should show wrapper', () => {
    render(<VersionSync />)

    const showWrapper = screen.getByTestId('showWrapper')
    expect(showWrapper).toHaveTextContent('true')
  })

  it('should render as link', () => {
    render(<VersionSync />)

    const renderAsLink = screen.getByTestId('renderAsLink')
    expect(renderAsLink).toHaveTextContent('true')
  })

  it('should use purchase URL from window', () => {
    render(<VersionSync />)

    const href = screen.getByTestId('href')
    expect(href).toHaveTextContent('https://example.com/buy-pro')
  })

  it('should handle missing purchase URL', () => {
    window.releaseDeployEDD.purchaseUrl = undefined

    render(<VersionSync />)

    const href = screen.getByTestId('href')
    expect(href).toHaveTextContent('') // Falls back to empty string
  })
})