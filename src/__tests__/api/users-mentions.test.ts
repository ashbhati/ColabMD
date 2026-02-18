/** @jest-environment node */

const mockCreateServerSupabaseClient = jest.fn()
const mockCreateAdminSupabaseClient = jest.fn()

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: () => mockCreateServerSupabaseClient(),
  createAdminSupabaseClient: () => mockCreateAdminSupabaseClient(),
}))

import { GET } from '@/app/api/users/route'

describe('GET /api/users mention suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns collaborators for a room filtered by query text', async () => {
    const serverClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'viewer-user' } },
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
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: 'doc-1', owner_id: 'owner-user' },
                  error: null,
                }),
              }),
            }),
          }
        }

        if (table === 'document_shares') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn((column: string) => {
                if (column === 'document_id') {
                  return {
                    eq: jest.fn().mockReturnValue({
                      maybeSingle: jest.fn().mockResolvedValue({
                        data: { id: 'share-viewer' },
                        error: null,
                      }),
                    }),
                    not: jest.fn().mockResolvedValue({
                      data: [{ user_id: 'viewer-user' }, { user_id: 'collab-user' }],
                      error: null,
                    }),
                  }
                }
                return {
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: { id: 'share-viewer' },
                    error: null,
                  }),
                }
              }),
            })),
          }
        }

        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [
                  { id: 'owner-user', display_name: 'Ashish', avatar_url: '', email: 'owner@example.com' },
                  { id: 'viewer-user', display_name: 'Akshat', avatar_url: '', email: 'akshat@example.com' },
                  { id: 'collab-user', display_name: 'Priya', avatar_url: '', email: 'priya@example.com' },
                ],
                error: null,
              }),
            }),
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    mockCreateServerSupabaseClient.mockResolvedValue(serverClient)
    mockCreateAdminSupabaseClient.mockReturnValue(adminClient)

    const response = await GET(new Request('http://localhost/api/users?roomId=doc:doc-1&text=ak'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([
      { id: 'viewer-user', name: 'Akshat', avatar: '' },
    ])
  })
})
