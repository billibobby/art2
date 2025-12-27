// Server-side validation utilities for security hardening
import { ALLOWED_IMAGE_TYPES, BASE64_PADDING_DIVISOR } from '../config/constants'

/**
 * Validate base64 string format
 * @param data - Base64 string to validate
 * @returns true if valid base64 format, false otherwise
 */
export const validateBase64 = (data: string): boolean => {
  if (!data || typeof data !== 'string') {
    return false
  }

  // Base64 regex pattern
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  
  // Check regex match and length divisible by BASE64_PADDING_DIVISOR
  return base64Regex.test(data) && data.length % BASE64_PADDING_DIVISOR === 0
}

/**
 * Validate MIME type against whitelist
 * @param mimeType - MIME type to validate
 * @returns true if MIME type is allowed, false otherwise
 */
export const validateMimeType = (mimeType: string): boolean => {
  if (!mimeType || typeof mimeType !== 'string') {
    return false
  }

  // Case-insensitive comparison
  return ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase() as any)
}

/**
 * Combined validation for image data
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - Image MIME type
 * @returns Validation result with success flag and optional error message
 */
export const validateImageData = (imageBase64: string, mimeType: string): { isValid: boolean; error?: string } => {
  // Check if both parameters are non-empty strings
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return { isValid: false, error: 'Image data is required and must be a valid string' }
  }

  if (!mimeType || typeof mimeType !== 'string') {
    return { isValid: false, error: 'MIME type is required and must be a valid string' }
  }

  // Validate MIME type against whitelist
  if (!validateMimeType(mimeType)) {
    return { 
      isValid: false, 
      error: `Unsupported image format: ${mimeType}. Allowed formats: ${ALLOWED_IMAGE_TYPES.join(', ')}` 
    }
  }

  // Validate base64 format
  if (!validateBase64(imageBase64)) {
    return { isValid: false, error: 'Invalid image data format. Expected valid base64 encoding.' }
  }

  return { isValid: true }
}