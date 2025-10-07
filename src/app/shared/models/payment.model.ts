export interface Payment {
  id: number;
  orderId?: number;
  amount: number;
  paidAmount: number;
  changeAmount: number;
  method: 'CASH' | 'E_WALLET';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionRef: string;
  qrCode?: string;
  qrString?: string;
  promptpayPhone?: string;
  expiresIn?: string;
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
  table?: {
    id: number;
    code: string;
    name: string;
  };
  payment: {
    totalAmount: number;
    paidAmount: number;
    changeAmount: number;
    orderCount: number;
    method: string;
  };
  orders: {
    id: number;
    total: number;
    status: string;
  }[];
  receipt?: {
    id: number;
    receiptNumber: string;
    downloadUrl: string;
  };
  transactionRefs: string[];
}

export interface ConfirmPaymentRequest {
  transactionRef?: string;
}

export interface ConfirmPaymentResponse {
  payment: {
    id: number;
    status: string;
    amount: number;
    tableId: number;
    orderIds: number[];
  };
  orders: {
    id: number;
    status: string;
  }[];
  receipt?: {
    id: number;
    receiptNumber: string;
    downloadUrl: string;
  };
}

export interface CheckoutRequest {
  items: {
    menuItemId: number;
    quantity: number;
    options?: {
      type: string;
      value: string;
    }[];
  }[];
  paymentMethod: 'CASH' | 'E_WALLET' | 'PROMPTPAY';
  paidAmount?: number;
  notes?: string;
}

export interface CheckoutResponse {
  success: boolean;
  flow?: string;
  order: {
    id: number;
    total: number;
    status: string;
    source: string;
  };
  payment: Payment;
  promptpay?: {
    paymentId: number;
    qrCode: string;
    amount: number;
    currency: string;
    promptpayPhone: string;
    message: string;
    expiresIn: string;
    confirmUrl: string;
  };
  receipt: {
    id: number;
    receiptNumber: string;
    downloadUrl: string;
  };
}
