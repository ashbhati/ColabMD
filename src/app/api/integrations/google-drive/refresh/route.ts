import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  fetchGoogleDriveFileContent,
  fetchGoogleDriveFileMetadata,
  isMarkdownFilename,
  isMarkdownMimeType,
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
    const documentId = body?.documentId as string | undefined

    if (!documentId || typeof documentId !== 'string') {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    const { data: source, error: sourceError } = await supabase
      .from('document_sources')
      .select('*')
      .eq('document_id', documentId)
      .eq('provider', 'google_drive')
      .single()

    if (sourceError || !source) {
      return NextResponse.json({ error: 'No Google Drive source linked to this document' }, { status: 404 })
    }

    const metadata = await fetchGoogleDriveFileMetadata(source.external_file_id, accessToken)

    if (!isMarkdownMimeType(metadata.mimeType) && !isMarkdownFilename(metadata.name)) {
      return NextResponse.json(
        { error: 'Only markdown files are supported in Phase 1 (.md/.markdown or markdown mime type).' },
        { status: 400 }
      )
    }

    const unchanged = source.external_modified_time === metadata.modifiedTime
    if (unchanged && !body?.force) {
      return NextResponse.json({ ok: true, unchanged: true })
    }

    const markdown = await fetchGoogleDriveFileContent(source.external_file_id, accessToken)
    const html = markdownToHtml(markdown)

    const { error: updateDocError } = await supabase
      .from('documents')
      .update({
        content: html,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('owner_id', user.id)

    if (updateDocError) {
      return NextResponse.json({ error: 'Failed to update local document from source' }, { status: 500 })
    }

    const { error: updateSourceError } = await supabase
      .from('document_sources')
      .update({
        external_file_name: metadata.name,
        external_mime_type: metadata.mimeType,
        external_modified_time: metadata.modifiedTime,
        last_pulled_at: new Date().toISOString(),
      })
      .eq('id', source.id)

    if (updateSourceError) {
      console.error('Failed to update document source metadata:', updateSourceError)
    }

    return NextResponse.json({ ok: true, unchanged: false })
  } catch (error) {
    console.error('Error in POST /api/integrations/google-drive/refresh:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
