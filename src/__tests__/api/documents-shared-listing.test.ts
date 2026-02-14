/** @jest-environment node */

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}))

import { GET } from '@/app/api/documents/route'

const mockCreateServerSupabaseClient = jest.fn()
const mockCreateAdminSupabaseClient = jest.fn()

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: () => mockCreateServerSupabaseClient(),
  createAdminSupabaseClient: () => mockCreateAdminSupabaseClient(),
}))

describe('GET /api/documents shared listing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns shared docs with permission, filters null rows, and sorts by updated_at desc', async () => {
    const mockUser = { id: 'user-1' }
    const ownedDocs = [{ id: 'owned-1', title: 'Owned', updated_at: '2026-02-14T00:00:00Z' }]
    const sharedRows = [
      {
        document_id: 'shared-old',
        permission: 'view',
        documents: {
          id: 'shared-old',
          title: 'Shared Old',
          updated_at: '2026-01-01T00:00:00Z',
          profiles: { display_name: 'Owner A', avatar_url: null },
        },
      },
      {
        document_id: 'shared-new',
        permission: 'edit',
        documents: {
          id: 'shared-new',
          title: 'Shared New',
          updated_at: '2026-02-01T00:00:00Z',
          profiles: { display_name: 'Owner B', avatar_url: null },
        },
      },
      {
        document_id: 'broken-row',
        permission: 'comment',
        documents: null,
      },
    ]

    const serverClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table !== 'documents') throw new Error(`Unexpected table: ${table}`)
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: ownedDocs,
                error: null,
              }),
            }),
          }),
        }
      }),
    }

    const adminClient = {
      from: jest.fn((table: string) => {
        if (table !== 'document_shares') throw new Error(`Unexpected table: ${table}`)
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: sharedRows,
              error: null,
            }),
          }),
        }
      }),
    }

    mockCreateServerSupabaseClient.mockResolvedValue(serverClient)
    mockCreateAdminSupabaseClient.mockReturnValue(adminClient)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.owned).toEqual(ownedDocs)
    expect(body.shared).toHaveLength(2)
    expect(body.shared[0].id).toBe('shared-new')
    expect(body.shared[0].shared_permission).toBe('edit')
    expect(body.shared[1].id).toBe('shared-old')
  })
})
