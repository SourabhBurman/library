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
    user: ReturnUser
    book: Book
    transactionType: TransactionType
    transactionDate: Date
    dueDate: Date
    quantity: Int
  }


  type Query {
    getTransactionsForOrder(orderId: ID!): [Transaction!]!
  }
`;