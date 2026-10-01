import { notificationRepository } from "../../../config/db.connection";
import { requireAuth } from "../../../util/auth";

export const notificationQueries = {
  getNotifications: async (_, __, context: any) => {
    const user = requireAuth(context);
    return notificationRepository.find({
      where: { user: { id: user.id } },
      relations: ["order"],
      order: { createdAt: "DESC" },
    });
  },

  getUnreadNotificationCount: async (_, __, context: any) => {
    const user = requireAuth(context);
    return notificationRepository.count({
      where: { user: { id: user.id }, isRead: false },
    });
  },
};
