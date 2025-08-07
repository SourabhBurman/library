import gql from "graphql-tag";

export const roleTypeDef = gql`
  enum USER_ROLES {
    Admin
    Reader
    Author
  }
  type Role {
    id: ID
    role: USER_ROLES
    displayName: String
  }

  type RoleWithPermissions {
    id: ID
    role: USER_ROLES
    displayName: String
    permissions: [Permission!]
  }

  input Id {
    id: ID!
  }

  input RoleInput {
    role: USER_ROLES!
    displayName: String!
    permissions: [Id!]
  }

  type Query {
    getRoles: [Role!]!
    getRole(id: ID!): RoleWithPermissions
  }
  type Mutation {
    createRole(input: RoleInput!): Role
    updateRole(id: ID!, input: RoleInput!): Role
    deleteRole(id: ID!): Response
  }
`;
