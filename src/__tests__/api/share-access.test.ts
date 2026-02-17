/** @jest-environment node */

const mockCreateAdminSupabaseClient = jest.fn()

jest.mock('@/lib/supabase-server', () => ({
  createAdminSupabaseClient: () => mockCreateAdminSupabaseClient(),
}))

import { GET } from '@/app/api/share/access/route'

describe('GET /api/share/access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when token is missing', async () => {
    const response = await GET(new Request('http://localhost/api/share/access'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Token is required')
  })

  it('returns document details when share token exists', async () => {
    const adminClient = {
      from: jest.fn((table: string) => {
        if (table === 'document_shares') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    document_id: 'doc-123',
                    permission: 'edit',
                    invited_email: 'friend@example.com',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }

        if (table === 'documents') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'doc-123',
                    title: 'Shared doc',
                    content: '<p>Hello</p>',
                    updated_at: '2026-02-17T00:00:00.000Z',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }

        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    mockCreateAdminSupabaseClient.mockReturnValue(adminClient)

    const response = await GET(new Request('http://localhost/api/share/access?token=share-token-123'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.permission).toBe('edit')
    expect(body.invitedEmail).toBe('friend@example.com')
    expect(body.document.id).toBe('doc-123')
  })
})
