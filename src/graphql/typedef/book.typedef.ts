import gql from "graphql-tag";

export const bookTypeDef = gql`
  enum Genre {
    Horror
    Romance
    Fantasy
    Mystery
    Other
  }

  enum BookFields {
    name
    id
    genre
    cost
    rentPrice
    publishedDate
  }

  enum OperatorFields {
    Eq
    In
    Like
    Gt
    Gte
    Lt
    Lte
  }

  input BookInput {
    name: String!
    description: String
    genre: Genre
    totalQuantities: Int
    cost: Float
    rentPrice: Float
  }

  input updateBookInput {
    name: String
    description: String
    genre: Genre
    quantityAvailable: Int
    totalQuantities: Int
    cost: Float
    rentPrice: Float
    publishedDate: Date
  }

  input BookPaginationInput {
    pageNumber: Int
    pageSize: Int
  }

  input BookFilterInput {
    and: [BookFilterInput!]
    or: [BookFilterInput!]
    field: BookFields
    operator: OperatorFields
    value: String
  }

  type Book {
    id: ID
    name: String
    description: String
    genre: Genre
    quantityAvailable: Int
    totalQuantities: Int
    cost: Float
    rentPrice: Float
    publishedDate: Date
  }

  type Query {
    "A curated array of listings to feature on the homepage"
    getBooks(pagination: BookPaginationInput, filter: BookFilterInput): [Book!]!
    getBook(id: ID!): Book
  }
  type Mutation {
    createBook(input: BookInput!): Book!
    updateBook(id: ID!, input: updateBookInput!): Book
  }
`;
