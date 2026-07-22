import { Component, OnInit, HostListener, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ToastService } from '../../../../shared/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../../core/services/api.service';
import { MeetingService } from '../../../../core/services/meeting.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-meeting-create',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, FormsModule, ButtonComponent],
  templateUrl: './meeting-create.html',
  styleUrl: './meeting-create.css'
})
export class MeetingCreate implements OnInit {
  meetingForm!: FormGroup;
  isSubmitting = false;
  showUsersDropdown = false;
  private toastService = inject(ToastService);
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private meetingService = inject(MeetingService);
  private authService = inject(AuthService);

  // Map Picker State
  showMapModal = false;
  map: any;
  marker: any;
  selectedAddress = '';
  isMapSearching = false;
  mapSearchQuery = '';
  mapSuggestions: any[] = [];
  showSuggestions = false;
  private searchDebounceTimeout: any;

  userSearchQuery = '';

  get filteredAvailableUsers() {
    return this.availableUsers;
  }

  availableUsers: any[] = [];
  existingMeetingTitles: string[] = [];
  usersPage = 1;
  usersPageSize = 10;
  isLoadingUsers = false;
  hasMoreUsers = true;
  private searchUsersTimeout: any;
  private usersById = new Map<string, any>();

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.meetingForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), this.uniqueTitleValidator()]],
      description: ['', [Validators.maxLength(255)]],
      meeting_date: ['', [Validators.required, this.futureDateValidator(), this.workingHoursValidator()]],
      location: ['', [Validators.required]],
      duration: [60, [Validators.required, Validators.min(15), Validators.max(240)]],
      participants: ['', [Validators.required, this.minParticipantsValidator(2)]]
    });

    this.loadAvailableUsers(false);

    this.meetingService.getMeetings('all', '', 1, 100).subscribe({
      next: (data: any) => {
        if (data && data.meetings) {
          this.existingMeetingTitles = data.meetings.map((m: any) => m.title);
        }
      }
    });
  }

  uniqueTitleValidator() {
    return (control: any) => {
      const val = control.value;
      if (!val) return null;
      const normalizedVal = val.trim().toLowerCase();
      const isDuplicate = this.existingMeetingTitles.some(
        title => title.trim().toLowerCase() === normalizedVal
      );
      return isDuplicate ? { duplicateTitle: true } : null;
    };
  }

  getMinDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  futureDateValidator() {
    return (control: any) => {
      const val = control.value;
      if (!val) return null;
      const selectedDate = new Date(val);
      const now = new Date();
      // Allow a 1-minute buffer for timezone latency
      return selectedDate.getTime() > now.getTime() - 60000 ? null : { pastDate: true };
    };
  }

  workingHoursValidator() {
    return (control: any) => {
      const val = control.value;
      if (!val) return null;
      
      const date = new Date(val);
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = date.getHours();
      const minutes = date.getMinutes();
      
      // Check weekend (Monday to Friday only)
      if (day === 0 || day === 6) {
        return { weekend: true };
      }
      
      // Convert to minutes from midnight
      const timeInMinutes = hour * 60 + minutes;
      const startWork = 8 * 60; // 08:00
      const endWork = 17 * 60 + 30; // 17:30
      
      const startLunch = 12 * 60; // 12:00
      const endLunch = 13 * 60 + 30; // 13:30
      
      if (timeInMinutes < startWork || timeInMinutes > endWork) {
        return { workingHours: true };
      }
      
      if (timeInMinutes >= startLunch && timeInMinutes < endLunch) {
        return { lunchBreak: true };
      }
      
      return null;
    };
  }

  onDateTimeChange() {
    const control = this.meetingForm.get('meeting_date');
    if (!control) return;

    control.markAsDirty();
    control.markAsTouched();
    control.updateValueAndValidity();

    const errors = control.errors;
    if (!errors) return;

    let message = '';
    if (errors['pastDate']) {
      message = 'Meeting date cannot be in the past.';
    } else if (errors['weekend']) {
      message = 'Meeting must be scheduled on weekdays.';
    } else if (errors['lunchBreak']) {
      message = 'Meeting cannot be scheduled during lunch break (12:00 - 13:30).';
    } else if (errors['workingHours']) {
      message = 'Meeting must be scheduled during working hours (08:00 - 17:30).';
    }

    if (message) {
      this.toastService.error('Invalid Date & Time', message);
      control.setValue('');
      control.markAsTouched();
    }
  }

  minParticipantsValidator(min: number) {
    return (control: any) => {
      const val = control.value || '';
      const list = val.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0);
      return list.length >= min ? null : { minParticipants: true };
    };
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.showUsersDropdown = false;
  }

  toggleUsersDropdown(event: Event) {
    event.stopPropagation();
    this.showUsersDropdown = !this.showUsersDropdown;
    if (this.showUsersDropdown) {
      this.userSearchQuery = '';
    }
  }

  toggleUserSelection(id: string) {
    // The form stores participant IDs, while the dropdown displays friendly names.
    const control = this.meetingForm.get('participants');
    let currentVal = control?.value || '';
    let selectedList = currentVal ? currentVal.split(',').map((n: string) => n.trim()) : [];
    const selectedUser = this.availableUsers.find(user => user.id === id);

    if (selectedUser) {
      this.usersById.set(id, selectedUser);
    }
    
    if (selectedList.includes(id)) {
      selectedList = selectedList.filter((n: string) => n !== id);
    } else {
      selectedList.push(id);
    }
    
    control?.setValue(selectedList.join(', '));
    control?.markAsDirty();
    control?.markAsTouched();
  }

  isUserSelected(id: string): boolean {
    const currentVal = this.meetingForm.get('participants')?.value || '';
    if (!currentVal) return false;
    const selectedList = currentVal.split(',').map((n: string) => n.trim());
    return selectedList.includes(id);
  }

  getSelectedNamesDisplay(): string {
    // Resolve selected IDs back to names for display inside the collapsed participant field.
    const val = this.meetingForm.get('participants')?.value || '';
    if (!val) return '';
    const ids = val.split(',').map((id: string) => id.trim());
    return ids.map((id: string) => {
      const u = this.usersById.get(id) || this.availableUsers.find(user => user.id === id);
      return u ? u.full_name : id;
    }).join(', ');
  }

  loadAvailableUsers(append = false) {
    if (this.isLoadingUsers) return;
    
    this.isLoadingUsers = true;
    const skip = (this.usersPage - 1) * this.usersPageSize;
    // Participant search uses the dedicated participants API instead of the admin users API.
    const queryParams = `?skip=${skip}&limit=${this.usersPageSize}&search=${encodeURIComponent(this.userSearchQuery.trim())}`;
    
    this.http.get<any>(`${this.api.users}/participants${queryParams}`).subscribe({
      next: (res) => {
        this.isLoadingUsers = false;
        const users = res.items || res.users || [];
        const total = res.total_count ?? res.total ?? 0;
        users.forEach((user: any) => this.usersById.set(user.id, user));
        
        if (append) {
          this.availableUsers = [...this.availableUsers, ...users];
        } else {
          this.availableUsers = users;
        }
        
        this.hasMoreUsers = this.availableUsers.length < total;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingUsers = false;
        this.toastService.error('Error', 'Failed to load participants.');
      }
    });
  }

  onUserSearchInput() {
    if (this.searchUsersTimeout) {
      clearTimeout(this.searchUsersTimeout);
    }
    this.searchUsersTimeout = setTimeout(() => {
      this.usersPage = 1;
      this.hasMoreUsers = true;
      this.loadAvailableUsers(false);
    }, 300);
  }

  onDropdownScroll(event: Event) {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    
    // Lazy-load more participants so large user lists do not render all at once.
    if (atBottom && this.hasMoreUsers && !this.isLoadingUsers) {
      this.usersPage++;
      this.loadAvailableUsers(true);
    }
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onSubmit() {
    if (this.meetingForm.invalid) {
      this.meetingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.meetingForm.value;
    // The creator is the logged-in user; participants remain a comma-separated UUID list.
    const meetingPayload = {
      user_id: this.authService.currentUser()?.id || '',
      title: formValue.title,
      description: formValue.description,
      meeting_date: formValue.meeting_date,
      location: formValue.location,
      duration: Number(formValue.duration),
      participants: formValue.participants,
      status: 'Scheduled'
    };

    this.meetingService.createMeeting(meetingPayload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.toastService.success('Meeting Created', `Meeting "${res.title}" has been created successfully.`);
        this.router.navigate(['/meetings']);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.toastService.error('Error', err.error?.detail || 'Failed to create meeting.');
      }
    });
  }

  isInvalid(fieldName: string): boolean {
    const control = this.meetingForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Map Picker Functions
  private loadLeaflet(): Promise<any> {
    if ((window as any).L) {
      return Promise.resolve((window as any).L);
    }
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve((window as any).L);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  openMapModal(event: Event) {
    event.preventDefault();
    this.showMapModal = true;
    this.selectedAddress = this.meetingForm.get('location')?.value || '';
    
    this.loadLeaflet().then((L) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setTimeout(() => {
              this.initMap(L, lat, lon);
            }, 100);
          },
          () => {
            setTimeout(() => {
              this.initMap(L);
            }, 100);
          },
          { enableHighAccuracy: true, timeout: 3000 }
        );
      } else {
        setTimeout(() => {
          this.initMap(L);
        }, 100);
      }
    });
  }

  initMap(L: any, gpsLat?: number, gpsLon?: number) {
    // Default coordinates: Quy Nhon, Binh Dinh (13.7594, 109.2213)
    let defaultLat = gpsLat || 13.7594;
    let defaultLon = gpsLon || 109.2213;
    
    const currentLoc = this.meetingForm.get('location')?.value;
    const mapContainer = document.getElementById('map-picker');
    if (!mapContainer) return;
    
    // Create map instance
    this.map = L.map('map-picker').setView([defaultLat, defaultLon], 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    
    // Fix leaflet marker icon path issue when loading via CDN
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;
    
    // Create marker
    this.marker = L.marker([defaultLat, defaultLon], { draggable: true }).addTo(this.map);
    
    // Handle click on map
    this.map.on('click', (e: any) => {
      this.showSuggestions = false;
      const coords = e.latlng;
      this.marker.setLatLng(coords);
      this.reverseGeocode(coords.lat, coords.lng);
    });
    
    // Handle marker dragend
    this.marker.on('dragend', () => {
      const coords = this.marker.getLatLng();
      this.reverseGeocode(coords.lat, coords.lng);
    });
    
    // If there is already a location (and no GPS coordinates provided), search it to center map
    if (!gpsLat && currentLoc && currentLoc.trim().length > 3) {
      this.mapSearchQuery = currentLoc;
      this.isMapSearching = true;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentLoc)}&limit=1&countrycodes=vn`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            if (this.map && this.marker) {
              this.map.setView([lat, lon], 16);
              this.marker.setLatLng([lat, lon]);
              this.selectedAddress = data[0].display_name;
            }
            this.isMapSearching = false;
          } else {
            this.isMapSearching = false;
            this.reverseGeocode(defaultLat, defaultLon);
          }
        })
        .catch(() => {
          this.isMapSearching = false;
          this.reverseGeocode(defaultLat, defaultLon);
        });
    } else {
      this.reverseGeocode(defaultLat, defaultLon);
    }
  }

  mergeAddressWithQuery(query: string, osmAddress: string): string {
    if (!query || !osmAddress) return osmAddress || query;
    
    const normQuery = query.toLowerCase().trim();
    const normOsm = osmAddress.toLowerCase().trim();
    
    // Match house number or block prefix at start of query, e.g. "12", "12a", "Lô 12", "Số 12", "12/3"
    const leadingPattern = /^((?:số\s+)?\d+[a-z]?(?:\/\d+)?(?:\s+lô\s+\d+)?)\b/i;
    const match = query.trim().match(leadingPattern);
    
    if (match) {
      const prefix = match[1];
      if (!normOsm.startsWith(prefix.toLowerCase())) {
        const restOfQuery = query.substring(match[0].length).trim();
        const cleanRest = restOfQuery.replace(/,.*$/, '').trim();
        
        if (normOsm.startsWith(cleanRest.toLowerCase())) {
          return `${prefix} ${restOfQuery}${osmAddress.substring(cleanRest.length)}`;
        } else {
          return `${prefix}, ${osmAddress}`;
        }
      }
    }
    
    return osmAddress;
  }

  cleanSearchQuery(query: string): string {
    let clean = query.trim();
    // Remove common prefixes
    clean = clean.replace(/^(công ty|tập đoàn|văn phòng|chi nhánh|trụ sở|company|group|office|branch|tòa nhà|building)\s+/i, '');
    return clean.trim();
  }

  reverseGeocode(lat: number, lon: number) {
    this.isMapSearching = true;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          this.selectedAddress = data.display_name;
        }
        this.isMapSearching = false;
      })
      .catch(() => {
        this.isMapSearching = false;
      });
  }

  searchAddress(query?: string) {
    const originalQuery = query || this.mapSearchQuery;
    if (!originalQuery || originalQuery.trim().length < 3) return;
    
    let viewboxParam = '';
    if (this.map) {
      const center = this.map.getCenter();
      const lat = center.lat;
      const lon = center.lng;
      viewboxParam = `&viewbox=${lon - 0.25},${lat - 0.25},${lon + 0.25},${lat + 0.25}`;
    }

    this.isMapSearching = true;

    const performSearch = (searchVal: string): Promise<any> => {
      return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchVal)}&limit=1&countrycodes=vn${viewboxParam}`)
        .then(res => res.json());
    };

    const cleaned = this.cleanSearchQuery(originalQuery);

    performSearch(cleaned)
      .then(data => {
        if (data && data.length > 0) {
          return data;
        }
        const words = cleaned.split(/\s+/);
        if (words.length > 1) {
          return performSearch(words[0]);
        }
        return [];
      })
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (this.map && this.marker) {
            this.map.setView([lat, lon], 16);
            this.marker.setLatLng([lat, lon]);
            this.selectedAddress = this.mergeAddressWithQuery(originalQuery, data[0].display_name);
          }
        }
        this.isMapSearching = false;
      })
      .catch(() => {
        this.isMapSearching = false;
      });
  }

  confirmMapLocation() {
    if (this.selectedAddress) {
      this.meetingForm.get('location')?.setValue(this.selectedAddress);
      this.meetingForm.get('location')?.markAsDirty();
      this.meetingForm.get('location')?.markAsTouched();
    }
    this.closeMapModal();
  }

  closeMapModal() {
    this.showMapModal = false;
    this.showSuggestions = false;
    this.mapSuggestions = [];
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker = null;
  }

  onSearchInputChange() {
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
    }
    this.searchDebounceTimeout = setTimeout(() => {
      this.fetchSuggestions();
    }, 400);
  }

  fetchSuggestions() {
    const originalQuery = this.mapSearchQuery;
    if (!originalQuery || originalQuery.trim().length < 3) {
      this.mapSuggestions = [];
      this.showSuggestions = false;
      return;
    }

    let viewboxParam = '';
    if (this.map) {
      const center = this.map.getCenter();
      const lat = center.lat;
      const lon = center.lng;
      viewboxParam = `&viewbox=${lon - 0.25},${lat - 0.25},${lon + 0.25},${lat + 0.25}`;
    }

    const performSuggest = (searchVal: string): Promise<any> => {
      return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchVal)}&limit=5&countrycodes=vn${viewboxParam}`)
        .then(res => res.json());
    };

    const cleaned = this.cleanSearchQuery(originalQuery);

    performSuggest(cleaned)
      .then(data => {
        if (data && data.length > 0) {
          return data;
        }
        const words = cleaned.split(/\s+/);
        if (words.length > 1) {
          return performSuggest(words[0]);
        }
        return [];
      })
      .then(data => {
        this.mapSuggestions = (data || []).map((item: any) => {
          return {
            ...item,
            display_name: this.mergeAddressWithQuery(originalQuery, item.display_name)
          };
        });
        this.showSuggestions = this.mapSuggestions.length > 0;
      })
      .catch(() => {
        this.mapSuggestions = [];
        this.showSuggestions = false;
      });
  }

  selectSuggestion(item: any) {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (this.map && this.marker) {
      this.map.setView([lat, lon], 16);
      this.marker.setLatLng([lat, lon]);
      this.selectedAddress = item.display_name;
      this.mapSearchQuery = item.display_name;
    }
    this.showSuggestions = false;
    this.mapSuggestions = [];
  }
}
