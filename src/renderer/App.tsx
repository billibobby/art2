import React, { useState, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import MessageList from './components/MessageList'
import InputArea from './components/InputArea'
import { ChatMessage, AnalysisResult, AiStatus } from '../types/electron'
import { generateMessageId } from './utils/helpers'

function App() {
  // State management
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Load chat history and check AI status on mount
  useEffect(() => {
    loadChatHistory()
    checkAiStatus()
  }, [])

  const loadChatHistory = async () => {
    try {
      const history = await window.electronAPI.getChatHistory()
      setChatHistory(history)
      setCurrentMessages(history)
    } catch (err) {
      console.error('Failed to load chat history:', err)
      setError('Failed to load chat history')
    }
  }

  const checkAiStatus = async () => {
    try {
      const status = await window.electronAPI.getAiStatus()
      setAiStatus(status)
      
      if (!status.hasApiKey) {
        setError('Google Gemini API key not configured. Please check your .env file.')
      } else if (!status.isInitialized) {
        setError('AI model not initialized. Please check your API key.')
      }
    } catch (err) {
      console.error('Failed to check AI status:', err)
      setError('Failed to check AI status')
    }
  }

  const handleSubmit = async (prompt: string, imageData?: string, mimeType?: string) => {
    if (!prompt.trim() || !imageData || !mimeType) {
      setError('Please provide both an image and a prompt for analysis.')
      return
    }

    setError(null)
    setSaveError(null)
    setIsLoading(true)
    
    // Declare updatedMessages in outer scope to avoid ReferenceError in catch block
    let updatedMessages: ChatMessage[] | null = null

    try {
      // Create user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      }

      // Add user message to current messages
      updatedMessages = [...currentMessages, userMessage]
      setCurrentMessages(updatedMessages)

      // Save user message to history and check return value
      const userSaveSuccess = await window.electronAPI.saveMessage(userMessage)
      if (!userSaveSuccess) {
        setSaveError('Failed to save message')
        setIsLoading(false)
        return
      }
      
      // Update chat history state only after successful save
      setChatHistory(updatedMessages)

      // Call AI analysis
      const result: AnalysisResult = await window.electronAPI.analyzeImage(
        imageData,
        mimeType,
        prompt
      )

      if (result.success && result.text) {
        // Create assistant message
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: result.text,
          timestamp: Date.now()
        }

        // Add assistant message to current messages
        const finalMessages = [...updatedMessages, assistantMessage]
        setCurrentMessages(finalMessages)

        // Save assistant message to history and check return value
        const assistantSaveSuccess = await window.electronAPI.saveMessage(assistantMessage)
        if (!assistantSaveSuccess) {
          setSaveError('Response received but not saved')
        } else {
          // Update chat history state only after successful save
          setChatHistory(finalMessages)
        }
      } else {
        // Handle AI analysis error
        const errorMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: `Sorry, I encountered an error while analyzing the image: ${result.error || 'Unknown error'}`,
          timestamp: Date.now()
        }

        const finalMessages = [...updatedMessages, errorMessage]
        setCurrentMessages(finalMessages)
        
        // Save error message to history and check return value
        const errorSaveSuccess = await window.electronAPI.saveMessage(errorMessage)
        if (!errorSaveSuccess) {
          console.error('Failed to save error message')
          setSaveError('Failed to save error message')
        } else {
          setChatHistory(finalMessages)
        }
      }
    } catch (err) {
      console.error('Failed to process message:', err)
      setError('Failed to process your request. Please try again.')
      
      // Ensure chat history stays in sync when analysis fails, only if updatedMessages was set
      if (updatedMessages) {
        setChatHistory(updatedMessages)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetrySave = async () => {
    // Find the last unsaved message and retry saving it
    const lastMessage = currentMessages[currentMessages.length - 1]
    if (lastMessage) {
      const saveSuccess = await window.electronAPI.saveMessage(lastMessage)
      if (saveSuccess) {
        setSaveError(null)
        setChatHistory([...currentMessages])
      } else {
        setSaveError('Retry failed. Please try again.')
      }
    }
  }

  const handleClearHistory = async () => {
    try {
      await window.electronAPI.clearHistory()
      setChatHistory([])
      setCurrentMessages([])
      setError(null)
    } catch (err) {
      console.error('Failed to clear history:', err)
      setError('Failed to clear chat history')
    }
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const handleSelectMessage = (messageId: string) => {
    // Find the selected message and load its conversation context
    const selectedMessage = chatHistory.find(msg => msg.id === messageId)
    if (selectedMessage) {
      // For now, show all messages up to and including the selected one
      // In a more complex implementation, this could load a specific conversation thread
      const messageIndex = chatHistory.findIndex(msg => msg.id === messageId)
      const conversationMessages = chatHistory.slice(0, messageIndex + 1)
      setCurrentMessages(conversationMessages)
    }
  }

  const handleNewChat = () => {
    // Clear current messages to start a new conversation
    setCurrentMessages([])
    setError(null)
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-bg text-white">
      {/* Custom Title Bar */}
      <TitleBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
          chatHistory={chatHistory}
          onSelectMessage={handleSelectMessage}
          onClearHistory={handleClearHistory}
          onNewChat={handleNewChat}
        />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-900 bg-opacity-20 border-b border-red-500 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-red-400 text-sm">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Save Error Banner */}
          {saveError && (
            <div className="bg-orange-900 bg-opacity-20 border-b border-orange-500 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-orange-400 text-sm">{saveError}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRetrySave}
                    className="text-orange-400 hover:text-orange-300 text-sm underline transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => setSaveError(null)}
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Status Banner */}
          {aiStatus && !aiStatus.isInitialized && (
            <div className="bg-yellow-900 bg-opacity-20 border-b border-yellow-500 px-4 py-2">
              <span className="text-yellow-400 text-sm">
                AI model not ready. Please check your configuration.
              </span>
            </div>
          )}

          {/* Message List */}
          <MessageList messages={currentMessages} isLoading={isLoading} />

          {/* Input Area */}
          <InputArea
            onSubmit={handleSubmit}
            disabled={isLoading || !aiStatus?.isInitialized}
          />
        </div>
      </div>
    </div>
  )
}

export default App