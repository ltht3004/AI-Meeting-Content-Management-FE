import { Component, OnInit, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../../../shared/services/search.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  meeting_date: string;
  location: string;
  duration: number;
  participants: string;
}

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ConfirmDialog],
  templateUrl: './meeting-list.html',
  styleUrl: './meeting-list.css'
})
export class MeetingList implements OnInit {
  meetings: Meeting[] = [
    {
      id: '1',
      title: 'Q3 Product Strategy Sync',
      description: 'Discuss product feature roadmap, timeline alignments, and core KPIs for the upcoming quarter.',
      meeting_date: '2023-10-24T14:00:00Z',
      location: 'Meeting Room A',
      duration: 45,
      participants: 'Alex Rivera, Sarah Connor, David Miller'
    },
    {
      id: '2',
      title: 'Customer Feedback Loop',
      description: 'Review recent feedback from enterprise client pilot runs and plan bug fixes.',
      meeting_date: '2023-10-23T11:30:00Z',
      location: 'Zoom Online',
      duration: 60,
      participants: 'Sarah Connor, Emma Watson, John Doe'
    },
    {
      id: '3',
      title: 'Design System Refactor',
      description: 'Refactor component spacing, font weight variables, and light/dark theme utilities.',
      meeting_date: '2023-10-22T09:00:00Z',
      location: 'Room 404',
      duration: 30,
      participants: 'Alex Rivera, John Doe, Peter Parker'
    },
    {
      id: '4',
      title: 'Urgent: Server Outage Review',
      description: 'Post-mortem review of yesterday server memory overflow and database connection pool fixes.',
      meeting_date: '2023-10-21T17:45:00Z',
      location: 'MS Teams',
      duration: 90,
      participants: 'Alex Rivera, David Miller, Emma Watson'
    }
  ];

  filteredMeetings: Meeting[] = [];
  showDeleteConfirm = false;
  meetingToDelete: Meeting | null = null;
  private searchService = inject(SearchService);

  constructor() {
    effect(() => {
      const query = this.searchService.searchQuery();
      this.filterMeetings(query);
    });
  }

  ngOnInit() {
    this.filterMeetings(this.searchService.searchQuery());
  }

  filterMeetings(query: string) {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) {
      this.filteredMeetings = [...this.meetings];
    } else {
      this.filteredMeetings = this.meetings.filter(m =>
        m.title.toLowerCase().includes(cleanQuery) ||
        m.description.toLowerCase().includes(cleanQuery) ||
        m.location.toLowerCase().includes(cleanQuery)
      );
    }
  }

  deleteMeeting(id: string) {
    const meeting = this.meetings.find(m => m.id === id);
    if (meeting) {
      this.meetingToDelete = meeting;
      this.showDeleteConfirm = true;
    }
  }

  onConfirmDelete() {
    if (this.meetingToDelete) {
      this.meetings = this.meetings.filter(m => m.id !== this.meetingToDelete!.id);
      this.filterMeetings(this.searchService.searchQuery());
    }
    this.showDeleteConfirm = false;
    this.meetingToDelete = null;
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
    this.meetingToDelete = null;
  }

  getParticipantInitials(participantsStr: string): string[] {
    if (!participantsStr) return [];
    return participantsStr.split(',').map(name => {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }).slice(0, 3); // Display at most 3 avatar circles
  }

  getParticipantCount(participantsStr: string): number {
    if (!participantsStr) return 0;
    return participantsStr.split(',').length;
  }
}
