import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  resetCode = '';
  newPassword = '';
  showPassword = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.email || !this.resetCode || !this.newPassword) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters.';
      return;
    }

    if (!/[A-Z]/.test(this.newPassword)) {
      this.errorMessage = 'Password must contain at least one uppercase letter.';
      return;
    }

    if (!/[a-z]/.test(this.newPassword)) {
      this.errorMessage = 'Password must contain at least one lowercase letter.';
      return;
    }

    if (!/\d/.test(this.newPassword)) {
      this.errorMessage = 'Password must contain at least one number.';
      return;
    }

    if (!/[\W_]/.test(this.newPassword)) {
      this.errorMessage = 'Password must contain at least one special character.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword({
      email: this.email,
      reset_code: this.resetCode,
      new_password: this.newPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password has been reset successfully. Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        let detail = err.error?.detail;
        if (Array.isArray(detail)) {
          detail = detail[0].msg;
        }
        this.errorMessage = detail || 'Failed to reset password. Please try again.';
      }
    });
  }
}
