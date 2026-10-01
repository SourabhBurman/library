import { GraphQLError } from "graphql";
import { requireAuth, requireRole, requireSelfOrRole } from "./auth";
import { ROLE } from "../enums";

const contextWithUser = (user: any) => ({ user });

describe("requireAuth", () => {
  it("returns context.user when present", () => {
    const user = { id: 1 };
    expect(requireAuth(contextWithUser(user))).toBe(user);
  });

  it("throws UNAUTHENTICATED when there is no user", () => {
    expect(() => requireAuth({})).toThrow(GraphQLError);
    try {
      requireAuth({});
      fail("expected requireAuth to throw");
    } catch (error) {
      expect((error as GraphQLError).extensions?.code).toBe(
        "UNAUTHENTICATED",
      );
    }
  });
});

describe("requireRole", () => {
  it("allows a user whose role is in the allow-list", () => {
    const context = contextWithUser({ role: { type: ROLE.ADMIN } });
    expect(() => requireRole(context, ROLE.ADMIN)).not.toThrow();
  });

  it("rejects a user whose role isn't in the allow-list", () => {
    const context = contextWithUser({ role: { type: ROLE.READER } });
    expect(() => requireRole(context, ROLE.ADMIN)).toThrow(
      "Forbidden: you don't have permission to do this",
    );
  });
});

describe("requireSelfOrRole", () => {
  // Regression test for a real bug that shipped: the JWT decodes a
  // numeric user id (Postgres integer PK), but GraphQL ID arguments are
  // always strings. A strict `===` comparison silently rejected every
  // self-service request (e.g. a user editing their own profile) because
  // `1 === "1"` is false in JS. requireSelfOrRole must compare as strings.
  it("allows a user acting on their own id, even across number/string types", () => {
    const context = contextWithUser({ id: 1, role: { type: ROLE.READER } });
    expect(() => requireSelfOrRole(context, "1", ROLE.ADMIN)).not.toThrow();
  });

  it("allows a user with an allow-listed role acting on someone else", () => {
    const context = contextWithUser({ id: 1, role: { type: ROLE.ADMIN } });
    expect(() => requireSelfOrRole(context, "99", ROLE.ADMIN)).not.toThrow();
  });

  it("rejects a user with neither a matching id nor an allow-listed role", () => {
    const context = contextWithUser({ id: 1, role: { type: ROLE.READER } });
    expect(() => requireSelfOrRole(context, "99", ROLE.ADMIN)).toThrow(
      "Forbidden: you don't have permission to do this",
    );
  });
});
