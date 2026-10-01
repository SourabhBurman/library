import { auditLogRepository } from "../config/db.connection";

/**
 * Best-effort audit log write — never throws, so a logging failure can
 * never break the actual mutation it's recording. `context` is the
 * resolver's GraphQL context (carries the decoded JWT user).
 */
export const logAudit = async (
  context: any,
  action: string,
  targetType: string,
  targetId?: string | null,
  details?: Record<string, unknown>,
) => {
  try {
    await auditLogRepository.save({
      actorId: context?.user?.id ? String(context.user.id) : null,
      actorEmail: context?.user?.email ?? "unknown",
      action,
      targetType,
      targetId: targetId ?? null,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
