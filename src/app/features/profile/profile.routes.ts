import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/profile-view/profile-view').then(m => m.ProfileView)
  },
  {
    path: 'edit',
    loadComponent: () => import('./pages/profile-edit/profile-edit').then(m => m.ProfileEdit)
  }
];
export default routes;
