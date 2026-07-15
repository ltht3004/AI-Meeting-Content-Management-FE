import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { SearchService } from '../../services/search.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, Sidebar, FormsModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  searchService = inject(SearchService);
  authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  get avatarUrl(): string {
    const defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
    const user = this.authService.currentUser();
    if (user?.avatar_url) {
      if (user.avatar_url.startsWith('http://') || user.avatar_url.startsWith('https://')) {
        return user.avatar_url;
      }
      const rootUrl = this.apiService.baseUrl.replace('/api/v1', '');
      const path = user.avatar_url.startsWith('/') ? user.avatar_url : `/${user.avatar_url}`;
      return `${rootUrl}${path}`;
    }
    return defaultAvatar;
  }

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        if (!event.urlAfterRedirects.startsWith('/meetings')) {
          this.searchService.clearQuery();
        }
      });
  }
}
