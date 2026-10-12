import gql from "graphql-tag";

export const orderTypeDefs = gql`
  enum OrderStatus {
    Borrowed
    Returned
    Purchased
    Cancelled
  }

  type Order {
    id: ID
    book: Book
    library: Library
    user: User
    transactions: [Transaction]
    current_status: OrderStatus
    expectedReturnDate: Date
    createdAt: Date
    updatedAt: Date
  }

  input PlaceOrderInput {
    bookId: ID!
    libraryId: ID!
    transactionType: TransactionType!
    expectedReturnDate: Date
  }

  input UpdateOrderInput {
    id: ID!
    transactionType: TransactionType!
    expectedReturnDate: Date
  }

  type PaymentIntentResponse {
    clientSecret: String!
    amount: Int!
    currency: String!
  }

  enum PaymentStatus {
    Pending
    Paid
    Failed
  }

  "Server-side outcome of a Stripe payment, as recorded by the webhook"
  type PaymentStatusResponse {
    paymentIntentId: String!
    paymentStatus: PaymentStatus!
    orderId: ID
    orderStatus: OrderStatus
    bookName: String
  }

  type Query {
    getOrders: [Order!]!
    getOrder(id: ID!): Order
    "Orders placed against the library owned by the current user"
    getLibraryOrders: [Order!]!
    "Polled by the checkout success page until the webhook settles the payment"
    getPaymentStatus(paymentIntentId: String!): PaymentStatusResponse!
  }

  type Mutation {
    returnOrder(input: [UpdateOrderInput]!): [Order]!
    createPaymentIntent(input: PlaceOrderInput!): PaymentIntentResponse!
  }
`;
