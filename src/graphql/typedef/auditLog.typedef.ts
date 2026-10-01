import gql from "graphql-tag";

export const auditLogTypeDef = gql`
  type AuditLog {
    id: ID
    actorEmail: String
    action: String
    targetType: String
    targetId: String
    details: String
    createdAt: Date
  }

  type Query {
    "Admin-only: recent audit log entries, newest first"
    getAuditLogs: [AuditLog!]!
  }
`;
