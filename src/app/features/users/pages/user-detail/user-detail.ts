import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css'
})
export class UserDetail implements OnInit {
  userService = inject(UserService);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  user: User | null = null;
  isLoading = true;
  error = '';
  returnTo = '';

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'admin';
  }

  getAvatarUrl(avatarUrl: string | undefined): string {
    const defaultAvatar = 'assets/images/default-avatar.png';
    if (avatarUrl) {
      if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return avatarUrl;
      }
      const rootUrl = this.apiService.baseUrl.replace('/api/v1', '');
      const path = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
      return `${rootUrl}${path}`;
    }
    return defaultAvatar;
  }

  ngOnInit() {
    this.returnTo = this.route.snapshot.queryParamMap.get('returnTo') || '';

    this.route.paramMap.pipe(
      switchMap(params => {
        this.isLoading = true;
        const id = params.get('id') || '';
        return forkJoin({
          user: this.userService.getUserById(id),
          stats: this.userService.getUserStats(id)
        });
      })
    ).subscribe({
      next: ({user, stats}) => {
        this.user = user;
        this.user.stats = stats;
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
}
