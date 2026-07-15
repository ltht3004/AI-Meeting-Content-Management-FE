import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

export interface UserStats {
  totalMeetings: number;
  totalRecordings: number;
  totalSummaries: number;
  productivityScore?: number;
  meetingsGrowth?: number;
  recordingsGrowth?: number;
}

export interface UserMeeting {
  id: string;
  title: string;
  date: string;
  participants: number;
  duration: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  created_at: string;
  status: 'Active' | 'Inactive';
  last_active?: string;
  avatar_url?: string;
  twoFactorEnabled?: boolean;
  total_quota?: number;
  used_quota?: number;
  resetDate?: string;
  stats?: UserStats;
  recentMeetings?: UserMeeting[];
}

export interface PaginatedUserResponse {
  items: User[];
  total_count: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiService = inject(ApiService);

  private get apiUrl() {
    return `${this.apiService.baseUrl}/users`;
  }

  constructor() {}

  getUsers(skip: number = 0, limit: number = 10, search?: string, role?: string, status?: string): Observable<PaginatedUserResponse> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);
    if (role && role !== 'all') params = params.set('role', role);
    if (status && status !== 'all') params = params.set('status', status);

    return this.http.get<PaginatedUserResponse>(`${this.apiUrl}/`, { params });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getUserStats(id: string): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/${id}/stats`);
  }

  createUser(user: any): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/`, user);
  }

  updateUser(id: string, userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiService.baseUrl}/users/${id}`, userData);
  }

  verifyUserEmailChange(id: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiService.baseUrl}/users/${id}/verify-email`, { code });
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getSystemMetrics(): Observable<any> {
    return forkJoin({
      total: this.getUsers(0, 1),
      active: this.getUsers(0, 1, undefined, undefined, 'Active')
    }).pipe(
      map(res => ({
        totalUsers: res.total.total_count,
        totalUsersGrowth: 15, 
        activeNow: res.active.total_count,
        systemSecurity: 100
      }))
    );
  }
}
