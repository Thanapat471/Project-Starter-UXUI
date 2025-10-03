export interface Table {
  id: number;
  code: string;
  name: string;
  seats: number;
  qrToken: string;
  qrUrl: string;
  status: 'AVAILABLE' | 'OCCUPIED';
  isActive: boolean;
}

export interface CreateTableRequest {
  code: string;
  name: string;
  seats: number;
}

export interface TableSession {
  sessionId: string;
  table: {
    id: number;
    code: string;
    name: string;
    seats: number;
  };
  menu: any[]; // Reuse MenuItem interface
  message: string;
  networkVerified: boolean;
}

export interface StartSessionRequest {
  customerCount?: number;
  networkSSID?: string;
  deviceInfo?: string;
}
