import { Query } from "typeorm/driver/Query";
import { bookQueries } from "./queries/book.queries";
import { bookMutation } from "./mutations/book.mutation";
import { authorMutation } from "./mutations/author.mutation";
// import { readerMutation } from "./mutations/reader.mutation";

export const resolvers = {
  Query: {
    ...bookQueries,
  },
  Mutation: {
    ...bookMutation,
    ...authorMutation,
    // ...readerMutation,
  },
};
