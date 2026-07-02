import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {
  isAdmin = false;

  ngOnInit() {
    // Check role from localStorage for mock setup
    const role = localStorage.getItem('role') || 'admin'; // Fallback to admin for easy design display
    this.isAdmin = role === 'admin';
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/auth/login';
  }
}
