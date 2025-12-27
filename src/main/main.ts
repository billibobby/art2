import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import Store from 'electron-store'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ChatMessage, WindowState, Settings } from '../types/electron'
import { IPC_CHANNELS } from '../types/ipc-channels'
import { validateImageData } from '../utils/validation'
import { validateChatHistory, validateWindowState, validateSettings, ChatMessageSchema, SettingsSchema } from '../types/schemas'
import { 
  MAX_CHAT_HISTORY_SIZE, 
  ALLOWED_STORE_KEYS, 
  WINDOW_STATE_SAVE_DEBOUNCE_MS,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  WINDOW_DISPLAY_MARGIN,
  MAX_DIMENSION_MULTIPLIER,
  ALLOWED_IMAGE_TYPES
} from '../config/constants'
import { wrapIpcHandler, wrapIpcBooleanHandler } from './utils/ipc-wrapper'
import { StorageError, WindowControlError, ImageAnalysisError, ApiKeyMissingError } from '../types/errors'

// Load environment variables
dotenv.config()

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Initialize electron store for persistent data
const store = new Store()

// Initialize Google Generative AI
let genAI: GoogleGenerativeAI | null = null
let model: any = null

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  model = genAI.getGenerativeModel({ model: modelName })
} else {
  console.error('GEMINI_API_KEY not found in environment variables')
}

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null

// Chat history size limit
const MAX_CHAT_HISTORY_SIZE_CONST = MAX_CHAT_HISTORY_SIZE

// Allowed store keys for security
const ALLOWED_STORE_KEYS_CONST = ALLOWED_STORE_KEYS

// Interfaces imported from centralized types

// Debounce function for saving window state
let saveWindowStateTimeout: NodeJS.Timeout | null = null

const saveWindowState = () => {
  if (saveWindowStateTimeout) {
    clearTimeout(saveWindowStateTimeout)
  }
  
  saveWindowStateTimeout = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds()
      const windowState: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized: mainWindow.isMaximized()
      }
      store.set('windowState', windowState)
    }
  }, WINDOW_STATE_SAVE_DEBOUNCE_MS)
}

const createWindow = () => {
  // Load saved window state
  const defaultState: WindowState = {
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    isMaximized: false,
    x: 0,
    y: 0
  }
  const rawSavedState = store.get('windowState', defaultState)
  const savedState = validateWindowState(rawSavedState) || defaultState
  
  // Validate window state against current display bounds
  const primaryDisplay = screen.getPrimaryDisplay()
  const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = primaryDisplay.workArea
  
  // Check if saved window would be completely off-screen or has invalid dimensions
  const isOffScreen = savedState.x + savedState.width < displayX || 
                     savedState.x > displayX + displayWidth ||
                     savedState.y + savedState.height < displayY ||
                     savedState.y > displayY + displayHeight
  
  const hasInvalidDimensions = savedState.width < MIN_WINDOW_WIDTH || savedState.height < MIN_WINDOW_HEIGHT ||
                              savedState.width > displayWidth * MAX_DIMENSION_MULTIPLIER || savedState.height > displayHeight * MAX_DIMENSION_MULTIPLIER
  
  // Use validated state or fall back to centered default
  let windowState: WindowState
  if (isOffScreen || hasInvalidDimensions) {
    windowState = {
      width: Math.min(DEFAULT_WINDOW_WIDTH, displayWidth - WINDOW_DISPLAY_MARGIN),
      height: Math.min(DEFAULT_WINDOW_HEIGHT, displayHeight - WINDOW_DISPLAY_MARGIN),
      x: Math.floor((displayWidth - Math.min(DEFAULT_WINDOW_WIDTH, displayWidth - WINDOW_DISPLAY_MARGIN)) / 2) + displayX,
      y: Math.floor((displayHeight - Math.min(DEFAULT_WINDOW_HEIGHT, displayHeight - WINDOW_DISPLAY_MARGIN)) / 2) + displayY,
      isMaximized: savedState.isMaximized
    }
  } else {
    windowState = savedState
  }

  // Create the browser window
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false
  })

  // Restore maximized state
  if (windowState.isMaximized) {
    mainWindow.maximize()
  }

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Window state persistence event listeners
  mainWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) saveWindowState()
  })
  mainWindow.on('move', () => {
    if (mainWindow && !mainWindow.isDestroyed()) saveWindowState()
  })
  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState()
      mainWindow.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, mainWindow.isMaximized())
    }
  })
  mainWindow.on('unmaximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState()
      mainWindow.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, mainWindow.isMaximized())
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// AI Analysis function
const analyzeImage = async (imageBase64: string, mimeType: string, prompt: string) => {
  try {
    if (!model) {
      return { success: false, error: 'Google Generative AI not initialized. Check your API key.' }
    }

    if (!imageBase64 || !mimeType || !prompt) {
      return { success: false, error: 'Missing required parameters: imageBase64, mimeType, or prompt' }
    }

    // Validate supported MIME types (defense-in-depth - redundant validation after IPC handler check)
    const supportedTypes = ALLOWED_IMAGE_TYPES
    if (!supportedTypes.includes(mimeType as any)) {
      return { success: false, error: `Unsupported image type: ${mimeType}` }
    }

    const parts = [
      { text: prompt },
      { inlineData: { mimeType, data: imageBase64 } }
    ]

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }]
    })

    const text = result.response.text()
    return { success: true, text }
  } catch (error) {
    console.error('AI Analysis Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred during analysis' 
    }
  }
}

// App event listeners
app.whenReady().then(() => {
  // Check API key on startup
  if (!process.env.GEMINI_API_KEY) {
    const error = new ApiKeyMissingError('GEMINI_API_KEY not found in .env file. Please add your Google AI API key to continue.')
    dialog.showErrorBox('Configuration Error', error.message)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  if (saveWindowStateTimeout) {
    clearTimeout(saveWindowStateTimeout)
    saveWindowStateTimeout = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for renderer communication

// Specific store getter methods
ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, wrapIpcHandler(async () => {
  const rawData = store.get('settings', {})
  return validateSettings(rawData)
}, StorageError))

ipcMain.handle(IPC_CHANNELS.SET_SETTINGS, wrapIpcBooleanHandler(async (_, value: Settings) => {
  // Validate settings before persisting
  const validation = SettingsSchema.safeParse(value)
  if (!validation.success) {
    console.error('Settings validation failed:', validation.error)
    return false
  }
  
  store.set('settings', validation.data)
  return true
}, StorageError))

ipcMain.handle(IPC_CHANNELS.GET_WINDOW_STATE, wrapIpcHandler(async () => {
  const rawData = store.get('windowState')
  return validateWindowState(rawData)
}, StorageError))

// API access handlers
ipcMain.handle(IPC_CHANNELS.GET_AI_STATUS, () => {
  return {
    isInitialized: model !== null,
    hasApiKey: !!process.env.GEMINI_API_KEY,
    modelName: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  }
})

// Window control handlers
ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, wrapIpcHandler(async () => {
  mainWindow?.minimize()
}, WindowControlError))

ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, wrapIpcHandler(async () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
}, WindowControlError))

ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, wrapIpcHandler(async () => {
  mainWindow?.close()
}, WindowControlError))

ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, wrapIpcHandler(async () => {
  return mainWindow?.isMaximized() || false
}, WindowControlError))

// AI Analysis handler
ipcMain.handle(IPC_CHANNELS.ANALYZE_IMAGE, wrapIpcHandler(async (_, imageBase64: string, mimeType: string, prompt: string) => {
  // Validate IPC parameters
  if (typeof imageBase64 !== 'string' || typeof mimeType !== 'string' || typeof prompt !== 'string') {
    return { success: false, error: 'Invalid arguments: imageBase64, mimeType, and prompt must all be strings' }
  }
  
  if (!imageBase64.trim() || !mimeType.trim() || !prompt.trim()) {
    return { success: false, error: 'Invalid arguments: imageBase64, mimeType, and prompt cannot be empty' }
  }
  
  // Add server-side validation for image data
  const validation = validateImageData(imageBase64, mimeType)
  if (!validation.isValid) {
    return { success: false, error: validation.error }
  }
  
  // Normalize MIME type to lowercase after validation
  const normalizedMimeType = mimeType.toLowerCase()
  
  return await analyzeImage(imageBase64, normalizedMimeType, prompt)
}, ImageAnalysisError))

// Chat history handlers
ipcMain.handle(IPC_CHANNELS.GET_CHAT_HISTORY, wrapIpcHandler(async () => {
  const rawData = store.get('chatHistory', [])
  return validateChatHistory(rawData)
}, StorageError))

ipcMain.handle(IPC_CHANNELS.SAVE_MESSAGE, wrapIpcBooleanHandler(async (_, message: ChatMessage) => {
  // Validate incoming message before saving
  const messageValidation = ChatMessageSchema.safeParse(message)
  if (!messageValidation.success) {
    console.error('Message validation failed:', messageValidation.error)
    return false
  }

  const rawHistory = store.get('chatHistory', [])
  const history = validateChatHistory(rawHistory)
  history.push(messageValidation.data)
  
  // Limit chat history size to prevent unbounded growth
  if (history.length > MAX_CHAT_HISTORY_SIZE_CONST) {
    history.splice(0, history.length - MAX_CHAT_HISTORY_SIZE_CONST)
  }
  
  store.set('chatHistory', history)
  return true
}, StorageError))

ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, wrapIpcBooleanHandler(async () => {
  store.set('chatHistory', [])
  return true
}, StorageError))

ipcMain.handle(IPC_CHANNELS.DELETE_MESSAGE, wrapIpcBooleanHandler(async (_, messageId: string) => {
  const history = validateChatHistory(store.get('chatHistory', []))
  const filteredHistory = history.filter(msg => msg.id !== messageId)
  store.set('chatHistory', filteredHistory)
  return true
}, StorageError))