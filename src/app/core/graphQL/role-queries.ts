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
