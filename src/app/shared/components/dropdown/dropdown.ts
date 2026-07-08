import { Component, Input, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css'
})
export class DropdownComponent {
  @Input() triggerText = '';
  @Input() icon?: string;
  @Input() iconClass = '';
  @Input() disabled = false;
  @Input() triggerClass = 'btn btn-secondary';
  
  isOpen = false;

  @Output() openStateChange = new EventEmitter<boolean>();

  constructor(private elementRef: ElementRef) {}

  toggle() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      this.openStateChange.emit(this.isOpen);
    }
  }

  close() {
    if (this.isOpen) {
      this.isOpen = false;
      this.openStateChange.emit(this.isOpen);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
