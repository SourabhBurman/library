import gql from "graphql-tag";

export const orderTypeDefs = gql`
  enum OrderStatus {
    Borrowed
    Returned
    Purchased
  }

  type Order {
    id: ID
    book: Book
    library: Library
    transactions: [Transaction]
    current_status: OrderStatus
    expectedReturnDate: Date
    createdAt: Date
    updatedAt: Date
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

  type PaymentIntentResponse {
    razorpayOrderId: String!
    amount: Int!
    currency: String!
  }

  type Query {
    getOrders: [Order!]!
    getOrder(id: ID!): Order
  }

  type Mutation {
    placeOrder(input: [PlaceOrderInput]!): [Order]!
    returnOrder(input: [UpdateOrderInput]!): [Order]!
    createPaymentIntent(input: PlaceOrderInput!): PaymentIntentResponse!
  }
`;
