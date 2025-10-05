export interface Payment {
  id: number;
  orderId?: number;
  amount: number;
  paidAmount: number;
  changeAmount: number;
  method: 'CASH' | 'E_WALLET';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionRef: string;
}

export interface PromptPayPaymentRequest {
  orderId?: number;
  tableId?: number;
  sessionId?: string;
}

export interface PromptPayPaymentResponse {
  paymentId: number;
  transactionRef: string;
  qrCode: string;
  qrString: string;
  amount: number;
  currency: string;
  promptpayPhone: string;
  message: string;
  expiresIn: string;
}

export interface CashPaymentRequest {
  orderId?: number;
  tableId?: number;
  sessionId?: string;
  paidAmount: number;
  notes?: string;
}

export interface CashPaymentResponse {
  success: boolean;
  message: string;
  payment: Payment;
}

export interface ConfirmPaymentRequest {
  transactionRef?: string;
}

export interface CheckoutRequest {
  items: {
    menuItemId: number;
    quantity: number;
    options?: {
      menuOptionId: number;
      selectedValue: string;
    }[];
  }[];
  paymentMethod: 'CASH' | 'E_WALLET';
  paidAmount?: number;
  notes?: string;
}

export interface CheckoutResponse {
  success: boolean;
  order: {
    id: number;
    total: number;
    status: string;
    source: string;
  };
  payment: Payment;
  receipt: {
    id: number;
    receiptNumber: string;
    downloadUrl: string;
  };
}
