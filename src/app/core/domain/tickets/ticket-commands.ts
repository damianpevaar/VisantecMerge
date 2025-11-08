import { TicketPriority } from '../../enums/ticket-priority';
import { TicketStatus } from '../../enums/ticket-status';
import { TicketAttachment } from './ticket-attachment';

export interface TicketAttachmentInput {
    fileName: string;
    contentType: string;
    fileSize?: number;
    base64Data?: string;
    storagePath?: string | null;
}

export interface CreateTicketInput {
    subject: string;
    description: string;
    clientOrganizationId?: string | null;
    priority: TicketPriority;
    requestedByEmail: string;
    requestedByName?: string | null;
    attachments: TicketAttachmentInput[];
}

export interface UpdateTicketInput {
    subject: string;
    description?: string | null;
    priority: TicketPriority;
    status: TicketStatus;
    clientOrganizationId?: string | null;
    resolutionSummary?: string | null;
}

export interface AssignTicketInput {
    assignedToUserId: string;
}

export interface ReplyToTicketInput {
    message: string;
    isInternal: boolean;
    attachments: TicketAttachmentInput[];
}

export function mapAttachmentToInput(attachment: TicketAttachment): TicketAttachmentInput {
    return {
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        fileSize: attachment.fileSize,
        storagePath: attachment.storagePath ?? null
    };
}
