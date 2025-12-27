// Utility functions for the renderer process
import { 
  ONE_MINUTE_MS, 
  ONE_HOUR_MS, 
  ONE_DAY_MS, 
  ONE_WEEK_MS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_DISPLAY,
  BYTES_PER_KB,
  ALLOWED_IMAGE_TYPES
} from '../config/constants'

/**
 * Generate unique message ID using crypto.randomUUID or timestamp fallback
 */
export const generateMessageId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format Unix timestamp to readable format
 */
export const formatTimestamp = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const date = new Date(timestamp)

  // Less than 1 minute
  if (diff < ONE_MINUTE_MS) {
    return 'Just now'
  }

  // Less than 1 hour
  if (diff < ONE_HOUR_MS) {
    const minutes = Math.floor(diff / ONE_MINUTE_MS)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }

  // Less than 24 hours
  if (diff < ONE_DAY_MS) {
    const hours = Math.floor(diff / ONE_HOUR_MS)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  // Less than 7 days
  if (diff < ONE_WEEK_MS) {
    const days = Math.floor(diff / ONE_DAY_MS)
    return `${days} day${days === 1 ? '' : 's'} ago`
  }

  // More than 7 days - show actual date
  const today = new Date()
  const isThisYear = date.getFullYear() === today.getFullYear()

  if (isThisYear) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })
  }
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Format file size in bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = BYTES_PER_KB
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate image file type and size
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.'
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size too large. Please select an image smaller than ${MAX_FILE_SIZE_DISPLAY}.`
    }
  }

  return { isValid: true }
}

/**
 * Convert File to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Check if the current environment is development
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}