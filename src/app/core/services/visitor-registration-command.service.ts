import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateVisitorRegistrationInput, UpdateVisitorRegistrationInput } from '../domain/visitor-registrations/visitor-registration-commands';
import { VisitorRegistration } from '../domain/visitor-registrations/visitor-registration';

@Injectable({ providedIn: 'root' })
export class VisitorRegistrationCommandService {

    private readonly baseUrl = `${environment.ApiUrl}/VisitorRegistrations`;

    constructor(private readonly _httpClient: HttpClient) { }

    createRegistration(payload: CreateVisitorRegistrationInput): Observable<VisitorRegistration> {
        return this._httpClient.post<VisitorRegistration>(this.baseUrl, this.mapPayload(payload));
    }

    updateRegistration(id: string, payload: UpdateVisitorRegistrationInput): Observable<VisitorRegistration> {
        return this._httpClient.put<VisitorRegistration>(`${this.baseUrl}/${id}`, this.mapPayload(payload));
    }

    deleteRegistration(id: string): Observable<void> {
        return this._httpClient.delete<void>(`${this.baseUrl}/${id}`);
    }

    private mapPayload(payload: CreateVisitorRegistrationInput | UpdateVisitorRegistrationInput) {
        return {
            documentType: payload.documentType,
            documentNumber: payload.documentNumber,
            fullName: payload.fullName,
            hostName: payload.hostName ?? null,
            company: payload.company ?? null,
            email: payload.email ?? null,
            phoneNumber: payload.phoneNumber ?? null,
            entryMode: payload.entryMode,
            timeSlot: payload.timeSlot ?? null,
            visitStart: payload.visitStart ?? null,
            visitEnd: payload.visitEnd ?? null,
            licensePlate: payload.licensePlate ?? null,
            notes: payload.notes ?? null,
            status: payload.status
        };
    }
}
