import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './button.html',
  styleUrl: './button.css'
})
export class ButtonComponent {
  @Input() type: 'primary' | 'secondary' | 'danger' | 'link' | 'back' | 'view-detail' | 'delete' = 'primary';
  @Input() nativeType: 'button' | 'submit' | 'reset' = 'button';
  @Input() icon?: string;
  @Input() routerLink?: string | any[];
  @Input() disabled: boolean = false;
  @Input() title?: string;

  @Output() btnClick = new EventEmitter<MouseEvent>();

  getButtonClass(): string {
    switch (this.type) {
      case 'back':
        return 'back-link';
      case 'view-detail':
        return 'btn-action-view';
      case 'delete':
        return 'btn-action-delete';
      case 'secondary':
        return 'btn btn-secondary';
      case 'danger':
        return 'btn btn-danger';
      case 'link':
        return 'btn-link';
      default:
        return 'btn btn-primary';
    }
  }

  onClick(event: MouseEvent) {
    if (!this.disabled) {
      this.btnClick.emit(event);
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
