import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { redis } from "./redis";
import { logger } from "../util/logger";

const NOTIFICATIONS_CHANNEL = "notifications";

let io: SocketIOServer | null = null;

/**
 * Unlike GraphQL requests, a socket connection is long-lived — the browser
 * opens it once (on login) and keeps it open, and the server pushes
 * events down it whenever something happens, instead of the browser
 * having to ask ("poll") again and again. Real use case here: the
 * waitlist notifications this app already creates (see util/waitlist.ts)
 * used to only show up on the next 30s poll (DashboardShell.tsx) — this
 * makes them appear the instant they're created instead.
 *
 * Attaches to the SAME underlying http.Server as Express (not a second
 * port) — see app.ts, which now creates that server explicitly with
 * `createServer(app)` instead of the old implicit `app.listen(...)`.
 */
export const initSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Socket.io's handshake is a plain HTTP request, but it happens *before*
  // Express's own middleware chain (cookie-parser, the GraphQL context
  // function, etc.) ever runs — those only apply to requests Express
  // itself routes. So the accessToken cookie is parsed and verified here,
  // by hand, the same way app.ts's GraphQL context function does it.
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const match = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
      if (!match) {
        return next(new Error("Unauthorized: no access token"));
      }
      const decoded = jwt.verify(
        decodeURIComponent(match[1]),
        process.env.JWT_SECRET as string,
      ) as { id: string | number };

      // The number-vs-string ID mismatch bug already bit this exact "id
      // from a JWT" value once elsewhere in this codebase (see
      // util/auth.ts) — coercing to a string here, once, means every room
      // name this server ever builds or looks up is guaranteed consistent
      // regardless of whether the JWT's `id` happens to be a JS number or
      // a string.
      socket.data.userId = String(decoded.id);
      next();
    } catch (error) {
      next(new Error("Unauthorized: invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const room = `user:${socket.data.userId}`;
    socket.join(room);
    logger.info({ userId: socket.data.userId, socketId: socket.id }, "Socket connected");

    socket.on("disconnect", () => {
      logger.info(
        { userId: socket.data.userId, socketId: socket.id },
        "Socket disconnected",
      );
    });
  });

  // ioredis connections that call .subscribe() enter a special mode where
  // they can ONLY be used for pub/sub from then on — issuing a normal
  // command (GET/SET/SCAN) on that same connection would error. So this
  // gets its own connection (`.duplicate()`), completely separate from the
  // `redis` client used for caching/rate-limiting elsewhere in the app.
  //
  // This is also *why* pub/sub is the bridge at all, not a direct
  // function call: util/waitlist.ts's actual notification-creating code
  // runs inside workers/waitlistWorker.ts — a different OS process that
  // has no access to this `io` instance. Publishing a message is the only
  // way for that process to reach a browser socket connected to *this*
  // one.
  const subscriber = redis.duplicate();
  subscriber.subscribe(NOTIFICATIONS_CHANNEL, (error) => {
    if (error) {
      logger.error({ err: error }, "Failed to subscribe to notifications channel");
    }
  });
  subscriber.on("message", (channel, message) => {
    if (channel !== NOTIFICATIONS_CHANNEL) return;
    try {
      // `event`/`payload` come from util/notify.ts. The older
      // `{ userId, notification }` shape is still accepted so a worker
      // process running an older build keeps delivering during a deploy.
      const { userId, event, payload, notification } = JSON.parse(message);
      io?.to(`user:${String(userId)}`).emit(
        event ?? "notification",
        payload ?? notification,
      );
    } catch (error) {
      logger.error({ err: error }, "Failed to relay pushed notification");
    }
  });

  logger.info("Socket.io initialized");
  return io;
};
