import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';
import { switchMap } from 'rxjs/operators';
import { ToastService } from '../../../../shared/services/toast.service';

import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmDialog],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.css'
})
export class UserEdit implements OnInit {
  userService = inject(UserService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  toastService = inject(ToastService);

  user: User | null = null;
  isLoading = true;
  isSaving = false;
  error = '';

  // Form fields
  editFullName = '';
  editEmail = '';
  editPhone = '';
  editRole: 'admin' | 'user' = 'user';
  editStatus: 'Active' | 'Unactive' = 'Active';

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.isLoading = true;
        const id = params.get('id') || '';
        return this.userService.getUserById(id);
      })
    ).subscribe({
      next: (user) => {
        this.user = user;
        this.editFullName = user.full_name;
        this.editEmail = user.email;
        this.editPhone = user.phone || '';
        this.editRole = user.role;
        this.editStatus = user.status;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user details.';
        this.isLoading = false;
      }
    });
  }

  toggleStatus() {
    this.editStatus = this.editStatus === 'Active' ? 'Unactive' : 'Active';
  }

  saveChanges() {
    if (!this.user || !this.editFullName || !this.editEmail || !this.editPhone) return;

    this.isSaving = true;
    this.userService.updateUser(this.user.id, {
      full_name: this.editFullName,
      email: this.editEmail,
      phone: this.editPhone,
      role: this.editRole,
      status: this.editStatus
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success('Changes Saved', 'User profile has been updated successfully.');
        setTimeout(() => this.router.navigate(['/users']), 1500);
      },
      error: (err) => {
        this.isSaving = false;
        this.error = 'Failed to save changes.';
      }
    });
  }

  showDeleteConfirm = false;

  deleteUser() {
    this.showDeleteConfirm = true;
  }

  onConfirmDelete() {
    if (!this.user) return;
    this.userService.deleteUser(this.user.id).subscribe(() => {
      this.toastService.success('User Deleted', 'User has been permanently removed.');
      this.router.navigate(['/users']);
    });
    this.showDeleteConfirm = false;
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
  }
}
