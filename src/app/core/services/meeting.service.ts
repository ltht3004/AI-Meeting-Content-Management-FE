import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  description: string;
  meeting_date: string;
  location: string;
  duration: number;
  participants: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  getMeetings(status?: string, search?: string, page: number = 1, pageSize: number = 9, currentUserId?: string): Observable<{ meetings: Meeting[], total: number }> {
    // Build query parameters explicitly because every meeting list filter is handled server-side.
    const params: string[] = [];
    if (status && status !== 'all') {
      params.push(`status=${status}`);
    }
    if (search && search.trim()) {
      params.push(`search=${search.trim()}`);
    }
    params.push(`page=${page}`);
    params.push(`page_size=${pageSize}`);
    if (currentUserId) {
      params.push(`current_user_id=${currentUserId}`);
    }
    
    const queryString = `?${params.join('&')}`;
    return this.http.get<{ meetings: Meeting[], total: number }>(`${this.api.meetings}/${queryString}`);
  }

  getMeetingById(id: string, currentUserId?: string): Observable<Meeting> {
    // Passing currentUserId lets the backend enforce creator/participant/admin visibility.
    const url = currentUserId ? `${this.api.meetings}/${id}?current_user_id=${currentUserId}` : `${this.api.meetings}/${id}`;
    return this.http.get<Meeting>(url);
  }

  createMeeting(meeting: Partial<Meeting>): Observable<Meeting> {
    return this.http.post<Meeting>(`${this.api.meetings}/`, meeting);
  }

  updateMeeting(id: string, meeting: Partial<Meeting>): Observable<Meeting> {
    return this.http.put<Meeting>(`${this.api.meetings}/${id}`, meeting);
  }

  deleteMeeting(id: string, currentUserId?: string): Observable<{ message: string }> {
    // Delete requires current user context because only the creator or admin can remove a meeting.
    const url = currentUserId 
      ? `${this.api.meetings}/${id}?current_user_id=${currentUserId}`
      : `${this.api.meetings}/${id}`;
    return this.http.delete<{ message: string }>(url);
  }
}
