import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import React from 'react'

// Mock wp.element.render BEFORE importing the module that uses it
const mockRender = vi.fn()
const mockWpElement = {
  render: mockRender
}

// Setup global mocks BEFORE any module imports
vi.stubGlobal('wp', { element: mockWpElement })

// Mock the VersionSync component
vi.mock('@/version-sync/VersionSync', () => ({
  VersionSync: vi.fn(() => null)
}))

describe('version-sync/init', () => {
  let initVersionSync: any
  let MockVersionSync: any

  beforeAll(async () => {
    // Clear module cache and import dynamically
    vi.resetModules()
    const initModule = await import('@/version-sync/init')
    const componentModule = await import('@/version-sync/VersionSync')
    initVersionSync = initModule.initVersionSync
    MockVersionSync = componentModule.VersionSync
  })
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return early if container element is not found', () => {
    initVersionSync()

    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should return early if downloadId is missing or invalid', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-version-sync-free-root'
    container.dataset.nonce = 'test-nonce'
    container.dataset.ajaxUrl = 'https://example.com/ajax'
    document.body.appendChild(container)

    // Test missing downloadId
    initVersionSync()
    expect(mockRender).not.toHaveBeenCalled()

    // Test invalid downloadId
    container.dataset.downloadId = '0'
    initVersionSync()
    expect(mockRender).not.toHaveBeenCalled()

    container.dataset.downloadId = '-1'
    initVersionSync()
    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should return early if nonce is missing', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-version-sync-free-root'
    container.dataset.downloadId = '123'
    container.dataset.ajaxUrl = 'https://example.com/ajax'
    document.body.appendChild(container)

    initVersionSync()

    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should return early if ajaxUrl is missing', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-version-sync-free-root'
    container.dataset.downloadId = '123'
    container.dataset.nonce = 'test-nonce'
    document.body.appendChild(container)

    // Mock window.ajaxurl to undefined
    Object.defineProperty(window, 'ajaxurl', { value: undefined, writable: true })

    initVersionSync()

    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should render VersionSync component when all required data is present', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-version-sync-free-root'
    container.dataset.downloadId = '123'
    container.dataset.nonce = 'test-nonce'
    container.dataset.ajaxUrl = 'https://example.com/ajax'
    document.body.appendChild(container)

    initVersionSync()

    expect(mockRender).toHaveBeenCalledTimes(1)
    const [element, containerArg] = mockRender.mock.calls[0]

    // Check that the right component was rendered
    expect(element.type).toBe(MockVersionSync)
    expect(element.props).toMatchObject({
      downloadId: 123,
      currentVersion: '',
      githubVersion: '',
      lastSync: 0,
      nonce: 'test-nonce',
      ajaxUrl: 'https://example.com/ajax',
      isProFeature: true
    })
    expect(containerArg).toBe(container)
  })

  it('should use window.ajaxurl as fallback for ajaxUrl', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-version-sync-free-root'
    container.dataset.downloadId = '123'
    container.dataset.nonce = 'test-nonce'
    document.body.appendChild(container)

    // Mock window.ajaxurl
    Object.defineProperty(window, 'ajaxurl', { value: 'https://fallback.example.com/ajax', writable: true })

    initVersionSync()

    expect(mockRender).toHaveBeenCalledTimes(1)
    const [element] = mockRender.mock.calls[0]

    expect(element.props.ajaxUrl).toBe('https://fallback.example.com/ajax')
  })

  it('should parse downloadId correctly from dataset', () => {
    const container = document.createElement('div')
    container.id = 'release-deploy-edd-version-sync-free-root'
    container.dataset.downloadId = '456'
    container.dataset.nonce = 'test-nonce'
    container.dataset.ajaxUrl = 'https://example.com/ajax'
    document.body.appendChild(container)

    initVersionSync()

    const [element, containerArg] = mockRender.mock.calls[0]

    expect(element.props.downloadId).toBe(456)
    expect(element.props.currentVersion).toBe('')
    expect(element.props.githubVersion).toBe('')
    expect(element.props.lastSync).toBe(0)
    expect(element.props.isProFeature).toBe(true)
    expect(containerArg).toBe(container)
  })
})