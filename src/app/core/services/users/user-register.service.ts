import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IUser } from '../../domain/iuser';

export interface RegisterUserInput {
    userName: string;
    email: string;
    roles: string[];
    password?: string;
    isActive?: boolean;
}

@Injectable({ providedIn: 'root' })

export class UserRegisterService {

    private readonly baseUrl = `${environment.ApiUrl}/Users/Register`;
    
    constructor(private readonly _http: HttpClient) { }

    registerUser(payload: RegisterUserInput): Observable<IUser> {
        return this._http.post<IUser>(this.baseUrl, payload);
    }
}