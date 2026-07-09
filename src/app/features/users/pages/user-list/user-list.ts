import { Component, OnInit, inject } from '@angular/core';
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

  users: User[] = [];
  metrics: any = null;
  isLoading = true;
  searchQuery = '';
  filterRole = 'all';
  filterStatus = 'all';
  sortOrder: 'newest' | 'oldest' = 'newest';

  currentPage = 1;
  pageSize = 10;

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

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
  }

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  setRoleFilter(role: string) {
    this.filterRole = role;
    this.currentPage = 1;
  }

  setStatusFilter(status: string) {
    this.filterStatus = status;
    this.currentPage = 1;
  }

  setSortOrder(order: 'newest' | 'oldest') {
    this.sortOrder = order;
    this.currentPage = 1;
  }

  getRoleLabel(role: string): string {
    if (role === 'admin') return 'Admin';
    if (role === 'user') return 'User';
    return 'All Roles';
  }

  getStatusLabel(status: string): string {
    if (status === 'Active') return 'Active';
    if (status === 'Unactive') return 'Unactive';
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
      this.userService.deleteUser(this.userToDelete.id).subscribe(() => {
        this.toastService.success('User Deleted', `User "${this.userToDelete?.full_name}" has been permanently removed.`);
        this.loadData();
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
