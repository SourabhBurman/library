import gql from "graphql-tag";

export const permissionTypeDef = gql`
  type Permission {
    id: ID
    name: String
    description: String
  }

  type Response {
    message: String
    success: Boolean
  }

  input PermissionInput {
    name: String!
    description: String
  }

  type Query {
    getPermissions: [Permission!]!
    getPermission(id: ID!): Permission
  }

  type Mutation {
    createPermission(input: PermissionInput!): Permission!
    updatePermission(id: ID!, input: PermissionInput!): Permission!
    deletePermission(id: ID!): Response!
  }
`;
