import { gql } from 'apollo-angular';

export const ROLES_QUERY = gql`
  query Roles($first: Int, $after: String) {
    roles(first: $first, after: $after) {
      totalCount
      nodes {
        id
        name
        normalizedName
        concurrencyStamp
      }
    }
  }
`;

export const CLIENT_ROLES_QUERY = gql`
  query ClientRoles($first: Int, $after: String) {
    clientRoles(first: $first, after: $after) {
      totalCount
      nodes {
        id
        name
        baseRoleId
        baseRoleName
        description
        clients {
          id
          name
        }
      }
    }
  }
`;

export const GET_USER_CLIENT_ROLES = gql`
  query GetUserClientRoles ($first: Int, $after: String) {
    userClientRoles (first: $first, after: $after) {
      totalCount
      nodes {
        id
        userId
        clientRoleId
        clientRoleName
      }
    }
  }
`;
