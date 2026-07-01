import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'transcript/:id',
    loadComponent: () => import('./pages/transcript/transcript').then(m => m.Transcript)
  },
  {
    path: 'summary/:id',
    loadComponent: () => import('./pages/summary/summary').then(m => m.Summary)
  }
];
export default routes;
