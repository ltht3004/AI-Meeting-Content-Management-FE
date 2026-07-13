import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';

import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DropdownComponent, PaginationComponent, ConfirmDialog],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList implements OnInit {
  userService = inject(UserService);
  toastService = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  users: User[] = [];
  metrics: any = null;
  isLoading = true;
  searchQuery = '';
  filterRole = 'all';
  filterStatus = 'all';
  sortOrder: 'newest' | 'oldest' = 'newest';

  currentPage = 1;
  pageSize = 10;
  totalCount = 0;

  ngOnInit() {
    this.loadData();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    
    // Load metrics
    this.userService.getSystemMetrics().subscribe(data => {
      this.metrics = data;
      this.cdr.detectChanges();
    });

    const skip = (this.currentPage - 1) * this.pageSize;
    
    // Load users from API
    this.userService.getUsers(skip, this.pageSize, this.searchQuery, this.filterRole, this.filterStatus).subscribe({
      next: (response) => {
        this.users = response.items;
        this.totalCount = response.total_count;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.error('Error', 'Failed to load users');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get paginatedUsers(): User[] {
    return this.users;
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadData();
    }
  }

  setRoleFilter(role: string) {
    this.filterRole = role;
    this.currentPage = 1;
    this.loadData();
  }

  setStatusFilter(status: string) {
    this.filterStatus = status;
    this.currentPage = 1;
    this.loadData();
  }

  setSortOrder(order: 'newest' | 'oldest') {
    this.sortOrder = order;
    this.currentPage = 1;
    this.loadData();
  }

  getRoleLabel(role: string): string {
    if (role === 'admin') return 'Admin';
    if (role === 'user') return 'User';
    return 'All Roles';
  }

  getStatusLabel(status: string): string {
    if (status === 'Active') return 'Active';
    if (status === 'Inactive') return 'Inactive';
    return 'All Status';
  }

  getSortLabel(sort: string): string {
    if (sort === 'oldest') return 'Oldest';
    return 'Newest';
  }

  showDeleteConfirm = false;
  userToDelete: User | null = null;

  deleteUser(user: User) {
    this.userToDelete = user;
    this.showDeleteConfirm = true;
  }

  onConfirmDelete() {
    if (this.userToDelete) {
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: () => {
          this.toastService.success('User Deleted', `User "${this.userToDelete?.full_name}" has been permanently removed.`);
          this.loadData();
        },
        error: (err) => {
          this.toastService.error('Error', err.error?.detail || 'Failed to delete user');
        }
      });
    }
    this.showDeleteConfirm = false;
    this.userToDelete = null;
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
    this.userToDelete = null;
  }
}
