# QR Debug และระบบสั่งอาหาร

## วิธีการใช้งาน

### 1. เปิดหน้า QR Debug
เข้าไปที่ `http://localhost:4200/qr-debug`

### 2. ขั้นตอนการทดสอบ
1. **คลิกที่โต๊ะ** - เลือกโต๊ะที่ต้องการจากรายการ
2. **สร้าง Session** - ระบบจะเรียก API สร้าง session โดยอัตโนมัติ
3. **ไปหน้าสั่งอาหาร** - คลิกปุ่ม "ไปที่หน้าสั่งอาหาร"
4. **สั่งอาหาร** - เลือกเมนู เพิ่มลงตะกร้า และสั่งอาหาร

### 3. API Flow
```
1. GET /api/tables 
   → ได้ qrToken

2. POST /api/tables/session/{qrToken}
   → ได้ sessionId

3. POST /api/orders
   → สั่งอาหารด้วย sessionId
```

### 4. โครงสร้างไฟล์ที่เพิ่ม
- `/src/app/feutures/qr-debug/` - QR Debug Component
- อัปเดต `/src/app/feutures/customer-menu/` - เพิ่ม session support
- อัปเดต `/src/app/app.routes.ts` - เพิ่ม routes ใหม่

### 5. Features
- ✅ แสดงรายการโต๊ะทั้งหมด
- ✅ สร้าง session จาก QR token
- ✅ เก็บ session ใน localStorage
- ✅ ส่งต่อไปหน้าสั่งอาหาร
- ✅ แสดงข้อมูลโต๊ะและ session
- ✅ สั่งอาหารผ่าน API
- ✅ เพิ่มหมายเหตุสำหรับออเดอร์
- ✅ Loading states และ error handling

### 6. การทดสอบ
1. เปิดเซิร์ฟเวอร์ API ที่ localhost:8080
2. เปิด Angular app ที่ localhost:4200
3. ไปที่ `/qr-debug` เพื่อเริ่มการทดสอบ
4. ไปที่ `/customer-menu` เพื่อทดสอบการสั่งอาหาร

### 7. UI Design
- ใช้ brown coffee theme สอดคล้องกับระบบ
- Glass morphism design
- Responsive สำหรับมือถือ
- Loading และ error states ครบถ้วน
