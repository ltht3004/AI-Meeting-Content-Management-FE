import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList implements OnInit {
  userService = inject(UserService);

  users: User[] = [];
  metrics: any = null;
  isLoading = true;
  searchQuery = '';
  filterRole = 'all';
  filterStatus = 'all';
  sortOrder: 'newest' | 'oldest' = 'newest';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    
    // Load metrics
    this.userService.getSystemMetrics().subscribe(data => {
      this.metrics = data;
    });

    // Load users
    this.userService.getUsers().subscribe(data => {
      this.users = data;
      this.isLoading = false;
    });
  }

  get filteredUsers() {
    let result = this.users;

    if (this.filterRole !== 'all') {
      result = result.filter(u => u.role === this.filterRole);
    }

    if (this.filterStatus !== 'all') {
      result = result.filter(u => u.status === this.filterStatus);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(u => 
        u.full_name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return this.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }
}
