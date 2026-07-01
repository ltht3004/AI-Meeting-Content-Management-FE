import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/meeting-list/meeting-list').then(m => m.MeetingList)
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/meeting-create/meeting-create').then(m => m.MeetingCreate)
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/meeting-detail/meeting-detail').then(m => m.MeetingDetail)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/meeting-edit/meeting-edit').then(m => m.MeetingEdit)
  }
];
export default routes;
