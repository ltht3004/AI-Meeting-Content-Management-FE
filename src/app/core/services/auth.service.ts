import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  currentUser = signal<any>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiService.baseUrl}/auth/login`, credentials).pipe(
      tap(res => {
        this.setSession(res);
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiService.baseUrl}/auth/register`, userData);
  }

  verifyEmail(data: { email: string; code: string }): Observable<any> {
    return this.http.post<any>(`${this.apiService.baseUrl}/auth/verify-email`, data).pipe(
      tap(res => {
        this.setSession(res);
      })
    );
  }

  resendVerification(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiService.baseUrl}/auth/resend-verification`, { email });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiService.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(data: { email: string; reset_code: string; new_password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiService.baseUrl}/auth/reset-password`, data);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiService.baseUrl}/profile/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  getProfileStats(): Observable<any> {
    return this.http.get<any>(`${this.apiService.baseUrl}/profile/me/stats`);
  }

  updateProfile(profileData: { full_name: string; email: string; phone?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiService.baseUrl}/profile/me`, profileData).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiService.baseUrl}/profile/me/avatar`, formData).pipe(
      tap(res => {
        const user = this.currentUser();
        if (user) {
          user.avatar_url = res.avatar_url;
          this.currentUser.set({ ...user });
          localStorage.setItem('user', JSON.stringify(user));
        }
      })
    );
  }

  removeAvatar(): Observable<any> {
    return this.http.delete<any>(`${this.apiService.baseUrl}/profile/me/avatar`).pipe(
      tap(res => {
        const user = this.currentUser();
        if (user) {
          user.avatar_url = null;
          this.currentUser.set({ ...user });
          localStorage.setItem('user', JSON.stringify(user));
        }
      })
    );
  }

  logout() {
    this.clearSession();
    window.location.href = '/auth/login';
  }

  private setSession(res: any) {
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('role', res.user.role);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
  }

  private clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}
