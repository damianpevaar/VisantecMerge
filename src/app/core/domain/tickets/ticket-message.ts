import { TicketAttachment } from './ticket-attachment';
import { TicketMessageDirection } from '../../enums/ticket-message-direction';
import { TicketOrigin } from '../../enums/ticket-origin';

export interface TicketMessage {
    id: string;
    ticketId: string;
    body: string;
    sentAt: string;
    direction: TicketMessageDirection;
    origin: TicketOrigin;
    authorUserId?: string | null;
    externalAuthor?: string | null;
    externalMessageId?: string | null;
    isAutoResponse: boolean;
    attachments: TicketAttachment[];
}
