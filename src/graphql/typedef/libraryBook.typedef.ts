import gql from "graphql-tag";

export const libraryBookTypeDefs = gql(`
    type Response {
        success: Boolean
        message: String
    }
    type Query {
        getBooksByLibrary(id: ID!): [Book!]!
    }
    type Mutation {
        addBookToLibrary(id: ID!, input: LibraryInput!): Response
    }
`);