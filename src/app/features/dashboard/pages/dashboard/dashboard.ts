import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface MeetingSummary {
  id: string;
  title: string;
  date: string;
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
export class Dashboard {
  activeMenuIndex: number | null = null;

  toggleMenu(index: number, event: Event) {
    event.stopPropagation();
    this.activeMenuIndex = this.activeMenuIndex === index ? null : index;
  }

  @HostListener('document:click')
  closeMenu() {
    this.activeMenuIndex = null;
  }

  recentMeetings: MeetingSummary[] = [
    { id: '1', title: 'Q3 Product Strategy Sync', date: 'Oct 24, 2023 • 2:00 PM', status: 'completed' },
    { id: '2', title: 'Customer Feedback Loop', date: 'Oct 23, 2023 • 11:30 AM', status: 'completed' },
    { id: '3', title: 'Design System Refactor', date: 'Oct 22, 2023 • 9:00 AM', status: 'processing' },
    { id: '4', title: 'Urgent: Server Outage Review', date: 'Oct 21, 2023 • 5:45 PM', status: 'scheduled' }
  ];

  recentActivities: ActivityLog[] = [
    { title: 'AI Summary Generated', desc: 'Marketing Team Brainstorm', time: '12 minutes ago' },
    { title: 'Transcript Edited', desc: 'By Sarah Connor', time: '2 hours ago' },
    { title: 'Meeting Scheduled', desc: 'Project Phoenix Kickoff', time: '4 hours ago' }
  ];
}
