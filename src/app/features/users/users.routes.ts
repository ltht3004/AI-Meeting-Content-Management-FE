import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/user-list/user-list').then(m => m.UserList)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/user-detail/user-detail').then(m => m.UserDetail)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/user-edit/user-edit').then(m => m.UserEdit)
  }
];
export default routes;
