// Configuration constants for the Art Analyst application
// Centralizes all magic numbers and configuration values for maintainability

/**
 * Storage & History Constants
 */
/** Maximum number of messages to store in chat history */
export const MAX_CHAT_HISTORY_SIZE = 1000

/** Whitelisted store keys for security */
export const ALLOWED_STORE_KEYS = ['chatHistory', 'windowState', 'settings'] as const

/**
 * Window Management Constants
 */
/** Debounce timeout for saving window state (milliseconds) */
export const WINDOW_STATE_SAVE_DEBOUNCE_MS = 500

/** Minimum window width (pixels) */
export const MIN_WINDOW_WIDTH = 800

/** Minimum window height (pixels) */
export const MIN_WINDOW_HEIGHT = 600

/** Default window width (pixels) */
export const DEFAULT_WINDOW_WIDTH = 1200

/** Default window height (pixels) */
export const DEFAULT_WINDOW_HEIGHT = 800

/** Margin for centering window on display (pixels) */
export const WINDOW_DISPLAY_MARGIN = 100

/** Multiplier for maximum dimension validation */
export const MAX_DIMENSION_MULTIPLIER = 2

/** Height of custom titlebar (pixels) - for reference */
export const TITLEBAR_HEIGHT = 8

/**
 * File Upload Constants
 */
/** Maximum file size limit (10MB in bytes) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/** Maximum file size display string */
export const MAX_FILE_SIZE_DISPLAY = '10MB'

/** Bytes per kilobyte conversion factor */
export const BYTES_PER_KB = 1024

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
] as const

/**
 * Time Constants (in milliseconds)
 */
/** One minute in milliseconds */
export const ONE_MINUTE_MS = 60 * 1000

/** One hour in milliseconds */
export const ONE_HOUR_MS = 60 * 60 * 1000

/** One day in milliseconds */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** One week in milliseconds */
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * UI Constants
 */
/** Line height for textarea elements (pixels) */
export const TEXTAREA_LINE_HEIGHT_PX = 24

/** Maximum visible lines in textarea */
export const TEXTAREA_MAX_LINES = 5

/** Minimum textarea height (pixels) */
export const TEXTAREA_MIN_HEIGHT_PX = 48

/** Maximum message bubble width (percentage) */
export const MESSAGE_MAX_WIDTH_PERCENT = 70

/** Collapsed sidebar width (pixels) - corresponds to Tailwind w-16 */
export const SIDEBAR_COLLAPSED_WIDTH = 16

/** Expanded sidebar width (pixels) - corresponds to Tailwind w-64 */
export const SIDEBAR_EXPANDED_WIDTH = 64

/** Characters to show in sidebar message preview */
export const MESSAGE_TRUNCATE_LENGTH = 50

/**
 * Animation Constants
 */
/** First loading dot animation delay (seconds) */
export const LOADING_DOT_DELAY_1 = 0.1

/** Second loading dot animation delay (seconds) */
export const LOADING_DOT_DELAY_2 = 0.2

/**
 * Validation Constants
 */
/** Base64 string length must be divisible by this number */
export const BASE64_PADDING_DIVISOR = 4

/**
 * Type definitions for constants
 */
export type AllowedStoreKey = typeof ALLOWED_STORE_KEYS[number]
export type AllowedImageType = typeof ALLOWED_IMAGE_TYPES[number]