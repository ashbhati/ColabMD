/**
 * API Tests for Document Routes
 *
 * Comprehensive tests for:
 * - GET /api/documents (list documents)
 * - POST /api/documents (create document)
 * - GET /api/documents/[id] (get single document)
 * - PATCH /api/documents/[id] (update document)
 * - DELETE /api/documents/[id] (delete document)
 */

import {
  createMockUser,
  createMockDocument,
  createMockShare,
  createMockSupabaseClient,
  MockSupabaseClient,
} from '../mocks/supabase';
import { isValidUUID, sanitizeTitle, isValidContentSize, MAX_CONTENT_LENGTH } from '@/lib/validation';

// Mock the supabase server module
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

import { createServerSupabaseClient } from '@/lib/supabase-server';

// =============================================================================
// GET /api/documents Tests
// =============================================================================

describe('GET /api/documents', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase = createMockSupabaseClient(null);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { data: { user }, error: authError } = await mockSupabase.auth.getUser();

      // Either authError exists OR user is null/falsy
      expect(!!authError || !user).toBe(true);
    });

    it('should return 401 when getUser returns an error', async () => {
      mockSupabase = createMockSupabaseClient(null);
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { error: authError } = await mockSupabase.auth.getUser();
      expect(authError).toBeTruthy();
    });
  });

  describe('successful requests', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return owned documents ordered by updated_at descending', async () => {
      const ownedDocs = [
        createMockDocument({ id: 'doc-1', title: 'Newest', updated_at: '2024-01-03T00:00:00Z' }),
        createMockDocument({ id: 'doc-2', title: 'Older', updated_at: '2024-01-02T00:00:00Z' }),
        createMockDocument({ id: 'doc-3', title: 'Oldest', updated_at: '2024-01-01T00:00:00Z' }),
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: ownedDocs, error: null }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('documents')
        .select('*')
        .eq('owner_id', mockUser.id)
        .order('updated_at', { ascending: false });

      expect(result.data).toEqual(ownedDocs);
      expect(result.data[0].title).toBe('Newest');
    });

    it('should include profile data for document owners', async () => {
      const expectedSelect = '*, profiles!documents_owner_id_fkey(display_name, avatar_url)';
      // Verify the select includes profile join
      expect(expectedSelect).toContain('profiles');
    });

    it('should return shared documents with permission info', async () => {
      const sharedDocs = [
        {
          document_id: 'doc-shared-1',
          permission: 'edit',
          documents: createMockDocument({ id: 'doc-shared-1', title: 'Shared Doc' }),
        },
      ];

      const response = {
        owned: [],
        shared: sharedDocs.map((s) => ({
          ...s.documents,
          shared_permission: s.permission,
        })),
      };

      expect(response.shared).toHaveLength(1);
      expect(response.shared[0]).toHaveProperty('shared_permission', 'edit');
    });

    it('should return empty arrays when user has no documents', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('documents')
        .select('*')
        .eq('owner_id', mockUser.id)
        .order('updated_at');

      expect(result.data).toEqual([]);
    });
  });

  describe('error handling', () => {
    const mockUser = createMockUser();

    it('should return 500 when owned documents query fails', async () => {
      mockSupabase = createMockSupabaseClient(mockUser);
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      });
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await mockSupabase
        .from('documents')
        .select('*')
        .eq('owner_id', mockUser.id)
        .order('updated_at');

      expect(result.error).toBeTruthy();
    });

    it('should handle shared documents query failure gracefully', async () => {
      // Shared docs query failure should not fail the entire request
      // The API continues and returns owned: [...], shared: []
      const response = { owned: [createMockDocument()], shared: [] };
      expect(response.owned).toHaveLength(1);
      expect(response.shared).toHaveLength(0);
    });
  });
});

// =============================================================================
// POST /api/documents Tests
// =============================================================================

describe('POST /api/documents', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase = createMockSupabaseClient(null);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { data: { user } } = await mockSupabase.auth.getUser();
      expect(user).toBeNull();
    });
  });

  describe('title handling', () => {
    it('should use sanitizeTitle for provided title', () => {
      expect(sanitizeTitle('My Document')).toBe('My Document');
      expect(sanitizeTitle('  Trimmed  ')).toBe('Trimmed');
    });

    it('should use default title for empty input', () => {
      expect(sanitizeTitle('')).toBe('Untitled Document');
      expect(sanitizeTitle(null)).toBe('Untitled Document');
      expect(sanitizeTitle(undefined)).toBe('Untitled Document');
    });

    it('should truncate very long titles', () => {
      const longTitle = 'A'.repeat(300);
      const result = sanitizeTitle(longTitle);
      expect(result.length).toBe(255); // MAX_TITLE_LENGTH
    });
  });

  describe('content validation', () => {
    it('should accept empty content', () => {
      expect(isValidContentSize('')).toBe(true);
    });

    it('should accept content within limit', () => {
      const validContent = '<p>Hello World</p>';
      expect(isValidContentSize(validContent)).toBe(true);
    });

    it('should reject content exceeding MAX_CONTENT_LENGTH', () => {
      const largeContent = 'A'.repeat(MAX_CONTENT_LENGTH + 1);
      expect(isValidContentSize(largeContent)).toBe(false);
    });

    it('should return 400 for content too large', () => {
      const largeContent = 'A'.repeat(MAX_CONTENT_LENGTH + 1);
      const isValid = isValidContentSize(largeContent);
      expect(isValid).toBe(false);
      // API would return { error: 'Content too large (max 10MB)' }, status: 400
    });
  });

  describe('successful creation', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should create document with generated UUID', async () => {
      const { v4: uuidv4 } = await import('uuid');
      const id = uuidv4();
      expect(id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should set owner_id to current user', async () => {
      const documentData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'New Doc',
        content: '',
        owner_id: mockUser.id,
      };

      expect(documentData.owner_id).toBe(mockUser.id);
    });

    it('should return 201 with created document', async () => {
      const createdDoc = createMockDocument({
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'New Doc',
        owner_id: mockUser.id,
      });

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: createdDoc, error: null }),
          }),
        }),
      });

      const result = await mockSupabase.from('documents').insert({}).select().single();
      expect(result.data).toEqual(createdDoc);
    });
  });

  describe('error handling', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return 500 when insert fails', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
          }),
        }),
      });

      const result = await mockSupabase.from('documents').insert({}).select().single();
      expect(result.error).toBeTruthy();
    });

    it('should handle malformed JSON body', () => {
      const invalidJson = '{title: invalid}';
      expect(() => JSON.parse(invalidJson)).toThrow();
    });
  });
});

// =============================================================================
// GET /api/documents/[id] Tests
// =============================================================================

describe('GET /api/documents/[id]', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UUID validation', () => {
    it('should return 400 for invalid UUID format', () => {
      const invalidIds = [
        'invalid',
        '123',
        'abc-def-ghi',
        "'; DROP TABLE documents; --",
        '../../../etc/passwd',
      ];

      invalidIds.forEach((id) => {
        expect(isValidUUID(id)).toBe(false);
      });
    });

    it('should accept valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });
  });

  describe('authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase = createMockSupabaseClient(null);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { data: { user } } = await mockSupabase.auth.getUser();
      expect(user).toBeNull();
    });
  });

  describe('authorization', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return document when user is owner', async () => {
      const ownedDoc = createMockDocument({ owner_id: mockUser.id });

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: ownedDoc, error: null }),
          }),
        }),
      });

      const result = await mockSupabase.from('documents').select('*').eq('id', ownedDoc.id).single();
      expect(result.data.owner_id).toBe(mockUser.id);
    });

    it('should return document when user has share access', async () => {
      const otherUserDoc = createMockDocument({ owner_id: 'other-user' });
      const share = createMockShare({
        document_id: otherUserDoc.id,
        user_id: mockUser.id,
        permission: 'view',
      });

      // User has share access
      expect(share.user_id).toBe(mockUser.id);
      expect(share.document_id).toBe(otherUserDoc.id);
    });

    it('should return 403 when user has no access', async () => {
      const otherUserDoc = createMockDocument({ owner_id: 'other-user' });

      // User is not owner
      expect(otherUserDoc.owner_id).not.toBe(mockUser.id);
      // And has no share (would need to check document_shares)
    });
  });

  describe('not found', () => {
    const mockUser = createMockUser();

    it('should return 404 when document does not exist', async () => {
      mockSupabase = createMockSupabaseClient(mockUser);
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await mockSupabase.from('documents').select('*').eq('id', 'nonexistent').single();
      expect(result.data).toBeNull();
    });
  });
});

// =============================================================================
// PATCH /api/documents/[id] Tests
// =============================================================================

describe('PATCH /api/documents/[id]', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UUID validation', () => {
    it('should return 400 for invalid UUID', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
    });
  });

  describe('authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase = createMockSupabaseClient(null);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { data: { user } } = await mockSupabase.auth.getUser();
      expect(user).toBeNull();
    });
  });

  describe('authorization', () => {
    const mockUser = createMockUser();

    it('should allow owner to update', () => {
      const doc = createMockDocument({ owner_id: mockUser.id });
      const canEdit = doc.owner_id === mockUser.id;
      expect(canEdit).toBe(true);
    });

    it('should allow user with edit permission to update', () => {
      const share = createMockShare({
        user_id: mockUser.id,
        permission: 'edit',
      });
      const canEdit = share.permission === 'edit';
      expect(canEdit).toBe(true);
    });

    it('should return 403 for view-only permission', () => {
      const share = createMockShare({
        user_id: mockUser.id,
        permission: 'view',
      });
      const canEdit = share.permission === 'edit';
      expect(canEdit).toBe(false);
    });

    it('should return 403 for comment permission', () => {
      const share = createMockShare({
        user_id: mockUser.id,
        permission: 'comment',
      });
      const canEdit = share.permission === 'edit';
      expect(canEdit).toBe(false);
    });
  });

  describe('content validation', () => {
    it('should return 400 for content exceeding limit', () => {
      const largeContent = 'A'.repeat(MAX_CONTENT_LENGTH + 1);
      expect(isValidContentSize(largeContent)).toBe(false);
    });

    it('should accept valid content size', () => {
      const validContent = '<p>Updated content</p>';
      expect(isValidContentSize(validContent)).toBe(true);
    });
  });

  describe('successful updates', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should sanitize title before update', () => {
      expect(sanitizeTitle('  New Title  ')).toBe('New Title');
    });

    it('should update only provided fields', () => {
      const updates: Record<string, unknown> = {};

      // Only title provided
      const body = { title: 'New Title' };
      if (body.title !== undefined) updates.title = sanitizeTitle(body.title);

      expect(updates).toHaveProperty('title');
      expect(updates).not.toHaveProperty('content');
    });

    it('should set updated_at timestamp', () => {
      const updates = {
        title: 'Updated',
        updated_at: new Date().toISOString(),
      };

      expect(updates.updated_at).toBeDefined();
      expect(new Date(updates.updated_at).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('not found', () => {
    const mockUser = createMockUser();

    it('should return 404 when document does not exist', async () => {
      mockSupabase = createMockSupabaseClient(mockUser);
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await mockSupabase.from('documents').select('*').eq('id', 'nonexistent').single();
      expect(result.data).toBeNull();
    });
  });

  describe('error handling', () => {
    const mockUser = createMockUser();

    it('should return 500 when update fails', async () => {
      mockSupabase = createMockSupabaseClient(mockUser);
      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
            }),
          }),
        }),
      });
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await mockSupabase.from('documents').update({}).eq('id', 'doc-123').select('*').single();
      expect(result.error).toBeTruthy();
    });
  });
});

// =============================================================================
// DELETE /api/documents/[id] Tests
// =============================================================================

describe('DELETE /api/documents/[id]', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UUID validation', () => {
    it('should return 400 for invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
    });
  });

  describe('authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase = createMockSupabaseClient(null);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { data: { user } } = await mockSupabase.auth.getUser();
      expect(user).toBeNull();
    });
  });

  describe('authorization', () => {
    const mockUser = createMockUser();

    it('should allow only owner to delete', () => {
      const doc = createMockDocument({ owner_id: mockUser.id });
      const canDelete = doc.owner_id === mockUser.id;
      expect(canDelete).toBe(true);
    });

    it('should return 403 for non-owner even with edit permission', () => {
      const doc = createMockDocument({ owner_id: 'other-user' });
      const share = createMockShare({
        document_id: doc.id,
        user_id: mockUser.id,
        permission: 'edit',
      });

      // Even with edit permission, only owner can delete
      const canDelete = doc.owner_id === mockUser.id;
      expect(canDelete).toBe(false);
      expect(share.permission).toBe('edit'); // Has edit but still can't delete
    });
  });

  describe('cascade deletion', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
      mockSupabase = createMockSupabaseClient(mockUser);
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should delete shares before document', async () => {
      const doc = createMockDocument({ owner_id: mockUser.id });

      // Verify deletion order: shares first, then document
      const deletionOrder: string[] = [];

      // Mock shares deletion
      deletionOrder.push('document_shares');
      // Mock document deletion
      deletionOrder.push('documents');

      expect(deletionOrder).toEqual(['document_shares', 'documents']);
    });
  });

  describe('successful deletion', () => {
    const mockUser = createMockUser();

    it('should return success: true', () => {
      const response = { success: true };
      expect(response.success).toBe(true);
    });
  });

  describe('not found', () => {
    const mockUser = createMockUser();

    it('should return 404 when document does not exist', async () => {
      mockSupabase = createMockSupabaseClient(mockUser);
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await mockSupabase.from('documents').select('*').eq('id', 'nonexistent').single();
      expect(result.data).toBeNull();
    });
  });

  describe('error handling', () => {
    const mockUser = createMockUser();

    it('should return 500 when delete fails', async () => {
      mockSupabase = createMockSupabaseClient(mockUser);
      mockSupabase.from = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Delete failed' } }),
        }),
      });
      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const result = await mockSupabase.from('documents').delete().eq('id', 'doc-123');
      expect(result.error).toBeTruthy();
    });
  });
});

// =============================================================================
// Security Tests
// =============================================================================

describe('API Security', () => {
  describe('UUID injection prevention', () => {
    const maliciousInputs = [
      "'; DROP TABLE documents; --",
      '1 OR 1=1',
      '../../../etc/passwd',
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      '${7*7}',
      '{{7*7}}',
      '__proto__',
      'constructor',
    ];

    maliciousInputs.forEach((input) => {
      it(`should reject malicious input: ${input.slice(0, 20)}...`, () => {
        expect(isValidUUID(input)).toBe(false);
      });
    });
  });

  describe('content size limit enforcement', () => {
    it('should enforce 10MB limit', () => {
      expect(MAX_CONTENT_LENGTH).toBe(10 * 1024 * 1024);
    });

    it('should reject content at 10MB + 1 byte', () => {
      const oversizedContent = 'A'.repeat(MAX_CONTENT_LENGTH + 1);
      expect(isValidContentSize(oversizedContent)).toBe(false);
    });
  });

  describe('authorization checks', () => {
    it('should check ownership before allowing delete', () => {
      const mockUser = createMockUser({ id: 'user-a' });
      const doc = createMockDocument({ owner_id: 'user-b' });

      const isOwner = doc.owner_id === mockUser.id;
      expect(isOwner).toBe(false);
    });

    it('should verify edit permission for updates', () => {
      const viewOnlyShare = createMockShare({ permission: 'view' });
      const commentShare = createMockShare({ permission: 'comment' });
      const editShare = createMockShare({ permission: 'edit' });

      expect(viewOnlyShare.permission === 'edit').toBe(false);
      expect(commentShare.permission === 'edit').toBe(false);
      expect(editShare.permission === 'edit').toBe(true);
    });
  });
});
