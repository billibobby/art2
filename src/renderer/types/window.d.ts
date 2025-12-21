// Type declarations for renderer process
// Ensures TypeScript recognizes window.electronAPI

import type { ElectronAPI } from '../../types/electron'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}