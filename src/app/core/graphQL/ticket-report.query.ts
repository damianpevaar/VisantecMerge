import { gql } from 'apollo-angular';

export const TICKET_SUMMARY_QUERY = gql`
  query TicketSummary($filter: TicketReportFilterInput) {
    ticketSummary(filter: $filter) {
      totalTickets
      overdueTickets
      ticketsByStatus { key value }
      ticketsByOrigin { key value }
      ticketsByAssignee { key value }
      ticketsByClient { key value }
    }
  }
`;
