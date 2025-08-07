import gql from "graphql-tag";

export const UserTypeDef = gql`
  enum GENDER {
    Male
    Female
    Other
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    gender: GENDER
  }

  input UpdateUserInput {
    name: String
    password: String
    gender: GENDER
    role: ID
    balance: Float
  }

  type User {
    id: ID
    name: String
    email: String
    gender: GENDER
    role: Role
    accessToken: String
    refreshToken: String
    booksBorrowed: [Transaction!]
    booksPublished: [Transaction!]
    booksPurchased: [Transaction!]
    balance: Float
  }

  type Query {
    getUsers: [User!]
    getUser(id: ID!): User
  }

  type Mutation {
    updateUser(id: ID!, input: UpdateUserInput!): User
    deleteUser(id: ID!): Response
  }
`;
