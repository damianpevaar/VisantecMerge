import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ 
    providedIn: 'root' 
})

export class UserStatusService {

  constructor(private _apollo: Apollo, private _http: HttpClient) { }

  // Update only the status (isActive) of a user
  updateStatus(email: string, isActive: boolean) {
    const url = `${environment.ApiUrl}/UserStatusManagement/UpdateUserStatus/${email}`;
    return this._http.put<any>(url, { isActive });
  }

  // Create initial status entry for a newly created user (uses email and isActive)
  createStatus(email: string, isActive: boolean) {
    const url = `${environment.ApiUrl}/UserStatusManagement/create`;
    return this._http.post<any>(url, { email, isActive });
  }
}
