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
    input UpdateLibraryBookInput {
        totalQuantities: Int
        quantityAvailable: Int
    }
    "A book as stocked by one specific library — its own copy counts, distinct from the shared catalog Book.quantityAvailable"
    type LibraryBook {
        id: ID
        totalQuantities: Int
        quantityAvailable: Int
        book: Book
        library: Library
    }
    type Query {
        getBooksByLibrary(id: ID!): [LibraryBook!]!
    }
    type Mutation {
        addBookToLibrary(input: LibraryBookInput!): Response
        updateLibraryBook(id: ID!, input: UpdateLibraryBookInput!): LibraryBook
    }
`);