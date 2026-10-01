import { auditLogRepository } from "../../../config/db.connection";
import { ROLE } from "../../../enums";
import { requireRole } from "../../../util/auth";

export const auditLogQueries = {
  getAuditLogs: async (_, __, context: any) => {
    requireRole(context, ROLE.ADMIN);
    return auditLogRepository.find({
      order: { createdAt: "DESC" },
      take: 500,
    });
  },
};
