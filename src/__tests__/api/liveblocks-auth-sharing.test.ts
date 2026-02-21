/** @jest-environment node */

const mockCreateServerSupabaseClient = jest.fn()
const mockCreateAdminSupabaseClient = jest.fn()
const mockCookies = jest.fn()

const mockAllow = jest.fn()
const mockAuthorize = jest.fn()
const mockPrepareSession = jest.fn()

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: () => mockCreateServerSupabaseClient(),
  createAdminSupabaseClient: () => mockCreateAdminSupabaseClient(),
}))

jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

jest.mock('@liveblocks/node', () => ({
  Liveblocks: jest.fn().mockImplementation(() => ({
    prepareSession: (...args: unknown[]) => mockPrepareSession(...args),
  })),
}))

import { POST } from '@/app/api/liveblocks-auth/route'

describe('POST /api/liveblocks-auth sharing flows', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockAuthorize.mockResolvedValue({
      body: JSON.stringify({ token: 'mock-liveblocks-token' }),
      status: 200,
    })

    mockPrepareSession.mockReturnValue({
      FULL_ACCESS: ['room:write'],
      READ_ACCESS: ['room:read'],
      allow: mockAllow,
      authorize: mockAuthorize,
    })
  })

  it('authorizes via redeemed share cookie when no direct share row exists', async () => {
    const user = {
      id: 'collaborator-user',
      email: 'friend@example.com',
      user_metadata: { full_name: 'Friend User', avatar_url: '' },
    }

    const serverClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    }

    const adminClient = {
      from: jest.fn((table: string) => {
        if (table === 'documents') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: '550e8400-e29b-41d4-a716-446655440000', owner_id: 'owner-user' },
                  error: null,
                }),
              }),
            }),
          }
        }

        if (table === 'document_shares') {
          const eqByUserId = jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })

          const eqByToken = jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { permission: 'comment', invited_email: 'friend@example.com' },
              error: null,
            }),
          })

          return {
            select: jest.fn((selectArg: string) => ({
              eq: jest.fn().mockImplementation((_column: string, _value: string) => {
                if (selectArg === 'permission, invited_email') {
                  return {
                    eq: eqByToken,
                  }
                }
                return {
                  eq: eqByUserId,
                }
              }),
            })),
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    mockCreateServerSupabaseClient.mockResolvedValue(serverClient)
    mockCreateAdminSupabaseClient.mockReturnValue(adminClient)
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'share-token-123' }),
    })

    const request = new Request('http://localhost/api/liveblocks-auth', {
      method: 'POST',
      body: JSON.stringify({ room: 'doc:550e8400-e29b-41d4-a716-446655440000' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ token: 'mock-liveblocks-token' })
    expect(mockAllow).toHaveBeenCalledWith('doc:550e8400-e29b-41d4-a716-446655440000', [
      'room:read',
      'room:presence:write',
      'comments:read',
      'comments:write',
    ])
  })

  it('grants full room access to directly shared edit collaborators', async () => {
    const user = {
      id: 'editor-user',
      email: 'editor@example.com',
      user_metadata: { full_name: 'Editor User', avatar_url: '' },
    }

    const serverClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    }

    const adminClient = {
      from: jest.fn((table: string) => {
        if (table === 'documents') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: '550e8400-e29b-41d4-a716-446655440000', owner_id: 'owner-user' },
                  error: null,
                }),
              }),
            }),
          }
        }

        if (table === 'document_shares') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { permission: 'edit' },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    mockCreateServerSupabaseClient.mockResolvedValue(serverClient)
    mockCreateAdminSupabaseClient.mockReturnValue(adminClient)
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    })

    const request = new Request('http://localhost/api/liveblocks-auth', {
      method: 'POST',
      body: JSON.stringify({ room: 'doc:550e8400-e29b-41d4-a716-446655440000' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ token: 'mock-liveblocks-token' })
    expect(mockAllow).toHaveBeenCalledWith('doc:550e8400-e29b-41d4-a716-446655440000', [
      'room:read',
      'room:write',
      'room:presence:write',
      'comments:read',
      'comments:write',
    ])
  })
})
