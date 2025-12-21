// IPC Channel Name Constants
// Centralized definition to prevent typos and improve refactoring safety

export const IPC_CHANNELS = {
  // Store operations
  GET_STORE_VALUE: 'get-store-value',
  SET_STORE_VALUE: 'set-store-value',
  
  // API access
  GET_GEMINI_API_KEY: 'get-gemini-api-key',
  GET_AI_STATUS: 'get-ai-status',
  
  // Window controls
  WINDOW_MINIMIZE: 'window-minimize',
  WINDOW_MAXIMIZE: 'window-maximize',
  WINDOW_CLOSE: 'window-close',
  WINDOW_IS_MAXIMIZED: 'window-is-maximized',
  WINDOW_MAXIMIZE_CHANGED: 'window-maximize-changed',
  
  // AI operations
  ANALYZE_IMAGE: 'analyze-image',
  
  // Chat history
  GET_CHAT_HISTORY: 'get-chat-history',
  SAVE_MESSAGE: 'save-message',
  CLEAR_HISTORY: 'clear-history',
  DELETE_MESSAGE: 'delete-message'
} as const

// Type for channel names
export type IpcChannelName = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]