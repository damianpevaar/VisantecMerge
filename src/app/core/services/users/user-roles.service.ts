import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

export interface UpdateUserRoleRequest {
  userName: string; // really email
  roles: string[];
}

export interface RegisterUserRoleResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class UserRolesService {
  private readonly baseUrl = `${environment.ApiUrl}/UserRoles/update`;

  constructor(private http: HttpClient) {}

  updateUserRoles(request: UpdateUserRoleRequest): Observable<RegisterUserRoleResponse> {
    const payload = {
      userName: request.userName, // use email here
      roles: request.roles
    };

    return this.http.post<RegisterUserRoleResponse>(this.baseUrl, payload);
  }
}
