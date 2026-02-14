import { POST as importPost } from '@/app/api/integrations/google-drive/import/route'
import { POST as refreshPost } from '@/app/api/integrations/google-drive/refresh/route'

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/google-drive', () => ({
  parseGoogleDriveFileRef: jest.fn(),
  fetchGoogleDriveFileMetadata: jest.fn(),
  fetchGoogleDriveFileContent: jest.fn(),
  isMarkdownFilename: jest.fn(),
  isMarkdownMimeType: jest.fn(),
}))

jest.mock('@/lib/markdown', () => ({
  markdownToHtml: jest.fn((s: string) => `<p>${s}</p>`),
}))

jest.mock('uuid', () => ({
  v4: jest.fn(() => '11111111-1111-4111-8111-111111111111'),
}))

import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  fetchGoogleDriveFileContent,
  fetchGoogleDriveFileMetadata,
  isMarkdownFilename,
  isMarkdownMimeType,
  parseGoogleDriveFileRef,
} from '@/lib/google-drive'

describe('google drive integration routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/integrations/google-drive/import', () => {
    it('returns 401 if unauthenticated', async () => {
      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Unauthorized' } }),
          getSession: jest.fn(),
        },
      })

      const req = new Request('http://localhost/api/integrations/google-drive/import', {
        method: 'POST',
        body: JSON.stringify({ fileUrl: 'https://drive.google.com/file/d/abc/view' }),
      })

      const res = await importPost(req)
      expect(res.status).toBe(401)
    })

    it('rolls back document when source upsert fails', async () => {
      ;(parseGoogleDriveFileRef as jest.Mock).mockReturnValue({ fileId: 'file-123' })
      ;(fetchGoogleDriveFileMetadata as jest.Mock).mockResolvedValue({
        id: 'file-123',
        name: 'notes.md',
        mimeType: 'text/markdown',
        modifiedTime: '2026-02-14T00:00:00Z',
      })
      ;(fetchGoogleDriveFileContent as jest.Mock).mockResolvedValue('# hello')
      ;(isMarkdownMimeType as jest.Mock).mockReturnValue(true)
      ;(isMarkdownFilename as jest.Mock).mockReturnValue(true)

      const deleteEq = jest.fn().mockReturnThis()
      const deleteBuilder = { eq: deleteEq }
      const documentInsertSingle = jest.fn().mockResolvedValue({
        data: { id: 'doc-1', title: 'notes', owner_id: 'user-1' },
        error: null,
      })

      const documentsBuilder = {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({ single: documentInsertSingle }),
        }),
        delete: jest.fn().mockReturnValue(deleteBuilder),
      }

      const sourceBuilder = {
        upsert: jest.fn().mockResolvedValue({ error: { message: 'boom' } }),
      }

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
          getSession: jest.fn().mockResolvedValue({ data: { session: { provider_token: 'token' } } }),
        },
        from: jest.fn((table: string) => {
          if (table === 'documents') return documentsBuilder
          if (table === 'document_sources') return sourceBuilder
          return {}
        }),
      })

      const req = new Request('http://localhost/api/integrations/google-drive/import', {
        method: 'POST',
        body: JSON.stringify({ fileUrl: 'https://drive.google.com/file/d/file-123/view' }),
      })

      const res = await importPost(req)
      const json = await res.json()

      expect(res.status).toBe(500)
      expect(json.error).toContain('Failed to store source link')
      expect(documentsBuilder.delete).toHaveBeenCalled()
      expect(deleteEq).toHaveBeenCalledWith('id', 'doc-1')
      expect(deleteEq).toHaveBeenCalledWith('owner_id', 'user-1')
    })
  })

  describe('POST /api/integrations/google-drive/refresh', () => {
    it('returns unchanged=true when modifiedTime did not change', async () => {
      ;(fetchGoogleDriveFileMetadata as jest.Mock).mockResolvedValue({
        id: 'file-123',
        name: 'notes.md',
        mimeType: 'text/markdown',
        modifiedTime: '2026-02-14T00:00:00Z',
      })
      ;(isMarkdownMimeType as jest.Mock).mockReturnValue(true)
      ;(isMarkdownFilename as jest.Mock).mockReturnValue(true)

      const sourceSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'src-1',
          document_id: 'doc-1',
          provider: 'google_drive',
          external_file_id: 'file-123',
          external_modified_time: '2026-02-14T00:00:00Z',
        },
        error: null,
      })

      const sourceSelectEq2 = { single: sourceSingle }
      const sourceSelectEq1 = { eq: jest.fn().mockReturnValue(sourceSelectEq2) }
      const sourceBuilder = {
        select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue(sourceSelectEq1) }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      }

      ;(createServerSupabaseClient as jest.Mock).mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
          getSession: jest.fn().mockResolvedValue({ data: { session: { provider_token: 'token' } } }),
        },
        from: jest.fn((table: string) => {
          if (table === 'document_sources') return sourceBuilder
          if (table === 'documents') {
            return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn() }) }) }
          }
          return {}
        }),
      })

      const req = new Request('http://localhost/api/integrations/google-drive/refresh', {
        method: 'POST',
        body: JSON.stringify({ documentId: 'doc-1' }),
      })

      const res = await refreshPost(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual({ ok: true, unchanged: true })
      expect(fetchGoogleDriveFileContent).not.toHaveBeenCalled()
    })
  })
})
