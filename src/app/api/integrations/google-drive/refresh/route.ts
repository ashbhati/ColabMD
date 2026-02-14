import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  fetchGoogleDriveFileContent,
  fetchGoogleDriveFileMetadata,
  isMarkdownFilename,
  isMarkdownMimeType,
} from '@/lib/google-drive'
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown'
import { buildLineDiffPreview } from '@/lib/diff'
import { logAuditEvent } from '@/lib/audit'

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
    const { data: currentDocument } = await supabase
      .from('documents')
      .select('content')
      .eq('id', documentId)
      .eq('owner_id', user.id)
      .maybeSingle()

    const currentMarkdown = htmlToMarkdown(currentDocument?.content || '')
    const diffPreview = buildLineDiffPreview(currentMarkdown, markdown)
    const contentChanged = diffPreview.added + diffPreview.removed + diffPreview.changed > 0

    if (!body?.force) {
      await logAuditEvent({
        supabase,
        actorId: user.id,
        documentId,
        eventType: 'drive_refresh_preview',
        metadata: {
          sourceModifiedTime: metadata.modifiedTime,
          unchanged,
          contentChanged,
          diffSummary: {
            added: diffPreview.added,
            removed: diffPreview.removed,
            changed: diffPreview.changed,
          },
        },
      })

      return NextResponse.json({
        ok: true,
        unchanged: unchanged && !contentChanged,
        requiresConfirm: contentChanged,
        diffPreview,
      })
    }

    const { error: updateDocError } = await supabase
      .from('documents')
      .update({
        content: html,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('owner_id', user.id)

    if (updateDocError) {
      await logAuditEvent({
        supabase,
        actorId: user.id,
        documentId,
        eventType: 'drive_refresh_failed',
        metadata: {
          stage: 'document_update',
          message: updateDocError.message,
        },
      })
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

    await logAuditEvent({
      supabase,
      actorId: user.id,
      documentId,
      eventType: 'drive_refresh_applied',
      metadata: {
        sourceModifiedTime: metadata.modifiedTime,
        diffSummary: {
          added: diffPreview.added,
          removed: diffPreview.removed,
          changed: diffPreview.changed,
        },
      },
    })

    return NextResponse.json({ ok: true, unchanged: false, applied: true })
  } catch (error) {
    console.error('Error in POST /api/integrations/google-drive/refresh:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
