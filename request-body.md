# Request Body Examples - BackendPOS API

## Authentication & User Management

### 1. Register User (`POST /api/auth/register`)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Passw0rd!",
  "role": "STAFF" // Enum: STAFF (all staff have equal permissions)
}
```

### 2. Login (`POST /api/auth/login`)
```json
{
  "email": "staff@example.com",
  "password": "Passw0rd!"
}
```

**Login Credentials สำหรับทดสอบ:**
```json
{
  "email": "staff@example.com",
  "password": "Passw0rd!"
}
```

---

## Menu Management

### 3. Create Menu Category (`POST /api/menu-categories`)
```json
{
  "name": "Coffee"
}
```

### 4. Update Menu Category (`PATCH /api/menu-categories/:id`)
```json
{
  "name": "Pastries"
}
```

### 5. Create Menu Item (`POST /api/menu`)
```json
{
  "name": "Americano",
  "description": "Strong black coffee",
  "price": 80.00,
  "category_id": 1
}
```

### 6. Update Menu Item (`PUT /api/menu/:id`)
```json
{
  "name": "Americano",
  "description": "Strong black coffee",
  "price": 85.00,
  "category_id": 1
}
```

### 7. Create Menu Options (`POST /api/menu-options`)
```json
{
  "name": "ระดับความหวาน",
  "type": "SWEETNESS",
  "options": [
    { "value": "ไม่หวาน", "price": 0 },
    { "value": "หวานน้อย", "price": 0 },
    { "value": "หวานปกติ", "price": 0 },
    { "value": "หวานมาก", "price": 5 }
  ],
  "isRequired": true,
  "maxSelections": 1
}
```

---

## Table & Session Management

### 8. Create Table (`POST /api/tables`)
```json
{
  "code": "T-001",
  "name": "Window side",
  "seats": 4
}
```

### 9. Update Table (`PUT /api/tables/:id`)
```json
{
  "code": "T-002",
  "name": "Outdoor patio",
  "seats": 6
}
```

### 10. Start Table Session (QR Scan) (`POST /api/tables/session/{qrToken}`)
```json
{
  "networkSSID": "CafeWiFi",
  "deviceInfo": "Mozilla/5.0 ..."
}
```

### Response ตัวอย่างจาก Table Session:
```json
{
  "sessionId": "7630bb1d14357cecdda5bf57b76de5561b595adc7212ec22",
  "table": {
    "id": 2,
    "code": "T-002",
    "name": null,
    "seats": 4
  },
  "menu": [...],
  "message": "Welcome to T-002!",
  "networkVerified": true
}
```

---

## Order Management


### 11. Create Counter Order & Pay Immediately (`POST /api/orders/checkout`)
```json
{
  "items": [
    {
      "menuItemId": 1,
      "quantity": 2
    }
  ],
  "paymentMethod": "CASH", // or "E_WALLET"
  "paidAmount": 200,        // required for CASH
  "notes": "ลูกค้าสั่งและจ่ายเงินทันที"
}
```

// ตัวอย่าง PromptPay
```json
{
  "items": [
    {
      "menuItemId": 1,
      "quantity": 1
    }
  ],
  "paymentMethod": "E_WALLET",
  "notes": "ลูกค้าสั่งและจ่าย PromptPay"
}
```

### 12. Create Table QR Order (`POST /api/orders`)
```json
{
  "source": "TABLE_QR",
  "sessionId": "7630bb1d14357cecdda5bf57b76de5561b595adc7212ec22",
  "items": [
    {
      "menuItemId": 1,
      "quantity": 1,
      "notes": "ร้อน"
    },
    {
      "menuItemId": 4,
      "quantity": 1,
      "notes": "เย็น",
      "options": [
        {
          "optionId": 1,
          "value": "หวานมาก"
        },
        {
          "optionId": 2,
          "value": "ไข่มุก"
        }
      ]
    }
  ],
  "notes": "ทดสอบ Table QR Order"
}
```

### 13. Update Order Status (`PATCH /api/orders/:id/status`)
```json
{
  "status": "SERVED"
}
```

---

## Payment System (อัปเดตใหม่ - ระบบง่ายขึ้น)

### **Counter Ordering (สั่งหน้าเคาน์เตอร์)**
ใช้ `/api/orders/checkout` เท่านั้น - สั่ง + จ่ายเงินในขั้นตอนเดียว

### **Table QR Ordering (สั่งผ่าน QR โต๊ะ)**
1. สั่งด้วย `/api/orders` (source: TABLE_QR)
2. จ่ายเงินด้วย `/api/payments/promptpay` (tableId/sessionId)
3. ยืนยันด้วย `/api/payments/{id}/confirm`

---

### 14. ❌ ~~Create PromptPay Payment - Counter Order~~ (DEPRECATED)
ใช้ `/api/orders/checkout` แทน

### 15. Create PromptPay Payment - Table Order (by Table ID) (`POST /api/payments/promptpay`)
```json
{
  "tableId": 5
}
```

### 16. Create PromptPay Payment - Table Order (by Session ID) (`POST /api/payments/promptpay`)
```json
{
  "sessionId": "7630bb1d14357cecdda5bf57b76de5561b595adc7212ec22"
}
```

### 17. ❌ ~~Cash Payment~~ (DEPRECATED)
ใช้ `/api/orders/checkout` สำหรับ counter orders แทน


### 20. Get Table Pending Orders (`GET /api/payments/table/{tableId}/pending`)
- ไม่ต้องมี request body (เป็น GET)
- ใช้สำหรับดูรายการ orders ที่รอชำระเงินของโต๊ะ

### 20.1. Get All Tables with Pending Orders (`GET /api/payments/tables/pending`)
- ไม่ต้องมี request body (เป็น GET)
- ใช้สำหรับดูรายการโต๊ะทั้งหมดที่มีออเดอร์รอชำระเงิน (สำหรับพนักงานเลือกโต๊ะ)

### Response ตัวอย่างจาก Tables Pending Orders:
```json
{
  "success": true,
  "count": 1,
  "tables": [
    {
      "tableId": 1,
      "tableName": "โต๊ะ 1",
      "tableCode": "T-001",
      "sessionId": "cf398ddf7c28513ca8a2ca73b8b9d27eb2a0f44743daa820",
      "orderCount": 1,
      "totalAmount": 160,
      "lastOrderTime": "2025-10-02T17:18:28.092Z",
      "orders": [
        {
          "id": 4,
          "total": 160,
          "status": "PENDING",
          "notes": "ทดสอบ Table QR Order",
          "createdAt": "2025-10-02T17:18:28.092Z"
        }
      ]
    }
  ]
}
```

### 18. Confirm Payment (`POST /api/payments/{id}/confirm`)
```json
{
  "transactionRef": "optional-transaction-reference"
}
```

**หมายเหตุ**: ใช้ได้กับทั้ง counter และ table orders

---

## Receipt Management

### 19. Create Receipt (`POST /api/receipts`)
```json
{
  "paymentId": 1,
  "customerName": "นาย ธนาคาร ชำระ",
  "customerPhone": "0812345678",
  "notes": "ขอใบกำกับภาษี"
}
```

### 20. Export Receipt as PDF (`GET /api/receipts/{id}/pdf`)
- ไม่ต้องมี request body (เป็น GET)
- ต้องมี Authorization header
- Response: PDF file download

รายละเอียด Layout ของใบเสร็จ (อัปเดต):
- ส่วนหัวบรรทัดแรก: ด้านซ้ายเป็นเลขที่ใบเสร็จ (Receipt No.), ด้านขวาเป็น "Order No. <id>" แทนค่าเดิมที่เคยเป็น "Baanthaicafe - XX"
- บรรทัดถัดไป: Cashier (แสดงชื่อถ้ามี) และ Time (วันที่-เวลา พ.ศ.)
- ตารางรายการสินค้า: คอลัมน์ Item, Qty, Amount พร้อมแสดงตัวเลือก (options) ใต้รายการ
- ส่วนสรุป: Total, Payment Total, ยอดชำระ, เงินทอน (ถ้ามี)

### ตัวอย่าง Authorization:
```bash
curl -X GET "http://localhost:8080/api/receipts/1/pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output receipt.pdf
```

---

## Payment API Examples สำหรับ Frontend


### การชำระเงินแบบครบถ้วน (Unified Payment System)

#### กรณีที่ 1: Counter Ordering (แนะนำใช้ /orders/checkout)
```javascript
// สร้าง order และชำระเงินทันที
const checkoutResponse = await fetch('/api/orders/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    items: [ { menuItemId: 1, quantity: 2 } ],
    paymentMethod: 'CASH',
    paidAmount: 200,
    notes: 'ลูกค้าสั่งและจ่ายเงินทันที'
  })
});
const result = await checkoutResponse.json();
// result.order, result.payment, result.receipt
```

// สำหรับ PromptPay
```javascript
const checkoutResponse = await fetch('/api/orders/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    items: [ { menuItemId: 1, quantity: 1 } ],
    paymentMethod: 'E_WALLET',
    notes: 'ลูกค้าสั่งและจ่าย PromptPay'
  })
});
const result = await checkoutResponse.json();
```

#### กรณีที่ 2: Table QR Ordering
```javascript
// ลูกค้าสแกน QR และสั่งอาหาร (ไม่ต้อง auth)
const sessionResponse = await fetch('/api/tables/session/{qrToken}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    networkSSID: 'CafeWiFi',
    deviceInfo: navigator.userAgent
  })
});

const session = await sessionResponse.json();

const orderResponse = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: 'TABLE_QR',
    sessionId: session.sessionId,
    items: [
      { menuItemId: 1, quantity: 1, notes: 'ร้อน' }
    ]
  })
});

// พนักงานดูรายการโต๊ะที่มี pending orders (เลือกโต๊ะเพื่อชำระเงิน)
const tablesPendingResponse = await fetch('/api/payments/tables/pending', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const tablesPending = await tablesPendingResponse.json();

// ชำระเงินผ่านหมายเลขโต๊ะ
const paymentResponse = await fetch('/api/payments/cash', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    tableId: 5,
    paidAmount: 500.00,
    notes: 'โต๊ะ 5 จ่ายเงินสด'
  })
});
```

---

## หมายเหตุ

- **Authentication**: ทุก API ที่ต้องการ auth ให้ใส่ `Authorization: Bearer YOUR_JWT_TOKEN` ใน header
- **Enum Values**: ใช้ค่าตาม Swagger documentation เท่านั้น
- **Number/Integer**: ให้ใส่ค่าตาม type ที่ระบุ ไม่ใช่ string
- **Payment System**: รองรับทั้ง Counter และ Table ordering ด้วย API เดียวกัน
- **Error Handling**: ระบบจะ validate ข้อมูลและส่ง error message ที่ชัดเจน

---

## Test Environment

**Base URL**: `http://localhost:8080/api`
**API Documentation**: `http://localhost:8080/api-docs`
**Database Admin**: `http://localhost:5050` (admin@admin.com / admin)
