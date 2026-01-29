/**
 * Supabase Mock Utilities
 *
 * Provides comprehensive mocks for Supabase client operations
 * used throughout the ColabMD application.
 */

import { User, Session } from '@supabase/supabase-js';

// ============================================================================
// Type Definitions
// ============================================================================

export interface MockUser extends Partial<User> {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface MockSession extends Partial<Session> {
  user: MockUser;
  access_token: string;
  refresh_token: string;
}

export interface MockDocument {
  id: string;
  title: string;
  content: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface MockProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface MockDocumentShare {
  id: string;
  document_id: string;
  user_id: string | null;
  share_token: string | null;
  permission: 'view' | 'edit' | 'comment';
  created_at: string;
}

// ============================================================================
// Mock Data Factories
// ============================================================================

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    ...overrides,
  };
}

export function createMockSession(overrides: Partial<MockSession> = {}): MockSession {
  const user = overrides.user || createMockUser();
  return {
    user,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    ...overrides,
  };
}

export function createMockDocument(overrides: Partial<MockDocument> = {}): MockDocument {
  const now = new Date().toISOString();
  return {
    id: 'doc-123',
    title: 'Test Document',
    content: '<p>Test content</p>',
    owner_id: 'user-123',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMockProfile(overrides: Partial<MockProfile> = {}): MockProfile {
  return {
    id: 'user-123',
    email: 'test@example.com',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockShare(overrides: Partial<MockDocumentShare> = {}): MockDocumentShare {
  return {
    id: 'share-123',
    document_id: 'doc-123',
    user_id: 'user-456',
    share_token: null,
    permission: 'view',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Supabase Client Mock
// ============================================================================

export interface MockQueryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  order: jest.Mock;
  data: unknown;
  error: Error | null;
}

export function createMockQueryBuilder(
  data: unknown = null,
  error: Error | null = null
): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
    order: jest.fn().mockReturnThis(),
    data,
    error,
  };

  // Allow chaining to resolve with data
  builder.select.mockImplementation(() => ({
    ...builder,
    single: jest.fn().mockResolvedValue({ data, error }),
    eq: jest.fn().mockReturnValue({
      ...builder,
      single: jest.fn().mockResolvedValue({ data, error }),
      order: jest.fn().mockResolvedValue({ data, error }),
    }),
    order: jest.fn().mockResolvedValue({ data, error }),
  }));

  builder.insert.mockImplementation(() => ({
    ...builder,
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data, error }),
    }),
  }));

  builder.update.mockImplementation(() => ({
    ...builder,
    eq: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data, error }),
      }),
    }),
  }));

  builder.delete.mockImplementation(() => ({
    ...builder,
    eq: jest.fn().mockResolvedValue({ data, error }),
  }));

  return builder;
}

export interface MockSupabaseAuth {
  getUser: jest.Mock;
  getSession: jest.Mock;
  signInWithOAuth: jest.Mock;
  signOut: jest.Mock;
  onAuthStateChange: jest.Mock;
  exchangeCodeForSession: jest.Mock;
}

export function createMockSupabaseAuth(
  user: MockUser | null = null,
  session: MockSession | null = null
): MockSupabaseAuth {
  return {
    getUser: jest.fn().mockResolvedValue({
      data: { user },
      error: user ? null : { message: 'Not authenticated' },
    }),
    getSession: jest.fn().mockResolvedValue({
      data: { session },
      error: null,
    }),
    signInWithOAuth: jest.fn().mockResolvedValue({
      data: { url: 'https://accounts.google.com/oauth' },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    exchangeCodeForSession: jest.fn().mockResolvedValue({
      data: { session },
      error: null,
    }),
  };
}

export interface MockSupabaseClient {
  auth: MockSupabaseAuth;
  from: jest.Mock;
}

export function createMockSupabaseClient(
  user: MockUser | null = createMockUser(),
  tableData: Record<string, unknown> = {}
): MockSupabaseClient {
  const auth = createMockSupabaseAuth(
    user,
    user ? createMockSession({ user }) : null
  );

  const from = jest.fn((table: string) => {
    const data = tableData[table] || null;
    return createMockQueryBuilder(data);
  });

  return { auth, from };
}

// ============================================================================
// Server-side Supabase Mock
// ============================================================================

export function mockCreateServerSupabaseClient(client: MockSupabaseClient) {
  jest.mock('@/lib/supabase-server', () => ({
    createServerSupabaseClient: jest.fn().mockResolvedValue(client),
  }));
}

export function mockCreateBrowserClient(client: MockSupabaseClient) {
  jest.mock('@/lib/supabase', () => ({
    createClient: jest.fn().mockReturnValue(client),
  }));
}

// ============================================================================
// Test Helpers
// ============================================================================

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createMockDocuments(count: number, ownerId: string): MockDocument[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDocument({
      id: `doc-${i + 1}`,
      title: `Document ${i + 1}`,
      owner_id: ownerId,
    })
  );
}

export function createMockShares(
  documentId: string,
  permissions: Array<'view' | 'edit' | 'comment'>
): MockDocumentShare[] {
  return permissions.map((permission, i) =>
    createMockShare({
      id: `share-${i + 1}`,
      document_id: documentId,
      user_id: `shared-user-${i + 1}`,
      permission,
    })
  );
}
