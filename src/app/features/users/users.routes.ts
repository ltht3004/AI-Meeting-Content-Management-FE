import { Routes } from '@angular/router';
import { adminGuard } from '../../core/auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/user-list/user-list').then(m => m.UserList),
    canActivate: [adminGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/user-detail/user-detail').then(m => m.UserDetail)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/user-edit/user-edit').then(m => m.UserEdit),
    canActivate: [adminGuard]
  }
];
export default routes;
