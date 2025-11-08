import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ILoginRequest } from '../application/ilogin-request';
import { ILoginResponse } from '../application/ilogin-response';
import { IUser } from '../domain/iuser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.ApiUrl;
  private refreshing = false;
  private refreshSubject = new BehaviorSubject<any>(null);
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly _httpClient: HttpClient) {
    this.loadCurrentUserFromStorage();
  }

  login(credentials: ILoginRequest) {
    return this._httpClient.post<ILoginResponse>(`${this.apiUrl}/Users/login`, credentials)
      .pipe(tap(res => this.storeTokens(res)));
  }

  refreshToken(): Observable<ILoginResponse> {
    if (this.refreshing) {
      return this.refreshSubject.asObservable();
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    this.refreshing = true;

    return this._httpClient.post<ILoginResponse>(`${this.apiUrl}/Users/refresh`, { refreshToken })
      .pipe(
        tap(res => {
          this.storeTokens(res);
          this.refreshing = false;
          this.refreshSubject.next(res);
        }),
        catchError(err => {
          this.logout();
          this.refreshing = false;
          return throwError(() => err);
        })
      );
  }

  private storeTokens(res: ILoginResponse) {
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('refresh_token', res.refreshToken);
    localStorage.setItem('access_token_expires_in', res.expiresIn.toString());
    // localStorage.setItem('refresh_token_expires_in', res.refreshTokenExpires.toString());
    
    // Calculate refresh token expiration manually using expiresIn (seconds)
    const expiresInMs = res.expiresIn * 1000;
    localStorage.setItem('refresh_token_expires_in', (Date.now() + expiresInMs).toString());

    // Fetch user info from backend instead of decoding token
    this.getUserInfoFromBackend().subscribe();
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getExpiresIn(): string | null {
    return localStorage.getItem('access_token_expires_in');
  }

  isAuthTokenExpired(): boolean {
    const at_expiresIn = localStorage.getItem('access_token_expires_in');
    if (at_expiresIn == null) return true;
    return Date.now() > Number(at_expiresIn);
  }

  isRefreshTokenExpired(): boolean {
    const rt_expiresIn = localStorage.getItem('refresh_token_expires_in');
    if (rt_expiresIn == null) return true;
    return Date.now() > Number(rt_expiresIn);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return (token != null && !this.isAuthTokenExpired()) || !this.isRefreshTokenExpired()
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access_token_expires_in');
    localStorage.removeItem('refresh_token_expires_in');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    window.location.href = '/login';
  }

  getCurrentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;
    return roles.some(role => user.roles.includes(role));
  }

  getUserId(): string | null {
    return this.getCurrentUser()?.id || null;
  }

  private loadCurrentUserFromStorage(): void {
    const userJson = localStorage.getItem('current_user');
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        this.currentUserSubject.next(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('current_user');
      }
    }
  }

  getUserInfoFromBackend(): Observable<IUser> {
    return this._httpClient.get<IUser>(`${this.apiUrl}/UserManagement/GetCurrentUserInfo`)
      .pipe(
        tap(userInfo => {
          localStorage.setItem('current_user', JSON.stringify(userInfo));
          this.currentUserSubject.next(userInfo);
        }),
        catchError(error => {
          console.error('Error fetching user info from backend:', error);
          return throwError(() => error);
        })
      );
  }

  // private extractUserDataFromToken(token: string): IUser | null {
  //   try {
  //     const payload = this.decodeJwtPayload(token);

  //     return {
  //       id: payload.sub || payload.userId || payload.id,
  //       userName: payload.username || payload.unique_name || payload.name,
  //       email: payload.email,
  //       roles: this.extractRolesFromPayload(payload)
  //     };
  //   } catch (error) {
  //     console.error('Error extracting user data from token:', error);
  //     return null;
  //   }
  // }

  // private decodeJwtPayload(token: string): any {
  //   const parts = token.split('.');
  //   if (parts.length !== 3) {
  //     throw new Error('Invalid JWT token format');
  //   }

  //   const payload = parts[1];
  //   const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  //   return JSON.parse(decodedPayload);
  // }

  // private extractRolesFromPayload(payload: any): string[] {
  //   const roles: string[] = [];

  //   if (payload.role) {
  //     if (Array.isArray(payload.role)) {
  //       roles.push(...payload.role);
  //     } else {
  //       roles.push(payload.role);
  //     }
  //   }

  //   if (payload.roles) {
  //     if (Array.isArray(payload.roles)) {
  //       roles.push(...payload.roles);
  //     } else {
  //       roles.push(payload.roles);
  //     }
  //   }

  //   if (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
  //     const msRoles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  //     if (Array.isArray(msRoles)) {
  //       roles.push(...msRoles);
  //     } else {
  //       roles.push(msRoles);
  //     }
  //   }

  //   return [...new Set(roles)];
  // }
}





