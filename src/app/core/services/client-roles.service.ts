import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateClientRoleRequest {
  clientOrganizationIds: string[];
  name: string;
  baseRoleId?: string | null;
  baseRoleName?: string | null;
  description?: string | null;
}

export interface ClientOrganizationSummary {
  id: string;
  name: string;
}

export interface ClientRoleResponse {
  id: string;
  name: string;
  baseRoleId?: string | null;
  baseRoleName?: string | null;
  description?: string | null;
  clients: ClientOrganizationSummary[];
}

@Injectable({ providedIn: 'root' })
export class ClientRolesService {
  private readonly baseUrl = `${environment.ApiUrl}/ClientRoles`;

  constructor(private readonly http: HttpClient) {}

  // POST /ClientRoles/create
  createClientRole(request: CreateClientRoleRequest): Observable<ClientRoleResponse> {
    const url = `${this.baseUrl}/create`;
    return this.http.post<ClientRoleResponse>(url, {
      clientOrganizationIds: request.clientOrganizationIds,
      name: request.name,
      baseRoleId: request.baseRoleId ?? null,
      baseRoleName: request.baseRoleName ?? null,
      description: request.description ?? null
    });
  }

  // PUT /ClientRoles/{roleId}
  updateClientRole(roleId: string, request: CreateClientRoleRequest): Observable<ClientRoleResponse> {
    const url = `${this.baseUrl}/${roleId}`;
    return this.http.put<ClientRoleResponse>(url, request);
  }

  // DELETE /ClientRoles/{roleId}
  deleteClientRole(roleId: string): Observable<void> {
    const url = `${this.baseUrl}/${roleId}`;
    return this.http.delete<void>(url);
  }
}
