import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

interface Table {
  id: number;
  name: string;
  qrToken: string;
  status: string;
}

interface SessionResponse {
  sessionId: string;
  tableId: number;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-qr-debug',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-debug.component.html',
  styleUrls: ['./qr-debug.component.css']
})
export class QrDebugComponent implements OnInit {
  tables: Table[] = [];
  selectedTable: Table | null = null;
  sessionData: SessionResponse | null = null;
  loading = false;
  error = '';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.loadTables();
  }

  async loadTables() {
    try {
      this.loading = true;
      this.error = '';

      const response = await firstValueFrom(this.http.get<Table[]>('http://localhost:8080/api/tables'));
      this.tables = response || [];
    } catch (error) {
      console.error('Error loading tables:', error);
      this.error = 'ไม่สามารถโหลดข้อมูลโต๊ะได้';
    } finally {
      this.loading = false;
    }
  }

  async createSession(table: Table) {
    try {
      this.loading = true;
      this.error = '';
      this.selectedTable = table;

      const response = await firstValueFrom(
        this.http.post<SessionResponse>(
          `http://localhost:8080/api/tables/session/${table.qrToken}`,
          {}
        )
      );

      this.sessionData = response || null;

      if (this.sessionData?.sessionId) {
        // เก็บ sessionId ใน localStorage เพื่อใช้ใน customer-menu
        localStorage.setItem('customerSessionId', this.sessionData.sessionId);
        localStorage.setItem('customerTableId', table.id.toString());
        localStorage.setItem('customerTableName', table.name);

        console.log('Session created:', this.sessionData);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      this.error = 'ไม่สามารถสร้าง session ได้';
    } finally {
      this.loading = false;
    }
  }

  goToMenu() {
    if (this.sessionData?.sessionId) {
      this.router.navigate(['/customer/menu'], {
        queryParams: { sessionId: this.sessionData.sessionId }
      });
    }
  }

  clearSession() {
    this.sessionData = null;
    this.selectedTable = null;
    localStorage.removeItem('customerSessionId');
    localStorage.removeItem('customerTableId');
    localStorage.removeItem('customerTableName');
  }
}
