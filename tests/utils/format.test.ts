import { describe, it, expect } from 'vitest'
import { formatSize } from '../../src/utils/format'

describe('formatSize', () => {
  it('formats bytes correctly', () => {
    expect(formatSize(100)).toBe('100.0 B')
  })

  it('formats kilobytes correctly', () => {
    expect(formatSize(1024)).toBe('1.0 KB')
    expect(formatSize(2048)).toBe('2.0 KB')
  })

  it('formats megabytes correctly', () => {
    expect(formatSize(1048576)).toBe('1.0 MB') // 1024 * 1024
    expect(formatSize(5242880)).toBe('5.0 MB') // 5 * 1024 * 1024
  })

  it('formats gigabytes correctly', () => {
    expect(formatSize(1073741824)).toBe('1.0 GB') // 1024 * 1024 * 1024
  })

  it('handles zero bytes', () => {
    expect(formatSize(0)).toBe('0.0 B')
  })

  it('handles fractional values', () => {
    expect(formatSize(1536)).toBe('1.5 KB') // 1.5 * 1024
  })
})
