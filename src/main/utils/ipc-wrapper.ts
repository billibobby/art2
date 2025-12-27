// IPC error handling wrapper for standardized error responses
import { createErrorResponse } from '../../types/errors'

/**
 * Wraps IPC handlers with standardized error handling
 * @param handler - The IPC handler function to wrap
 * @param errorType - Optional specific error class to throw
 * @returns Wrapped handler with consistent error handling
 */
export function wrapIpcHandler<T>(
  handler: (...args: any[]) => T | Promise<T>,
  errorType?: new (message?: string) => Error
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      const result = await handler(...args)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('IPC Handler Error:', {
        handler: handler.name || 'anonymous',
        error: errorMessage,
        args: args.slice(1) // Exclude event object from logging
      })

      // Throw specific error type if provided
      if (errorType) {
        throw new errorType(errorMessage)
      }

      // Re-throw original error
      throw error
    }
  }
}

/**
 * Wraps IPC handlers that return boolean success indicators
 * @param handler - The IPC handler function to wrap
 * @param errorType - Optional specific error class to use
 * @returns Wrapped handler that returns false on error
 */
export function wrapIpcBooleanHandler(
  handler: (...args: any[]) => boolean | Promise<boolean>,
  errorType?: new (message?: string) => Error
): (...args: any[]) => Promise<boolean> {
  return async (...args: any[]): Promise<boolean> => {
    try {
      const result = await handler(...args)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('IPC Boolean Handler Error:', {
        handler: handler.name || 'anonymous',
        error: errorMessage,
        args: args.slice(1) // Exclude event object from logging
      })

      // Return false for boolean handlers instead of throwing
      return false
    }
  }
}