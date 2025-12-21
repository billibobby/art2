// Custom Error Types for Better Error Handling

export class ApiKeyMissingError extends Error {
  constructor(message = 'Gemini API key is not configured') {
    super(message)
    this.name = 'ApiKeyMissingError'
  }
}

export class ImageAnalysisError extends Error {
  constructor(message = 'AI image analysis failed') {
    super(message)
    this.name = 'ImageAnalysisError'
  }
}

export class StorageError extends Error {
  constructor(message = 'Electron store operation failed') {
    super(message)
    this.name = 'StorageError'
  }
}

export class WindowControlError extends Error {
  constructor(message = 'Window control operation failed') {
    super(message)
    this.name = 'WindowControlError'
  }
}

// Helper function to create standardized error responses
export const createErrorResponse = (error: Error) => ({
  success: false,
  error: error.message,
  errorType: error.name
})

// Helper function to create success responses
export const createSuccessResponse = <T>(data?: T) => ({
  success: true,
  ...(data && { data })
})