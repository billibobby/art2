import React from 'react'
import { ChatMessage } from '../../types/electron'
import { formatTimestamp, truncateText } from '../utils/helpers'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  chatHistory: ChatMessage[]
  onSelectMessage?: (messageId: string) => void
  onClearHistory: () => void
  onNewChat: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  chatHistory,
  onSelectMessage,
  onClearHistory,
  onNewChat
}) => {
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      onClearHistory()
    }
  }

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const now = Date.now()
    const today = new Date(now).setHours(0, 0, 0, 0)
    const yesterday = today - 24 * 60 * 60 * 1000
    const lastWeek = today - 7 * 24 * 60 * 60 * 1000

    const groups = {
      today: [] as ChatMessage[],
      yesterday: [] as ChatMessage[],
      lastWeek: [] as ChatMessage[],
      older: [] as ChatMessage[]
    }

    messages.forEach(message => {
      const messageDate = new Date(message.timestamp).setHours(0, 0, 0, 0)
      
      if (messageDate === today) {
        groups.today.push(message)
      } else if (messageDate === yesterday) {
        groups.yesterday.push(message)
      } else if (messageDate >= lastWeek) {
        groups.lastWeek.push(message)
      } else {
        groups.older.push(message)
      }
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(chatHistory.filter(msg => msg.role === 'user'))

  const renderMessageGroup = (title: string, messages: ChatMessage[]) => {
    if (messages.length === 0) return null

    return (
      <div key={title} className="mb-4">
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-3">
            {title}
          </h3>
        )}
        <div className="space-y-1">
          {messages.map(message => (
            <div
              key={message.id}
              onClick={() => onSelectMessage?.(message.id)}
              className="flex items-center p-2 mx-2 rounded cursor-pointer hover:bg-dark-hover transition-colors duration-150"
            >
              {message.imageData && (
                <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 mr-3">
                  <img
                    src={`data:${message.imageMimeType || 'image/jpeg'};base64,${message.imageData}`}
                    alt="Message thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {truncateText(message.content, 50)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-dark-sidebar border-r border-dark-border flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-accent-blue rounded flex items-center justify-center">
                <span className="text-white text-sm">🎨</span>
              </div>
              <span className="font-semibold text-white">Art Analyst</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-dark-hover transition-colors duration-150"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-300">
              <path d="M2 4h12v1H2V4zm0 3h12v1H2V7zm0 3h12v1H2v-1z" />
            </svg>
          </button>
        </div>
        
        {!isCollapsed && (
          <button 
            onClick={onNewChat}
            className="w-full mt-3 px-3 py-2 bg-accent-blue hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors duration-150"
          >
            + New Chat
          </button>
        )}
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        {chatHistory.length === 0 ? (
          <div className="p-4 text-center">
            {!isCollapsed && (
              <p className="text-sm text-gray-400">No chat history yet</p>
            )}
          </div>
        ) : (
          <div className="py-4">
            {renderMessageGroup('Today', messageGroups.today)}
            {renderMessageGroup('Yesterday', messageGroups.yesterday)}
            {renderMessageGroup('Last 7 Days', messageGroups.lastWeek)}
            {renderMessageGroup('Older', messageGroups.older)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center justify-between">
          <button
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-dark-hover transition-colors duration-150"
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-300">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
          </button>
          
          {chatHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-600 transition-colors duration-150"
              title="Clear history"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-300">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar