/**
 * Unit Tests for Validation Functions
 *
 * Comprehensive tests for the validation utilities in /src/lib/validation.ts
 * Testing UUID validation, title sanitization, content size validation,
 * email validation, and permission validation.
 */

import {
  isValidUUID,
  sanitizeTitle,
  isValidContentSize,
  isValidEmail,
  isValidPermission,
  MAX_TITLE_LENGTH,
  MAX_CONTENT_LENGTH,
} from '@/lib/validation';

// =============================================================================
// UUID Validation Tests
// =============================================================================

describe('isValidUUID', () => {
  describe('valid UUIDs', () => {
    it('should accept a standard UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should accept UUID with lowercase letters', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should accept UUID with uppercase letters', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('should accept UUID with mixed case letters', () => {
      expect(isValidUUID('550E8400-e29b-41D4-A716-446655440000')).toBe(true);
    });

    it('should accept all zeros UUID (nil UUID)', () => {
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('should accept all F UUID (max UUID)', () => {
      expect(isValidUUID('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBe(true);
    });

    it('should accept various version UUIDs', () => {
      // Version 1
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
      // Version 4
      expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
      // Version 5
      expect(isValidUUID('886313e1-3b8a-5372-9b90-0c9aee199e5d')).toBe(true);
    });
  });

  describe('invalid UUIDs', () => {
    it('should reject empty string', () => {
      expect(isValidUUID('')).toBe(false);
    });

    it('should reject UUID without hyphens', () => {
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
    });

    it('should reject UUID with extra characters', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000x')).toBe(false);
    });

    it('should reject UUID with missing characters', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false);
    });

    it('should reject UUID with invalid characters (g-z)', () => {
      expect(isValidUUID('550g8400-e29b-41d4-a716-446655440000')).toBe(false);
    });

    it('should reject UUID with special characters', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-44665544000!')).toBe(false);
    });

    it('should reject UUID with spaces', () => {
      expect(isValidUUID('550e8400 e29b 41d4 a716 446655440000')).toBe(false);
    });

    it('should reject UUID with wrong hyphen positions', () => {
      expect(isValidUUID('550e84-00e29b-41d4-a716-446655440000')).toBe(false);
    });

    it('should reject SQL injection attempts', () => {
      expect(isValidUUID("'; DROP TABLE documents; --")).toBe(false);
      expect(isValidUUID('1 OR 1=1')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000; DROP TABLE users;')).toBe(false);
    });

    it('should reject path traversal attempts', () => {
      expect(isValidUUID('../../../etc/passwd')).toBe(false);
      expect(isValidUUID('..%2F..%2F..%2Fetc%2Fpasswd')).toBe(false);
    });

    it('should reject script injection attempts', () => {
      expect(isValidUUID('<script>alert(1)</script>')).toBe(false);
      expect(isValidUUID('javascript:alert(1)')).toBe(false);
    });

    it('should reject very long strings', () => {
      expect(isValidUUID('a'.repeat(1000))).toBe(false);
    });

    it('should reject numbers only', () => {
      expect(isValidUUID('12345678-1234-1234-1234-123456789012')).toBe(true); // This is valid
      expect(isValidUUID('1234567812341234123412345678901')).toBe(false); // But without hyphens is not
    });

    it('should reject random strings that look like UUIDs', () => {
      expect(isValidUUID('not-a-real-uuid-at-all-here')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined gracefully (type coercion)', () => {
      // TypeScript should prevent this, but testing runtime behavior
      expect(isValidUUID(null as unknown as string)).toBe(false);
      expect(isValidUUID(undefined as unknown as string)).toBe(false);
    });

    it('should handle number input (type coercion)', () => {
      expect(isValidUUID(123 as unknown as string)).toBe(false);
    });

    it('should handle object input (type coercion)', () => {
      expect(isValidUUID({} as unknown as string)).toBe(false);
      expect(isValidUUID({ id: '550e8400-e29b-41d4-a716-446655440000' } as unknown as string)).toBe(false);
    });
  });
});

// =============================================================================
// Title Sanitization Tests
// =============================================================================

describe('sanitizeTitle', () => {
  describe('valid input handling', () => {
    it('should return the same title for valid input', () => {
      expect(sanitizeTitle('My Document')).toBe('My Document');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(sanitizeTitle('  My Document  ')).toBe('My Document');
    });

    it('should trim tabs and newlines', () => {
      expect(sanitizeTitle('\tMy Document\n')).toBe('My Document');
    });

    it('should preserve internal spaces', () => {
      expect(sanitizeTitle('My   Document   Title')).toBe('My   Document   Title');
    });

    it('should handle unicode characters', () => {
      expect(sanitizeTitle('Test Document')).toBe('Test Document');
      expect(sanitizeTitle('Document with unicode')).toBe('Document with unicode');
    });

    it('should handle special characters', () => {
      expect(sanitizeTitle('My Document (Draft)')).toBe('My Document (Draft)');
      expect(sanitizeTitle('Document #1 - Final!')).toBe('Document #1 - Final!');
    });

    it('should handle HTML entities', () => {
      expect(sanitizeTitle('Document &amp; Notes')).toBe('Document &amp; Notes');
      expect(sanitizeTitle('Test &lt;script&gt;')).toBe('Test &lt;script&gt;');
    });
  });

  describe('default title handling', () => {
    it('should return "Untitled Document" for empty string', () => {
      expect(sanitizeTitle('')).toBe('Untitled Document');
    });

    it('should return "Untitled Document" for whitespace-only string', () => {
      expect(sanitizeTitle('   ')).toBe('Untitled Document');
      expect(sanitizeTitle('\t\n')).toBe('Untitled Document');
    });

    it('should return "Untitled Document" for non-string input (null)', () => {
      expect(sanitizeTitle(null)).toBe('Untitled Document');
    });

    it('should return "Untitled Document" for non-string input (undefined)', () => {
      expect(sanitizeTitle(undefined)).toBe('Untitled Document');
    });

    it('should return "Untitled Document" for number input', () => {
      expect(sanitizeTitle(123)).toBe('Untitled Document');
    });

    it('should return "Untitled Document" for object input', () => {
      expect(sanitizeTitle({ title: 'test' })).toBe('Untitled Document');
    });

    it('should return "Untitled Document" for array input', () => {
      expect(sanitizeTitle(['test'])).toBe('Untitled Document');
    });

    it('should return "Untitled Document" for boolean input', () => {
      expect(sanitizeTitle(true)).toBe('Untitled Document');
      expect(sanitizeTitle(false)).toBe('Untitled Document');
    });
  });

  describe('length truncation', () => {
    it('should truncate titles longer than MAX_TITLE_LENGTH', () => {
      const longTitle = 'A'.repeat(300);
      const result = sanitizeTitle(longTitle);
      expect(result.length).toBe(MAX_TITLE_LENGTH);
    });

    it('should not truncate titles at MAX_TITLE_LENGTH', () => {
      const exactTitle = 'A'.repeat(MAX_TITLE_LENGTH);
      expect(sanitizeTitle(exactTitle)).toBe(exactTitle);
    });

    it('should not truncate titles under MAX_TITLE_LENGTH', () => {
      const shortTitle = 'A'.repeat(100);
      expect(sanitizeTitle(shortTitle)).toBe(shortTitle);
    });

    it('should truncate after trimming', () => {
      const paddedLongTitle = '   ' + 'A'.repeat(300) + '   ';
      const result = sanitizeTitle(paddedLongTitle);
      expect(result.length).toBe(MAX_TITLE_LENGTH);
      expect(result.startsWith('A')).toBe(true);
    });

    it('should handle unicode truncation correctly', () => {
      // Unicode characters should be handled correctly
      const unicodeTitle = 'test'.repeat(100);
      const result = sanitizeTitle(unicodeTitle);
      expect(result.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    });
  });

  describe('security edge cases', () => {
    it('should preserve HTML tags (not escape - escaping is done at render)', () => {
      const xssTitle = '<script>alert("xss")</script>';
      expect(sanitizeTitle(xssTitle)).toBe(xssTitle);
    });

    it('should handle SQL-like content', () => {
      const sqlTitle = "'; DROP TABLE documents; --";
      expect(sanitizeTitle(sqlTitle)).toBe(sqlTitle);
    });

    it('should handle null bytes', () => {
      const nullByteTitle = 'Title\x00Injected';
      // The function trims but doesn't filter null bytes - DB should handle this
      expect(sanitizeTitle(nullByteTitle)).toBe(nullByteTitle);
    });
  });
});

// =============================================================================
// Content Size Validation Tests
// =============================================================================

describe('isValidContentSize', () => {
  describe('valid content', () => {
    it('should return true for empty string', () => {
      expect(isValidContentSize('')).toBe(true);
    });

    it('should return true for small content', () => {
      expect(isValidContentSize('Hello World')).toBe(true);
    });

    it('should return true for content at exactly MAX_CONTENT_LENGTH', () => {
      const exactContent = 'A'.repeat(MAX_CONTENT_LENGTH);
      expect(isValidContentSize(exactContent)).toBe(true);
    });

    it('should return true for content just under MAX_CONTENT_LENGTH', () => {
      const underContent = 'A'.repeat(MAX_CONTENT_LENGTH - 1);
      expect(isValidContentSize(underContent)).toBe(true);
    });

    it('should return true for HTML content within limit', () => {
      const htmlContent = '<p>Hello <strong>World</strong></p>'.repeat(1000);
      expect(isValidContentSize(htmlContent)).toBe(true);
    });

    it('should return true for unicode content within limit', () => {
      const unicodeContent = 'test'.repeat(10000);
      expect(isValidContentSize(unicodeContent)).toBe(true);
    });
  });

  describe('non-string input', () => {
    it('should return true for null (no content is valid)', () => {
      expect(isValidContentSize(null)).toBe(true);
    });

    it('should return true for undefined (no content is valid)', () => {
      expect(isValidContentSize(undefined)).toBe(true);
    });

    it('should return true for number input', () => {
      expect(isValidContentSize(123)).toBe(true);
    });

    it('should return true for object input', () => {
      expect(isValidContentSize({ content: 'test' })).toBe(true);
    });

    it('should return true for array input', () => {
      expect(isValidContentSize(['test'])).toBe(true);
    });

    it('should return true for boolean input', () => {
      expect(isValidContentSize(true)).toBe(true);
      expect(isValidContentSize(false)).toBe(true);
    });
  });

  describe('invalid content (exceeds limit)', () => {
    it('should return false for content exceeding MAX_CONTENT_LENGTH', () => {
      const largeContent = 'A'.repeat(MAX_CONTENT_LENGTH + 1);
      expect(isValidContentSize(largeContent)).toBe(false);
    });

    it('should return false for content significantly over limit', () => {
      const hugeContent = 'A'.repeat(MAX_CONTENT_LENGTH * 2);
      expect(isValidContentSize(hugeContent)).toBe(false);
    });
  });

  describe('boundary conditions', () => {
    it('should correctly identify MAX_CONTENT_LENGTH constant value', () => {
      expect(MAX_CONTENT_LENGTH).toBe(10 * 1024 * 1024); // 10MB
    });

    it('should handle content of exactly 10MB', () => {
      const tenMB = 'A'.repeat(10 * 1024 * 1024);
      expect(isValidContentSize(tenMB)).toBe(true);
    });

    it('should reject content of 10MB + 1 byte', () => {
      const overTenMB = 'A'.repeat(10 * 1024 * 1024 + 1);
      expect(isValidContentSize(overTenMB)).toBe(false);
    });
  });
});

// =============================================================================
// Email Validation Tests
// =============================================================================

describe('isValidEmail', () => {
  describe('valid emails', () => {
    it('should accept standard email format', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('should accept email with plus sign', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should accept email with dots in local part', () => {
      expect(isValidEmail('first.last@example.com')).toBe(true);
    });

    it('should accept email with numbers', () => {
      expect(isValidEmail('user123@example123.com')).toBe(true);
    });

    it('should accept email with hyphen in domain', () => {
      expect(isValidEmail('user@my-company.com')).toBe(true);
    });

    it('should accept email with hyphen in local part', () => {
      expect(isValidEmail('user-name@example.com')).toBe(true);
    });

    it('should accept email with underscore in local part', () => {
      expect(isValidEmail('user_name@example.com')).toBe(true);
    });

    it('should accept email with longer TLD', () => {
      expect(isValidEmail('user@example.co.uk')).toBe(true);
      expect(isValidEmail('user@example.technology')).toBe(true);
    });

    it('should accept email with single character local part', () => {
      expect(isValidEmail('a@example.com')).toBe(true);
    });
  });

  describe('invalid emails', () => {
    it('should reject email without @', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should reject email without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should reject email without TLD', () => {
      expect(isValidEmail('user@example')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@ example.com')).toBe(false);
      expect(isValidEmail('user@example .com')).toBe(false);
    });

    it('should reject email with multiple @', () => {
      expect(isValidEmail('user@@example.com')).toBe(false);
      expect(isValidEmail('user@test@example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject whitespace only', () => {
      expect(isValidEmail('   ')).toBe(false);
    });

    it('should reject email with only spaces around @', () => {
      expect(isValidEmail(' @ ')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very long email addresses', () => {
      const longLocalPart = 'a'.repeat(64) + '@example.com';
      expect(isValidEmail(longLocalPart)).toBe(true);
    });

    it('should handle email with numeric domain', () => {
      // Simple regex allows numeric domains - this is acceptable for basic validation
      expect(isValidEmail('user@123.456.789.0')).toBe(true);
    });

    it('should reject malformed emails with whitespace', () => {
      // The simple regex rejects whitespace
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@ example.com')).toBe(false);
    });
  });
});

// =============================================================================
// Permission Validation Tests
// =============================================================================

describe('isValidPermission', () => {
  describe('valid permissions', () => {
    it('should accept "view" permission', () => {
      expect(isValidPermission('view')).toBe(true);
    });

    it('should accept "edit" permission', () => {
      expect(isValidPermission('edit')).toBe(true);
    });

    it('should accept "comment" permission', () => {
      expect(isValidPermission('comment')).toBe(true);
    });
  });

  describe('invalid permissions', () => {
    it('should reject empty string', () => {
      expect(isValidPermission('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidPermission(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidPermission(undefined)).toBe(false);
    });

    it('should reject uppercase variants', () => {
      expect(isValidPermission('VIEW')).toBe(false);
      expect(isValidPermission('EDIT')).toBe(false);
      expect(isValidPermission('COMMENT')).toBe(false);
    });

    it('should reject mixed case variants', () => {
      expect(isValidPermission('View')).toBe(false);
      expect(isValidPermission('Edit')).toBe(false);
      expect(isValidPermission('Comment')).toBe(false);
    });

    it('should reject invalid permission strings', () => {
      expect(isValidPermission('read')).toBe(false);
      expect(isValidPermission('write')).toBe(false);
      expect(isValidPermission('admin')).toBe(false);
      expect(isValidPermission('owner')).toBe(false);
      expect(isValidPermission('delete')).toBe(false);
    });

    it('should reject numbers', () => {
      expect(isValidPermission(1)).toBe(false);
      expect(isValidPermission(0)).toBe(false);
    });

    it('should reject boolean', () => {
      expect(isValidPermission(true)).toBe(false);
      expect(isValidPermission(false)).toBe(false);
    });

    it('should reject objects', () => {
      expect(isValidPermission({ permission: 'view' })).toBe(false);
    });

    it('should reject arrays', () => {
      expect(isValidPermission(['view'])).toBe(false);
    });

    it('should reject permission with whitespace', () => {
      expect(isValidPermission(' view')).toBe(false);
      expect(isValidPermission('view ')).toBe(false);
      expect(isValidPermission(' view ')).toBe(false);
    });
  });

  describe('type guard behavior', () => {
    it('should narrow type correctly for valid permission', () => {
      const permission: unknown = 'view';
      if (isValidPermission(permission)) {
        // TypeScript should recognize permission as 'view' | 'edit' | 'comment'
        const validPermission: 'view' | 'edit' | 'comment' = permission;
        expect(validPermission).toBe('view');
      }
    });
  });
});

// =============================================================================
// Constants Tests
// =============================================================================

describe('validation constants', () => {
  it('should have correct MAX_TITLE_LENGTH', () => {
    expect(MAX_TITLE_LENGTH).toBe(255);
  });

  it('should have correct MAX_CONTENT_LENGTH (10MB)', () => {
    expect(MAX_CONTENT_LENGTH).toBe(10 * 1024 * 1024);
  });
});
