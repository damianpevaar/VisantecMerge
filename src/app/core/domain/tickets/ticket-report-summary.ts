export interface TicketReportSummary {
    totalTickets: number;
    overdueTickets: number;
    ticketsByStatus: Array<{ key: string; value: number }>;
    ticketsByOrigin: Array<{ key: string; value: number }>;
    ticketsByAssignee: Array<{ key: string; value: number }>;
    ticketsByClient: Array<{ key: string; value: number }>;
}

    // ticketsByStatus: Record<string, number>;