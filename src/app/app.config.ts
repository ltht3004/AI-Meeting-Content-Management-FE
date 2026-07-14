import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

import { routes } from './app.routes';
import { apiInterceptor } from './core/http/api.interceptor';

registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), 
    { provide: LOCALE_ID, useValue: 'vi-VN' },
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor]))
  ],
};
