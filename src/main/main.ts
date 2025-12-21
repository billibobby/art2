import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import Store from 'electron-store'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ChatMessage, WindowState } from '../types/electron'
import { IPC_CHANNELS } from '../types/ipc-channels'

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
const MAX_CHAT_HISTORY_SIZE = 1000

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
  }, 500)
}

const createWindow = () => {
  // Load saved window state
  const defaultState: WindowState = {
    width: 1200,
    height: 800,
    isMaximized: false,
    x: 0,
    y: 0
  }
  const savedState = store.get('windowState', defaultState) as WindowState
  
  // Validate window state against current display bounds
  const primaryDisplay = screen.getPrimaryDisplay()
  const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = primaryDisplay.workArea
  
  // Check if saved window would be completely off-screen or has invalid dimensions
  const isOffScreen = savedState.x + savedState.width < displayX || 
                     savedState.x > displayX + displayWidth ||
                     savedState.y + savedState.height < displayY ||
                     savedState.y > displayY + displayHeight
  
  const hasInvalidDimensions = savedState.width < 800 || savedState.height < 600 ||
                              savedState.width > displayWidth * 2 || savedState.height > displayHeight * 2
  
  // Use validated state or fall back to centered default
  let windowState: WindowState
  if (isOffScreen || hasInvalidDimensions) {
    windowState = {
      width: Math.min(1200, displayWidth - 100),
      height: Math.min(800, displayHeight - 100),
      x: Math.floor((displayWidth - Math.min(1200, displayWidth - 100)) / 2) + displayX,
      y: Math.floor((displayHeight - Math.min(800, displayHeight - 100)) / 2) + displayY,
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
    minWidth: 800,
    minHeight: 600,
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
  mainWindow.on('resize', saveWindowState)
  mainWindow.on('move', saveWindowState)
  mainWindow.on('maximize', () => {
    saveWindowState()
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, mainWindow.isMaximized())
  })
  mainWindow.on('unmaximize', () => {
    saveWindowState()
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, mainWindow.isMaximized())
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

    // Validate supported MIME types
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!supportedTypes.includes(mimeType)) {
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
    dialog.showErrorBox(
      'Configuration Error', 
      'GEMINI_API_KEY not found in .env file. Please add your Google AI API key to continue.'
    )
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for renderer communication

// Store operation handlers
ipcMain.handle(IPC_CHANNELS.GET_STORE_VALUE, (_, key: string) => {
  try {
    return store.get(key)
  } catch (error) {
    console.error('Error getting store value:', error)
    return null
  }
})

ipcMain.handle(IPC_CHANNELS.SET_STORE_VALUE, (_, key: string, value: any) => {
  try {
    store.set(key, value)
    return true
  } catch (error) {
    console.error('Error setting store value:', error)
    return false
  }
})

// API access handlers
ipcMain.handle(IPC_CHANNELS.GET_GEMINI_API_KEY, () => {
  return process.env.GEMINI_API_KEY
})

ipcMain.handle(IPC_CHANNELS.GET_AI_STATUS, () => {
  return {
    isInitialized: model !== null,
    hasApiKey: !!process.env.GEMINI_API_KEY,
    modelName: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  }
})

// Window control handlers
ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
  try {
    mainWindow?.minimize()
  } catch (error) {
    console.error('Error minimizing window:', error)
  }
})

ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
  try {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  } catch (error) {
    console.error('Error toggling maximize:', error)
  }
})

ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
  try {
    mainWindow?.close()
  } catch (error) {
    console.error('Error closing window:', error)
  }
})

ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
  try {
    return mainWindow?.isMaximized() || false
  } catch (error) {
    console.error('Error checking maximize state:', error)
    return false
  }
})

// AI Analysis handler
ipcMain.handle(IPC_CHANNELS.ANALYZE_IMAGE, async (_, imageBase64: string, mimeType: string, prompt: string) => {
  // Validate IPC parameters
  if (typeof imageBase64 !== 'string' || typeof mimeType !== 'string' || typeof prompt !== 'string') {
    return { success: false, error: 'Invalid arguments: imageBase64, mimeType, and prompt must all be strings' }
  }
  
  if (!imageBase64.trim() || !mimeType.trim() || !prompt.trim()) {
    return { success: false, error: 'Invalid arguments: imageBase64, mimeType, and prompt cannot be empty' }
  }
  
  return await analyzeImage(imageBase64, mimeType, prompt)
})

// Chat history handlers
ipcMain.handle(IPC_CHANNELS.GET_CHAT_HISTORY, () => {
  try {
    return store.get('chatHistory', []) as ChatMessage[]
  } catch (error) {
    console.error('Error getting chat history:', error)
    return []
  }
})

ipcMain.handle(IPC_CHANNELS.SAVE_MESSAGE, (_, message: ChatMessage) => {
  try {
    const history = store.get('chatHistory', []) as ChatMessage[]
    history.push(message)
    
    // Limit chat history size to prevent unbounded growth
    if (history.length > MAX_CHAT_HISTORY_SIZE) {
      history.splice(0, history.length - MAX_CHAT_HISTORY_SIZE)
    }
    
    store.set('chatHistory', history)
    return true
  } catch (error) {
    console.error('Error saving message:', error)
    return false
  }
})

ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, () => {
  try {
    store.set('chatHistory', [])
    return true
  } catch (error) {
    console.error('Error clearing history:', error)
    return false
  }
})

ipcMain.handle(IPC_CHANNELS.DELETE_MESSAGE, (_, messageId: string) => {
  try {
    const history = store.get('chatHistory', []) as ChatMessage[]
    const filteredHistory = history.filter(msg => msg.id !== messageId)
    store.set('chatHistory', filteredHistory)
    return true
  } catch (error) {
    console.error('Error deleting message:', error)
    return false
  }
})