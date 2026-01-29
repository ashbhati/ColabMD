// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Validation constants
export const MAX_TITLE_LENGTH = 255
export const MAX_CONTENT_LENGTH = 10 * 1024 * 1024 // 10MB

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

/**
 * Sanitize and validate document title
 */
export function sanitizeTitle(title: unknown): string {
  if (typeof title !== 'string') {
    return 'Untitled Document'
  }
  return title.trim().slice(0, MAX_TITLE_LENGTH) || 'Untitled Document'
}

/**
 * Validate content size
 */
export function isValidContentSize(content: unknown): boolean {
  if (typeof content !== 'string') {
    return true // No content is valid
  }
  return content.length <= MAX_CONTENT_LENGTH
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate permission value
 */
export function isValidPermission(permission: unknown): permission is 'view' | 'edit' | 'comment' {
  return permission === 'view' || permission === 'edit' || permission === 'comment'
}
