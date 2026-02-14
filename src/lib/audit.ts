import { SupabaseClient } from '@supabase/supabase-js'
import { Database, Json } from '@/types/database'

export type AuditEventType =
  | 'drive_import'
  | 'drive_import_failed'
  | 'drive_refresh_preview'
  | 'drive_refresh_applied'
  | 'drive_refresh_failed'

interface LogAuditEventInput {
  supabase: Pick<SupabaseClient<Database>, 'from'>
  actorId: string
  eventType: AuditEventType
  documentId?: string | null
  metadata?: Json
}

export async function logAuditEvent({
  supabase,
  actorId,
  eventType,
  documentId = null,
  metadata = {},
}: LogAuditEventInput): Promise<void> {
  const { error } = await supabase.from('document_audit_events').insert({
    document_id: documentId,
    actor_id: actorId,
    event_type: eventType,
    metadata,
  })

  if (error) {
    console.warn('Failed to write audit event:', error.message || error)
  }
}
