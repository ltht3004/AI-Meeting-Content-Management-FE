import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meeting-create',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './meeting-create.html',
  styleUrl: './meeting-create.css'
})
export class MeetingCreate implements OnInit {
  meetingForm!: FormGroup;
  isSubmitting = false;
  showUsersDropdown = false;

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

  availableUsers = [
    { id: '1', name: 'Alex Rivera' },
    { id: '2', name: 'Sarah Connor' },
    { id: '3', name: 'David Miller' },
    { id: '4', name: 'Emma Watson' },
    { id: '5', name: 'John Doe' },
    { id: '6', name: 'Peter Parker' }
  ];

  existingMeetingTitles = [
    'Q3 Product Strategy Sync',
    'Customer Feedback Loop',
    'Design System Refactor',
    'Urgent: Server Outage Review'
  ];

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
  }

  toggleUserSelection(name: string) {
    const control = this.meetingForm.get('participants');
    let currentVal = control?.value || '';
    let selectedList = currentVal ? currentVal.split(',').map((n: string) => n.trim()) : [];
    
    if (selectedList.includes(name)) {
      selectedList = selectedList.filter((n: string) => n !== name);
    } else {
      selectedList.push(name);
    }
    
    control?.setValue(selectedList.join(', '));
    control?.markAsDirty();
    control?.markAsTouched();
  }

  isUserSelected(name: string): boolean {
    const currentVal = this.meetingForm.get('participants')?.value || '';
    if (!currentVal) return false;
    const selectedList = currentVal.split(',').map((n: string) => n.trim());
    return selectedList.includes(name);
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
      setTimeout(() => {
        this.initMap(L);
      }, 100);
    });
  }

  initMap(L: any) {
    // Default coordinates: Hanoi, Vietnam (21.0285, 105.8542)
    let lat = 21.0285;
    let lon = 105.8542;
    
    const currentLoc = this.meetingForm.get('location')?.value;
    
    const mapContainer = document.getElementById('map-picker');
    if (!mapContainer) return;
    
    // Create map instance
    this.map = L.map('map-picker').setView([lat, lon], 13);
    
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
    this.marker = L.marker([lat, lon], { draggable: true }).addTo(this.map);
    
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
    
    // If there is already a location, search it to center map
    if (currentLoc && currentLoc.trim().length > 3) {
      this.mapSearchQuery = currentLoc;
      this.searchAddress(currentLoc);
    } else {
      // Try to get user current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const uLat = position.coords.latitude;
          const uLon = position.coords.longitude;
          if (this.map && this.marker) {
            this.map.setView([uLat, uLon], 15);
            this.marker.setLatLng([uLat, uLon]);
            this.reverseGeocode(uLat, uLon);
          }
        }, () => {
          this.reverseGeocode(lat, lon);
        });
      } else {
        this.reverseGeocode(lat, lon);
      }
    }
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
    const searchVal = query || this.mapSearchQuery;
    if (!searchVal || searchVal.trim().length < 3) return;
    
    this.isMapSearching = true;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchVal)}&limit=1`)
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
    const query = this.mapSearchQuery;
    if (!query || query.trim().length < 3) {
      this.mapSuggestions = [];
      this.showSuggestions = false;
      return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
      .then(res => res.json())
      .then(data => {
        this.mapSuggestions = data || [];
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
