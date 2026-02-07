import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// GET /api/documents/[id]/share - Get shares for a document
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only document owner can view shares
    const { data: document } = await adminSupabase
      .from('documents')
      .select()
      .eq('id', id)
      .single()

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only owner can view shares' }, { status: 403 })
    }

    const { data: shares, error } = await adminSupabase
      .from('document_shares')
      .select('*')
      .eq('document_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
    }

    const userIds = (shares || [])
      .map((share) => share.user_id)
      .filter((userId): userId is string => !!userId)

    let profileById: Record<string, { email: string; display_name: string | null; avatar_url: string | null }> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id, email, display_name, avatar_url')
        .in('id', userIds)

      if (profiles) {
        profileById = profiles.reduce((acc, profile) => {
          acc[profile.id] = {
            email: profile.email,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          }
          return acc
        }, {} as Record<string, { email: string; display_name: string | null; avatar_url: string | null }>)
      }
    }

    const enrichedShares = (shares || []).map((share) => ({
      ...share,
      profiles: share.user_id ? profileById[share.user_id] ?? null : null,
    }))

    return NextResponse.json(enrichedShares)
  } catch (error) {
    console.error('Error in GET /api/documents/[id]/share:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/documents/[id]/share - Create a new share
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only document owner can create shares
    const { data: document } = await adminSupabase
      .from('documents')
      .select()
      .eq('id', id)
      .single()

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only owner can share document' }, { status: 403 })
    }

    const body = await request.json()
    const { email, permission, type } = body

    if (!permission || !['view', 'edit', 'comment'].includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission' }, { status: 400 })
    }

    // Link sharing
    if (type === 'link') {
      const shareToken = uuidv4()

      const { data, error } = await adminSupabase
        .from('document_shares')
        .insert({
          id: uuidv4(),
          document_id: id,
          share_token: shareToken,
          permission,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
      }

      return NextResponse.json({
        ...data,
        share_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/share/${shareToken}`,
      }, { status: 201 })
    }

    // Email sharing
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Email is required for user sharing' }, { status: 400 })
    }

    // Find user by email
    const { data: targetUser } = await adminSupabase
      .from('profiles')
      .select()
      .ilike('email', normalizedEmail)
      .maybeSingle()

    if (!targetUser) {
      const shareToken = uuidv4()
      const { data, error } = await adminSupabase
        .from('document_shares')
        .insert({
          id: uuidv4(),
          document_id: id,
          share_token: shareToken,
          permission,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to create share invite' }, { status: 500 })
      }

      return NextResponse.json({
        ...data,
        pending_invite_email: normalizedEmail,
        share_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/share/${shareToken}`,
      }, { status: 201 })
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 })
    }

    // Check if share already exists
    const { data: existingShare } = await adminSupabase
      .from('document_shares')
      .select()
      .eq('document_id', id)
      .eq('user_id', targetUser.id)
      .maybeSingle()

    if (existingShare) {
      // Update existing share
      const { data, error } = await adminSupabase
        .from('document_shares')
        .update({ permission })
        .eq('id', existingShare.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to update share' }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Create new share
    const { data, error } = await adminSupabase
      .from('document_shares')
      .insert({
        id: uuidv4(),
        document_id: id,
        user_id: targetUser.id,
        permission,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create share' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/documents/[id]/share:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/documents/[id]/share - Remove a share
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()
    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('shareId')

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    // Only document owner can remove shares
    const { data: document } = await adminSupabase
      .from('documents')
      .select()
      .eq('id', id)
      .single()

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only owner can remove shares' }, { status: 403 })
    }

    const { error } = await adminSupabase
      .from('document_shares')
      .delete()
      .eq('id', shareId)
      .eq('document_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to remove share' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/documents/[id]/share:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
