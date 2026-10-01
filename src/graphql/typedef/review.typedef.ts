import gql from "graphql-tag";

export const reviewTypeDef = gql`
  type Review {
    id: ID
    rating: Int
    comment: String
    user: User
    book: Book
    createdAt: Date
  }

  input CreateReviewInput {
    bookId: ID!
    rating: Int!
    comment: String
  }

  type Query {
    getReviewsForBook(bookId: ID!): [Review!]!
    "Admin-only: every review across the whole catalog, newest first"
    getAllReviews: [Review!]!
  }

  type Mutation {
    createReview(input: CreateReviewInput!): Review!
    deleteReview(id: ID!): Response
  }
`;
