import { gql } from 'apollo-angular';

export const VISITOR_REGISTRATIONS_QUERY = gql`
  query VisitorRegistrations($first: Int, $after: String, $where: VisitorRegistrationFilterInput, $order: [VisitorRegistrationSortInput!]) {
    visitorRegistrations(first: $first, after: $after, where: $where, order: $order) {
      nodes {
        id
        documentType
        documentNumber
        fullName
        hostName
        company
        email
        phoneNumber
        entryMode
        timeSlot
        visitStart
        visitEnd
        licensePlate
        notes
        status
        created
        createdBy
        lastModified
        lastModifiedBy
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const VISITOR_REGISTRATION_BY_ID_QUERY = gql`
  query VisitorRegistrationById($id: UUID!) {
    visitorRegistrationById(id: $id) {
      id
      documentType
      documentNumber
      fullName
      hostName
      company
      email
      phoneNumber
      entryMode
      timeSlot
      visitStart
      visitEnd
      licensePlate
      notes
      status
      created
      createdBy
      lastModified
      lastModifiedBy
    }
  }
`;
