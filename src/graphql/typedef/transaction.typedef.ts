import gql from "graphql-tag";

export const transactionTypeDef = gql`
  scalar Date

  enum TransactionType {
    Borrow
    Return
    Publish
    Purchase
  }

  type ReturnUser {
    id: ID
    name: String
    email: String
    gender: GENDER
    role: Role
  }

  type Transaction {
    id: ID
    order: Order
    transactionType: TransactionType
    transactionDate: Date
    amount: Int
    paymentStatus: String
    razorpayOrderId: String
    razorpayPaymentId: String
    createdAt: Date
  }


  type Query {
    getTransactionsForOrder(orderId: ID!): [Transaction!]!
  }
`;