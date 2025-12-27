import { contextBridge, ipcRenderer } from 'electron'
import type { ChatMessage, AnalysisResult, AiStatus, ElectronAPI, Settings } from '../types/electron'
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
  // Store operations - specific getters only
  /**
   * Get application settings
   * @returns Promise resolving to settings object
   */
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  
  /**
   * Set application settings
   * @param value - Settings object to save
   * @returns Promise resolving to true if successful
   */
  setSettings: (value: Settings) => ipcRenderer.invoke(IPC_CHANNELS.SET_SETTINGS, value),
  
  /**
   * Get window state
   * @returns Promise resolving to WindowState object or undefined
   */
  getWindowState: () => ipcRenderer.invoke(IPC_CHANNELS.GET_WINDOW_STATE),
  
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
   * @returns Cleanup function to remove the listener
   */
  onWindowMaximizeChanged: (callback: (isMaximized: boolean) => void) => {
    const listener = (_: any, isMaximized: boolean) => callback(isMaximized)
    ipcRenderer.on(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, listener)
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, listener)
    }
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