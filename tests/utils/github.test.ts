import { describe, it, expect } from 'vitest'
import { parseGitHubUrl, buildGitHubUrl } from '../../src/utils/github'

describe('parseGitHubUrl', () => {
  it('parses valid GitHub URL correctly', () => {
    const url = 'edd-release-deploy://owner/repo/v1.0.0/file.zip'
    const result = parseGitHubUrl(url)

    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      release: 'v1.0.0',
      filename: 'file.zip'
    })
  })

  it('returns null for invalid protocol', () => {
    const url = 'https://github.com/owner/repo'
    const result = parseGitHubUrl(url)

    expect(result).toBeNull()
  })

  it('returns null for incomplete URL', () => {
    const url = 'edd-release-deploy://owner/repo'
    const result = parseGitHubUrl(url)

    expect(result).toBeNull()
  })

  it('returns null for empty string', () => {
    const result = parseGitHubUrl('')

    expect(result).toBeNull()
  })

  it('handles "latest" as release tag', () => {
    const url = 'edd-release-deploy://owner/repo/latest/file.zip'
    const result = parseGitHubUrl(url)

    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      release: 'latest',
      filename: 'file.zip'
    })
  })
})

describe('buildGitHubUrl', () => {
  it('builds URL correctly', () => {
    const url = buildGitHubUrl('owner/repo', 'v1.0.0', 'file.zip')

    expect(url).toBe('edd-release-deploy://owner/repo/v1.0.0/file.zip')
  })

  it('handles "latest" release', () => {
    const url = buildGitHubUrl('owner/repo', 'latest', 'file.zip')

    expect(url).toBe('edd-release-deploy://owner/repo/latest/file.zip')
  })
})
