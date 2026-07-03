import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../services/user.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.css'
})
export class UserEdit implements OnInit {
  userService = inject(UserService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  user: User | null = null;
  isLoading = true;
  isSaving = false;
  error = '';
  showToast = false;

  // Form fields
  editFullName = '';
  editEmail = '';
  editRole: 'admin' | 'user' = 'user';
  editStatus: 'Active' | 'Pending' = 'Active';

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
    this.editStatus = this.editStatus === 'Active' ? 'Pending' : 'Active';
  }

  saveChanges() {
    if (!this.user || !this.editFullName || !this.editEmail) return;

    this.isSaving = true;
    this.userService.updateUser(this.user.id, {
      full_name: this.editFullName,
      email: this.editEmail,
      role: this.editRole,
      status: this.editStatus
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSuccessToast();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = 'Failed to save changes.';
      }
    });
  }

  deleteUser() {
    if (!this.user) return;
    if (confirm('Are you sure you want to permanently remove this user? This action cannot be undone.')) {
      this.userService.deleteUser(this.user.id).subscribe(() => {
        this.router.navigate(['/users']);
      });
    }
  }

  showSuccessToast() {
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
      // Navigate back after toast hides
      this.router.navigate(['/users', this.user?.id]);
    }, 2500);
  }
}
