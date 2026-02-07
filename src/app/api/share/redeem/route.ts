import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

function getShareCookieName(documentId: string) {
  return `share_${documentId}`
}

// POST /api/share/redeem - Redeem a share token
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find the share by token
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select('document_id, permission')
      .eq('share_token', token)
      .single()

    if (shareError || !share) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    // Check if user already has access
    const { data: existingShare } = await supabase
      .from('document_shares')
      .select('id')
      .eq('document_id', share.document_id)
      .eq('user_id', user.id)
      .single()

    if (existingShare) {
      // User already has access, just return the document ID
      const response = NextResponse.json({ documentId: share.document_id, alreadyHasAccess: true })
      response.cookies.set(getShareCookieName(share.document_id), token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      return response
    }

    // Grant access based on the share link permission
    const { error: insertError } = await supabase
      .from('document_shares')
      .insert({
        id: uuidv4(),
        document_id: share.document_id,
        user_id: user.id,
        permission: share.permission,
      })

    if (insertError) {
      // RLS can block recipient-side inserts in some environments.
      // Keep redemption successful via token cookie fallback.
      console.warn('Share grant insert failed, using token fallback access:', insertError.message)
    }

    const response = NextResponse.json({
      documentId: share.document_id,
      granted: true,
      persisted: !insertError,
    })
    response.cookies.set(getShareCookieName(share.document_id), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    return response
  } catch (error) {
    console.error('Error in POST /api/share/redeem:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
