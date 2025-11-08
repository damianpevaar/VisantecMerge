import { gql } from 'apollo-angular';

export const CLIENT_ORGANIZATIONS_QUERY = gql`
  query ClientOrganizations($first: Int, $after: String, $where: ClientOrganizationFilterInput) {
    clientOrganizations(first: $first, after: $after, where: $where) {
      nodes {
        id
        name
        taxId
        contactEmail
        contactPhone
        isActive
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
