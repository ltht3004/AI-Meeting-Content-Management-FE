import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface MeetingData {
  id: string;
  title: string;
  description: string;
  meeting_date: string;
  location: string;
  duration: number;
  participants: string;
}

@Component({
  selector: 'app-meeting-edit',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './meeting-edit.html',
  styleUrl: './meeting-edit.css'
})
export class MeetingEdit implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  meetingId!: string;
  meetingForm!: FormGroup;
  isSubmitting = false;

  // Mock Database
  private meetingsDb: Record<string, MeetingData> = {
    '1': {
      id: '1',
      title: 'Q3 Product Strategy Sync',
      description: 'Discuss product feature roadmap, timeline alignments, and core KPIs for the upcoming quarter.',
      meeting_date: '2023-10-24T14:00',
      location: 'Meeting Room A',
      duration: 45,
      participants: 'Alex Rivera, Sarah Connor, David Miller'
    },
    '2': {
      id: '2',
      title: 'Customer Feedback Loop',
      description: 'Review recent feedback from enterprise client pilot runs and plan bug fixes.',
      meeting_date: '2023-10-23T11:30',
      location: 'Zoom Online',
      duration: 60,
      participants: 'Sarah Connor, Emma Watson, John Doe'
    },
    '3': {
      id: '3',
      title: 'Design System Refactor',
      description: 'Refactor component spacing, font weight variables, and light/dark theme utilities.',
      meeting_date: '2023-10-22T09:00',
      location: 'Room 404',
      duration: 30,
      participants: 'Alex Rivera, John Doe, Peter Parker'
    },
    '4': {
      id: '4',
      title: 'Urgent: Server Outage Review',
      description: 'Post-mortem review of yesterday server memory overflow and database connection pool fixes.',
      meeting_date: '2023-10-21T17:45',
      location: 'MS Teams',
      duration: 90,
      participants: 'Alex Rivera, David Miller, Emma Watson'
    }
  };

  ngOnInit() {
    this.meetingId = this.route.snapshot.paramMap.get('id') || '1';
    
    this.meetingForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      meeting_date: ['', [Validators.required]],
      location: ['', [Validators.required]],
      duration: [60, [Validators.required, Validators.min(5)]],
      participants: ['', [Validators.required]]
    });

    this.loadMeetingData();
  }

  loadMeetingData() {
    const meeting = this.meetingsDb[this.meetingId];
    if (meeting) {
      let formattedDate = meeting.meeting_date;
      if (formattedDate.includes('Z')) {
        formattedDate = formattedDate.replace('Z', '').substring(0, 16);
      }
      
      this.meetingForm.patchValue({
        title: meeting.title,
        description: meeting.description,
        meeting_date: formattedDate,
        location: meeting.location,
        duration: meeting.duration,
        participants: meeting.participants
      });
    } else {
      alert('Meeting not found!');
      this.router.navigate(['/meetings']);
    }
  }

  onSubmit() {
    if (this.meetingForm.invalid) {
      this.meetingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    // Simulate API update delay
    setTimeout(() => {
      console.log('Meeting updated:', this.meetingForm.value);
      this.isSubmitting = false;
      this.router.navigate(['/meetings', this.meetingId]);
    }, 1000);
  }

  isInvalid(fieldName: string): boolean {
    const control = this.meetingForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
