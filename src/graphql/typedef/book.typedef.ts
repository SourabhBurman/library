import gql from "graphql-tag";

export const bookTypeDef = gql`
  enum Genre {
    Horror
    Romance
    Fantasy
    Mystery
    Other
  }

  input BookInput {
    name: String!
    description: String
    genre: Genre
    author: ID
  }

  type Book {
    id: ID!
    name: String!
    description: String
    genre: Genre
    # readers: [Reader]
  }

  type Query {
    "A curated array of listings to feature on the homepage"
    booksListing: [Book!]!
  }
  type Mutation {
    createBook(input: BookInput!): Book!
  }
`;
