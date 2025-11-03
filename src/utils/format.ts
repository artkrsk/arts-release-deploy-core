import { SIZE_UNITS } from '../constants'

/** Format bytes into human-readable size */
export function formatSize(bytes: number): string {
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${SIZE_UNITS[unitIndex]}`
}
