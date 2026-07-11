import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  onSubmit() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password reset code has been sent to your email.';
        setTimeout(() => {
          this.router.navigate(['/auth/reset-password'], { queryParams: { email: this.email } });
        }, 1500);
      },
      error: (err) => {
        this.isLoading = false;
        let detail = err.error?.detail;
        if (Array.isArray(detail)) {
          detail = detail[0].msg;
        }
        this.errorMessage = detail || 'Failed to send link. Please try again.';
      }
    });
  }
}
