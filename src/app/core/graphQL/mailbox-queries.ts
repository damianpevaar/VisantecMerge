import { gql } from 'apollo-angular';

export const MANAGED_MAILBOXES_QUERY = gql`
  query ManagedMailboxes {
    managedMailboxes {
      nodes {
        id
        address
        displayName
        description
        isActive
        autoResponseEnabled
        autoResponseTemplate
      }
      totalCount
    }
  }
`;
