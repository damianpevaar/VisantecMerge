import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs';
import { ROLES_QUERY } from '../graphQL/role-queries';

@Injectable({ providedIn: 'root' })
export class RolesService {
  constructor(private _apollo: Apollo) {}

  getRoles(first: number = 100) {
    return this._apollo.query<any>({
      query: ROLES_QUERY,
      variables: { first, after: null },
      fetchPolicy: 'network-only'
    }).pipe(
      map(res => res?.data?.roles?.nodes ?? [])
    );
  }
}
