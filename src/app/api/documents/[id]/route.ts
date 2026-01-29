import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isValidUUID, sanitizeTitle, isValidContentSize } from '@/lib/validation'
import { NextResponse } from 'next/server'

interface DocumentRow {
  id: string
  title: string
  content: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

interface ShareRow {
  id: string
  document_id: string
  user_id: string | null
  share_token: string | null
  permission: 'view' | 'edit' | 'comment'
  created_at: string
}

// GET /api/documents/[id] - Get a specific document
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the document or has access via share
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const document = data as DocumentRow

    // Check ownership or share permission
    if (document.owner_id !== user.id) {
      const { data: shareData } = await supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', id)
        .eq('user_id', user.id)
        .single()

      if (!shareData) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error in GET /api/documents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/documents/[id] - Update a document
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has edit permission
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !docData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const document = docData as DocumentRow
    let canEdit = document.owner_id === user.id

    if (!canEdit) {
      const { data: shareData } = await supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', id)
        .eq('user_id', user.id)
        .single()

      const share = shareData as ShareRow | null
      canEdit = share?.permission === 'edit'
    }

    if (!canEdit) {
      return NextResponse.json({ error: 'Edit access denied' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Partial<DocumentRow> = {}

    if (body.title !== undefined) updates.title = sanitizeTitle(body.title)
    if (body.content !== undefined) {
      if (!isValidContentSize(body.content)) {
        return NextResponse.json({ error: 'Content too large (max 10MB)' }, { status: 400 })
      }
      updates.content = body.content
    }
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating document:', error)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/documents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner can delete
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !docData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const document = docData as DocumentRow

    if (document.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only owner can delete document' }, { status: 403 })
    }

    // Delete shares first
    await supabase
      .from('document_shares')
      .delete()
      .eq('document_id', id)

    // Delete document
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting document:', error)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/documents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
