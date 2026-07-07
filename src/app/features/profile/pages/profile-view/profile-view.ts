import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './profile-view.html',
  styleUrl: './profile-view.css'
})
export class ProfileView implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  isEditing = false;
  editName = '';
  editEmail = '';
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  // Mock statistics
  stats = {
    totalMeetings: 128,
    meetingsGrowth: 12,
    totalRecordings: 94,
    recordingsGrowth: 5,
    totalTranscripts: 2104,
    transcriptsGrowth: 18,
    totalSummaries: 312,
    summariesGrowth: 24,
    totalQuota: 600,
    usedQuota: 450,
    resetDate: 'Nov 01, 2024'
  };

  ngOnInit() {
    this.authService.getProfile().subscribe();
  }

  get user() {
    return this.authService.currentUser();
  }

  startEdit() {
    this.isEditing = true;
    this.editName = this.user?.full_name || '';
    this.editEmail = this.user?.email || '';
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit() {
    this.isEditing = false;
    this.errorMessage = '';
  }

  saveProfile() {
    if (!this.editName || !this.editEmail) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.updateProfile({
      full_name: this.editName,
      email: this.editEmail
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Update failed.';
      }
    });
  }

  getCreatedDate(): string {
    return 'Oct 12, 2023';
  }

  getUpdatedDate(): string {
    return 'Oct 12, 2023';
  }
}
