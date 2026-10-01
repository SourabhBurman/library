/**
 * Integration test: exercises the real savedBook resolvers against a real
 * Postgres database (library_test) — unlike the pricing/auth unit tests,
 * this verifies the actual SQL, the TypeORM relations, and the unique
 * (user, book) index actually behave the way the resolver code assumes.
 *
 * Setup/teardown (connecting, truncating between tests) lives in
 * src/test/integrationSetup.ts, wired in via jest.config.js.
 */
import { userRepository, bookRepository, savedBookRepository } from "../../../config/db.connection";
import { savedBookMutation } from "./savedBook.mutation";
import { savedBookQueries } from "../queries/savedBook.queries";
import { GraphQLError } from "graphql";

const makeUser = () =>
  userRepository.save(
    userRepository.create({
      name: "Test User",
      email: `test-${Date.now()}-${Math.random()}@example.com`,
      password: "not-a-real-hash",
    }),
  );

const makeBook = () =>
  bookRepository.save(bookRepository.create({ name: "Test Book" }));

describe("savedBook resolvers (integration)", () => {
  it("saves a book for the user and shows up in getSavedBooks", async () => {
    const user = await makeUser();
    const book = await makeBook();
    const context = { user: { id: user.id } };

    const saved = await savedBookMutation.saveBook(
      null,
      { bookId: String(book.id) },
      context,
    );
    expect(saved.book.id).toBe(book.id);

    const list = await savedBookQueries.getSavedBooks(null, null, context);
    expect(list).toHaveLength(1);
    expect(list[0].book.id).toBe(book.id);
  });

  it("saving the same book twice doesn't create a duplicate row", async () => {
    const user = await makeUser();
    const book = await makeBook();
    const context = { user: { id: user.id } };

    await savedBookMutation.saveBook(null, { bookId: String(book.id) }, context);
    await savedBookMutation.saveBook(null, { bookId: String(book.id) }, context);

    const rows = await savedBookRepository.find({
      where: { user: { id: user.id }, book: { id: book.id } },
    });
    expect(rows).toHaveLength(1);
  });

  it("unsaveBook removes it, and errors if it wasn't saved", async () => {
    const user = await makeUser();
    const book = await makeBook();
    const context = { user: { id: user.id } };

    await savedBookMutation.saveBook(null, { bookId: String(book.id) }, context);
    const result = await savedBookMutation.unsaveBook(
      null,
      { bookId: String(book.id) },
      context,
    );
    expect(result.success).toBe(true);

    const list = await savedBookQueries.getSavedBooks(null, null, context);
    expect(list).toHaveLength(0);

    await expect(
      savedBookMutation.unsaveBook(null, { bookId: String(book.id) }, context),
    ).rejects.toThrow(GraphQLError);
  });

  it("keeps each user's saved list separate", async () => {
    const [userA, userB] = await Promise.all([makeUser(), makeUser()]);
    const book = await makeBook();

    await savedBookMutation.saveBook(
      null,
      { bookId: String(book.id) },
      { user: { id: userA.id } },
    );

    const listA = await savedBookQueries.getSavedBooks(null, null, {
      user: { id: userA.id },
    });
    const listB = await savedBookQueries.getSavedBooks(null, null, {
      user: { id: userB.id },
    });
    expect(listA).toHaveLength(1);
    expect(listB).toHaveLength(0);
  });

  it("requires authentication", async () => {
    await expect(
      savedBookQueries.getSavedBooks(null, null, {}),
    ).rejects.toThrow(GraphQLError);
  });
});
