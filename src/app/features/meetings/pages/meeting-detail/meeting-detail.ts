import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TranscriptSegment {
  time: string;
  speaker: string;
  text: string;
}

interface RecordingData {
  id: string;
  file_name: string;
  size: string;
  created_at: string;
}

interface MeetingDetailData {
  id: string;
  title: string;
  description: string;
  meeting_date: string;
  location: string;
  duration: number;
  participants: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  status: 'scheduled' | 'processing' | 'completed';
  recordings: RecordingData[];
  transcripts: Record<string, TranscriptSegment[]>; // recording_id -> TranscriptSegment[]
  summary?: {
    content: string;
  };
}

@Component({
  selector: 'app-meeting-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './meeting-detail.html',
  styleUrl: './meeting-detail.css'
})
export class MeetingDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  meetingId!: string;
  meeting!: MeetingDetailData;
  activeTab: 'summary' | 'transcript' = 'summary';
  showToast = false;

  // Selection state for multiple recordings
  selectedRecordingId = '';
  isExporting = false;
  showPreviewModal = false;
  showExportDropdown = false;
  exportType: 'pdf' | 'word' = 'pdf';
  today = new Date();
  currentUserId = '1'; // Mock logged-in user ID
  isAdmin = false;      // Mock admin privilege toggler

  // Upload & processing simulator states
  isDragOver = false;
  isUploading = false;
  uploadProgress = 0;
  isProcessing = false;
  processingStep = 0; // 0: Speech-to-Text, 1: Formatting, 2: AI Summarization
  processingStepsText = [
    'Transcribing audio to text...',
    'Identifying speakers and timestamps...',
    'Updating meeting AI summary...'
  ];

  transcriptSearch = '';

  // Database simulator
  private meetingsDb: Record<string, MeetingDetailData> = {
    '1': {
      id: '1',
      title: 'Q3 Product Strategy Sync',
      description: 'Discuss product feature roadmap, timeline alignments, and core KPIs for the upcoming quarter.',
      meeting_date: '2023-10-24T14:00:00Z',
      location: 'Meeting Room A',
      duration: 45,
      participants: 'Alex Rivera, Sarah Connor, David Miller',
      created_at: '2023-10-24T08:00:00Z',
      updated_at: '2023-10-24T10:30:00Z',
      creator_id: '1',
      status: 'completed',
      recordings: [
        { id: 'rec_1', file_name: 'strategy_sync_q3_part1.mp3', size: '12.8 MB', created_at: '2023-10-24T14:05:00Z' },
        { id: 'rec_2', file_name: 'strategy_sync_q3_part2.mp3', size: '10.0 MB', created_at: '2023-10-24T14:35:00Z' }
      ],
      transcripts: {
        'rec_1': [
          { time: '00:02', speaker: 'Alex Rivera', text: 'Hi everyone, thanks for joining today. Let us sync on our strategy and roadmap for Q3. Sarah, how are things looking on the technical side?' },
          { time: '00:30', speaker: 'Sarah Connor', text: 'Good morning. On the dev side, our primary technical debt is refactoring the database connection pool. It will take about 2 weeks, but it is critical for scaling.' }
        ],
        'rec_2': [
          { time: '00:05', speaker: 'David Miller', text: 'From the product side, that makes sense. But we also have the marketing campaign launching in mid-November. We need the API ready by then.' },
          { time: '00:45', speaker: 'Alex Rivera', text: 'Right. So Sarah, can we prioritize the API endpoints needed for marketing first, and run the deep DB refactor in parallel?' },
          { time: '01:10', speaker: 'Sarah Connor', text: 'Yes, that is doable. I will set up the core endpoints by next week. David can then integrate them with the landing pages.' }
        ]
      },
      summary: {
        content: 'The team synced on the Q3 Product Strategy. Part 1 covered technical refactoring where Sarah identified refactoring the database connection pool as critical technical debt (estimated at 2 weeks). Part 2 covered product schedules, where David highlighted the mid-November marketing campaign. Key agreements include prioritizing core API endpoints for marketing by next Friday, while running database refactoring in parallel.'
      }
    },
    '2': {
      id: '2',
      title: 'Customer Feedback Loop',
      description: 'Review recent feedback from enterprise client pilot runs and plan bug fixes.',
      meeting_date: '2023-10-23T11:30:00Z',
      location: 'Zoom Online',
      duration: 60,
      participants: 'Sarah Connor, Emma Watson, John Doe',
      created_at: '2023-10-23T09:00:00Z',
      updated_at: '2023-10-23T11:45:00Z',
      creator_id: '2',
      status: 'completed',
      recordings: [
        { id: 'rec_3', file_name: 'customer_feedback_loop_23.mp3', size: '34.1 MB', created_at: '2023-10-23T11:30:00Z' }
      ],
      transcripts: {
        'rec_3': [
          { time: '00:05', speaker: 'Emma Watson', text: 'Hello team, let us go through the enterprise feedback from the last week. The biggest concern raised is dashboard rendering latency.' },
          { time: '00:35', speaker: 'John Doe', text: 'Yes, we saw some logs showing loading times over 4 seconds on the dashboard KPI stats.' },
          { time: '01:05', speaker: 'Sarah Connor', text: 'That is likely due to the un-indexed query on recent meetings history. I can add database indexes to solve this.' },
          { time: '01:45', speaker: 'Emma Watson', text: 'Great. Let us get those indexes deployed as soon as possible. Our customers are complaining about it.' }
        ]
      },
      summary: {
        content: 'Weekly sync to review customer feedback. Dashboard loading latency was identified as the primary complaint, with load times exceeding 4 seconds. The team isolated the root cause to missing database indexes on recent meetings history queries, which Sarah will resolve and apply indexes shortly. John will monitor dashboard API response times post-release.'
      }
    },
    '3': {
      id: '3',
      title: 'Design System Refactor',
      description: 'Refactor component spacing, font weight variables, and light/dark theme utilities.',
      meeting_date: '2023-10-22T09:00:00Z',
      location: 'Room 404',
      duration: 30,
      participants: 'Alex Rivera, John Doe, Peter Parker',
      created_at: '2023-10-22T08:30:00Z',
      updated_at: '2023-10-22T08:30:00Z',
      creator_id: '1',
      status: 'scheduled',
      recordings: [],
      transcripts: {}
    },
    '4': {
      id: '4',
      title: 'Urgent: Server Outage Review',
      description: 'Post-mortem review of yesterday server memory overflow and database connection pool fixes.',
      meeting_date: '2023-10-21T17:45:00Z',
      location: 'MS Teams',
      duration: 90,
      participants: 'Alex Rivera, David Miller, Emma Watson',
      created_at: '2023-10-21T17:00:00Z',
      updated_at: '2023-10-21T17:00:00Z',
      creator_id: '3',
      status: 'scheduled',
      recordings: [],
      transcripts: {}
    }
  };

  ngOnInit() {
    this.meetingId = this.route.snapshot.paramMap.get('id') || '1';
    this.meeting = this.meetingsDb[this.meetingId] || this.meetingsDb['1'];

    // Select first recording by default if exists
    if (this.meeting.recordings && this.meeting.recordings.length > 0) {
      this.selectedRecordingId = this.meeting.recordings[0].id;
    }

    // Listen for success toast query param
    this.route.queryParams.subscribe(params => {
      if (params['edited'] === 'true') {
        this.showToast = true;
        this.cdr.detectChanges();
        
        // Auto hide toast after 3 seconds
        setTimeout(() => {
          this.showToast = false;
          this.cdr.detectChanges();
          
          // Clear query parameter without page reload
          this.router.navigate([], {
            queryParams: { edited: null },
            queryParamsHandling: 'merge'
          });
        }, 3000);
      }
    });
  }

  selectRecording(recId: string) {
    this.selectedRecordingId = recId;
    this.transcriptSearch = ''; // Reset search on select
  }

  getSelectedRecording() {
    return this.meeting.recordings.find(r => r.id === this.selectedRecordingId);
  }

  // Drag & Drop event handlers
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
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.startUploadSimulation(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.startUploadSimulation(input.files[0]);
    }
  }

  private startUploadSimulation(file: File) {
    this.isUploading = true;
    this.uploadProgress = 0;
    this.meeting.status = 'processing';

    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        this.isUploading = false;
        this.startProcessingSimulation(file.name);
      }
    }, 200);
  }

  private startProcessingSimulation(fileName: string) {
    this.isProcessing = true;
    this.processingStep = 0;

    const runStep = () => {
      setTimeout(() => {
        this.processingStep++;
        if (this.processingStep < 3) {
          runStep();
        } else {
          // Finished! Populate new mock recording in the list
          this.isProcessing = false;
          this.meeting.status = 'completed';
          const newRecId = 'rec_' + (Object.keys(this.meeting.transcripts).length + 1);

          const newRecording: RecordingData = {
            id: newRecId,
            file_name: fileName,
            size: '18.5 MB',
            created_at: new Date().toISOString()
          };

          this.meeting.recordings.push(newRecording);

          this.meeting.transcripts[newRecId] = [
            { time: '00:00', speaker: 'Presenter', text: 'Welcome to this additional recording session. Today we are finishing our follow-up discussions.' },
            { time: '00:45', speaker: 'Sarah Connor', text: 'We verified the API and spacing changes. The indexes were also pushed successfully.' },
            { time: '01:20', speaker: 'Alex Rivera', text: 'Great work team. That concludes our follow-up.' }
          ];

          // Select the newly uploaded recording
          this.selectedRecordingId = newRecId;

          // Append or regenerate the global summary
          this.meeting.summary = {
            content: (this.meeting.summary?.content || '') + ' In an additional session, the team confirmed that both spacing changes and database indexes were verified and successfully pushed to remote.'
          };
        }
      }, 1500); // 1.5 seconds per step
    };

    runStep();
  }

  getFilteredTranscript(): TranscriptSegment[] {
    const activeTranscript = this.meeting.transcripts[this.selectedRecordingId];
    if (!activeTranscript) return [];
    if (!this.transcriptSearch.trim()) return activeTranscript;

    const search = this.transcriptSearch.toLowerCase().trim();
    return activeTranscript.filter(t =>
      t.speaker.toLowerCase().includes(search) ||
      t.text.toLowerCase().includes(search)
    );
  }

  toggleExportDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
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
    this.isExporting = true;

    // Simulate API delay for generation
    setTimeout(() => {
      this.isExporting = false;
      const fileExt = this.exportType === 'pdf' ? 'pdf' : 'docx';
      const fileTypeLabel = this.exportType === 'pdf' ? 'PDF Report' : 'Word Document';
      alert(`${fileTypeLabel} downloaded successfully for "${this.meeting.title}"!\n\nDownloaded file: ${this.meeting.title.toLowerCase().replace(/ /g, '_')}_report.${fileExt}`);
    }, 1500);
  }
}
