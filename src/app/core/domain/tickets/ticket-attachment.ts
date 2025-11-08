export interface TicketAttachment {
    id?: string;
    fileName: string;
    contentType: string;
    fileSize?: number;
    content?: string | null;
    storagePath?: string | null;
    checksum?: string | null;
}
