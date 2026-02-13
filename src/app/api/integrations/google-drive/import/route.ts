import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { parseGoogleDriveFileRef } from '@/lib/google-drive'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const fileRef = parseGoogleDriveFileRef({
      fileUrl: body?.fileUrl,
      fileId: body?.fileId,
    })

    if (!fileRef) {
      return NextResponse.json({
        error: 'Invalid Google Drive file reference. Provide a valid fileUrl or fileId.',
      }, { status: 400 })
    }

    // Phase 1 scaffold: endpoint shape + validation done.
    // Next step: wire Google Drive token retrieval + file metadata/content fetch.
    return NextResponse.json({
      ok: false,
      phase: 'scaffold',
      message: 'Google Drive markdown import is not fully implemented yet.',
      fileId: fileRef.fileId,
    }, { status: 501 })
  } catch (error) {
    console.error('Error in POST /api/integrations/google-drive/import:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
