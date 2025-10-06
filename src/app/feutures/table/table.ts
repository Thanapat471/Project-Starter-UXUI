import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpinModule } from 'ng-zorro-antd/spin';

interface TableData {
  id: number;
  code: string;
  name: string;
  status: string;
  seats: number;
  qrUrl: string;
  uniqueUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TableStats {
  available: number;
  inUse: number;
  total: number;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NzGridModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSkeletonModule,
    NzSpinModule
  ],
  providers: [NzMessageService],
  templateUrl: './table.html',
  styleUrl: './table.css'
})
export class Table implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly apiUrl = 'http://localhost:8080/api/tables';

  tables: TableData[] = [];
  stats: TableStats = {
    available: 0,
    inUse: 0,
    total: 0
  };

  // Loading states
  isLoading = true;
  isInitialLoad = true;

  // Modal state
  isAddModalVisible = false;
  isEditModalVisible = false;
  isSubmitting = false;
  selectedTable: TableData | null = null;

  // Add table form
  addTableForm = this.fb.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    seats: [4, [Validators.required, Validators.min(1)]]
  });

  // Edit table form
  editTableForm = this.fb.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    seats: [4, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.isLoading = true;
    
    this.http.get<TableData[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.tables = data;
        this.calculateStats();
        this.isLoading = false;
        this.isInitialLoad = false;
      },
      error: (error) => {
        console.error('Error loading tables:', error);
        this.message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลโต๊ะ');
        this.isLoading = false;
        this.isInitialLoad = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.tables.length;
    this.stats.available = this.tables.filter(t => t.status === 'AVAILABLE').length;
    this.stats.inUse = this.tables.filter(t => t.status === 'IN_USE').length;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'ว่าง';
      case 'IN_USE': return 'ใช้งาน';
      case 'RESERVED': return 'จองแล้ว';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'green';
      case 'IN_USE': return 'orange';
      case 'RESERVED': return 'red';
      default: return 'default';
    }
  }

  getCardClass(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'card-available';
      case 'IN_USE': return 'card-in-use';
      case 'RESERVED': return 'card-reserved';
      default: return '';
    }
  }

  downloadQR(table: TableData): void {
    const downloadUrl = `${this.apiUrl}/${table.id}/qr`;
    const loadingMsgId = this.message.loading('กำลังดาวน์โหลด QR Code...', { nzDuration: 0 }).messageId;
    
    this.http.get(downloadUrl, { 
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        this.message.remove(loadingMsgId);
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `table-${table.code}-qr.png`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        // Create blob URL and download
        const blob = response.body;
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(url);
          this.message.success('✓ ดาวน์โหลด QR Code สำเร็จ', { nzDuration: 3000 });
        }
      },
      error: (error) => {
        this.message.remove(loadingMsgId);
        console.error('Error downloading QR:', error);
        this.message.error('✗ เกิดข้อผิดพลาดในการดาวน์โหลด QR Code', { nzDuration: 3000 });
      }
    });
  }

  // Modal functions
  showAddModal(): void {
    this.isAddModalVisible = true;
    this.addTableForm.reset({ seats: 4 });
  }

  handleAddCancel(): void {
    this.isAddModalVisible = false;
    this.addTableForm.reset();
  }

  handleAddSubmit(): void {
    if (this.addTableForm.invalid) {
      Object.values(this.addTableForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      this.message.warning('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    this.isSubmitting = true;
    const formData = this.addTableForm.value;

    this.http.post(this.apiUrl, formData).subscribe({
      next: (response: any) => {
        this.message.success('✓ เพิ่มโต๊ะสำเร็จ', { nzDuration: 3000 });
        this.isAddModalVisible = false;
        this.addTableForm.reset({ seats: 4 });
        this.loadTables();
      },
      error: (error) => {
        console.error('Error adding table:', error);
        const errorMsg = error.error?.message || 'เกิดข้อผิดพลาดในการเพิ่มโต๊ะ';
        this.message.error(`✗ ${errorMsg}`, { nzDuration: 3000 });
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  // Edit functions
  showEditModal(table: TableData): void {
    this.selectedTable = table;
    this.editTableForm.patchValue({
      code: table.code,
      name: table.name,
      seats: table.seats
    });
    this.isEditModalVisible = true;
  }

  handleEditCancel(): void {
    this.isEditModalVisible = false;
    this.selectedTable = null;
    this.editTableForm.reset();
  }

  handleEditSubmit(): void {
    if (this.editTableForm.invalid || !this.selectedTable) {
      Object.values(this.editTableForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      this.message.warning('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    this.isSubmitting = true;
    const formData = this.editTableForm.value;
    const updateUrl = `${this.apiUrl}/${this.selectedTable.id}`;

    this.http.put(updateUrl, formData).subscribe({
      next: (response: any) => {
        this.message.success('✓ อัพเดทโต๊ะสำเร็จ', { nzDuration: 3000 });
        this.isEditModalVisible = false;
        this.selectedTable = null;
        this.editTableForm.reset();
        this.loadTables();
      },
      error: (error) => {
        console.error('Error updating table:', error);
        const errorMsg = error.error?.message || 'เกิดข้อผิดพลาดในการอัพเดทโต๊ะ';
        this.message.error(`✗ ${errorMsg}`, { nzDuration: 3000 });
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  // Delete function
  deleteTable(table: TableData): void {
    this.modal.confirm({
      nzTitle: 'ยืนยันการลบโต๊ะ',
      nzContent: `คุณต้องการลบโต๊ะ "${table.name}" (${table.code}) ใช่หรือไม่?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้`,
      nzOkText: 'ลบโต๊ะ',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'ยกเลิก',
      nzWidth: 420,
      nzCentered: true,
      nzOnOk: () => {
        return new Promise((resolve, reject) => {
          const deleteUrl = `${this.apiUrl}/${table.id}`;
          
          this.http.delete(deleteUrl).subscribe({
            next: (response: any) => {
              this.message.success('✓ ลบโต๊ะสำเร็จ', { nzDuration: 3000 });
              this.loadTables();
              resolve();
            },
            error: (error) => {
              console.error('Error deleting table:', error);
              const errorMsg = error.error?.message || 'เกิดข้อผิดพลาดในการลบโต๊ะ';
              this.message.error(`✗ ${errorMsg}`, { nzDuration: 3000 });
              reject(error);
            }
          });
        });
      }
    });
  }
}
