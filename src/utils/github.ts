import { GITHUB_PROTOCOL } from '../constants'

/** Parse GitHub URL to extract components */
export function parseGitHubUrl(url: string): {
  owner?: string
  repo?: string
  release?: string
  filename?: string
} | null {
  if (!url || !url.startsWith(GITHUB_PROTOCOL)) {
    return null
  }

  const clean = url.replace(GITHUB_PROTOCOL, '')
  const parts = clean.split('/')

  if (parts.length >= 4 && parts[0] && parts[1] && parts[2] && parts[3]) {
    return {
      owner: parts[0],
      repo: parts[1],
      release: parts[2],
      filename: parts[3]
    }
  }

  return null
}

/** Build GitHub URL from components */
export function buildGitHubUrl(
  repo: string,
  release: string | 'latest',
  filename: string
): string {
  return `${GITHUB_PROTOCOL}${repo}/${release}/${filename}`
}
