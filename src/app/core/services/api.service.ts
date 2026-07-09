import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  readonly baseUrl = 'http://localhost:8000/api/v1';

  readonly auth = `${this.baseUrl}/auth`;
  readonly meetings = `${this.baseUrl}/meetings`;
}