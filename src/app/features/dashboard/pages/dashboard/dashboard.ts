import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface MeetingSummary {
  title: string;
  date: string;
}

export interface ActivityLog {
  title: string;
  desc: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  recentMeetings: MeetingSummary[] = [
    { title: 'Q3 Product Strategy Sync', date: 'Oct 24, 2023 • 2:00 PM' },
    { title: 'Customer Feedback Loop', date: 'Oct 23, 2023 • 11:30 AM' },
    { title: 'Design System Refactor', date: 'Oct 22, 2023 • 9:00 AM' },
    { title: 'Urgent: Server Outage Review', date: 'Oct 21, 2023 • 5:45 PM' }
  ];

  recentActivities: ActivityLog[] = [
    { title: 'AI Summary Generated', desc: 'Marketing Team Brainstorm', time: '12 minutes ago' },
    { title: 'Transcript Edited', desc: 'By Sarah Connor', time: '2 hours ago' },
    { title: 'Meeting Scheduled', desc: 'Project Phoenix Kickoff', time: '4 hours ago' }
  ];
}
