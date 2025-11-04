import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChangelogSync } from '../../src/changelog-sync/ChangelogSync'

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
      'sync.autoChangelogSync': 'Auto Changelog Sync'
    }
    return translations[key] || key
  })
}))

describe('ChangelogSync', () => {
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
    render(<ChangelogSync />)

    const proBadge = screen.getByTestId('pro-badge')
    expect(proBadge).toBeInTheDocument()
  })

  it('should pass correct label from getString', () => {
    render(<ChangelogSync />)

    const label = screen.getByTestId('label')
    expect(label).toHaveTextContent('Auto Changelog Sync')
  })

  it('should pass correct icon', () => {
    render(<ChangelogSync />)

    const icon = screen.getByTestId('icon')
    expect(icon).toHaveTextContent('dashicons-media-document')
  })

  it('should show wrapper', () => {
    render(<ChangelogSync />)

    const showWrapper = screen.getByTestId('showWrapper')
    expect(showWrapper).toHaveTextContent('true')
  })

  it('should render as link', () => {
    render(<ChangelogSync />)

    const renderAsLink = screen.getByTestId('renderAsLink')
    expect(renderAsLink).toHaveTextContent('true')
  })

  it('should use purchase URL from window', () => {
    render(<ChangelogSync />)

    const href = screen.getByTestId('href')
    expect(href).toHaveTextContent('https://example.com/buy-pro')
  })

  it('should handle missing purchase URL', () => {
    window.releaseDeployEDD.purchaseUrl = undefined

    render(<ChangelogSync />)

    const href = screen.getByTestId('href')
    expect(href).toHaveTextContent('') // Falls back to empty string
  })
})