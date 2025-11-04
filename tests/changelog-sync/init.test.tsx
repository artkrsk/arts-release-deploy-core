import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import React from 'react'

// Mock wp.element.render BEFORE importing the module that uses it
const mockRender = vi.fn()
const mockWpElement = {
  render: mockRender
}

// Setup global mocks BEFORE any module imports
vi.stubGlobal('wp', { element: mockWpElement })

// Mock the ChangelogSync component
vi.mock('@/changelog-sync/ChangelogSync', () => ({
  ChangelogSync: vi.fn(() => null)
}))

describe('changelog-sync/init', () => {
  let initChangelogSync: any
  let MockChangelogSync: any

  beforeAll(async () => {
    // Clear module cache and import dynamically
    vi.resetModules()
    const initModule = await import('@/changelog-sync/init')
    const componentModule = await import('@/changelog-sync/ChangelogSync')
    initChangelogSync = initModule.initChangelogSync
    MockChangelogSync = componentModule.ChangelogSync
  })
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return early if container element is not found', () => {
    initChangelogSync()

    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should return early if downloadId is missing or invalid', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-changelog-sync-free-root'
    container.dataset.nonce = 'test-nonce'
    container.dataset.ajaxUrl = 'https://example.com/ajax'
    document.body.appendChild(container)

    // Test missing downloadId
    initChangelogSync()
    expect(mockRender).not.toHaveBeenCalled()

    // Test invalid downloadId
    container.dataset.downloadId = '0'
    initChangelogSync()
    expect(mockRender).not.toHaveBeenCalled()

    container.dataset.downloadId = '-1'
    initChangelogSync()
    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should return early if nonce is missing', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-changelog-sync-free-root'
    container.dataset.downloadId = '123'
    container.dataset.ajaxUrl = 'https://example.com/ajax'
    document.body.appendChild(container)

    initChangelogSync()

    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should return early if ajaxUrl is missing', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-changelog-sync-free-root'
    container.dataset.downloadId = '123'
    container.dataset.nonce = 'test-nonce'
    document.body.appendChild(container)

    // Mock window.ajaxurl to undefined
    Object.defineProperty(window, 'ajaxurl', { value: undefined, writable: true })

    initChangelogSync()

    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should render ChangelogSync component when all required data is present', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-changelog-sync-free-root'
    container.dataset.downloadId = '123'
    container.dataset.nonce = 'test-nonce'
    container.dataset.ajaxUrl = 'https://example.com/ajax'
    document.body.appendChild(container)

    initChangelogSync()

    expect(mockRender).toHaveBeenCalledTimes(1)
    const [element, containerArg] = mockRender.mock.calls[0]

    // Check that the right component was rendered
    expect(element.type).toBe(MockChangelogSync)
    expect(element.props).toMatchObject({
      downloadId: 123,
      nonce: 'test-nonce',
      ajaxUrl: 'https://example.com/ajax',
      isProFeature: true,
      lastSync: 0,
      isLinked: false
    })
    expect(containerArg).toBe(container)
  })

  it('should use window.ajaxurl as fallback for ajaxUrl', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-changelog-sync-free-root'
    container.dataset.downloadId = '123'
    container.dataset.nonce = 'test-nonce'
    document.body.appendChild(container)

    // Mock window.ajaxurl
    Object.defineProperty(window, 'ajaxurl', { value: 'https://fallback.example.com/ajax', writable: true })

    initChangelogSync()

    expect(mockRender).toHaveBeenCalledTimes(1)
    const [element] = mockRender.mock.calls[0]

    expect(element.props.ajaxUrl).toBe('https://fallback.example.com/ajax')
  })

  it('should parse downloadId correctly from dataset', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-changelog-sync-free-root'
    container.dataset.downloadId = '456'
    container.dataset.nonce = 'test-nonce'
    container.dataset.ajaxUrl = 'https://example.com/ajax'
    document.body.appendChild(container)

    initChangelogSync()

    const [element, containerArg] = mockRender.mock.calls[0]

    expect(element.props.downloadId).toBe(456)
    expect(containerArg).toBe(container)
  })
})