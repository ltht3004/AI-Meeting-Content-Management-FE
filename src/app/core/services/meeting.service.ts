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

  getMeetings(): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(`${this.api.meetings}/`);
  }

  getMeetingById(id: string): Observable<Meeting> {
    return this.http.get<Meeting>(`${this.api.meetings}/${id}`);
  }

  createMeeting(meeting: Partial<Meeting>): Observable<Meeting> {
    return this.http.post<Meeting>(`${this.api.meetings}/`, meeting);
  }

  updateMeeting(id: string, meeting: Partial<Meeting>): Observable<Meeting> {
    return this.http.put<Meeting>(`${this.api.meetings}/${id}`, meeting);
  }

  deleteMeeting(id: string, currentUserId?: string): Observable<{ message: string }> {
    const url = currentUserId 
      ? `${this.api.meetings}/${id}?current_user_id=${currentUserId}`
      : `${this.api.meetings}/${id}`;
    return this.http.delete<{ message: string }>(url);
  }
}