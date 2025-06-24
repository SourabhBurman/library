import gql from "graphql-tag";

export const authorTypeDef = gql`
  input ids {
    id: ID!
  }

  input AuthorInput {
    name: String!
    email: String
    age: Int
    books: [ids]
  }

  type Author {
    id: ID!
    name: String!
    email: String
    age: Int
    books: [Book]
  }

  type Mutation {
    addAuthor(input: AuthorInput!): Author!
  }
`;
