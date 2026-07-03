import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { switchMap } from 'rxjs/operators';

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

  user: User | null = null;
  isLoading = true;
  error = '';

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
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user details.';
        this.isLoading = false;
      }
    });
  }
}
