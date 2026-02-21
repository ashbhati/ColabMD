import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { sanitizeTitle, isValidContentSize } from '@/lib/validation'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

interface ListDocument {
  id: string
  title: string
  updated_at: string
  owner_id?: string
  profiles?: unknown
  shared_permission?: 'view' | 'edit' | 'comment'
}

function buildPrivateCacheHeaders(maxAgeSeconds: number) {
  return {
    'Cache-Control': `private, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 3}`,
  }
}

function toListDocument(doc: Record<string, unknown>): ListDocument {
  const out: ListDocument = {
    id: String(doc.id ?? ''),
    title: String(doc.title ?? 'Untitled'),
    updated_at: String(doc.updated_at ?? new Date().toISOString()),
  }

  if (typeof doc.owner_id === 'string') out.owner_id = doc.owner_id
  if (doc.profiles !== undefined) out.profiles = doc.profiles

  return out
}

// GET /api/documents - List user's documents
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

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

    // Get documents shared with user.
    // Use admin client to avoid RLS edge cases where shared rows exist
    // but are not visible through user-scoped policies.
    const { data: sharedDocs, error: sharedError } = await adminSupabase
      .from('document_shares')
      .select('document_id, permission, documents(*, profiles!documents_owner_id_fkey(display_name, avatar_url))')
      .eq('user_id', user.id)

    if (sharedError) {
      console.error('Error fetching shared documents:', sharedError)
    }

    // Intentionally keep payload lean for dashboard listing responses.
    const ownedDocuments: ListDocument[] = (ownedDocs || []).map((doc) =>
      toListDocument(doc as unknown as Record<string, unknown>)
    )

    const sharedDocuments: ListDocument[] = (sharedDocs || [])
      .map(share => {
        const doc = share.documents as Record<string, unknown> | null
        if (!doc) return null
        return {
          ...toListDocument(doc),
          shared_permission: share.permission,
        }
      })
      .filter((doc): doc is ListDocument => !!doc && !!doc.id)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    const response = NextResponse.json({
      owned: ownedDocuments,
      shared: sharedDocuments,
    })
    Object.entries(buildPrivateCacheHeaders(20)).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
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
