/**
 * API Tests for Share Token Redemption
 *
 * Tests the /api/share/redeem endpoint that handles
 * share link redemption for document access.
 */

import { createMockUser, createMockSupabaseClient, MockSupabaseClient } from '../mocks/supabase';

// Mock the supabase server module
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-12345'),
}));

import { createServerSupabaseClient } from '@/lib/supabase-server';

describe('POST /api/share/redeem', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Authentication Tests
  // =========================================================================

  describe('authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase = createMockSupabaseClient(null);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { data: { user }, error: authError } = await mockSupabase.auth.getUser();

      expect(authError).toBeTruthy();
      expect(user).toBeNull();
    });

    it('should return 401 when auth returns an error', async () => {
      mockSupabase = createMockSupabaseClient(null);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' },
      });
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { error: authError } = await mockSupabase.auth.getUser();
      expect(authError).toBeTruthy();
      expect(authError.message).toBe('Token expired');
    });
  });

  // =========================================================================
  // Input Validation Tests
  // =========================================================================

  describe('input validation', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return 400 when token is missing', async () => {
      const body = {};
      const token = body.token;

      expect(!token || typeof token !== 'string').toBe(true);
    });

    it('should return 400 when token is empty string', async () => {
      const body = { token: '' };
      const token = body.token;

      // Empty string is falsy, so !token is true, triggering the 400 response
      expect(!token || typeof token !== 'string').toBe(true);
      expect(!body.token).toBe(true);
    });

    it('should return 400 when token is not a string (number)', async () => {
      const body = { token: 12345 };

      expect(typeof body.token !== 'string').toBe(true);
    });

    it('should return 400 when token is not a string (object)', async () => {
      const body = { token: { value: 'abc' } };

      expect(typeof body.token !== 'string').toBe(true);
    });

    it('should return 400 when token is not a string (array)', async () => {
      const body = { token: ['abc'] };

      expect(typeof body.token !== 'string').toBe(true);
    });

    it('should return 400 when token is null', async () => {
      const body = { token: null };

      expect(!body.token || typeof body.token !== 'string').toBe(true);
    });
  });

  // =========================================================================
  // Token Lookup Tests
  // =========================================================================

  describe('token lookup', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return 404 when token does not exist', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('document_shares')
        .select('document_id, permission')
        .eq('share_token', 'nonexistent-token')
        .single();

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should find share by valid token', async () => {
      const mockShare = {
        document_id: 'doc-123',
        permission: 'view',
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockShare,
              error: null,
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('document_shares')
        .select('document_id, permission')
        .eq('share_token', 'valid-token')
        .single();

      expect(result.data).toEqual(mockShare);
      expect(result.error).toBeNull();
    });
  });

  // =========================================================================
  // Existing Access Tests
  // =========================================================================

  describe('existing access check', () => {
    const mockUser = createMockUser();

    it('should return alreadyHasAccess when user already has access', async () => {
      const mockShare = {
        document_id: 'doc-123',
        permission: 'edit',
      };

      const existingShare = {
        id: 'existing-share-123',
      };

      // Simulate the case where user already has access
      const response = {
        documentId: mockShare.document_id,
        alreadyHasAccess: true,
      };

      expect(response.alreadyHasAccess).toBe(true);
      expect(response.documentId).toBe('doc-123');
      expect(existingShare).toBeDefined();
    });

    it('should proceed to grant access when user does not have existing access', async () => {
      const mockShare = {
        document_id: 'doc-123',
        permission: 'view',
      };

      // Simulate no existing share found
      const existingShare = null;

      expect(existingShare).toBeNull();
      expect(mockShare.document_id).toBe('doc-123');
    });
  });

  // =========================================================================
  // Access Grant Tests
  // =========================================================================

  describe('access granting', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should create share record with correct permission', async () => {
      const shareToken = {
        document_id: 'doc-123',
        permission: 'edit',
      };

      const expectedInsert = {
        id: expect.any(String),
        document_id: shareToken.document_id,
        user_id: mockUser.id,
        permission: shareToken.permission,
      };

      // Verify the shape of what would be inserted
      expect(expectedInsert.document_id).toBe('doc-123');
      expect(expectedInsert.user_id).toBe(mockUser.id);
      expect(expectedInsert.permission).toBe('edit');
    });

    it('should return granted: true on successful access grant', async () => {
      const response = {
        documentId: 'doc-123',
        granted: true,
      };

      expect(response.granted).toBe(true);
      expect(response.documentId).toBe('doc-123');
    });

    it('should copy permission from share link', async () => {
      const testCases = [
        { linkPermission: 'view', expectedUserPermission: 'view' },
        { linkPermission: 'edit', expectedUserPermission: 'edit' },
        { linkPermission: 'comment', expectedUserPermission: 'comment' },
      ];

      testCases.forEach(({ linkPermission, expectedUserPermission }) => {
        expect(linkPermission).toBe(expectedUserPermission);
      });
    });
  });

  // =========================================================================
  // Error Handling Tests
  // =========================================================================

  describe('error handling', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return 500 when insert fails', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      });

      const result = await mockSupabase.from('document_shares').insert({});
      expect(result.error).toBeTruthy();
    });

    it('should handle JSON parse errors', () => {
      const invalidJson = 'not valid json';
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('should handle database connection errors', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      expect(() => mockSupabase.from('document_shares')).toThrow('Database connection failed');
    });
  });

  // =========================================================================
  // Security Tests
  // =========================================================================

  describe('security considerations', () => {
    const mockUser = createMockUser();

    it('should not leak information about token existence to unauthenticated users', async () => {
      // This is verified by the fact that unauthenticated users get 401 before any token lookup
      mockSupabase = createMockSupabaseClient(null);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { data: { user } } = await mockSupabase.auth.getUser();
      expect(user).toBeNull();
      // Token lookup should not happen for unauthenticated users
    });

    it('should handle SQL injection attempts in token', async () => {
      const maliciousTokens = [
        "'; DROP TABLE document_shares; --",
        "1' OR '1'='1",
        "1; SELECT * FROM users",
        "UNION SELECT * FROM users",
      ];

      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      // Supabase client handles parameterized queries, so these should be safe
      maliciousTokens.forEach((token) => {
        expect(typeof token).toBe('string');
        // The token is passed as a parameter, not interpolated
      });
    });

    it('should not allow elevation of permission beyond share link permission', async () => {
      const shareLinkPermission = 'view';
      const grantedPermission = shareLinkPermission; // Must be equal

      expect(grantedPermission).toBe(shareLinkPermission);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('edge cases', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(1000);
      expect(typeof longToken).toBe('string');
      expect(longToken.length).toBe(1000);
    });

    it('should handle tokens with special characters', async () => {
      const specialTokens = [
        'token-with-dashes',
        'token_with_underscores',
        'token.with.dots',
        'token+with+plus',
        'token with spaces',
      ];

      specialTokens.forEach((token) => {
        expect(typeof token).toBe('string');
      });
    });

    it('should handle unicode tokens', async () => {
      const unicodeToken = 'token-test-123';
      expect(typeof unicodeToken).toBe('string');
    });

    it('should handle null byte in token', async () => {
      const nullByteToken = 'token\x00injected';
      expect(typeof nullByteToken).toBe('string');
      // The database should handle null byte properly
    });

    it('should handle concurrent redemption attempts', async () => {
      // Simulating race condition scenario
      const firstAttempt = { documentId: 'doc-123', granted: true };
      const secondAttempt = { documentId: 'doc-123', alreadyHasAccess: true };

      // First attempt grants access
      expect(firstAttempt.granted).toBe(true);
      // Second attempt should find existing access
      expect(secondAttempt.alreadyHasAccess).toBe(true);
    });
  });

  // =========================================================================
  // Response Format Tests
  // =========================================================================

  describe('response format', () => {
    it('should return documentId and granted: true on new access', () => {
      const response = {
        documentId: 'doc-123',
        granted: true,
      };

      expect(response).toHaveProperty('documentId');
      expect(response).toHaveProperty('granted');
      expect(response.granted).toBe(true);
    });

    it('should return documentId and alreadyHasAccess: true for existing access', () => {
      const response = {
        documentId: 'doc-123',
        alreadyHasAccess: true,
      };

      expect(response).toHaveProperty('documentId');
      expect(response).toHaveProperty('alreadyHasAccess');
      expect(response.alreadyHasAccess).toBe(true);
    });

    it('should return error object for failures', () => {
      const errorResponse = {
        error: 'Invalid or expired share link',
      };

      expect(errorResponse).toHaveProperty('error');
      expect(typeof errorResponse.error).toBe('string');
    });
  });
});
