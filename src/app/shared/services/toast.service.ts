import { Injectable, signal } from '@angular/core';

export interface ToastConfig {
  show: boolean;
  title: string;
  desc: string;
  type: 'success' | 'danger' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toast = signal<ToastConfig>({
    show: false,
    title: '',
    desc: '',
    type: 'success'
  });

  show(title: string, desc: string, type: 'success' | 'danger' | 'info' = 'success', duration = 3000) {
    this.toast.set({
      show: true,
      title,
      desc,
      type
    });

    setTimeout(() => {
      this.hide();
    }, duration);
  }

  success(title: string, desc: string, duration = 3000) {
    this.show(title, desc, 'success', duration);
  }

  error(title: string, desc: string, duration = 3000) {
    this.show(title, desc, 'danger', duration);
  }

  info(title: string, desc: string, duration = 3000) {
    this.show(title, desc, 'info', duration);
  }

  hide() {
    this.toast.update(state => ({ ...state, show: false }));
  }
}
