import React, { useState, useRef, useEffect } from 'react'
import ImageUpload from './ImageUpload'
import { TEXTAREA_LINE_HEIGHT_PX, TEXTAREA_MAX_LINES, TEXTAREA_MIN_HEIGHT_PX } from '../../config/constants'

interface InputAreaProps {
  onSubmit: (prompt: string, imageData?: string, mimeType?: string) => void
  disabled?: boolean
}

const InputArea: React.FC<InputAreaProps> = ({ onSubmit, disabled = false }) => {
  const [prompt, setPrompt] = useState('')
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = TEXTAREA_MAX_LINES * TEXTAREA_LINE_HEIGHT_PX
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [prompt])

  const handleSubmit = () => {
    if (!prompt.trim() || disabled) return

    if (selectedImage) {
      onSubmit(prompt.trim(), selectedImage.data, selectedImage.mimeType)
      setSelectedImage(null)
    } else {
      // For text-only messages, we still need an image for the AI to analyze
      // Show image upload if no image is selected
      if (!showImageUpload) {
        setShowImageUpload(true)
        return
      }
    }

    setPrompt('')
    setShowImageUpload(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      setPrompt('')
      setShowImageUpload(false)
      setSelectedImage(null)
    }
  }

  const handleImageSelect = (imageData: string, mimeType: string) => {
    setSelectedImage({ data: imageData, mimeType })
    setShowImageUpload(false)
  }

  const canSubmit = prompt.trim() && selectedImage && !disabled

  return (
    <div className="bg-dark-sidebar border-t border-dark-border p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Image Upload Section */}
        {showImageUpload && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Upload Artwork</h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
            <ImageUpload onImageSelect={handleImageSelect} disabled={disabled} />
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="flex items-center justify-between p-3 bg-dark-bg border border-dark-border rounded">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-accent-green rounded flex items-center justify-center">
                <span className="text-white text-xs">🖼️</span>
              </div>
              <span className="text-sm text-white">Image ready for analysis</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Input Section */}
        <div className="flex items-end space-x-3">
          {/* Image Upload Button */}
          <button
            onClick={() => setShowImageUpload(!showImageUpload)}
            disabled={disabled}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-dark-bg border border-dark-border hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            title="Upload image"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-300">
              <path
                d="M17.5 12.5v3.75a1.25 1.25 0 0 1-1.25 1.25H3.75a1.25 1.25 0 0 1-1.25-1.25V12.5M14.167 6.667L10 2.5 5.833 6.667M10 2.5v10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you'd like to know about this artwork..."
              disabled={disabled}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              rows={1}
              style={{ minHeight: `${TEXTAREA_MIN_HEIGHT_PX}px`, lineHeight: `${TEXTAREA_LINE_HEIGHT_PX}px` }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {prompt.length > 0 && `${prompt.length} chars`}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-accent-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-150"
            title="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
              <path
                d="M18.333 1.667L9.167 10.833M18.333 1.667L12.5 18.333l-3.333-7.5-7.5-3.333L18.333 1.667z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Helper Text */}
        <div className="text-xs text-gray-500 text-center">
          Press Enter to send • Shift+Enter for new line • Escape to clear
        </div>
      </div>
    </div>
  )
}

export default InputArea