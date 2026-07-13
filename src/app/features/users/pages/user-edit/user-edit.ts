import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  cdr = inject(ChangeDetectorRef);

  user: User | null = null;
  isLoading = true;
  isSaving = false;
  error = '';
  saveError = '';

  // Form fields
  editFullName = '';
  editEmail = '';
  editPhone = '';
  editRole: 'admin' | 'user' = 'user';
  editStatus: 'Active' | 'Inactive' = 'Active';

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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load user details.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err.error?.detail) {
      if (Array.isArray(err.error.detail)) {
        return err.error.detail.map((e: any) => e.msg).join(', ');
      }
      return err.error.detail;
    }
    return 'An unexpected error occurred.';
  }

  toggleStatus() {
    this.editStatus = this.editStatus === 'Active' ? 'Inactive' : 'Active';
  }

  saveChanges() {
    if (!this.user || !this.editFullName || !this.editEmail || !this.editPhone) return;

    this.isSaving = true;
    this.saveError = '';
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
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/users']), 1500);
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = this.getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  showDeleteConfirm = false;

  deleteUser() {
    this.showDeleteConfirm = true;
  }

  onConfirmDelete() {
    if (!this.user) return;
    this.userService.deleteUser(this.user.id).subscribe({
      next: () => {
        this.toastService.success('User Deleted', 'User has been permanently removed.');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.toastService.error('Error', this.getErrorMessage(err));
        this.cdr.detectChanges();
      }
    });
    this.showDeleteConfirm = false;
  }

  onCancelDelete() {
    this.showDeleteConfirm = false;
  }
}
