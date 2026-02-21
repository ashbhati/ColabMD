import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/share/access?token=... - Access shared document info without requiring an account
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select('document_id, permission, invited_email')
      .eq('share_token', token)
      .single()

    if (shareError || !share) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title, content, updated_at')
      .eq('id', share.document_id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const response = NextResponse.json({
      document,
      permission: share.permission,
      invitedEmail: share.invited_email,
    })
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error('Error in GET /api/share/access:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
