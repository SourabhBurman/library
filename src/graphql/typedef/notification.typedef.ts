import gql from "graphql-tag";

export const notificationTypeDef = gql`
  enum NotificationType {
    DueSoon
    Overdue
    OrderUpdate
    General
  }

  type Notification {
    id: ID
    type: NotificationType
    message: String
    isRead: Boolean
    order: Order
    createdAt: Date
  }

  type Query {
    "The current user's own notifications, newest first"
    getNotifications: [Notification!]!
    getUnreadNotificationCount: Int!
  }

  type Mutation {
    markNotificationRead(id: ID!): Notification
    markAllNotificationsRead: Response
  }
`;
