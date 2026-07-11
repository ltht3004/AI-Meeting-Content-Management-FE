import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [FormsModule, DecimalPipe, ConfirmDialog],
  templateUrl: './profile-view.html',
  styleUrl: './profile-view.css'
})
export class ProfileView implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  isEditing = false;
  editName = '';
  editEmail = '';
  editPhone = '';
  errorMessage = '';
  isLoading = false;
  showRemoveAvatarModal = false;

  stats: any = {
    totalMeetings: 0,
    meetingsGrowth: 0,
    totalRecordings: 0,
    recordingsGrowth: 0,
    totalTranscripts: 0,
    transcriptsGrowth: 0,
    totalSummaries: 0,
    summariesGrowth: 0,
    totalQuota: 600,
    usedQuota: 0,
    resetDate: 'N/A'
  };

  ngOnInit() {
    this.authService.getProfile().subscribe();
    this.authService.getProfileStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load profile stats', err);
      }
    });
  }

  get user() {
    return this.authService.currentUser();
  }

  get avatarUrl(): string {
    const defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
    if (this.user?.avatar_url) {
      const rootUrl = this.apiService.baseUrl.replace('/api/v1', '');
      return `${rootUrl}${this.user.avatar_url}`;
    }
    return defaultAvatar;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.toastService.error('Invalid File', 'Please select an image file.');
        event.target.value = '';
        return;
      }
      this.isLoading = true;
      this.authService.uploadAvatar(file).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.success('Success', 'Avatar updated successfully!');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.error('Error', 'Failed to upload avatar.');
          this.cdr.detectChanges();
        }
      });
    }
    event.target.value = '';
  }

  promptRemoveAvatar() {
    this.showRemoveAvatarModal = true;
  }

  cancelRemoveAvatar() {
    this.showRemoveAvatarModal = false;
  }

  confirmRemoveAvatar() {
    this.isLoading = true;
    this.authService.removeAvatar().subscribe({
      next: () => {
        this.isLoading = false;
        this.showRemoveAvatarModal = false;
        this.toastService.success('Success', 'Avatar removed successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.showRemoveAvatarModal = false;
        this.toastService.error('Error', 'Failed to remove avatar.');
        this.cdr.detectChanges();
      }
    });
  }

  startEdit() {
    this.isEditing = true;
    this.editName = this.user?.full_name || '';
    this.editEmail = this.user?.email || '';
    this.editPhone = this.user?.phone || '';
    this.errorMessage = '';
  }

  cancelEdit() {
    this.isEditing = false;
    this.errorMessage = '';
  }

  saveProfile() {
    if (!this.editName || !this.editEmail || !this.editPhone) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (!/^\d{10}$/.test(this.editPhone)) {
      this.errorMessage = 'Phone number must be exactly 10 digits.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.updateProfile({
      full_name: this.editName,
      email: this.editEmail,
      phone: this.editPhone
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.isEditing = false;
        this.toastService.success('Changes Saved', 'Profile updated successfully!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        let detail = err.error?.detail;
        if (Array.isArray(detail)) {
          detail = detail[0].msg;
        }
        this.errorMessage = detail || 'Update failed.';
        this.cdr.detectChanges();
      }
    });
  }

  getCreatedDate(): string {
    if (this.user?.created_at) {
      return new Date(this.user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return 'N/A';
  }

  getUpdatedDate(): string {
    if (this.user?.updated_at) {
      return new Date(this.user.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return 'N/A';
  }
}
