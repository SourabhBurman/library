import { waitlistRepository } from "../../../config/db.connection";
import { requireAuth } from "../../../util/auth";

export const waitlistQueries = {
  getMyWaitlist: async (_, __, context: any) => {
    const user = requireAuth(context);
    return waitlistRepository.find({
      where: { user: { id: user.id } },
      relations: ["book"],
      order: { createdAt: "DESC" },
    });
  },
};
