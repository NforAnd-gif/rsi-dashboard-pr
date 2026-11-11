import { AuditLog } from '../models';

interface AuditLogInput {
    user_id?: number | null;
    action: string;
    target_table: string;
    target_id?: number | null;
    metadata?: Record<string, unknown> | null;
}

export async function writeAuditLog(
    data: AuditLogInput
): Promise<void> {
    try {
        await AuditLog.create({
            user_id: data.user_id ?? null,
            action: data.action,
            target_table: data.target_table,
            target_id: data.target_id ?? null,
            metadata: data.metadata
                ? JSON.stringify(data.metadata)
                : null,
            created_at: new Date()
        });
    } catch (error) {
        console.error('Gagal menyimpan audit log:', error);
    }
}