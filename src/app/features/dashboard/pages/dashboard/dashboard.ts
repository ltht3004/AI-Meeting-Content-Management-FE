import { ChangeDetectorRef, Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface MeetingSummary {
  id: string;
  title: string;
  meeting_date: string;
  status: 'completed' | 'scheduled' | 'processing';
}

export interface ActivityLog {
  title: string;
  desc: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  activeMenuIndex: number | null = null;
  isLoading = true;

  stats = {
    totalMeetings: 0,
    totalRecordings: 0,
    totalTranscripts: 0,
    totalSummaries: 0
  };

  recentMeetings: MeetingSummary[] = [];

  recentActivities: ActivityLog[] = [];

  ngOnInit() {
    this.loadDashboard();
  }

  toggleMenu(index: number, event: Event) {
    event.stopPropagation();
    this.activeMenuIndex = this.activeMenuIndex === index ? null : index;
  }

  @HostListener('document:click')
  closeMenu() {
    this.activeMenuIndex = null;
  }

  loadDashboard() {
    const currentUserId = this.authService.currentUser()?.id;
    const url = currentUserId
      ? `${this.api.dashboard}/summary?current_user_id=${currentUserId}`
      : `${this.api.dashboard}/summary`;

    this.isLoading = true;
    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.stats = {
          totalMeetings: data.stats?.total_meetings ?? 0,
          totalRecordings: data.stats?.total_recordings ?? 0,
          totalTranscripts: data.stats?.total_transcripts ?? 0,
          totalSummaries: data.stats?.total_summaries ?? 0
        };

        this.recentMeetings = (data.recent_meetings || []).map((meeting: any) => ({
          id: meeting.id,
          title: meeting.title,
          meeting_date: meeting.meeting_date,
          status: this.normalizeStatus(meeting.status)
        }));

        this.recentActivities = (data.recent_activities || []).map((activity: any) => ({
          title: activity.title,
          desc: activity.desc,
          time: this.getRelativeTime(activity.created_at)
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  normalizeStatus(status: string): 'completed' | 'scheduled' | 'processing' {
    const value = status?.toLowerCase();

    if (value === 'completed') return 'completed';
    if (value === 'processing' || value === 'archived') return 'processing';

    return 'scheduled';
  }

  getRelativeTime(dateValue: string): string {
    if (!dateValue) return '';

    const date = new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return date.toLocaleDateString();
  }
}
