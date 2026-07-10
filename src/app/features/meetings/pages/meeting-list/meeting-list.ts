import { Component, OnInit, effect, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SearchService } from '../../../../shared/services/search.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown';
import { MeetingService } from '../../../../core/services/meeting.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface Meeting {
  id: string;
  user_id: string;
  creator_id: string;
  title: string;
  description: string;
  meeting_date: string;
  location: string;
  duration: number;
  participants: string;
  status: 'scheduled' | 'completed' | 'processing';
}

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    ConfirmDialog,
    PaginationComponent,
    ButtonComponent,
    DropdownComponent
  ],
  templateUrl: './meeting-list.html',
  styleUrl: './meeting-list.css'
})
export class MeetingList implements OnInit {
  meetings: Meeting[] = [];
  filteredMeetings: Meeting[] = [];

  currentPage = 1;
  pageSize = 9;
  totalItems = 0;
  selectedStatus: 'all' | 'scheduled' | 'completed' | 'processing' = 'all';
  isLoading = true;

  showDeleteConfirm = false;
  meetingToDelete: Meeting | null = null;

  private searchService = inject(SearchService);
  private toastService = inject(ToastService);
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  get currentUserId(): string {
    return this.authService.currentUser()?.id || '';
  }

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'admin';
  }

  constructor() {
    effect(() => {
      const query = this.searchService.searchQuery();
      this.currentPage = 1;
      this.loadMeetings();
    });
  }

  ngOnInit() {
    this.loadMeetings();
  }

  loadMeetings() {
    this.isLoading = true;
    const query = this.searchService.searchQuery();
    this.meetingService.getMeetings(this.selectedStatus, query, this.currentPage, this.pageSize, this.currentUserId).subscribe({
      next: (data: any) => {
        this.meetings = data.meetings.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          creator_id: m.user_id,
          title: m.title,
          description: m.description ?? '',
          meeting_date: m.meeting_date,
          location: m.location ?? '',
          duration: m.duration ?? 0,
          participants: m.participants ?? '',
          status: this.normalizeStatus(m.status)
        }));

        this.filteredMeetings = this.meetings;
        this.totalItems = data.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Error', 'Cannot load meetings from server.');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  normalizeStatus(status: string): 'scheduled' | 'completed' | 'processing' {
    const value = status?.toLowerCase();

    if (value === 'completed') return 'completed';
    if (value === 'processing' || value === 'archived') return 'processing';

    return 'scheduled';
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get paginatedMeetings(): Meeting[] {
    return this.filteredMeetings;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMeetings();
    }
  }

  setStatusFilter(status: 'all' | 'scheduled' | 'completed' | 'processing') {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadMeetings();
  }

  selectStatus(status: 'all' | 'scheduled' | 'completed' | 'processing') {
    this.setStatusFilter(status);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      default:
        return 'All';
    }
  }

  deleteMeeting(id: string) {
    const meeting = this.meetings.find((m) => m.id === id);

    if (meeting) {
      this.meetingToDelete = meeting;
      this.showDeleteConfirm = true;
      this.cdr.detectChanges();
    }
  }

  onConfirmDelete() {
    const toDelete = this.meetingToDelete;

    if (toDelete) {
      this.meetingService.deleteMeeting(toDelete.id, this.currentUserId).subscribe({
        next: () => {
          this.toastService.success(
            'Meeting Deleted',
            `Meeting "${toDelete.title}" has been deleted successfully.`
          );
          this.loadMeetings();
        },
        error: (err) => {
          console.error(err);
          this.toastService.error('Error', 'Cannot delete meeting from database.');
        }
      });
    }

    this.showDeleteConfirm = false;
    this.meetingToDelete = null;
    this.cdr.detectChanges();
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
    this.meetingToDelete = null;
    this.cdr.detectChanges();
  }

  getParticipantInitials(participantsStr: string): string[] {
    if (!participantsStr) return [];

    return participantsStr
      .split(',')
      .map((name) => {
        const parts = name.trim().split(' ');

        if (parts.length >= 2) {
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }

        return parts[0][0].toUpperCase();
      })
      .slice(0, 3);
  }

  getParticipantsList(participantsStr: string) {
    if (!participantsStr) return [];

    return participantsStr.split(',').map((p, index) => {
      const name = p.trim();
      const parts = name.split(' ');

      let initials = '';

      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        initials = parts[0][0].toUpperCase();
      }

      return {
        id: String(index + 1),
        name,
        initials
      };
    });
  }

  getParticipantCount(participantsStr: string): number {
    if (!participantsStr) return 0;

    return participantsStr.split(',').length;
  }
}