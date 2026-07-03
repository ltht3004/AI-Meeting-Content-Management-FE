import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';

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
  role: 'admin' | 'user';
  created_at: string;
  status: 'Active' | 'Pending';
  last_active: string;
  avatarUrl?: string;
  twoFactorEnabled?: boolean;
  totalQuota?: number;
  usedQuota?: number;
  resetDate?: string;
  stats?: UserStats;
  recentMeetings?: UserMeeting[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // --- MOCK DATA ---
  private mockUsers: User[] = [
    {
      id: '1',
      full_name: 'Alex Rivera',
      email: 'alex.rivera@meetingai.com',
      role: 'admin',
      created_at: 'Oct 12, 2023',
      status: 'Active',
      last_active: 'Last active 2h ago',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      twoFactorEnabled: true,
      totalQuota: 600,
      usedQuota: 450,
      resetDate: 'Nov 01, 2024',
      stats: { totalMeetings: 145, totalRecordings: 120, totalSummaries: 95, productivityScore: 92.5, meetingsGrowth: 15, recordingsGrowth: 10 },
      recentMeetings: [
        { id: 'm1', title: 'Q3 Product Roadmap', date: 'Oct 24, 2024', participants: 6, duration: '45m' },
        { id: 'm2', title: 'Engineering Sync', date: 'Oct 22, 2024', participants: 12, duration: '1h 15m' }
      ]
    },
    {
      id: '2',
      full_name: 'Sarah Chen',
      email: 'sarah.chen@meetingai.com',
      role: 'user',
      created_at: 'Nov 05, 2023',
      status: 'Active',
      last_active: 'Last active 14m ago',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      twoFactorEnabled: true,
      totalQuota: 300,
      usedQuota: 280,
      resetDate: 'Nov 05, 2024',
      stats: { totalMeetings: 42, totalRecordings: 38, totalSummaries: 35, productivityScore: 88.0, meetingsGrowth: 12, recordingsGrowth: 8 },
      recentMeetings: [
        { id: 'm3', title: 'Q4 Strategy Sync', date: 'Oct 24, 2024', participants: 4, duration: '54m' },
        { id: 'm4', title: 'Design Critiques: V2 Shell', date: 'Oct 20, 2024', participants: 3, duration: '30m' }
      ]
    },
    {
      id: '3',
      full_name: 'Jordan Smyth',
      email: 'jordan.s@meetingai.com',
      role: 'user',
      created_at: 'Jan 18, 2024',
      status: 'Pending',
      last_active: 'Never logged in',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      twoFactorEnabled: false,
      totalQuota: 300,
      usedQuota: 0,
      resetDate: 'Nov 18, 2024',
      stats: { totalMeetings: 0, totalRecordings: 0, totalSummaries: 0 },
      recentMeetings: []
    },
    {
      id: '4',
      full_name: 'Elena Rodriguez',
      email: 'e.rodriguez@meetingai.com',
      role: 'admin',
      created_at: 'Mar 02, 2023',
      status: 'Active',
      last_active: 'Last active 1d ago',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      twoFactorEnabled: true,
      totalQuota: 1000,
      usedQuota: 150,
      resetDate: 'Nov 02, 2024',
      stats: { totalMeetings: 210, totalRecordings: 180, totalSummaries: 150, productivityScore: 96.0 },
      recentMeetings: []
    },
    {
      id: '5',
      full_name: 'Alex Thompson',
      email: 'alex.thompson@meetingai.com',
      role: 'admin',
      created_at: 'October 12, 2023',
      status: 'Active',
      last_active: 'Last active 5h ago',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      twoFactorEnabled: true,
      totalQuota: 600,
      usedQuota: 550,
      resetDate: 'Nov 12, 2024',
      stats: { totalMeetings: 42, totalRecordings: 38, totalSummaries: 35, productivityScore: 94.8, meetingsGrowth: 12, recordingsGrowth: 8 },
      recentMeetings: [
        { id: 'm5', title: 'Q4 Strategy Sync', date: 'Oct 24, 2024', participants: 5, duration: '54m' },
        { id: 'm6', title: 'Product Roadmap Review', date: 'Oct 22, 2024', participants: 2, duration: '1h 15m' },
        { id: 'm7', title: 'Design Critiques: V2 Shell', date: 'Oct 20, 2024', participants: 3, duration: '30m' }
      ]
    }
  ];

  private usersSubject = new BehaviorSubject<User[]>([...this.mockUsers]);
  public users$ = this.usersSubject.asObservable();

  constructor() {}

  getUsers(): Observable<User[]> {
    return this.users$;
  }

  getUserById(id: string): Observable<User> {
    return this.users$.pipe(
      map(users => {
        const user = users.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return user;
      })
    );
  }

  updateUser(id: string, updates: Partial<User>): Observable<User> {
    return new Observable(subscriber => {
      const currentUsers = this.usersSubject.value;
      const index = currentUsers.findIndex(u => u.id === id);
      
      if (index === -1) {
        subscriber.error(new Error('User not found'));
        return;
      }

      const updatedUser = { ...currentUsers[index], ...updates };
      const newUsers = [...currentUsers];
      newUsers[index] = updatedUser;
      
      this.usersSubject.next(newUsers);
      subscriber.next(updatedUser);
      subscriber.complete();
    });
  }

  deleteUser(id: string): Observable<boolean> {
    return new Observable(subscriber => {
      const currentUsers = this.usersSubject.value;
      const index = currentUsers.findIndex(u => u.id === id);
      
      if (index === -1) {
        subscriber.error(new Error('User not found'));
        return;
      }

      const newUsers = currentUsers.filter(u => u.id !== id);
      this.usersSubject.next(newUsers);
      subscriber.next(true);
      subscriber.complete();
    });
  }

  getSystemMetrics(): Observable<any> {
    return of({
      totalUsers: 2481,
      totalUsersGrowth: 12, // +12%
      activeNow: 142,
      systemSecurity: 99.8
    });
  }
}
