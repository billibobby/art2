import React, { useEffect, useRef } from 'react'
import { ChatMessage } from '../../types/electron'
import { formatTimestamp } from '../utils/helpers'
import { MESSAGE_MAX_WIDTH_PERCENT, LOADING_DOT_DELAY_1, LOADING_DOT_DELAY_2 } from '../../config/constants'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user'
    
    return (
      <div
        key={message.id}
        className={`message flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[${MESSAGE_MAX_WIDTH_PERCENT}%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
          {/* Avatar for assistant messages */}
          {!isUser && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="flex-1">
                <div className={`rounded-lg px-4 py-3 ${
                  isUser 
                    ? 'bg-accent-blue text-white' 
                    : 'bg-dark-sidebar text-white border border-dark-border'
                }`}>
                  {/* Image placeholder for user messages */}
                  {isUser && (
                    <div className="mb-3 flex items-center space-x-2 text-blue-100">
                      <span className="text-lg">🖼️</span>
                      <span className="text-sm italic">[Image was attached]</span>
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs mt-2 ${
                    isUser ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* User messages */}
          {isUser && (
            <div className="flex items-start space-x-3 justify-end">
              <div className="flex-1">
                <div className={`rounded-lg px-4 py-3 ${
                  isUser 
                    ? 'bg-accent-blue text-white' 
                    : 'bg-dark-sidebar text-white border border-dark-border'
                }`}>
                  {/* Image placeholder for user messages */}
                  {isUser && (
                    <div className="mb-3 flex items-center space-x-2 text-blue-100">
                      <span className="text-lg">🖼️</span>
                      <span className="text-sm italic">[Image was attached]</span>
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  
                  {/* Timestamp */}
                  <div className={`text-xs mt-2 ${
                    isUser ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">👤</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const LoadingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className={`max-w-[${MESSAGE_MAX_WIDTH_PERCENT}%] mr-auto`}>
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">🤖</span>
          </div>
          <div className="bg-dark-sidebar border border-dark-border rounded-lg px-4 py-3">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${LOADING_DOT_DELAY_1}s` }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${LOADING_DOT_DELAY_2}s` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-accent-green rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">🎨</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Welcome to Art Analyst</h3>
        <p className="text-gray-400 text-sm max-w-sm">
          Upload an image of artwork and ask questions to get AI-powered analysis and insights.
        </p>
      </div>
    </div>
  )

  if (messages.length === 0 && !isLoading) {
    return <EmptyState />
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        {messages.map(renderMessage)}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList