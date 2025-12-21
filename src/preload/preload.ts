import { contextBridge, ipcRenderer } from 'electron'
import type { ChatMessage, AnalysisResult, AiStatus, ElectronAPI } from '../types/electron'
import { IPC_CHANNELS } from '../types/ipc-channels'

/**
 * Secure IPC Bridge for Electron Renderer Process
 * 
 * Exposes a limited, type-safe API to the renderer process without
 * giving direct access to Node.js APIs or the full ipcRenderer.
 * 
 * All methods return Promises and handle errors gracefully.
 * Use window.electronAPI in your React components to access these methods.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  /**
   * Get a value from electron-store
   * @param key - The key to retrieve
   * @returns Promise resolving to the stored value or null if not found
   */
  getStoreValue: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_STORE_VALUE, key),
  
  /**
   * Set a value in electron-store
   * @param key - The key to store under
   * @param value - The value to store
   * @returns Promise resolving to true if successful
   */
  setStoreValue: (key: string, value: any) => ipcRenderer.invoke(IPC_CHANNELS.SET_STORE_VALUE, key, value),
  
  // API key access (development only for security)
  /**
   * Get the Gemini API key (development mode only)
   * @returns Promise resolving to the API key or undefined
   * @deprecated Consider using getAiStatus() instead for production
   */
  ...(process.env.NODE_ENV === 'development' && {
    getGeminiApiKey: () => ipcRenderer.invoke(IPC_CHANNELS.GET_GEMINI_API_KEY)
  }),
  
  /**
   * Get AI initialization status
   * @returns Promise resolving to AiStatus object with initialization info
   */
  getAiStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_AI_STATUS),
  
  // Window controls
  /**
   * Minimize the application window
   * @returns Promise that resolves when window is minimized
   */
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  
  /**
   * Toggle maximize/restore the application window
   * @returns Promise that resolves when window state changes
   */
  maximizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  
  /**
   * Close the application window
   * @returns Promise that resolves when window closes
   */
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  
  /**
   * Check if window is currently maximized
   * @returns Promise resolving to true if maximized, false otherwise
   */
  isWindowMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
  
  /**
   * Listen for window maximize state changes
   * @param callback - Function called when maximize state changes
   */
  onWindowMaximizeChanged: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, (_: any, isMaximized: boolean) => callback(isMaximized))
  },
  
  // AI Analysis
  /**
   * Analyze an image using Google Gemini AI
   * @param imageBase64 - Base64 encoded image data
   * @param mimeType - Image MIME type (e.g., 'image/jpeg')
   * @param prompt - Analysis prompt for the AI
   * @returns Promise resolving to AnalysisResult with success/error info
   */
  analyzeImage: (imageBase64: string, mimeType: string, prompt: string) => 
    ipcRenderer.invoke(IPC_CHANNELS.ANALYZE_IMAGE, imageBase64, mimeType, prompt),
  
  // Chat history
  /**
   * Retrieve all chat messages from storage
   * @returns Promise resolving to array of ChatMessage objects
   */
  getChatHistory: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CHAT_HISTORY),
  
  /**
   * Save a new message to chat history
   * @param message - ChatMessage object to save
   * @returns Promise resolving to true if successful
   */
  saveMessage: (message: ChatMessage) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_MESSAGE, message),
  
  /**
   * Clear all chat history
   * @returns Promise resolving to true if successful
   */
  clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.CLEAR_HISTORY),
  
  /**
   * Delete a specific message from chat history
   * @param messageId - ID of the message to delete
   * @returns Promise resolving to true if successful
   */
  deleteMessage: (messageId: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_MESSAGE, messageId),
})

// Re-export types from centralized definitions for backward compatibility
export type { ChatMessage, AnalysisResult, AiStatus, ElectronAPI } from '../types/electron'