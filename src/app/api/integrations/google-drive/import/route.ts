import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  fetchGoogleDriveFileContent,
  fetchGoogleDriveFileMetadata,
  isMarkdownFilename,
  isMarkdownMimeType,
  parseGoogleDriveFileRef,
} from '@/lib/google-drive'
import { markdownToHtml } from '@/lib/markdown'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const accessToken = session?.provider_token
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google session token not found. Please sign in with Google again.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const fileRef = parseGoogleDriveFileRef({
      fileUrl: body?.fileUrl,
      fileId: body?.fileId,
    })

    if (!fileRef) {
      return NextResponse.json(
        {
          error: 'Invalid Google Drive file reference. Provide a valid fileUrl or fileId.',
        },
        { status: 400 }
      )
    }

    const metadata = await fetchGoogleDriveFileMetadata(fileRef.fileId, accessToken)

    if (!isMarkdownMimeType(metadata.mimeType) && !isMarkdownFilename(metadata.name)) {
      return NextResponse.json(
        {
          error: 'Only markdown files are supported in Phase 1 (.md/.markdown or markdown mime type).',
        },
        { status: 400 }
      )
    }

    const markdown = await fetchGoogleDriveFileContent(fileRef.fileId, accessToken)
    const html = markdownToHtml(markdown)
    const title = body?.title?.trim() || metadata.name.replace(/\.[^.]+$/, '') || 'Imported Markdown'

    const docId = uuidv4()

    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        id: docId,
        title,
        content: html,
        owner_id: user.id,
      })
      .select()
      .single()

    if (docError || !document) {
      console.error('Failed to create imported document:', docError)
      return NextResponse.json({ error: 'Failed to create imported document' }, { status: 500 })
    }

    const { error: sourceError } = await supabase.from('document_sources').upsert(
      {
        document_id: document.id,
        provider: 'google_drive',
        external_file_id: metadata.id,
        external_file_name: metadata.name,
        external_mime_type: metadata.mimeType,
        external_modified_time: metadata.modifiedTime,
        last_pulled_at: new Date().toISOString(),
        created_by: user.id,
      },
      { onConflict: 'document_id,provider' }
    )

    if (sourceError) {
      console.error('Failed to persist source metadata:', sourceError)
      return NextResponse.json({ error: 'Document created, but failed to store source link' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      documentId: document.id,
      title: document.title,
      source: {
        provider: 'google_drive',
        fileId: metadata.id,
        name: metadata.name,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/integrations/google-drive/import:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
