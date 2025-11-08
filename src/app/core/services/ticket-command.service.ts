import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssignTicketInput, CreateTicketInput, ReplyToTicketInput, TicketAttachmentInput, UpdateTicketInput } from '../domain/tickets/ticket-commands';
import { TicketResponse } from '../domain/tickets/ticket-response';

@Injectable({ providedIn: 'root' })
export class TicketCommandService {

    private readonly baseUrl = `${environment.ApiUrl}/Tickets`;

    constructor(private readonly _httpClient: HttpClient) { }

    createTicket(payload: CreateTicketInput): Observable<TicketResponse> {
        return this._httpClient.post<TicketResponse>(this.baseUrl, {
            subject: payload.subject,
            description: payload.description,
            clientOrganizationId: payload.clientOrganizationId ?? null,
            priority: payload.priority,
            requestedByEmail: payload.requestedByEmail,
            requestedByName: payload.requestedByName ?? null,
            attachments: payload.attachments.map(this.mapAttachment)
        });
    }

    updateTicket(id: string, payload: UpdateTicketInput): Observable<TicketResponse> {
        return this._httpClient.put<TicketResponse>(`${this.baseUrl}/${id}`, {
            subject: payload.subject,
            description: payload.description ?? null,
            priority: payload.priority,
            status: payload.status,
            clientOrganizationId: payload.clientOrganizationId ?? null,
            resolutionSummary: payload.resolutionSummary ?? null
        });
    }

    assignTicket(id: string, payload: AssignTicketInput): Observable<TicketResponse> {
        return this._httpClient.post<TicketResponse>(`${this.baseUrl}/${id}/assign`, payload);
    }

    replyToTicket(id: string, payload: ReplyToTicketInput): Observable<void> {
        return this._httpClient.post<void>(`${this.baseUrl}/${id}/reply`, {
            message: payload.message,
            isInternal: payload.isInternal,
            attachments: payload.attachments.map(this.mapAttachment)
        });
    }

    deleteTicket(id: string): Observable<void> {
        return this._httpClient.delete<void>(`${this.baseUrl}/${id}`);
    }

    private mapAttachment(attachment: TicketAttachmentInput) {
        return {
            fileName: attachment.fileName,
            contentType: attachment.contentType,
            fileSize: attachment.fileSize,
            base64Data: attachment.base64Data,
            storagePath: attachment.storagePath ?? null
        };
    }
}
