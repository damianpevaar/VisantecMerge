import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateClientRoleRequest {
  clientOrganizationId: string;
  name: string;
  RoleId?: string | null;
  baseRoleName?: string | null;
  description?: string | null;
}

export interface ClientRoleResponse {
  id: string;
  clientOrganizationId: string;
  name: string;
  RoleId?: string | null;
  baseRoleName?: string | null;
  description?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientRolesService {
  // baseUrl points to the controller root for ClientRoles endpoints
  private readonly baseUrl = `${environment.ApiUrl}/ClientRoles`;

  constructor(private readonly http: HttpClient) {}

  // POST /ClientRoles/create
  createClientRole(request: CreateClientRoleRequest): Observable<ClientRoleResponse> {
    const url = `${this.baseUrl}/create`;
    return this.http.post<ClientRoleResponse>(url, {
      clientOrganizationId: request.clientOrganizationId,
      name: request.name,
      RoleId: request.RoleId ?? null,
      baseRoleName: request.baseRoleName ?? null,
      description: request.description ?? null
    });
  }

  // GET /ClientRoles/{clientId}
  getRolesByClient(clientId: string): Observable<ClientRoleResponse[]> {
    const url = `${this.baseUrl}/${clientId}`;
    return this.http.get<ClientRoleResponse[]>(url);
  }

  // (opcional) endpoint para borrar si lo implementas en backend
  deleteClientRole(roleId: string): Observable<void> {
    const url = `${this.baseUrl}/${roleId}`;
    return this.http.delete<void>(url);
  }
}