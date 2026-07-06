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
  creator_id: string;
  status: 'scheduled' | 'processing' | 'completed';
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
      participants: 'Alex Rivera, Sarah Connor, David Miller',
      creator_id: '1',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Customer Feedback Loop',
      description: 'Review recent feedback from enterprise client pilot runs and plan bug fixes.',
      meeting_date: '2023-10-23T11:30:00Z',
      location: 'Zoom Online',
      duration: 60,
      participants: 'Sarah Connor, Emma Watson, John Doe',
      creator_id: '2',
      status: 'completed'
    },
    {
      id: '3',
      title: 'Design System Refactor',
      description: 'Refactor component spacing, font weight variables, and light/dark theme utilities.',
      meeting_date: '2023-10-22T09:00:00Z',
      location: 'Room 404',
      duration: 30,
      participants: 'Alex Rivera, John Doe, Peter Parker',
      creator_id: '1',
      status: 'scheduled'
    },
    {
      id: '4',
      title: 'Urgent: Server Outage Review',
      description: 'Post-mortem review of yesterday server memory overflow and database connection pool fixes.',
      meeting_date: '2023-10-21T17:45:00Z',
      location: 'MS Teams',
      duration: 90,
      participants: 'Alex Rivera, David Miller, Emma Watson',
      creator_id: '3',
      status: 'scheduled'
    },
    {
      id: '5',
      title: 'Marketing Plan Brainstorm',
      description: 'Brainstorm creative directions, campaigns, and content scheduling for next month.',
      meeting_date: '2023-10-20T10:00:00Z',
      location: 'Creative Lab B',
      duration: 60,
      participants: 'Emma Watson, John Doe, Peter Parker',
      creator_id: '2',
      status: 'completed'
    },
    {
      id: '6',
      title: 'DevOps & CI/CD Pipeline Audit',
      description: 'Analyze build speed, Docker layer caching, and deployment stability in staging environment.',
      meeting_date: '2023-10-19T15:30:00Z',
      location: 'Slack Call',
      duration: 45,
      participants: 'Sarah Connor, David Miller, Peter Parker',
      creator_id: '1',
      status: 'completed'
    },
    {
      id: '7',
      title: 'API Gateway Integration',
      description: 'Refactor API endpoints, rate limiting policies, and authentication token caching.',
      meeting_date: '2023-10-18T13:00:00Z',
      location: 'Meeting Room C',
      duration: 75,
      participants: 'Alex Rivera, David Miller, John Doe',
      creator_id: '3',
      status: 'completed'
    },
    {
      id: '8',
      title: 'HR Policy & Benefits Review',
      description: 'Review updated health insurance plans, annual remote work policy changes, and perks.',
      meeting_date: '2023-10-17T09:30:00Z',
      location: 'Main Hall',
      duration: 60,
      participants: 'Emma Watson, Sarah Connor, Peter Parker',
      creator_id: '2',
      status: 'completed'
    },
    {
      id: '9',
      title: 'Q4 Budget & Spending Review',
      description: 'Analyze team spending, cloud computing costs, and estimate budget for next quarter.',
      meeting_date: '2023-10-16T11:00:00Z',
      location: 'Executive Boardroom',
      duration: 60,
      participants: 'Alex Rivera, Sarah Connor, David Miller',
      creator_id: '1',
      status: 'completed'
    },
    {
      id: '10',
      title: 'Frontend Performance Audit',
      description: 'Check Core Web Vitals, bundle optimization, and image lazy loading configurations.',
      meeting_date: '2023-10-15T14:30:00Z',
      location: 'Room 101',
      duration: 45,
      participants: 'Alex Rivera, John Doe, Peter Parker',
      creator_id: '1',
      status: 'completed'
    }
  ];

  filteredMeetings: Meeting[] = [];
  currentPage = 1;
  pageSize = 9;

  get totalPages(): number {
    return Math.ceil(this.filteredMeetings.length / this.pageSize);
  }

  get paginatedMeetings(): Meeting[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredMeetings.slice(startIndex, startIndex + this.pageSize);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const array: number[] = [];
    for (let i = 1; i <= total; i++) {
      array.push(i);
    }
    return array;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  availableUsers = [
    { id: '1', name: 'Alex Rivera' },
    { id: '2', name: 'Sarah Connor' },
    { id: '3', name: 'David Miller' },
    { id: '4', name: 'Emma Watson' },
    { id: '5', name: 'John Doe' },
    { id: '6', name: 'Peter Parker' }
  ];
  showDeleteConfirm = false;
  meetingToDelete: Meeting | null = null;
  currentUserId = '1'; // Mock logged-in user ID (Alex Rivera)
  isAdmin = false;      // Mock admin privilege toggler
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
    this.currentPage = 1;
  }

  deleteMeeting(id: string) {
    const meeting = this.meetings.find(m => m.id === id);
    if (meeting) {
      this.meetingToDelete = meeting;
      this.showDeleteConfirm = true;
    }
  }

  onConfirmDelete() {
    const toDelete = this.meetingToDelete;
    if (toDelete) {
      this.meetings = this.meetings.filter(m => m.id !== toDelete.id);
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

  getParticipantsList(participantsStr: string) {
    if (!participantsStr) return [];
    return participantsStr.split(',').map(p => {
      const name = p.trim();
      const user = this.availableUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
      
      const parts = name.split(' ');
      let initials = '';
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        initials = parts[0][0].toUpperCase();
      }

      return {
        id: user ? user.id : '1',
        name: name,
        initials: initials
      };
    });
  }

  getParticipantCount(participantsStr: string): number {
    if (!participantsStr) return 0;
    return participantsStr.split(',').length;
  }
}
