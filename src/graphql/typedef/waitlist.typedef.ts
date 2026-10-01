import gql from "graphql-tag";

export const waitlistTypeDef = gql`
  type Waitlist {
    id: ID
    book: Book
    createdAt: Date
  }

  type Query {
    "The current user's own waitlist entries"
    getMyWaitlist: [Waitlist!]!
  }

  type Mutation {
    joinWaitlist(bookId: ID!): Waitlist!
    leaveWaitlist(bookId: ID!): Response
  }
`;
