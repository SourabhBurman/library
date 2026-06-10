import gql from "graphql-tag";

export const orderTypeDefs = gql`
  type Order {
    id: ID
    user: User
    book: Book
    transactionType: TransactionType
    transactionDate: Date
    expectedReturnDate: Date
  }

  input PlaceOrderInput {
    book: ID!
    library: ID!
    transactionType: TransactionType!
    expectedReturnDate: Date
  }

  input UpdateOrderInput {
    id: ID!
    transactionType: TransactionType!
    expectedReturnDate: Date
  }

  type Query {
    getOrders: [Order!]!
    getOrder(id: ID!): Order
  }

  type Mutation {
    placeOrder(input: [PlaceOrderInput]!): [Order]!
    returnOrder(input: [UpdateOrderInput]!): [Order]!
  }
`;
