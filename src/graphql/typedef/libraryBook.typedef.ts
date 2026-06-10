import gql from "graphql-tag";

export const libraryBookTypeDefs = gql(`
    type Response {
        success: Boolean
        message: String
    }
    input BookQuantityInput {
        bookId: ID!
        quantity: Int!
    }
    input LibraryBookInput {
        books: [BookQuantityInput!]
        library: ID!
        isAll: Boolean
        quantityForIsAll: Int
    }
    type Query {
        getBooksByLibrary(id: ID!): [Book!]!
    }
    type Mutation {
        addBookToLibrary(input: LibraryBookInput!): Response
    }
`);