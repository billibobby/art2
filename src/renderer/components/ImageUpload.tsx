import React, { useState, useRef } from 'react'
import { validateImageFile, fileToBase64, formatFileSize } from '../utils/helpers'

interface ImageUploadProps {
  onImageSelect: (imageData: string, mimeType: string) => void
  disabled?: boolean
}

interface SelectedImage {
  file: File
  preview: string
  base64: string
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = async (file: File) => {
    setError(null)

    const validation = validateImageFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return
    }

    try {
      const base64 = await fileToBase64(file)
      const preview = URL.createObjectURL(file)
      
      setSelectedImage({
        file,
        preview,
        base64
      })
    } catch (err) {
      setError('Failed to process image file')
    }
  }

  const handleAnalyze = () => {
    if (selectedImage) {
      onImageSelect(selectedImage.base64, selectedImage.file.type)
      setSelectedImage(null)
    }
  }

  const handleRemove = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.preview)
      setSelectedImage(null)
    }
    setError(null)
  }

  const openFilePicker = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  if (selectedImage) {
    return (
      <div className="bg-dark-sidebar border border-dark-border rounded-lg p-4">
        <div className="flex items-start space-x-4">
          <div className="w-24 h-24 rounded overflow-hidden flex-shrink-0">
            <img
              src={selectedImage.preview}
              alt="Selected artwork"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">
              {selectedImage.file.name}
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              {formatFileSize(selectedImage.file.size)} • {selectedImage.file.type}
            </p>
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleAnalyze}
                disabled={disabled}
                className="px-3 py-1.5 bg-accent-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors duration-150"
              >
                Analyze
              </button>
              <button
                onClick={handleRemove}
                disabled={disabled}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors duration-150"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFilePicker}
        className={`
          h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
          flex flex-col items-center justify-center space-y-3
          ${isDragging 
            ? 'border-accent-blue bg-blue-50 bg-opacity-5' 
            : 'border-dark-border bg-dark-sidebar hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="w-12 h-12 bg-dark-hover rounded-full flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white">
            {isDragging ? 'Drop image here' : 'Upload artwork image'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Drag & drop or click to select • JPEG, PNG, GIF, WebP
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max file size: 10MB
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}

export default ImageUpload