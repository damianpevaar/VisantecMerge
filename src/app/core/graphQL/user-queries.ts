import { gql } from 'apollo-angular';
import { IGraphQLFilter } from '../application/igraph-qlfilter';

export interface GetUsersVariables extends IGraphQLFilter {
}

export const USERS_QUERY = gql`
  query Users($first: Int, $after: String, $where: ApplicationUserFilterInput) {
    users(first: $first, after: $after, where: $where) {
      nodes {
        id
        userName
        email
        phoneNumber      
        status {
          isActive
        }
        roles
      }
    }
  }
`;