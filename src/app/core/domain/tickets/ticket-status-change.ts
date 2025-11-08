import { TicketStatus } from '../../enums/ticket-status';

export interface TicketStatusChange {
    id: string;
    ticketId: string;
    fromStatus: TicketStatus;
    toStatus: TicketStatus;
    changedByUserId?: string | null;
    notes?: string | null;
    changedAt: string;
}
