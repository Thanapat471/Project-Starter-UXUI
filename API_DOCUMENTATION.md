# POS Backend API Documentation

## Overview
Complete API documentation for Coffee Shop POS system with detailed flows, request/response examples.

---

## 🔐 Authentication

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "staff@example.com",
  "password": "Passw0rd!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Staff",
    "email": "staff@example.com",
    "role": "STAFF",
    "createdAt": "2025-10-02T17:08:20.056Z",
    "updatedAt": "2025-10-02T17:08:20.056Z"
  }
}
```

---

## 📋 Menu Management

### Get Menu Items (Public)
```http
GET /api/menu
```

**Response:**
```json
[
  {
    "id": "1",
    "name": "ลาเต้",
    "description": "กาแฟลาเต้หอม",
    "price": 80,
    "categoryId": "1",
    "category": {
      "id": "1",
      "name": "กาแฟ"
    },
    "imageUrl": "/uploads/menu/image.png",
    "isAvailable": true,
    "options": [
      {
        "id": 1,
        "name": "ระดับความหวาน",
        "type": "SWEETNESS",
        "options": [
          {"value": "ไม่หวาน", "price": 0},
          {"value": "หวานน้อย", "price": 0},
          {"value": "หวานปกติ", "price": 0},
          {"value": "หวานมาก", "price": 5}
        ],
        "isRequired": true,
        "maxSelections": 1
      }
    ]
  }
]
```

### Create Menu Item (Staff)
```http
POST /api/menu
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "เอสเปรสโซ่",
  "description": "กาแฟเข้มข้น",
  "price": 60,
  "category_id": 1
}
```

---

## 🪑 Table Management

### Create Table (Staff)
```http
POST /api/tables
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "code": "T-001",
  "name": "หน้าต่าง",
  "seats": 4
}
```

**Response:**
```json
{
  "id": 1,
  "code": "T-001",
  "name": "หน้าต่าง",
  "seats": 4,
  "qrToken": "7a3dd2872be1e637f7a3f76813d5acd1319ac71625e9158f7590509606d2524c",
  "qrUrl": "http://localhost:3001/o/CAFE001/7a3dd2872be1e637f7a3f76813d5acd1319ac71625e9158f7590509606d2524c",
  "status": "AVAILABLE",
  "isActive": true
}
```

### Get All Tables (Staff)
```http
GET /api/tables
Authorization: Bearer {token}
```

### Download QR Code (Staff)
```http
GET /api/tables/{id}/qr
Authorization: Bearer {token}
```
Returns PNG image file for printing.

---

## 🎯 Table QR Ordering Flow

### 1. Customer Scans QR & Starts Session
```http
POST /api/tables/session/{qrToken}
```

**Request Body:**
```json
{
  "customerCount": 3
}
```

**Response:**
```json
{
  "sessionId": "9df698170de90d7db6a3c30e6482e1e021e00f75704ffee3",
  "table": {
    "id": 1,
    "code": "T-001",
    "name": "หน้าต่าง",
    "seats": 4
  },
  "menu": [
    {
      "id": "1",
      "name": "ลาเต้",
      "description": "หอมอร่อย",
      "price": 50,
      "categoryId": "1",
      "category": {"id": "1", "name": "Coffee"},
      "imageUrl": "/uploads/menu/image.png",
      "isAvailable": true,
      "options": []
    }
  ],
  "message": "Welcome to T-001 (หน้าต่าง)!",
  "networkVerified": true
}
```

### 2. Customer Places Order
```http
POST /api/orders
```

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": 1,
      "quantity": 3,
      "options": [
        {
          "menuOptionId": 1,
          "selectedValue": "หวานมาก"
        }
      ]
    }
  ],
  "source": "TABLE_QR",
  "sessionId": "9df698170de90d7db6a3c30e6482e1e021e00f75704ffee3",
  "notes": "โต๊ะ T-001 สั่ง 3 แก้ว"
}
```

**Response:**
```json
{
  "id": 6,
  "status": "PENDING",
  "total": 150,
  "source": "TABLE_QR",
  "notes": "โต๊ะ T-001 สั่ง 3 แก้ว",
  "table": {
    "id": 1,
    "code": "T-001",
    "name": "หน้าต่าง"
  },
  "sessionId": "9df698170de90d7db6a3c30e6482e1e021e00f75704ffee3",
  "items": [
    {
      "id": 6,
      "menuItemId": 1,
      "menuItem": {
        "id": 1,
        "name": "ลาเต้",
        "price": 50
      },
      "quantity": 3,
      "price": 50,
      "total": 150,
      "options": []
    }
  ],
  "createdAt": "2025-10-03T17:40:02.968Z"
}
```

### 3a. Customer Pays Cash at Counter
```http
POST /api/payments/cash
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "tableId": 1,
  "paidAmount": 200.00,
  "notes": "โต๊ะ T-001 จ่ายเงินสด"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cash payment completed successfully",
  "payment": {
    "id": 1,
    "orderId": 6,
    "amount": 150.00,
    "paidAmount": 200.00,
    "changeAmount": 50.00,
    "method": "CASH",
    "status": "COMPLETED",
    "transactionRef": "CASH-1759513219588-6"
  }
}
```

### 3b. Customer Pays via PromptPay at Counter

#### Generate PromptPay QR
```http
POST /api/payments/promptpay
```

**Request Body:**
```json
{
  "tableId": 1
}
```

**Response:**
```json
{
  "paymentId": 1,
  "transactionRef": "PP-1759513219588-6",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "qrString": "00020101021229370016A0000006770101110113006692754538553037645802TH540550.006304B5FD",
  "amount": 150,
  "currency": "THB",
  "promptpayPhone": "0927545385",
  "message": "Scan QR Code to pay via PromptPay",
  "expiresIn": "15 minutes"
}
```

#### Confirm PromptPay Payment
```http
POST /api/payments/{paymentId}/confirm
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "transactionRef": "PROMPTPAY-CONFIRMED-T001-150"
}
```

**Response:**
```json
{
  "message": "Payment confirmed successfully",
  "payment": {
    "id": 1,
    "status": "COMPLETED",
    "amount": "150.00",
    "transactionRef": "PROMPTPAY-CONFIRMED-T001-150"
  }
}
```

### 4. Generate Receipt
```http
POST /api/receipts
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "paymentId": 1,
  "customerName": "ลูกค้าโต๊ะ T-001",
  "customerPhone": "081-234-5678",
  "notes": "ขอบคุณที่มาใช้บริการ"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "receiptNumber": "RCP-20251003-001",
    "paymentId": 1,
    "orderId": 6,
    "customerName": "ลูกค้าโต๊ะ T-001",
    "customerPhone": "081-234-5678",
    "subtotal": "150.00",
    "tax": "0.00",
    "discount": "0.00",
    "total": "150.00",
    "paidAmount": "150.00",
    "changeAmount": "0.00",
    "paymentMethod": "E_WALLET",
    "transactionRef": "PROMPTPAY-CONFIRMED-T001-150",
    "downloadUrl": "/api/receipts/1/pdf"
  }
}
```

### 5. Close Session
```http
POST /api/tables/session/{sessionId}/close
```

**Response:**
```json
{
  "message": "Session closed successfully",
  "sessionId": "9df698170de90d7db6a3c30e6482e1e021e00f75704ffee3",
  "table": {
    "code": "T-001",
    "name": "หน้าต่าง"
  }
}
```

---

## 🏪 Counter Ordering Flow

### 1a. Counter Order + Cash Payment (One Step)
```http
POST /api/orders/checkout
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": 1,
      "quantity": 2,
      "options": [
        {
          "menuOptionId": 1,
          "selectedValue": "หวานน้อย"
        }
      ]
    }
  ],
  "paymentMethod": "CASH",
  "paidAmount": 200.00,
  "notes": "Counter order - cash payment"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": 14,
    "total": 160,
    "status": "SERVED",
    "source": "COUNTER"
  },
  "payment": {
    "id": 10,
    "method": "CASH",
    "amount": 160,
    "paidAmount": "200.00",
    "changeAmount": "40.00",
    "status": "COMPLETED"
  },
  "receipt": {
    "id": 9,
    "receiptNumber": "RCP-20251002-014",
    "downloadUrl": "/api/receipts/9/pdf"
  }
}
```

### 1b. Counter Order + PromptPay Payment (Two Steps)

#### Create Order
```http
POST /api/orders
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": 1,
      "quantity": 1,
      "options": [
        {
          "menuOptionId": 1,
          "selectedValue": "หวานปกติ"
        }
      ]
    }
  ],
  "source": "COUNTER",
  "notes": "Counter order for PromptPay"
}
```

**Response:**
```json
{
  "id": 15,
  "status": "PENDING",
  "total": 80,
  "source": "COUNTER",
  "notes": "Counter order for PromptPay",
  "table": null,
  "items": [
    {
      "id": 15,
      "menuItemId": 1,
      "menuItem": {
        "id": 1,
        "name": "ลาเต้",
        "price": 80
      },
      "quantity": 1,
      "price": 80,
      "total": 80,
      "options": [
        {
          "id": 2,
          "menuOptionId": 1,
          "optionName": "ระดับความหวาน",
          "optionType": "SWEETNESS",
          "selectedValue": "หวานปกติ",
          "additionalPrice": 0
        }
      ]
    }
  ]
}
```

#### Generate PromptPay
```http
POST /api/payments/promptpay
```

**Request Body:**
```json
{
  "orderId": 15
}
```

**Response:**
```json
{
  "paymentId": 11,
  "transactionRef": "PP-1759430718851-15",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "qrString": "00020101021229370016A0000006770101110113006692754538553037645802TH540580.006304EBCE",
  "amount": 80,
  "currency": "THB",
  "promptpayPhone": "0927545385",
  "message": "Scan QR Code to pay via PromptPay",
  "expiresIn": "15 minutes"
}
```

#### Confirm Payment
```http
POST /api/payments/11/confirm
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "transactionRef": "MANUAL-CONFIRM-COUNTER-PROMPTPAY"
}
```

**Response:**
```json
{
  "message": "Payment confirmed successfully",
  "payment": {
    "id": 11,
    "status": "COMPLETED",
    "amount": "80.00",
    "transactionRef": "MANUAL-CONFIRM-COUNTER-PROMPTPAY"
  }
}
```

---

## 📊 Additional APIs

### Get Orders (Staff)
```http
GET /api/orders
Authorization: Bearer {token}
```

### Update Order Status (Staff)
```http
PATCH /api/orders/{id}/status
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

### Get Payment Status
```http
GET /api/payments/{id}/status
```

### Get Receipts Today (Staff)
```http
GET /api/receipts
Authorization: Bearer {token}
```

### Download Receipt PDF
```http
GET /api/receipts/{id}/pdf
Authorization: Bearer {token}
```

---

## 🔄 Complete Flow Summary

### Table QR Ordering Flow:
1. **Setup**: Staff creates table → Download QR → Print & place at table
2. **Customer**: Scan QR → Start session → Order food → Go to counter
3. **Payment**: Staff processes cash/PromptPay → Generate receipt → Close session

### Counter Ordering Flow:
1. **Cash**: One API call `/orders/checkout` → Complete
2. **PromptPay**: Create order → Generate QR → Confirm payment → Receipt

### Key Differences:
- **Table orders**: Use `tableId`/`sessionId` for payment
- **Counter orders**: Use `orderId` for PromptPay or direct `/checkout` for cash
- **Authentication**: Only staff operations require bearer token
- **Customer operations**: QR scanning and ordering don't need authentication

---

## 🏷️ API Endpoint Categories

### Public (No Auth):
- `GET /api/menu` - View menu
- `POST /api/orders` - Place order (auth optional)
- `POST /api/tables/session/{token}` - Start table session
- `GET /api/tables/session/{id}/status` - Check session
- `POST /api/tables/session/{id}/close` - Close session
- `POST /api/payments/promptpay` - Generate PromptPay QR
- `GET /api/payments/{id}/status` - Check payment status

### Staff Only (Requires Auth):
- All table management
- Order status updates
- Payment confirmation
- Receipt management
- Menu management
- Cash payments
- `/orders/checkout` endpoint

---

## 💡 Frontend Integration Tips

1. **Store tokens**: Save JWT token from login for staff operations
2. **Handle sessions**: Track sessionId for table orders
3. **QR scanning**: Extract qrToken from scanned URL
4. **Payment flows**: Different UI for cash vs PromptPay
5. **Real-time**: Consider WebSocket for order status updates
6. **Error handling**: Check HTTP status codes and error messages
7. **Receipt download**: Use PDF URLs for receipt printing
