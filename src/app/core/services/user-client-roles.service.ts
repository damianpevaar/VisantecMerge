import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Apollo } from 'apollo-angular';
import { GET_USER_CLIENT_ROLES } from '../graphQL/role-queries';
import { map } from 'rxjs';

export interface CreateUserClientRoleRequest {
  userId: string;
  clientRoleId: string;
}

export interface UserClientRoleResponse {
  id: string;
  userId: string;
  clientRoleId: string;
  clientRoleName?: string;
}

@Injectable({ providedIn: 'root' })
export class UserClientRolesService {
  // ✅ Usa el mismo patrón que los demás servicios
  private readonly baseUrl = `${environment.ApiUrl}/UserClientRoles`;

  constructor(private http: HttpClient, private _apollo: Apollo) {}

  // GraphQL client: get all user-client-role nodes
  getAllUserClientRoles(first: number = 100) {
    // Use Apollo if available; if not, this method can be replaced by REST.
    // We'll lazy-inject Apollo via dynamic require to avoid adding it to ctor signature here.
    try {
      const apollo = this._apollo;
      return apollo.query<any>({ query: GET_USER_CLIENT_ROLES, variables: { first, after: null }, fetchPolicy: 'network-only' })
        .pipe(map(res => res?.data?.userClientRoles?.nodes ?? []));
    } catch (e) {
      return new Observable<any[]>(subscriber => { subscriber.next([]); subscriber.complete(); });
    }
  }

  /** Crea una asignación usuario ⇄ rol de cliente */
  create(data: CreateUserClientRoleRequest): Observable<UserClientRoleResponse> {
    // ✅ Llama correctamente al endpoint POST /UserClientRoles/create
    const url = `${this.baseUrl}/create`;
    return this.http.post<UserClientRoleResponse>(url, data);
  }

  /** Actualiza las asignaciones del usuario (PUT /UserClientRoles/{userId}) */
  updateByUser(userId: string, clientRoleIds: string[]): Observable<UserClientRoleResponse[]> {
    const url = `${this.baseUrl}/${userId}`;
    return this.http.put<UserClientRoleResponse[]>(url, { clientRoleIds });
  }
}
