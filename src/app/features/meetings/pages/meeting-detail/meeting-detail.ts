import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonComponent } from '../../../../shared/components/button/button';
import { DropdownComponent } from '../../../../shared/components/dropdown/dropdown';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { MeetingService, Meeting } from '../../../../core/services/meeting.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';

interface ParticipantDetail {
  name: string;
  status: string;
  is_active: boolean;
}

interface MeetingDetailData extends Meeting {
  creator_id: string;
  recordings: any[];
  transcripts: Record<string, any[]>;
  summary?: {
    content: string;
  };
  participant_details: ParticipantDetail[];
}

@Component({
  selector: 'app-meeting-detail',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    FormsModule,
    ButtonComponent,
    DropdownComponent,
    ConfirmDialog
  ],
  templateUrl: './meeting-detail.html',
  styleUrl: './meeting-detail.css'
})
export class MeetingDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private toastService = inject(ToastService);
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  meetingId!: string;
  meeting!: MeetingDetailData;
  isLoading = true;

  activeTab: 'summary' | 'transcript' = 'summary';

  selectedRecordingId = '';
  isExporting = false;
  showPreviewModal = false;
  showParticipantsModal = false;
  showExportDropdown = false;
  showDeleteRecConfirm = false;

  recToDelete = '';
  recNameToDelete = '';
  exportType: 'pdf' | 'word' = 'pdf';

  today = new Date();

  get currentUserId(): string {
    return this.authService.currentUser()?.id || '';
  }

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'admin';
  }

  isDragOver = false;
  isUploading = false;
  uploadProgress = 0;
  isProcessing = false;
  processingStep = 0;

  processingStepsText = [
    'Transcribing audio to text...',
    'Identifying speakers and timestamps...',
    'Updating meeting AI summary...'
  ];

  transcriptSearch = '';

  ngOnInit() {
    this.meetingId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.meetingId) {
      this.toastService.error('Error', 'Meeting ID is missing.');
      this.router.navigate(['/meetings']);
      return;
    }

    this.loadMeetingDetail();
  }

  loadMeetingDetail() {
    this.isLoading = true;
    this.meetingService.getMeetingById(this.meetingId, this.currentUserId).subscribe({
      next: (data) => {
        this.meeting = {
          ...data,
          creator_id: data.user_id,
          status: this.normalizeStatus(data.status),
          recordings: (data as any).recordings || [],
          transcripts: {},
          summary: undefined,
          participant_details: (data as any).participant_details || []
        };

        this.selectedRecordingId = this.meeting.recordings[0]?.id || '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Error', 'Cannot load meeting detail.');
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/meetings']);
      }
    });
  }

  normalizeStatus(status: string): 'scheduled' | 'processing' | 'completed' {
    const value = status?.toLowerCase();

    if (value === 'completed') return 'completed';
    if (value === 'processing' || value === 'archived') return 'processing';

    return 'scheduled';
  }

  getOtherParticipantsTooltip(others: any[]): string {
    if (!others) return '';
    return others.map(o => o.name.trim() + (o.status === 'Unactive' || !o.is_active ? ' (Unactive)' : '')).join(', ');
  }

  selectRecording(recId: string) {
    this.selectedRecordingId = recId;
    this.transcriptSearch = '';
  }

  getSelectedRecording() {
    return this.meeting?.recordings.find(r => r.id === this.selectedRecordingId);
  }

  getRecordingUrl(recording: any): string {
    if (!recording?.file_url) return '';
    if (recording.file_url.startsWith('http')) return recording.file_url;

    return this.api.baseUrl.replace('/api/v1', '') + recording.file_url;
  }

  formatRecordingSize(size: number): string {
    if (!size) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const value = size / Math.pow(1024, unitIndex);

    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  deleteRecording(recId: string, event: Event) {
    event.stopPropagation();
    this.recToDelete = recId;
    this.recNameToDelete = 'Recording';
    this.showDeleteRecConfirm = true;
  }

  onConfirmDeleteRec() {
    this.showDeleteRecConfirm = false;
    this.recToDelete = '';
    this.recNameToDelete = '';
    this.toastService.info('Info', 'Recording API is not implemented yet.');
  }

  onCancelDeleteRec() {
    this.showDeleteRecConfirm = false;
    this.recToDelete = '';
    this.recNameToDelete = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.uploadRecording(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.uploadRecording(file);
    }

    input.value = '';
  }

  uploadRecording(file: File) {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac'];
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.opus', '.flac'];
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some(ext => lowerName.endsWith(ext));

    if (!allowedTypes.includes(file.type) && !hasAllowedExtension) {
      this.toastService.error('Invalid file', 'Please upload an audio file (.mp3, .wav, .m4a, .ogg, .opus, .aac, .flac).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    this.isUploading = true;
    this.uploadProgress = 0;
    this.isProcessing = false;

    this.http.post<any>(
      `${this.api.recordings}/upload/${this.meetingId}`,
      formData,
      {
        reportProgress: true,
        observe: 'events'
      }
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total || file.size;
          this.uploadProgress = Math.round((event.loaded / total) * 100);
          this.cdr.detectChanges();
        }

        if (event.type === HttpEventType.Response) {
          this.isUploading = false;
          this.uploadProgress = 100;
          this.toastService.success('Uploaded', 'Recording uploaded successfully.');
          this.loadMeetingDetail();
        }
      },
      error: (err) => {
        console.error(err);
        this.isUploading = false;
        this.uploadProgress = 0;
        this.toastService.error('Upload failed', err?.error?.detail || 'Cannot upload recording.');
        this.cdr.detectChanges();
      }
    });
  }

  getFilteredTranscript(): any[] {
    return [];
  }

  triggerExport(type: 'pdf' | 'word') {
    this.exportType = type;
    this.showExportDropdown = false;
    this.showPreviewModal = true;
  }

  closePreview() {
    this.showPreviewModal = false;
  }

  downloadReport() {
    this.showPreviewModal = false;
    this.toastService.info('Info', 'Export API is not implemented yet.');
  }

  openParticipantsModal() {
    this.showParticipantsModal = true;
    this.cdr.detectChanges();
  }

  closeParticipantsModal() {
    this.showParticipantsModal = false;
    this.cdr.detectChanges();
  }
}
