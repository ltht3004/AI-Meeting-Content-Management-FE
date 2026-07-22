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
  id?: string | null;
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

const MAX_RECORDING_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_RECORDING_SIZE_LABEL = '50MB';

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

  get canManageRecordings(): boolean {
    // Only admins and the meeting creator can upload or delete recordings.
    return this.isAdmin || this.meeting?.creator_id === this.currentUserId;
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
    // Meeting detail is permission-aware; currentUserId lets the backend validate access.
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
    return others.map(o => {
      if (o.status === 'Unavailable') return `${o.name.trim()} (Unavailable)`;
      return o.name.trim() + (this.isParticipantInactive(o) ? ' (Inactive)' : '');
    }).join(', ');
  }

  isParticipantInactive(participant: ParticipantDetail): boolean {
    return ['inactive', 'unactive'].includes(String(participant.status).toLowerCase()) || !participant.is_active;
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

    // Support legacy relative URLs while Supabase Storage returns absolute URLs.
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
    const recording = this.meeting?.recordings.find(rec => rec.id === recId);
    this.recToDelete = recId;
    this.recNameToDelete = recording?.file_name || 'Recording';
    this.showDeleteRecConfirm = true;
  }

  onConfirmDeleteRec() {
    this.showDeleteRecConfirm = false;
    const recordingId = this.recToDelete;
    const recordingName = this.recNameToDelete;

    if (!recordingId) return;

    // current_user_id is required because only the creator/admin may delete recordings.
    this.http.delete<{ message: string }>(
      `${this.api.recordings}/${recordingId}?current_user_id=${this.currentUserId}`
    ).subscribe({
      next: () => {
        this.toastService.success('Deleted', `"${recordingName}" has been deleted.`);
        this.recToDelete = '';
        this.recNameToDelete = '';
        this.loadMeetingDetail();
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Error', err?.error?.detail || 'Cannot delete recording.');
        this.recToDelete = '';
        this.recNameToDelete = '';
        this.cdr.detectChanges();
      }
    });
  }

  onCancelDeleteRec() {
    this.showDeleteRecConfirm = false;
    this.recToDelete = '';
    this.recNameToDelete = '';
  }

  onDragOver(event: DragEvent) {
    if (!this.canManageRecordings) return;

    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    if (!this.canManageRecordings) return;

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
    // Stop unauthorized users before opening any upload request.
    if (!this.canManageRecordings) {
      this.toastService.error('Permission denied', 'Only the meeting creator or an admin can upload recordings.');
      return;
    }

    // Validate by MIME type and extension because browsers report audio types differently.
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac'];
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.opus', '.flac'];
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some(ext => lowerName.endsWith(ext));

    if (!allowedTypes.includes(file.type) && !hasAllowedExtension) {
      this.toastService.error('Invalid file', 'Please upload an audio file (.mp3, .wav, .m4a, .ogg, .opus, .aac, .flac).');
      return;
    }

    if (file.size > MAX_RECORDING_SIZE_BYTES) {
      this.toastService.error('Upload failed', `File size must not exceed ${MAX_RECORDING_SIZE_LABEL}.`);
      return;
    }

    // Package the selected audio file for the FastAPI multipart upload endpoint.
    const formData = new FormData();
    formData.append('file', file);

    // Reset upload UI state before streaming progress events.
    this.isUploading = true;
    this.uploadProgress = 0;
    this.isProcessing = false;

    // Upload progress is streamed from HttpClient events so the UI can show progress.
    this.http.post<any>(
      `${this.api.recordings}/upload/${this.meetingId}?current_user_id=${this.currentUserId}`,
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
    // Map the UI label to the backend export format.
    const format = this.exportType === 'word' ? 'docx' : 'pdf';
    const fileName = `${this.slugify(this.meeting?.title || 'meeting')}-report.${format}`;
    const url = `${this.api.meetings}/${this.meetingId}/export?format=${format}&current_user_id=${this.currentUserId}`;

    // Close the preview before downloading so the user sees one clear action state.
    this.isExporting = true;
    this.showPreviewModal = false;

    // Report export returns a binary blob that the browser downloads as PDF or DOCX.
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(downloadUrl);

        this.isExporting = false;
        this.toastService.success('Exported', 'Report downloaded successfully.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isExporting = false;
        this.toastService.error('Export failed', err?.error?.detail || 'Cannot export report.');
        this.cdr.detectChanges();
      }
    });
  }

  slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'meeting';
  }

  openParticipantsModal() {
    this.showParticipantsModal = true;
    this.cdr.detectChanges();
  }

  closeParticipantsModal() {
    this.showParticipantsModal = false;
    this.cdr.detectChanges();
  }

  openParticipantProfile(participant: ParticipantDetail) {
    if (!participant.id || participant.status === 'Unavailable') return;

    // Preserve the meeting detail URL so the browser Back flow returns to this meeting.
    this.showParticipantsModal = false;
    this.router.navigate(['/users', participant.id], {
      queryParams: { returnTo: `/meetings/${this.meetingId}` }
    });
  }
}
