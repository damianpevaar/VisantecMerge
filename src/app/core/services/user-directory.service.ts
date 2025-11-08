import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { USERS_QUERY } from '../graphQL/user-queries';
import { IUser } from '../domain/iuser';

interface UsersResponse {
    users: {
        nodes: IUser[];
        totalCount: number;
    };
}


@Injectable({ providedIn: 'root' })
export class UserDirectoryService {

    constructor(private readonly _apollo: Apollo) { }
    

    searchUsers(term: string = '', first: number = 25): Observable<IUser[]> {
        const where: any = {};

        if (term) {
            const contains = { contains: term };
            where.or = [
                { email: contains },
                { userName: contains }
            ];
        }

        return this._apollo.query<UsersResponse>({
            query: USERS_QUERY,
            variables: {
                first,
                after: null,
                where
            }
        }).pipe(map(result => result.data.users.nodes));
    }
}
