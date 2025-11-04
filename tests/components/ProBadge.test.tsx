import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProBadge } from '../../src/components/ProBadge'
import * as utilsModule from '../../src/utils/getString'

// Mock the getString utility
vi.mock('../../src/utils/getString', () => ({
  getString: vi.fn((key: string) => {
    const translations: Record<string, string> = {
      'common.getPro': 'Get Pro'
    }
    return translations[key] || key
  })
}))

describe('ProBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering as link or span', () => {
    it('should render as a link when renderAsLink is true and href is provided', () => {
      render(
        <ProBadge
          renderAsLink={true}
          href="https://example.com/pro"
        />
      )

      const link = screen.getByRole('link', { name: /Get Pro - Pro feature/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/pro')
    })

    it('should render as a span when renderAsLink is false', () => {
      render(
        <ProBadge
          renderAsLink={false}
          href="https://example.com/pro"
        />
      )

      const badge = screen.getByRole('status', { name: /Get Pro - Pro feature/i })
      expect(badge).toBeInTheDocument()
      expect(badge.tagName).toBe('SPAN')
    })

    it('should render as a span when href is not provided', () => {
      render(
        <ProBadge
          renderAsLink={true}
        />
      )

      const badge = screen.getByRole('status', { name: /Get Pro - Pro feature/i })
      expect(badge).toBeInTheDocument()
      expect(badge.tagName).toBe('SPAN')
    })
  })

  describe('window opening behavior', () => {
    it('should open in new window by default', () => {
      render(
        <ProBadge
          renderAsLink={true}
          href="https://example.com/pro"
        />
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should not open in new window when openInNewWindow is false', () => {
      render(
        <ProBadge
          renderAsLink={true}
          href="https://example.com/pro"
          openInNewWindow={false}
        />
      )

      const link = screen.getByRole('link')
      expect(link).not.toHaveAttribute('target')
      expect(link).not.toHaveAttribute('rel')
    })
  })

  describe('wrapper behavior', () => {
    it('should show wrapper by default', () => {
      render(
        <ProBadge />
      )

      const wrapper = document.querySelector('.arts-license-pro-badge-wrapper')
      expect(wrapper).toBeInTheDocument()
    })

    it('should show wrapper with label when provided', () => {
      render(
        <ProBadge
          label="Premium Feature"
          showWrapper={true}
        />
      )

      expect(screen.getByText('Premium Feature')).toBeInTheDocument()
      const labelElement = document.querySelector('.arts-license-pro-badge-wrapper__label')
      expect(labelElement).toHaveTextContent('Premium Feature')
    })

    it('should show wrapper with icon when provided', () => {
      render(
        <ProBadge
          icon="dashicons-star-filled"
          showWrapper={true}
        />
      )

      const icon = document.querySelector('.dashicons.dashicons-star-filled')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('role', 'img')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should show wrapper with both label and icon', () => {
      render(
        <ProBadge
          label="Premium"
          icon="dashicons-star"
          showWrapper={true}
        />
      )

      expect(screen.getByText('Premium')).toBeInTheDocument()
      const icon = document.querySelector('.dashicons.dashicons-star')
      expect(icon).toBeInTheDocument()
    })

    it('should not show wrapper when showWrapper is false', () => {
      render(
        <ProBadge
          label="Premium Feature"
          icon="dashicons-star"
          showWrapper={false}
        />
      )

      const wrapper = document.querySelector('.arts-license-pro-badge-wrapper')
      expect(wrapper).not.toBeInTheDocument()

      // Badge should still be rendered
      const badge = document.querySelector('.arts-license-pro-badge')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('text customization', () => {
    it('should use custom text when provided', () => {
      render(
        <ProBadge
          text="Upgrade Now"
        />
      )

      expect(screen.getByText('Upgrade Now')).toBeInTheDocument()
    })

    it('should use getString fallback when text is not provided', () => {
      const getStringSpy = vi.spyOn(utilsModule, 'getString')

      render(<ProBadge />)

      expect(getStringSpy).toHaveBeenCalledWith('common.getPro')
      expect(screen.getByText('Get Pro')).toBeInTheDocument()
    })
  })

  describe('status classes', () => {
    it('should apply default status class when status is default', () => {
      render(
        <ProBadge status="default" />
      )

      const badge = document.querySelector('.arts-license-pro-badge')
      expect(badge).toHaveClass('arts-license-pro-badge')
      expect(badge).not.toHaveClass('arts-license-pro-badge_warning')
      expect(badge).not.toHaveClass('arts-license-pro-badge_error')
      expect(badge).not.toHaveClass('arts-license-pro-badge_success')
    })

    it('should apply warning status class', () => {
      render(
        <ProBadge status="warning" />
      )

      const badge = document.querySelector('.arts-license-pro-badge_warning')
      expect(badge).toBeInTheDocument()
    })

    it('should apply error status class', () => {
      render(
        <ProBadge status="error" />
      )

      const badge = document.querySelector('.arts-license-pro-badge_error')
      expect(badge).toBeInTheDocument()
    })

    it('should apply success status class', () => {
      render(
        <ProBadge status="success" />
      )

      const badge = document.querySelector('.arts-license-pro-badge_success')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('aria labels', () => {
    it('should have correct aria-label for link', () => {
      render(
        <ProBadge
          renderAsLink={true}
          href="https://example.com"
          text="Upgrade"
        />
      )

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('aria-label', 'Upgrade - Pro feature')
    })

    it('should have correct aria-label for span', () => {
      render(
        <ProBadge
          renderAsLink={false}
          text="Premium Only"
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('aria-label', 'Premium Only - Pro feature')
    })
  })

  describe('complete integration', () => {
    it('should render complete badge with all features', () => {
      const { container } = render(
        <ProBadge
          label="Advanced Settings"
          icon="dashicons-admin-settings"
          showWrapper={true}
          renderAsLink={true}
          href="https://example.com/buy"
          text="Unlock Feature"
          status="warning"
          openInNewWindow={true}
        />
      )

      // Check wrapper
      const wrapper = container.querySelector('.arts-license-pro-badge-wrapper')
      expect(wrapper).toBeInTheDocument()

      // Check icon
      const icon = container.querySelector('.dashicons.dashicons-admin-settings')
      expect(icon).toBeInTheDocument()

      // Check label
      expect(screen.getByText('Advanced Settings')).toBeInTheDocument()

      // Check badge as link
      const badge = screen.getByRole('link', { name: /Unlock Feature - Pro feature/i })
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('arts-license-pro-badge')
      expect(badge).toHaveClass('arts-license-pro-badge_warning')
      expect(badge).toHaveAttribute('href', 'https://example.com/buy')
      expect(badge).toHaveAttribute('target', '_blank')
      expect(badge).toHaveTextContent('Unlock Feature')
    })
  })
})