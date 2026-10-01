import gql from "graphql-tag";

export const bookTypeDef = gql`
  scalar Date

  enum Genre {
    Horror
    Romance
    Fantasy
    SciFi
    Mystery
    Thriller
    Adventure
    Biography
    History
    SelfHelp
    Business
    Health
    Drama
    Finance
    Technology
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
    quantityAvailable: Int
    cost: Float
    rentPrice: Float
    author: String
    coverImage: String
    publishedDate: Date
  }

  input updateBookInput {
    name: String
    description: String
    genre: Genre
    quantityAvailable: Int
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
    genre: String
    quantityAvailable: Int
    cost: Float
    rentPrice: Float
    publishedDate: Date
    coverImage: String
    author: String
    reviews: [Review!]!
    averageRating: Float
    "Real, currently-borrowable stock: the sum of this book's quantityAvailable across every library that stocks it (unlike the quantityAvailable field above, which is just the unassigned shared pool)."
    totalAvailableCopies: Int
  }

  type Query {
    "A curated array of listings to feature on the homepage"
    getBooks(pagination: BookPaginationInput, filter: BookFilterInput): [Book!]!
    getBook(id: ID!): Book
  }
  type Mutation {
    createBook(input: BookInput!): Book!
    updateBook(id: ID!, input: updateBookInput!): Book
    deleteBook(id: ID!): Response
  }
`;
