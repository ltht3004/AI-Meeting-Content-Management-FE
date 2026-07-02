import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meeting-create',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './meeting-create.html',
  styleUrl: './meeting-create.css'
})
export class MeetingCreate implements OnInit {
  meetingForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.meetingForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      meeting_date: ['', [Validators.required]],
      location: ['', [Validators.required]],
      duration: [60, [Validators.required, Validators.min(5)]],
      participants: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.meetingForm.invalid) {
      this.meetingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    
    // Simulate API request delay
    setTimeout(() => {
      console.log('Meeting created:', this.meetingForm.value);
      this.isSubmitting = false;
      this.router.navigate(['/meetings']);
    }, 1000);
  }

  isInvalid(fieldName: string): boolean {
    const control = this.meetingForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
