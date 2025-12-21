// TypeScript type definitions for Electron IPC communication

// Chat message interface
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageData?: string
  imageMimeType?: string
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

// Main Electron API interface exposed to renderer
export interface ElectronAPI {
  // Store operations
  getStoreValue: (key: string) => Promise<any>
  setStoreValue: (key: string, value: any) => Promise<boolean>
  getAiStatus: () => Promise<AiStatus>
  
  // Window controls
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  isWindowMaximized: () => Promise<boolean>
  onWindowMaximizeChanged: (callback: (isMaximized: boolean) => void) => void
  
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