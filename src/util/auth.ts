import { GraphQLError } from "graphql";
import { ROLE } from "../enums";

/**
 * Throws if the request isn't authenticated. In practice the Apollo context
 * function already rejects any request without a valid session cookie
 * before a resolver ever runs, so this mostly documents the assumption and
 * narrows `context.user` for callers — but keep it since resolvers shouldn't
 * rely on that upstream behavior never changing.
 */
export function requireAuth(context: any) {
  if (!context?.user) {
    throw new GraphQLError("Unauthorized", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return context.user;
}

/** Throws unless the current user has one of the given roles. */
export function requireRole(context: any, ...roles: ROLE[]) {
  const user = requireAuth(context);
  if (!roles.includes(user.role?.type)) {
    throw new GraphQLError(
      "Forbidden: you don't have permission to do this",
      { extensions: { code: "FORBIDDEN" } },
    );
  }
  return user;
}

/** Throws unless the current user is the given id, or has one of the given roles. */
export function requireSelfOrRole(
  context: any,
  targetUserId: string,
  ...roles: ROLE[]
) {
  const user = requireAuth(context);
  // `user.id` comes off the JWT as whatever type the DB driver returned
  // (a number, for our integer primary keys), while `targetUserId` is a
  // GraphQL ID argument, which always arrives as a string — compare as
  // strings so a genuine self-request isn't rejected as "someone else".
  if (
    String(user.id) === String(targetUserId) ||
    roles.includes(user.role?.type)
  ) {
    return user;
  }
  throw new GraphQLError("Forbidden: you don't have permission to do this", {
    extensions: { code: "FORBIDDEN" },
  });
}
