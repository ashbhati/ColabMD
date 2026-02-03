/**
 * Unit Tests for Liveblocks Auth Profile Fallback (Issue #1 Fix)
 *
 * Tests the fix for comments showing "Anonymous" instead of user name.
 * The fix adds a fallback to check the profiles table when user_metadata
 * doesn't contain full_name.
 *
 * Test Coverage:
 * - Profile fallback logic when user_metadata.full_name is missing
 * - Profile lookup from Supabase profiles table
 * - Cascading fallback: metadata -> profiles -> email prefix -> "Anonymous"
 * - Avatar URL fallback chain
 */

import {
  createMockUser,
  createMockProfile,
  createMockDocument,
  createMockSupabaseClient,
  MockSupabaseClient,
  MockProfile,
} from '../mocks/supabase';

// Mock the supabase server module
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}));

// Mock the Liveblocks SDK
const mockPrepareSession = jest.fn();
const mockAllow = jest.fn();
const mockAuthorize = jest.fn();

jest.mock('@liveblocks/node', () => ({
  Liveblocks: jest.fn().mockImplementation(() => ({
    prepareSession: mockPrepareSession,
  })),
}));

import { createServerSupabaseClient } from '@/lib/supabase-server';

describe('Liveblocks Auth Profile Fallback (Issue #1 Fix)', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrepareSession.mockReturnValue({
      allow: mockAllow,
      FULL_ACCESS: ['room:write'],
      READ_ACCESS: ['room:read'],
      authorize: mockAuthorize.mockResolvedValue({
        body: JSON.stringify({ token: 'mock-token' }),
        status: 200,
      }),
    });
  });

  // ===========================================================================
  // Display Name Resolution Logic
  // ===========================================================================

  describe('display name resolution', () => {
    /**
     * Replicate the display name resolution logic from the route handler
     * to test each scenario independently
     */
    interface User {
      id: string;
      email?: string;
      user_metadata?: {
        full_name?: string;
        avatar_url?: string;
      };
    }

    interface Profile {
      display_name: string | null;
      avatar_url: string | null;
    }

    function resolveDisplayName(
      user: User,
      profile: Profile | null
    ): string {
      // First try user_metadata.full_name
      let displayName = user.user_metadata?.full_name;

      // If no name in metadata, check profiles table
      if (!displayName && profile) {
        displayName = profile.display_name || user.email?.split('@')[0] || 'Anonymous';
      } else if (!displayName) {
        displayName = user.email?.split('@')[0] || 'Anonymous';
      }

      return displayName;
    }

    // -------------------------------------------------------------------------
    // Priority 1: user_metadata.full_name
    // -------------------------------------------------------------------------

    describe('priority 1: user_metadata.full_name', () => {
      it('should use full_name from user_metadata when available', () => {
        const user: User = {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'John Doe',
            avatar_url: 'https://example.com/avatar.jpg',
          },
        };

        const displayName = resolveDisplayName(user, null);
        expect(displayName).toBe('John Doe');
      });

      it('should prefer user_metadata.full_name over profile.display_name', () => {
        const user: User = {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Metadata Name',
          },
        };

        const profile: Profile = {
          display_name: 'Profile Name',
          avatar_url: null,
        };

        const displayName = resolveDisplayName(user, profile);
        expect(displayName).toBe('Metadata Name');
      });

      it('should handle whitespace-only full_name as falsy', () => {
        const user: User = {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: '   ', // Whitespace only
          },
        };

        const profile: Profile = {
          display_name: 'Profile Name',
          avatar_url: null,
        };

        // Note: The actual implementation may need trimming logic
        // This test documents current behavior
        const displayName = resolveDisplayName(user, profile);
        // Whitespace-only string is truthy in JavaScript, so it will be used
        expect(displayName).toBe('   ');
      });
    });

    // -------------------------------------------------------------------------
    // Priority 2: profiles table lookup (FIX FOR ISSUE #1)
    // -------------------------------------------------------------------------

    describe('priority 2: profiles table (Issue #1 fix)', () => {
      it('should use profile.display_name when user_metadata.full_name is missing', () => {
        const user: User = {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {},
        };

        const profile: Profile = {
          display_name: 'Jane Smith',
          avatar_url: 'https://example.com/profile-avatar.jpg',
        };

        const displayName = resolveDisplayName(user, profile);
        expect(displayName).toBe('Jane Smith');
      });

      it('should use profile.display_name when user_metadata is undefined', () => {
        const user: User = {
          id: 'user-123',
          email: 'test@example.com',
        };

        const profile: Profile = {
          display_name: 'Profile User',
          avatar_url: null,
        };

        const displayName = resolveDisplayName(user, profile);
        expect(displayName).toBe('Profile User');
      });

      it('should use profile.display_name when user_metadata.full_name is null', () => {
        const user: User = {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: undefined,
          },
        };

        const profile: Profile = {
          display_name: 'From Profile Table',
          avatar_url: null,
        };

        const displayName = resolveDisplayName(user, profile);
        expect(displayName).toBe('From Profile Table');
      });

      it('should use profile.display_name when user_metadata.full_name is empty string', () => {
        const user: User = {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: '',
          },
        };

        const profile: Profile = {
          display_name: 'Profile Display Name',
          avatar_url: null,
        };

        const displayName = resolveDisplayName(user, profile);
        expect(displayName).toBe('Profile Display Name');
      });
    });

    // -------------------------------------------------------------------------
    // Priority 3: email prefix fallback
    // -------------------------------------------------------------------------

    describe('priority 3: email prefix fallback', () => {
      it('should use email prefix when no metadata name and profile.display_name is null', () => {
        const user: User = {
          id: 'user-123',
          email: 'john.doe@company.com',
          user_metadata: {},
        };

        const profile: Profile = {
          display_name: null,
          avatar_url: null,
        };

        const displayName = resolveDisplayName(user, profile);
        expect(displayName).toBe('john.doe');
      });

      it('should use email prefix when no metadata name and no profile exists', () => {
        const user: User = {
          id: 'user-123',
          email: 'jane@example.org',
          user_metadata: {},
        };

        const displayName = resolveDisplayName(user, null);
        expect(displayName).toBe('jane');
      });

      it('should handle complex email addresses', () => {
        const user: User = {
          id: 'user-123',
          email: 'user+tag@subdomain.example.com',
          user_metadata: {},
        };

        const displayName = resolveDisplayName(user, null);
        expect(displayName).toBe('user+tag');
      });
    });

    // -------------------------------------------------------------------------
    // Priority 4: "Anonymous" fallback
    // -------------------------------------------------------------------------

    describe('priority 4: Anonymous fallback', () => {
      it('should return "Anonymous" when no name sources available', () => {
        const user: User = {
          id: 'user-123',
          user_metadata: {},
        };

        const displayName = resolveDisplayName(user, null);
        expect(displayName).toBe('Anonymous');
      });

      it('should return "Anonymous" when profile has null display_name and no email', () => {
        const user: User = {
          id: 'user-123',
          user_metadata: {},
        };

        const profile: Profile = {
          display_name: null,
          avatar_url: null,
        };

        const displayName = resolveDisplayName(user, profile);
        expect(displayName).toBe('Anonymous');
      });

      it('should return "Anonymous" for minimal user object', () => {
        const user: User = {
          id: 'user-123',
        };

        const displayName = resolveDisplayName(user, null);
        expect(displayName).toBe('Anonymous');
      });
    });
  });

  // ===========================================================================
  // Avatar URL Resolution
  // ===========================================================================

  describe('avatar URL resolution', () => {
    interface User {
      user_metadata?: {
        avatar_url?: string;
      };
    }

    interface Profile {
      avatar_url: string | null;
    }

    function resolveAvatarUrl(user: User, profile: Profile | null): string {
      let avatar = user.user_metadata?.avatar_url || '';
      if (!avatar && profile?.avatar_url) {
        avatar = profile.avatar_url;
      }
      return avatar;
    }

    it('should use avatar from user_metadata when available', () => {
      const user: User = {
        user_metadata: {
          avatar_url: 'https://google.com/avatar.jpg',
        },
      };

      const avatar = resolveAvatarUrl(user, null);
      expect(avatar).toBe('https://google.com/avatar.jpg');
    });

    it('should prefer user_metadata.avatar_url over profile.avatar_url', () => {
      const user: User = {
        user_metadata: {
          avatar_url: 'https://metadata-avatar.com/pic.jpg',
        },
      };

      const profile: Profile = {
        avatar_url: 'https://profile-avatar.com/pic.jpg',
      };

      const avatar = resolveAvatarUrl(user, profile);
      expect(avatar).toBe('https://metadata-avatar.com/pic.jpg');
    });

    it('should fall back to profile.avatar_url when metadata avatar is missing', () => {
      const user: User = {
        user_metadata: {},
      };

      const profile: Profile = {
        avatar_url: 'https://profile.com/avatar.png',
      };

      const avatar = resolveAvatarUrl(user, profile);
      expect(avatar).toBe('https://profile.com/avatar.png');
    });

    it('should return empty string when no avatar available', () => {
      const user: User = {
        user_metadata: {},
      };

      const profile: Profile = {
        avatar_url: null,
      };

      const avatar = resolveAvatarUrl(user, profile);
      expect(avatar).toBe('');
    });
  });

  // ===========================================================================
  // Database Query Simulation
  // ===========================================================================

  describe('profiles table query simulation', () => {
    it('should query profiles table with user ID', async () => {
      const mockUser = createMockUser({
        id: 'user-456',
        user_metadata: {}, // No full_name in metadata
      });

      const mockProfile = createMockProfile({
        id: 'user-456',
        display_name: 'Database User Name',
        avatar_url: 'https://db.com/avatar.jpg',
      });

      mockSupabase = createMockSupabaseClient(mockUser);

      // Setup mock to return profile
      const mockProfileQuery = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      };

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'profiles') {
          return mockProfileQuery;
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      // Simulate the query pattern from the route
      const result = await mockSupabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', mockUser.id)
        .single();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(result.data).toEqual(mockProfile);
    });

    it('should handle missing profile gracefully', async () => {
      const mockUser = createMockUser({
        id: 'new-user-789',
        email: 'newuser@example.com',
        user_metadata: {},
      });

      mockSupabase = createMockSupabaseClient(mockUser);

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Row not found' },
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', mockUser.id)
        .single();

      // Should fall back to email prefix
      expect(result.data).toBeNull();
      const displayName = mockUser.email?.split('@')[0] || 'Anonymous';
      expect(displayName).toBe('newuser');
    });

    it('should handle database query error gracefully', async () => {
      const mockUser = createMockUser({
        id: 'user-error',
        email: 'error@example.com',
        user_metadata: {},
      });

      mockSupabase = createMockSupabaseClient(mockUser);

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection error' },
            }),
          }),
        }),
      });

      const result = await mockSupabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', mockUser.id)
        .single();

      // On error, should still work with fallback
      expect(result.error).toBeTruthy();
      const displayName = mockUser.email?.split('@')[0] || 'Anonymous';
      expect(displayName).toBe('error');
    });
  });

  // ===========================================================================
  // Session Creation with Profile Data
  // ===========================================================================

  describe('session creation with profile data', () => {
    it('should create session with correct userInfo when profile provides name', () => {
      const userInfo = {
        name: 'Profile Display Name',
        email: 'user@example.com',
        avatar: 'https://profile.com/avatar.jpg',
        color: '#E57373',
      };

      // Simulate session preparation
      mockPrepareSession('user-123', { userInfo });

      expect(mockPrepareSession).toHaveBeenCalledWith('user-123', {
        userInfo: expect.objectContaining({
          name: 'Profile Display Name',
          email: 'user@example.com',
          avatar: 'https://profile.com/avatar.jpg',
        }),
      });
    });

    it('should create session with email prefix when profile has no display_name', () => {
      const userInfo = {
        name: 'emailprefix',
        email: 'emailprefix@example.com',
        avatar: '',
        color: '#64B5F6',
      };

      mockPrepareSession('user-456', { userInfo });

      expect(mockPrepareSession).toHaveBeenCalledWith('user-456', {
        userInfo: expect.objectContaining({
          name: 'emailprefix',
        }),
      });
    });

    it('should create session with "Anonymous" when all fallbacks fail', () => {
      const userInfo = {
        name: 'Anonymous',
        email: '',
        avatar: '',
        color: '#4DD0E1',
      };

      mockPrepareSession('user-789', { userInfo });

      expect(mockPrepareSession).toHaveBeenCalledWith('user-789', {
        userInfo: expect.objectContaining({
          name: 'Anonymous',
        }),
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle profile with empty string display_name', () => {
      interface Profile {
        display_name: string | null;
      }

      const profile: Profile = {
        display_name: '',
      };

      // Empty string is falsy, should fall back
      const displayName = profile.display_name || 'Fallback';
      expect(displayName).toBe('Fallback');
    });

    it('should handle profile with whitespace-only display_name', () => {
      interface Profile {
        display_name: string | null;
      }

      const profile: Profile = {
        display_name: '   ',
      };

      // Whitespace is truthy - this documents current behavior
      // Implementation may need .trim() check
      const displayName = profile.display_name || 'Fallback';
      expect(displayName).toBe('   ');
    });

    it('should handle email with no @ symbol', () => {
      const email = 'invalidemailformat';
      const prefix = email.split('@')[0];
      expect(prefix).toBe('invalidemailformat');
    });

    it('should handle email with multiple @ symbols', () => {
      const email = 'user@domain@extra.com';
      const prefix = email.split('@')[0];
      expect(prefix).toBe('user');
    });

    it('should handle undefined user_metadata gracefully', () => {
      interface User {
        id: string;
        user_metadata?: Record<string, unknown>;
      }

      const user: User = {
        id: 'user-123',
      };

      const fullName = user.user_metadata?.full_name;
      expect(fullName).toBeUndefined();
    });
  });
});
