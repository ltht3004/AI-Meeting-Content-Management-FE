import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  authService = inject(AuthService);

  get isAdmin(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'admin';
  }

  logout() {
    this.authService.logout();
  }
}
