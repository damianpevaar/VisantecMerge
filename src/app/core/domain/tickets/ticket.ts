import { TicketPriority } from '../../enums/ticket-priority';
import { TicketStatus } from '../../enums/ticket-status';
import { TicketOrigin } from '../../enums/ticket-origin';
import { TicketMessage } from './ticket-message';
import { TicketAttachment } from './ticket-attachment';
import { TicketStatusChange } from './ticket-status-change';
import { ClientOrganization } from './client-organization';
import { ManagedMailbox } from './managed-mailbox';

export interface Ticket {
    id: string;
    ticketNumber: string;
    subject: string;
    description?: string | null;
    status: TicketStatus;
    priority: TicketPriority;
    origin: TicketOrigin;
    requestedByEmail: string;
    requestedByName?: string | null;
    clientOrganizationId?: string | null;
    clientOrganization?: ClientOrganization | null;
    managedMailboxId?: string | null;
    managedMailbox?: ManagedMailbox | null;
    assignedToUserId?: string | null;
    openedAt: string;
    assignedAt?: string | null;
    closedAt?: string | null;
    autoResponseSentAt?: string | null;
    slaDueAt?: string | null;
    resolutionSummary?: string | null;
    messages: TicketMessage[];
    attachments: TicketAttachment[];
    statusHistory: TicketStatusChange[];
}
