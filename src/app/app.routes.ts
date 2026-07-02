import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  // Authentication Routes (unauthenticated)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes')
  },

  // Authorized Application Shell Dashboard
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes')
      },
      {
        path: 'meetings',
        loadChildren: () => import('./features/meetings/meetings.routes')
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes')
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes'),
        canActivate: [adminGuard]
      }
    ]
  },

  // Fallback Route redirection
  {
    path: '**',
    redirectTo: ''
  }
];
