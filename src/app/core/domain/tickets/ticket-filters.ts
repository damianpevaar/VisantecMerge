import { TicketOrigin } from '../../enums/ticket-origin';
import { TicketPriority } from '../../enums/ticket-priority';
import { TicketStatus } from '../../enums/ticket-status';

export interface TicketListFilters {
    search?: string;
    status?: TicketStatus | string | null;
    priority?: TicketPriority | string | null;
    origin?: TicketOrigin | string | null;
    clientOrganizationId?: string | null;
    assignedToUserId?: string | null;
    from?: string | null;
    to?: string | null;
}
