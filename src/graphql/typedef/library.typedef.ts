import gql from "graphql-tag";

export const libraryTypeDefs = gql(`
    type Library {
        id: ID
        name: String
        address: String
        balance: Int
    }

    input LibraryInput {
        name: String!
        address: String!
    }

     type Query {
        getLibraries: [Library!]
        getLibraryById(id: ID!): Library
    }

    type Mutation {
        createLibrary(input: LibraryInput!): Library
        deleteLibrary(id: ID!): Library
        updateLibrary(id: ID!, input: LibraryInput!): Library
    }
`);