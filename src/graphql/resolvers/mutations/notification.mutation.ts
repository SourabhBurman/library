import { GraphQLError } from "graphql";
import { notificationRepository } from "../../../config/db.connection";
import { requireAuth } from "../../../util/auth";

export const notificationMutation = {
  markNotificationRead: async (_, args: { id: string }, context: any) => {
    const user = requireAuth(context);
    const notification = await notificationRepository.findOne({
      where: { id: args.id },
      relations: ["user"],
    });
    if (!notification) {
      throw new GraphQLError("Notification not found");
    }
    if (notification.user.id !== user.id) {
      throw new GraphQLError("You are not authorized to view this notification");
    }
    notification.isRead = true;
    return notificationRepository.save(notification);
  },

  markAllNotificationsRead: async (_, __, context: any) => {
    const user = requireAuth(context);
    await notificationRepository.update(
      { user: { id: user.id }, isRead: false },
      { isRead: true },
    );
    return { message: "All notifications marked as read", success: true };
  },
};
