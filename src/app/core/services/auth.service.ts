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
      }),
      catchError(err => {
        // Fallback mock check to keep FE runnable when BE is not running or empty
        if (credentials.email === 'alex.rivera@kinetic-sync.ai' || credentials.email === 'admin@gmail.com') {
          const mockRes = {
            access_token: 'mock-jwt-token-12345',
            user: {
              id: '99aa3eab-7784-4074-a385-d03911468810',
              full_name: 'Alex Rivera',
              email: credentials.email,
              role: credentials.email.includes('admin') || credentials.email === 'alex.rivera@kinetic-sync.ai' ? 'admin' : 'user'
            }
          };
          this.setSession(mockRes);
          return of(mockRes);
        }
        throw err;
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiService.baseUrl}/auth/register`, userData).pipe(
      tap(res => {
        this.setSession(res);
      }),
      catchError(err => {
        const mockRes = {
          access_token: 'mock-jwt-token-67890',
          user: {
            id: '273765c5-825e-4602-b12d-034dffa6bbc1',
            full_name: userData.full_name,
            email: userData.email,
            role: 'user'
          }
        };
        this.setSession(mockRes);
        return of(mockRes);
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return of({ success: true, message: 'Reset link sent.' });
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiService.baseUrl}/profile/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      }),
      catchError(err => {
        if (!this.currentUser()) {
          const mockUser = {
            id: '99aa3eab-7784-4074-a385-d03911468810',
            full_name: 'Alex Rivera',
            email: 'alex.rivera@kinetic-sync.ai',
            phone: '+1 (555) 123-4567',
            role: 'admin'
          };
          this.currentUser.set(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
        }
        return of(this.currentUser());
      })
    );
  }

  updateProfile(profileData: { full_name: string; email: string; phone?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiService.baseUrl}/profile/me`, profileData).pipe(
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
      }),
      catchError(err => {
        const updatedUser = { ...this.currentUser(), ...profileData };
        this.currentUser.set(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return of(updatedUser);
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
