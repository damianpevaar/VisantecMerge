import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ManagedMailbox } from '../domain/tickets/managed-mailbox';

export interface CreateMailboxInput {
    address: string;
    displayName?: string | null;
    description?: string | null;
    autoResponseEnabled: boolean;
    autoResponseTemplate?: string | null;
}

export interface UpdateMailboxInput {
    displayName?: string | null;
    description?: string | null;
    isActive: boolean;
    autoResponseEnabled: boolean;
    autoResponseTemplate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ManagedMailboxService {

    private readonly baseUrl = `${environment.ApiUrl}/ManagedMailboxes`;

    constructor(private readonly _http: HttpClient) { }

    createMailbox(payload: CreateMailboxInput): Observable<ManagedMailbox> {
        return this._http.post<ManagedMailbox>(this.baseUrl, payload);
    }

    updateMailbox(id: string, payload: UpdateMailboxInput): Observable<ManagedMailbox> {
        return this._http.put<ManagedMailbox>(`${this.baseUrl}/${id}`, payload);
    }

    deleteMailbox(id: string): Observable<void> {
        return this._http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
