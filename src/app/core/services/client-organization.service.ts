import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClientOrganization } from '../domain/tickets/client-organization';

export interface UpsertOrganizationInput {
    name: string;
    taxId?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClientOrganizationService {

    private readonly baseUrl = `${environment.ApiUrl}/ClientOrganizations`;

    constructor(private readonly _http: HttpClient) { }

    createOrganization(payload: UpsertOrganizationInput): Observable<ClientOrganization> {
        return this._http.post<ClientOrganization>(this.baseUrl, payload);
    }

    updateOrganization(id: string, payload: UpsertOrganizationInput): Observable<ClientOrganization> {
        return this._http.put<ClientOrganization>(`${this.baseUrl}/${id}`, payload);
    }

    deleteOrganization(id: string): Observable<void> {
        return this._http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
