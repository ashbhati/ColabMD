import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sanitizeTitle, isValidContentSize } from '@/lib/validation'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// GET /api/documents - List user's documents
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get documents owned by user or shared with user
    const { data: ownedDocs, error: ownedError } = await supabase
      .from('documents')
      .select('*, profiles!documents_owner_id_fkey(display_name, avatar_url)')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })

    if (ownedError) {
      console.error('Error fetching owned documents:', ownedError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get documents shared with user
    const { data: sharedDocs, error: sharedError } = await supabase
      .from('document_shares')
      .select('document_id, permission, documents(*, profiles!documents_owner_id_fkey(display_name, avatar_url))')
      .eq('user_id', user.id)

    if (sharedError) {
      console.error('Error fetching shared documents:', sharedError)
    }

    const sharedDocuments = sharedDocs?.map(share => ({
      ...share.documents,
      shared_permission: share.permission,
    })) || []

    return NextResponse.json({
      owned: ownedDocs || [],
      shared: sharedDocuments,
    })
  } catch (error) {
    console.error('Error in GET /api/documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/documents - Create a new document
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = sanitizeTitle(body.title)
    const content = body.content || ''

    // Validate content size
    if (!isValidContentSize(content)) {
      return NextResponse.json({ error: 'Content too large (max 10MB)' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        id: uuidv4(),
        title,
        content,
        owner_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating document:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
