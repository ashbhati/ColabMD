import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

function getShareCookieName(documentId: string) {
  return `share_${documentId}`
}

function permissionRank(permission: 'view' | 'comment' | 'edit') {
  if (permission === 'edit') return 3
  if (permission === 'comment') return 2
  return 1
}

// POST /api/share/redeem - Redeem a share token
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

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
    const { data: share, error: shareError } = await adminSupabase
      .from('document_shares')
      .select('document_id, permission, invited_email')
      .eq('share_token', token)
      .single()

    if (shareError || !share) {
      return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
    }

    const normalizedUserEmail = user.email?.toLowerCase() || ''
    if (share.invited_email && normalizedUserEmail !== share.invited_email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `This invite is restricted to ${share.invited_email}. Sign in with that Google account to continue.`,
        },
        { status: 403 }
      )
    }

    // Check if user already has access
    const { data: existingShare } = await adminSupabase
      .from('document_shares')
      .select('id, permission')
      .eq('document_id', share.document_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingShare) {
      if (permissionRank(share.permission) > permissionRank(existingShare.permission)) {
        await adminSupabase
          .from('document_shares')
          .update({ permission: share.permission })
          .eq('id', existingShare.id)
      }

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
    const { error: insertError } = await adminSupabase
      .from('document_shares')
      .insert({
        id: uuidv4(),
        document_id: share.document_id,
        user_id: user.id,
        permission: share.permission,
      })

    if (insertError) {
      // Keep redemption successful even if persistence fails due a race or duplicate row.
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
