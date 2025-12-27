// Zod validation schemas for runtime type checking
import { z } from 'zod'

// Chat message schema
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number()
})

// Window state schema
export const WindowStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  isMaximized: z.boolean()
})

// Settings schema (empty placeholder for future settings)
export const SettingsSchema = z.object({
  // Add settings fields here as needed
})

// Chat history schema with max length validation
export const ChatHistorySchema = z.array(ChatMessageSchema).max(1000)

// Type inference helpers
export type ChatMessageValidated = z.infer<typeof ChatMessageSchema>
export type WindowStateValidated = z.infer<typeof WindowStateSchema>
export type SettingsValidated = z.infer<typeof SettingsSchema>

// Validation helper functions
export const validateChatHistory = (data: unknown): ChatMessageValidated[] => {
  const result = ChatHistorySchema.safeParse(data)
  if (!result.success) {
    console.error('Chat history validation failed:', result.error)
    return []
  }
  return result.data
}

export const validateWindowState = (data: unknown): WindowStateValidated | undefined => {
  const result = WindowStateSchema.safeParse(data)
  if (!result.success) {
    console.error('Window state validation failed:', result.error)
    return undefined
  }
  return result.data
}

export const validateSettings = (data: unknown): SettingsValidated => {
  const result = SettingsSchema.safeParse(data)
  if (!result.success) {
    console.error('Settings validation failed:', result.error)
    return {}
  }
  return result.data
}