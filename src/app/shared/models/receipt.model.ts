export interface Receipt {
  id: number;
  receiptNumber: string;
  paymentId: number;
  orderId: number;
  customerName?: string;
  customerPhone?: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  paidAmount: string;
  changeAmount: string;
  paymentMethod: string;
  transactionRef: string;
  downloadUrl: string;
  createdAt: string;
}

export interface CreateReceiptRequest {
  paymentId: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export interface CreateReceiptResponse {
  success: boolean;
  data: Receipt;
}
