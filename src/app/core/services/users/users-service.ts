import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { HttpClient } from '@angular/common/http';
import { USERS_QUERY, GetUsersVariables } from '../../graphQL/user-queries';
import { IGetUsersResponse } from '../../domain/users/iget-users-response';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private _apollo: Apollo, private _http: HttpClient) { }

  getUsers(variables: GetUsersVariables) {
    return this._apollo.watchQuery<IGetUsersResponse, GetUsersVariables>({
      query: USERS_QUERY,
      variables: variables,
      fetchPolicy: 'network-only'
    });
  }

  updateUser(id: string, input: any) {
    const url = `${environment.ApiUrl}/UserManagement/Update/${id}`;
    return this._http.put<any>(url, input);
  }
}
