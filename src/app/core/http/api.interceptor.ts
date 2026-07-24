import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('token');
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  let cloned = req;
  if (token) {
    cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        const errorDetail = error.error?.detail;
        if (errorDetail === 'Account has been disabled') {
          if (!req.url.includes('/auth/login')) {
            toastService.error('Forbidden', 'Your account has been disabled. Please contact the administrator.');
            authService.logout();
          }
          return throwError(() => error);
        }
      }
      return throwError(() => error);
    })
  );
};
