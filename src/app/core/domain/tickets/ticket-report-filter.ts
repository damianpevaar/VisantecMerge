import { TicketOrigin } from '../../enums/ticket-origin';
import { TicketStatus } from '../../enums/ticket-status';

export interface TicketReportFilter {
    from?: string | null;
    to?: string | null;
    clientOrganizationId?: string | null;
    assignedToUserId?: string | null;
    status?: string | null;
    origin?: string | null;
}
