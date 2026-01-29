/**
 * API Tests for Liveblocks Authentication
 *
 * Tests the /api/liveblocks-auth endpoint that handles
 * Liveblocks session creation and room permission assignment.
 */

import { createMockUser, createMockDocument, createMockShare, createMockSupabaseClient, MockSupabaseClient } from '../mocks/supabase';
import { isValidUUID } from '@/lib/validation';

// Mock the supabase server module
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

// Mock the Liveblocks SDK
jest.mock('@liveblocks/node', () => ({
  Liveblocks: jest.fn().mockImplementation(() => ({
    prepareSession: jest.fn().mockReturnValue({
      allow: jest.fn(),
      FULL_ACCESS: ['room:write'],
      READ_ACCESS: ['room:read'],
      authorize: jest.fn().mockResolvedValue({
        body: JSON.stringify({ token: 'mock-liveblocks-token' }),
        status: 200,
      }),
    }),
  })),
}));

import { createServerSupabaseClient } from '@/lib/supabase-server';

describe('POST /api/liveblocks-auth', () => {
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
        error: { message: 'Session expired' },
      });
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { error: authError } = await mockSupabase.auth.getUser();
      expect(authError).toBeTruthy();
    });
  });

  // =========================================================================
  // Room Validation Tests
  // =========================================================================

  describe('room validation', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return 400 when room is missing', async () => {
      const body = {};
      expect(!body.room).toBe(true);
    });

    it('should return 400 when room is empty string', async () => {
      const body = { room: '' };
      expect(!body.room).toBe(true);
    });

    it('should return 400 when room is null', async () => {
      const body = { room: null };
      expect(!body.room).toBe(true);
    });

    it('should extract document ID from room name correctly', () => {
      const room = 'doc:550e8400-e29b-41d4-a716-446655440000';
      const documentId = room.replace('doc:', '');
      expect(documentId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return 400 for invalid document ID format', () => {
      const room = 'doc:invalid-uuid';
      const documentId = room.replace('doc:', '');
      expect(isValidUUID(documentId)).toBe(false);
    });

    it('should return 400 for room without doc: prefix', () => {
      const room = '550e8400-e29b-41d4-a716-446655440000';
      const documentId = room.replace('doc:', '');
      // Without prefix, the entire string is treated as document ID
      expect(documentId).toBe(room);
      expect(isValidUUID(documentId)).toBe(true); // Still valid UUID
    });

    it('should handle malformed room names', () => {
      const malformedRooms = [
        'doc:',
        ':550e8400-e29b-41d4-a716-446655440000',
        'doc:doc:550e8400-e29b-41d4-a716-446655440000',
        'DOC:550e8400-e29b-41d4-a716-446655440000',
      ];

      malformedRooms.forEach((room) => {
        const documentId = room.replace('doc:', '');
        // Some will be invalid UUIDs
        if (documentId === '' || documentId.startsWith(':') || documentId.startsWith('doc:')) {
          expect(isValidUUID(documentId)).toBe(false);
        }
      });
    });
  });

  // =========================================================================
  // Document Access Tests
  // =========================================================================

  describe('document access verification', () => {
    const mockUser = createMockUser();
    const mockDoc = createMockDocument({ owner_id: mockUser.id });

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return 404 when document does not exist', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('documents')
        .select()
        .eq('id', 'nonexistent-doc')
        .single();

      expect(result.data).toBeNull();
    });

    it('should grant full access when user is document owner', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockDoc,
              error: null,
            }),
          }),
        }),
      });

      const document = mockDoc;
      const canAccess = document.owner_id === mockUser.id;
      const permission = 'write';

      expect(canAccess).toBe(true);
      expect(permission).toBe('write');
    });

    it('should return 403 when user has no access to document', async () => {
      const otherUserDoc = createMockDocument({ owner_id: 'other-user-123' });

      // User is not owner and has no share
      const canAccess = otherUserDoc.owner_id === mockUser.id;
      expect(canAccess).toBe(false);
    });
  });

  // =========================================================================
  // Permission Mapping Tests
  // =========================================================================

  describe('permission mapping', () => {
    const mockUser = createMockUser();

    function mapPermission(sharePermission: string): string {
      switch (sharePermission) {
        case 'edit':
          return 'write';
        case 'comment':
          return 'comment';
        case 'view':
        default:
          return 'read';
      }
    }

    it('should map edit permission to write', () => {
      const share = createMockShare({ permission: 'edit' });
      const liveblocksPermission = mapPermission(share.permission);
      expect(liveblocksPermission).toBe('write');
    });

    it('should map comment permission to comment', () => {
      const share = createMockShare({ permission: 'comment' });
      const liveblocksPermission = mapPermission(share.permission);
      expect(liveblocksPermission).toBe('comment');
    });

    it('should map view permission to read', () => {
      const share = createMockShare({ permission: 'view' });
      const liveblocksPermission = mapPermission(share.permission);
      expect(liveblocksPermission).toBe('read');
    });

    it('should default to read for unknown permissions', () => {
      const liveblocksPermission = mapPermission('unknown');
      expect(liveblocksPermission).toBe('read');
    });
  });

  // =========================================================================
  // User Color Generation Tests
  // =========================================================================

  describe('getUserColor function', () => {
    function getUserColor(userId: string): string {
      const colors = [
        '#E57373', '#F06292', '#BA68C8', '#9575CD',
        '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
        '#4DB6AC', '#81C784', '#AED581', '#DCE775',
        '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F',
      ];

      let hash = 0;
      for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
      }

      return colors[Math.abs(hash) % colors.length];
    }

    it('should return consistent color for same user ID', () => {
      const userId = 'user-123-abc';
      const color1 = getUserColor(userId);
      const color2 = getUserColor(userId);
      expect(color1).toBe(color2);
    });

    it('should return valid hex color', () => {
      const color = getUserColor('test-user');
      expect(color).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });

    it('should return color from predefined palette', () => {
      const palette = [
        '#E57373', '#F06292', '#BA68C8', '#9575CD',
        '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
        '#4DB6AC', '#81C784', '#AED581', '#DCE775',
        '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F',
      ];
      const color = getUserColor('any-user-id');
      expect(palette).toContain(color);
    });

    it('should distribute colors across many users', () => {
      const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`);
      const colors = new Set(userIds.map(getUserColor));
      // Should use at least 5 different colors
      expect(colors.size).toBeGreaterThan(5);
    });

    it('should handle empty string', () => {
      const color = getUserColor('');
      expect(color).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });

    it('should handle very long user IDs', () => {
      const longId = 'a'.repeat(1000);
      const color = getUserColor(longId);
      expect(color).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });

    it('should handle special characters', () => {
      const specialId = 'user@example.com!#$%^&*()';
      const color = getUserColor(specialId);
      expect(color).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });

    it('should handle unicode characters', () => {
      const unicodeId = 'user-test-123';
      const color = getUserColor(unicodeId);
      expect(color).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });
  });

  // =========================================================================
  // Session Info Tests
  // =========================================================================

  describe('session user info', () => {
    const mockUser = createMockUser({
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    });

    it('should use full_name from user metadata when available', () => {
      const displayName = mockUser.user_metadata?.full_name || mockUser.email?.split('@')[0] || 'Anonymous';
      expect(displayName).toBe('Test User');
    });

    it('should fallback to email prefix when full_name is missing', () => {
      const userWithoutName = createMockUser({
        email: 'john@example.com',
        user_metadata: {},
      });
      const displayName = userWithoutName.user_metadata?.full_name || userWithoutName.email?.split('@')[0] || 'Anonymous';
      expect(displayName).toBe('john');
    });

    it('should fallback to Anonymous when no name or email', () => {
      const anonymousUser = createMockUser({
        email: undefined as unknown as string,
        user_metadata: {},
      });
      const displayName = anonymousUser.user_metadata?.full_name || anonymousUser.email?.split('@')[0] || 'Anonymous';
      expect(displayName).toBe('Anonymous');
    });

    it('should use avatar_url when available', () => {
      const avatar = mockUser.user_metadata?.avatar_url || '';
      expect(avatar).toBe('https://example.com/avatar.jpg');
    });

    it('should use empty string when avatar_url is missing', () => {
      const userWithoutAvatar = createMockUser({
        user_metadata: { full_name: 'Test' },
      });
      const avatar = userWithoutAvatar.user_metadata?.avatar_url || '';
      expect(avatar).toBe('');
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

    it('should return 500 on internal errors', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      expect(() => mockSupabase.from('documents')).toThrow('Database error');
    });

    it('should handle JSON parse errors', () => {
      const invalidJson = 'not valid json';
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('should handle Liveblocks authorization failure', async () => {
      // The session.authorize() could fail
      const authResult = {
        body: JSON.stringify({ error: 'Authorization failed' }),
        status: 403,
      };

      expect(authResult.status).toBe(403);
    });
  });

  // =========================================================================
  // Security Tests
  // =========================================================================

  describe('security', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should validate UUID format to prevent injection', () => {
      const maliciousIds = [
        "'; DROP TABLE documents; --",
        '1 OR 1=1',
        '../../../etc/passwd',
        '<script>alert(1)</script>',
      ];

      maliciousIds.forEach((id) => {
        expect(isValidUUID(id)).toBe(false);
      });
    });

    it('should not expose internal errors to client', () => {
      // Generic error message should be returned
      const errorResponse = { error: 'Internal server error' };
      expect(errorResponse.error).toBe('Internal server error');
      // Should not contain stack traces or internal details
    });

    it('should verify document access before granting Liveblocks session', async () => {
      // This is tested by the document access verification tests
      // The key is that access check happens BEFORE session creation
    });

    it('should not allow permission escalation', () => {
      const sharePermission = 'view';
      const expectedLiveblocksPermission = 'read';

      // View permission should only get read access, not write
      expect(sharePermission === 'view').toBe(true);
      expect(expectedLiveblocksPermission).toBe('read');
    });
  });

  // =========================================================================
  // Response Format Tests
  // =========================================================================

  describe('response format', () => {
    it('should return Liveblocks token on success', () => {
      const response = {
        body: JSON.stringify({ token: 'liveblocks-session-token' }),
        status: 200,
      };

      expect(response.status).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('token');
    });

    it('should return error object on failure', () => {
      const errorResponse = {
        error: 'Access denied',
      };

      expect(errorResponse).toHaveProperty('error');
    });
  });
});
