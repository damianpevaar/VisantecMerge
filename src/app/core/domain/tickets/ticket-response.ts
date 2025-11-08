import { TicketPriority } from '../../enums/ticket-priority';
import { TicketStatus } from '../../enums/ticket-status';

export interface TicketResponse {
    ticketId: string;
    ticketNumber: string;
    status: TicketStatus;
    priority: TicketPriority;
}
