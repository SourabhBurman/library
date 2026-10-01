import gql from "graphql-tag";

export const savedBookTypeDef = gql`
  type SavedBook {
    id: ID
    book: Book
    createdAt: Date
  }

  type Query {
    "The current user's own saved / want-to-read books"
    getSavedBooks: [SavedBook!]!
  }

  type Mutation {
    saveBook(bookId: ID!): SavedBook!
    unsaveBook(bookId: ID!): Response
  }
`;
