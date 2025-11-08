import { gql } from 'apollo-angular';

export const TICKETS_QUERY = gql`
  query Tickets($first: Int, $after: String, $where: TicketFilterInput, $order: [TicketSortInput!]) {
    tickets(first: $first, after: $after, where: $where, order: $order) {
      nodes {
        id
        ticketNumber
        subject
        description
        status
        priority
        origin
        requestedByEmail
        requestedByName
        clientOrganizationId
        clientOrganization {
          id
          name
          contactEmail
          contactPhone
          isActive
        }
        managedMailboxId
        managedMailbox {
          id
          address
          displayName
          autoResponseEnabled
          autoResponseTemplate
        }
        assignedToUserId
        openedAt
        assignedAt
        closedAt
        autoResponseSentAt
        slaDueAt
        resolutionSummary
        attachments {
          id
          fileName
          contentType
          fileSize
          storagePath
        }
        messages {
          id
          ticketId
          direction
          origin
          sentAt
          authorUserId
          externalAuthor
          externalMessageId
          isAutoResponse
          body
          attachments {
            id
            fileName
            contentType
            fileSize
            storagePath
            content
          }
        }
        statusHistory {
          id
          fromStatus
          toStatus
          changedAt
          changedByUserId
          notes
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const TICKET_BY_ID_QUERY = gql`
  query TicketById($id: UUID!) {
    ticketByIdAsync(id: $id) {
      id
      ticketNumber
      subject
      description
      status
      priority
      origin
      requestedByEmail
      requestedByName
      clientOrganizationId
      clientOrganization {
        id
        name
        contactEmail
        contactPhone
        isActive
      }
      managedMailboxId
      managedMailbox {
        id
        address
        displayName
        autoResponseEnabled
        autoResponseTemplate
      }
      assignedToUserId
      openedAt
      assignedAt
      closedAt
      autoResponseSentAt
      slaDueAt
      resolutionSummary
      attachments {
        id
        fileName
        contentType
        fileSize
        storagePath
        content
      }
      messages {
        id
        ticketId
        direction
        origin
        sentAt
        authorUserId
        externalAuthor
        externalMessageId
        isAutoResponse
        body
        attachments {
          id
          fileName
          contentType
          fileSize
          storagePath
          content
        }
      }
      statusHistory {
        id
        fromStatus
        toStatus
        changedAt
        changedByUserId
        notes
      }
    }
  }
`;

export const OVERDUE_TICKETS_QUERY = gql`
  query OverdueTickets($first: Int) {
    overdueTickets(first: $first) {
      nodes {
        id
        ticketNumber
        subject
        status
        priority
        requestedByEmail
        clientOrganization {
          id
          name
        }
        slaDueAt
        openedAt
      }
      totalCount
    }
  }
`;

