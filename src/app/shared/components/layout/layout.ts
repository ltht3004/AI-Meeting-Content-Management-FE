import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { SearchService } from '../../services/search.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, FormsModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  searchService = inject(SearchService);
  authService = inject(AuthService);
}
