import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { SearchService } from '../../services/search.service';
import { AuthService } from '../../../core/services/auth.service';
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
  private router = inject(Router);

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
