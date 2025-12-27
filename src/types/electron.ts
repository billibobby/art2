// TypeScript type definitions for Electron IPC communication

// Chat message interface
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// AI analysis result interface
export interface AnalysisResult {
  success: boolean
  text?: string
  error?: string
}

// AI status interface
export interface AiStatus {
  isInitialized: boolean
  hasApiKey: boolean
  modelName: string
}

// Window state interface
export interface WindowState {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
}

// Settings interface
export interface Settings {
  // Placeholder for future application settings
  // Add theme preferences, UI state, or other configuration here
}

// Store value union type
export type StoreValue = ChatMessage[] | WindowState | Settings | undefined

// Main Electron API interface exposed to renderer
export interface ElectronAPI {
  // Store operations - specific getters only
  getSettings: () => Promise<Settings>
  setSettings: (value: Settings) => Promise<boolean>
  getWindowState: () => Promise<WindowState | undefined>
  getAiStatus: () => Promise<AiStatus>
  
  // Window controls
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isWindowMaximized: () => Promise<boolean>
  onWindowMaximizeChanged: (callback: (isMaximized: boolean) => void) => () => void
  
  // AI Analysis
  analyzeImage: (imageBase64: string, mimeType: string, prompt: string) => Promise<AnalysisResult>
  
  // Chat history
  getChatHistory: () => Promise<ChatMessage[]>
  saveMessage: (message: ChatMessage) => Promise<boolean>
  clearHistory: () => Promise<boolean>
  deleteMessage: (messageId: string) => Promise<boolean>
}

// Global window interface augmentation
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}