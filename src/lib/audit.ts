import { Json } from '@/types/database'

export type AuditEventType =
  | 'drive_import'
  | 'drive_import_failed'
  | 'drive_refresh_preview'
  | 'drive_refresh_applied'
  | 'drive_refresh_failed'

interface LogAuditEventInput {
  supabase: {
    from: (table: string) => {
      insert: (value: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>
    }
  }
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
