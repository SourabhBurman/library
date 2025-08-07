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

  input TransactionInput {
    book: ID!
    transactionType: TransactionType!
    quantity: Int!
  }

  type Query {
    getTransactions: [Transaction!]!
    getTransaction(id: ID!): Transaction
  }

  type Mutation {
    createTransaction(input: [TransactionInput]!): [Transaction]!
    updateTransaction(id: ID!, input: [TransactionInput]!): [Transaction]!
    deleteTransaction(id: ID!): Response!
  }
`;
