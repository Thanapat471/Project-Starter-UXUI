# Toast Component Documentation

## การใช้งาน Toast Component

Toast component ถูกสร้างขึ้นเป็น custom component สำหรับแสดง notification ต่างๆ โดยมีประเภทดังนี้:

### ประเภทของ Toast
- **Success** (สีเขียว) - สำหรับแสดงการทำงานที่สำเร็จ
- **Error** (สีแดง) - สำหรับแสดงข้อผิดพลาด
- **Info** (สีน้ำเงิน) - สำหรับแสดงข้อมูลทั่วไป
- **Warning** (สีเหลือง) - สำหรับแสดงคำเตือน

### วิธีการใช้งาน

#### 1. Import ToastService
```typescript
import { ToastService } from '../core/services/toast.service';

export class YourComponent {
  private readonly toastService = inject(ToastService);
  
  // หรือใช้ constructor injection
  constructor(private toastService: ToastService) {}
}
```

#### 2. เรียกใช้ Toast
```typescript
// Success toast
this.toastService.success('ชำระเงินสำเร็จแล้ว');

// Error toast
this.toastService.error('ไม่สามารถชำระเงินได้');

// Info toast
this.toastService.info('ใบเสร็จ: R-12345');

// Warning toast
this.toastService.warning('กรุณาตรวจสอบข้อมูล');

// กำหนดระยะเวลาแสดง (มิลลิวินาที)
this.toastService.success('ข้อความ', 3000); // แสดง 3 วินาที
```

#### 3. จัดการ Toast
```typescript
// ลบ toast ทั้งหมด
this.toastService.clear();

// ลบ toast เฉพาะ
this.toastService.remove('toast-id');
```

### Features
- ✅ Animation เวลาเปิด/ปิด
- ✅ Auto-close หลังจากเวลาที่กำหนด
- ✅ ปุ่มปิดแบบ manual
- ✅ Responsive design
- ✅ Multiple toast support
- ✅ TypeScript support

### การติดตั้งในแอป
Toast component ถูกติดตั้งใน:
- MainLayout (สำหรับหน้าต่างๆ ที่ใช้ main layout)
- SimpleLayout (สำหรับหน้า customer menu)

### ตัวอย่างการใช้ในหน้า Payment Management
```typescript
// เมื่อชำระเงินสำเร็จ
this.toastService.success('ชำระเงินสดสำเร็จแล้ว');

// เมื่อเกิดข้อผิดพลาด
this.toastService.error('ไม่สามารถชำระเงินสดได้');

// เมื่อมีข้อมูลเพิ่มเติม
this.toastService.info('ใบเสร็จ: R-12345');
```

### Styling
Toast ใช้ Tailwind CSS เป็นหลัก และมี custom animation สำหรับ slide in/out effect
