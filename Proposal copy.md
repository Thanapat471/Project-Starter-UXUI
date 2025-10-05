# ระบบ POS (Point of Sale) คาเฟ่สมัยใหม่
**คณะวิทยาศาสตร์ ศรีราชา มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตศรีราชา**

## หลักการและเหตุผล

ในยุคดิจิทัลปัจจุบัน ธุรกิจร้านกาแฟต้องการระบบการขายที่ครอบคลุมทั้งการสั่งซื้อหน้าเคาน์เตอร์แบบดั้งเดิมและการสั่งซื้อผ่าน QR Code บนโต๊ะ เพื่อเพิ่มความสะดวกสบายให้ลูกค้าและเพิ่มประสิทธิภาพในการให้บริการ ระบบ POS แบบครบวงจรจึงมีความจำเป็นสำหรับร้านกาแฟที่ต้องการยกระดับการบริการและการจัดการ

ระบบนี้รองรับทั้งการสั่งซื้อแบบดั้งเดิม (Counter Ordering) และการสั่งซื้อผ่าน QR Code บนโต๊ะ (Table QR Ordering) โดยมีการชำระเงินแบบรวมศูนย์ที่เคาน์เตอร์เท่านั้น เพื่อความปลอดภัยในการเงินและควบคุมคุณภาพการบริการ พร้อมระบบจัดการเมนู การติดตามออเดอร์ และการชำระเงินผ่าน PromptPay QR Code

## ปัญหาที่พบในระบบเดิม

1. **ความล่าช้าในการสั่งซื้อ** – ลูกค้าต้องต่อคิวที่เคาน์เตอร์เพื่อสั่งอาหารและเครื่องดื่ม ทำให้เกิดความแออัดในช่วงเวลาเร่งด่วน
2. **การจัดการออเดอร์ไม่เป็นระบบ** – การใช้กระดาษหรือการจดจำทำให้เกิดความผิดพลาดและความล่าช้า
3. **การชำระเงินไม่สะดวก** – จำกัดรูปแบบการชำระเงินเฉพาะเงินสดหรือบัตร ขาดความทันสมัยและไม่มีระบบคำนวณเงินทอนอัตโนมัติ
4. **ขาดการติดตามข้อมูลแบบเรียลไทม์** – ไม่สามารถวิเคราะห์ยอดขาย เมนูยอดนิยม หรือประสิทธิภาพการให้บริการได้
5. **การจัดการโต๊ะและ Session ไม่มีประสิทธิภาพ** – ไม่สามารถติดตามสถานะโต๊ะและการใช้งานได้อย่างแม่นยำ

## วัตถุประสงค์

- เพื่อพัฒนาระบบ POS ที่รองรับการสั่งซื้อแบบ Multi-Channel (Counter + Table QR)
- เพื่อเพิ่มความสะดวกสบายให้ลูกค้าในการสั่งซื้อและลดเวลารอคิว
- เพื่อเพิ่มประสิทธิภาพในการจัดการออเดอร์และการชำระเงิน
- เพื่อสร้างระบบติดตามและรายงานข้อมูลแบบเรียลไทม์
- เพื่อรองรับการชำระเงินแบบครบถ้วน ทั้ง PromptPay QR Code และเงินสดพร้อมระบบคำนวณเงินทอนอัตโนมัติ
- เพื่อรักษาความปลอดภัยทางการเงินด้วยการชำระเงินรวมศูนย์ที่เคาน์เตอร์
- เพื่อให้พนักงานสามารถจัดการการชำระเงินได้ง่ายด้วยระบุเพียงหมายเลขโต๊ะหรือ Order ID

## ขอบเขตและฟีเจอร์ของระบบ

### 1. ระบบสำหรับพนักงาน (Staff/Admin)
**ระบบจัดการเมนู**
- เพิ่ม/แก้ไข/ลบหมวดหมู่เมนู (Menu Categories)
- เพิ่ม/แก้ไข/ลบรายการเมนู (Menu Items) พร้อมราคาและรายละเอียด
- จัดการสถานะเมนู (เปิด/ปิดขาย)

**ระบบจัดการโต๊ะ**
- เพิ่ม/แก้ไข/ลบโต๊ะพร้อมสร้าง QR Code ถาวร
- ตรวจสอบสถานะโต๊ะ (ว่าง/ใช้งาน)
- จัดการ Table Session (เริ่ม/ปิด Session)

**ระบบจัดการออเดอร์**
- ดูออเดอร์ทั้งหมดแบบเรียลไทม์ (Counter + Table Orders)
- ติดตามสถานะออเดอร์และหมายเหตุพิเศษ
- สร้างออเดอร์หน้าเคาน์เตอร์

**ระบบชำระเงิน**
- สร้าง PromptPay QR Code สำหรับการชำระเงิน
- รองรับการชำระเงินสดพร้อมคำนวณเงินทอนอัตโนมัติ
- ระบบการชำระเงินแบบครบถ้วน รองรับการค้นหา Order ด้วย Order ID, Table ID, หรือ Session ID
- บันทึกการชำระเงินและออกใบเสร็จอัตโนมัติ
- ดูรายการ Orders ที่รอชำระเงินของแต่ละโต๊ะ
- รองรับการชำระเงินสำหรับทั้ง Counter และ Table Orders

### 2. ระบบสำหรับลูกค้า (Customer Experience)
**Table QR Ordering**
- สแกน QR Code บนโต๊ะเพื่อเริ่ม Table Session
- เลือกเมนูและเพิ่มลงตะกร้า
- ระบุหมายเหตุพิเศษ (เช่น ไม่ใส่น้ำตาล, เพิ่มน้ำแข็ง)
- ส่งออเดอร์ไปยังระบบพนักงาน
- มาชำระเงินที่เคาน์เตอร์ตามระบบ

**Counter Ordering**
- สั่งซื้อโดยตรงกับพนักงานที่เคาน์เตอร์
- ชำระเงินทันทีผ่าน PromptPay QR Code

### 3. ระบบความปลอดภัยและการรับรองตัวตน
- ระบบ JWT Authentication สำหรับพนักงาน
- การเข้ารหัสข้อมูลการชำระเงิน
- Table Session Management แบบปลอดภัย

### 4. ระบบฐานข้อมูลและ API
- PostgreSQL Database พร้อม Sequelize ORM
- RESTful API สำหรับการเชื่อมต่อระหว่างส่วนต่างๆ
- Swagger API Documentation
- Docker containerization

## กระบวนการทำงานของระบบ

### Counter Ordering Flow (ทดสอบสำเร็จ ✅)
1. พนักงาน Login เข้าระบบ
2. ลูกค้าสั่งเมนูที่เคาน์เตอร์
3. พนักงานสร้างออเดอร์ในระบบ
4. ระบบคำนวณราคารวม
5. **ตัวเลือกการชำระเงิน:**
   - **PromptPay:** สร้าง QR Code → ลูกค้าสแกนจ่าย → พนักงานยืนยันการชำระเงิน
   - **เงินสด:** พนักงานป้อนจำนวนเงินที่ลูกค้าจ่าย → ระบบคำนวณเงินทอนอัตโนมัติ
6. ระบบสร้างใบเสร็จอัตโนมัติ
7. อัปเดตสถานะ Order เป็น "SERVED"

### Table QR Ordering Flow (ทดสอบสำเร็จ ✅)
1. ลูกค้าสแกน QR Code บนโต๊ะ
2. ระบบสร้าง Table Session อัตโนมัติ
3. ลูกค้าเลือกเมนูและเพิ่มหมายเหตุ
4. ส่งออเดอร์เข้าระบบ
5. พนักงานเห็นออเดอร์พร้อมข้อมูลโต๊ะและหมายเหตุ
6. ลูกค้ามาชำระเงินที่เคาน์เตอร์
7. **พนักงานเลือกวิธีการชำระเงิน:**
   - **ระบุหมายเลขโต๊ะ:** พนักงาน key เฉพาะเลขโต๊ะ ระบบจะหา Orders ที่รอชำระเงินอัตโนมัติ
   - **ระบุ Session ID:** ใช้ Session ID จากการสแกน QR
   - **ระบุ Order ID:** ใช้ Order ID โดยตรง
8. **ตัวเลือกการชำระเงิน:**
   - **PromptPay:** สร้าง QR Code สำหรับยอดรวมของโต๊ะ
   - **เงินสด:** ป้อนจำนวนเงินที่ลูกค้าจ่าย ระบบคำนวณเงินทอน
9. ระบบสร้างใบเสร็จและปิด Table Session อัตโนมัติ

## ผลการทดสอบระบบ

### ✅ Test Case 1: Counter Ordering - สำเร็จ
- ✅ Login staff และการรับรองตัตน
- ✅ Create menu category "กาแฟ"
- ✅ Create menu items "ลาเต้", "คาปูชิโน่"
- ✅ Create counter order (2 ลาเต้ + 1 คาปูชิโน่) = 275 บาท
- ✅ Generate PromptPay QR for payment

### ✅ Test Case 2: Table QR Ordering - สำเร็จ
- ✅ Create table T-002 with permanent QR code
- ✅ Customer scans QR → start session (แก้ไข sessionId bug เรียบร้อย)
- ✅ Customer places table order (1 ลาเต้ + 2 คาปูชิโน่) = 280 บาท with notes
- ✅ Staff sees all orders including table orders with notes
- ✅ Staff creates payment for table order (customer comes to counter)
- ✅ Close table session (no auth required)

### ✅ Test Case 3: Menu Options & PDF Receipt - สำเร็จ
- ✅ Create menu options (ระดับความหวาน, ท็อปปิ้ง)
- ✅ Customer orders with options (ชาไทย + หวานมาก + ไข่มุก)
- ✅ Staff processes payment and generates receipt
- ✅ PDF receipt export with Thai-English transliteration
- ✅ Receipt includes itemized options and pricing

### ✅ Test Case 4: ระบบการชำระเงินแบบครบถ้วน - สำเร็จ
- ✅ Counter Order + PromptPay QR payment
- ✅ Counter Order + Cash payment with automatic change calculation
- ✅ Table QR Order + Payment by Table ID
- ✅ Table QR Order + Payment by Session ID
- ✅ View pending orders by Table ID
- ✅ Automatic receipt generation for all payment methods
- ✅ Order status update to "SERVED" after payment

### ✅ Test Case 5: ระบบ API ที่รองรับการชำระเงินหลากหลาย - สำเร็จ
- ✅ `POST /api/payments/promptpay` รองรับ `orderId`, `tableId`, `sessionId`
- ✅ `POST /api/payments/cash` รองรับ `orderId`, `tableId`, `sessionId`
- ✅ `GET /api/payments/table/{tableId}/pending` ดูรายการ orders ที่รอชำระเงิน
- ✅ Error handling สำหรับกรณีหา order ไม่เจอ
- ✅ Validation การชำระเงินสด (เงินไม่พอ, จำนวนเงินไม่ถูกต้อง)

## เทคโนโลยีที่ใช้

**Backend Development**
- Node.js + Express.js (MVC Architecture)
- PostgreSQL Database
- Sequelize ORM
- JWT Authentication
- Swagger API Documentation
- PDF Receipt Generation (jsPDF)
- Thai-English Transliteration Support

**DevOps & Deployment**
- Docker & Docker Compose
- Environment Configuration (.env)

**Payment Integration**
- PromptPay QR Code Generation
- QR Code Libraries

**Security Features**
- JWT Token-based Authentication
- Encrypted Session Management
- Secure API Endpoints

## ประโยชน์ที่ได้รับ

### สำหรับลูกค้า
1. **ความสะดวกสบาย** - สั่งอาหารผ่าน QR Code โดยไม่ต้องต่อคิว
2. **ความรวดเร็ว** - ลดเวลารอในการสั่งซื้อ
3. **ความถูกต้อง** - สามารถเลือกเมนูและระบุหมายเหตุได้ด้วยตนเอง
4. **การชำระเงินสะดวก** - รองรับ PromptPay ที่ทันสมัย

### สำหรับพนักงาน
1. **เพิ่มประสิทธิภาพ** - จัดการออเดอร์ได้แบบเรียลไทม์
2. **ลดความผิดพลาด** - ระบบดิจิทัลลดการผิดพลาดจากการจดจำ และระบบคำนวณเงินทอนอัตโนมัติ
3. **การควบคุมที่ดีขึ้น** - ติดตามสถานะโต๊ะและออเดอร์ได้ชัดเจน
4. **ความสะดวกในการชำระเงิน** - key เฉพาะหมายเลขโต๊ะก็สามารถชำระเงินได้
5. **ความยืดหยุ่น** - รองรับการชำระเงินหลากหลายรูปแบบ (QR, เงินสด)
6. **ความปลอดภัย** - การชำระเงินรวมศูนย์ที่เคาน์เตอร์

### สำหรับเจ้าของร้าน
1. **ข้อมูลแบบเรียลไทม์** - ติดตามยอดขายและเมนูยอดนิยม
2. **การจัดการที่เป็นระบบ** - ข้อมูลครบถ้วนและแม่นยำ
3. **เพิ่มปริมาณลูกค้า** - รองรับลูกค้าได้มากขึ้นด้วยระบบที่มีประสิทธิภาพ
4. **การควบคุมต้นทุน** - ลดความสูญเสียจากความผิดพลาด

## สรุป

ระบบ POS คาเฟ่สมัยใหม่นี้ได้รับการพัฒนาและทดสอบแล้วเสร็จสมบูรณ์ โดยครอบคลุมทั้งการสั่งซื้อแบบดั้งเดิมและการสั่งซื้อผ่าน QR Code บนโต๊ะ ระบบมีความปลอดภัยสูงด้วยการชำระเงินรวมศูนย์ที่เคาน์เตอร์ และรองรับเทคโนโลยีสมัยใหม่ทั้ง PromptPay และการชำระเงินสดพร้อมระบบคำนวณเงินทอนอัตโนมัติ

 - **ใบเสร็จอ่านง่ายตามมาตรฐานร้าน**: ส่วนหัวระบุเลขที่ใบเสร็จทางซ้าย และ Order No. ทางขวา พร้อม Cashier และ Time ตามรูปตัวอย่าง
 ✅ PDF receipt export with Thai-English transliteration
 ✅ Receipt includes itemized options and pricing
 ✅ Receipt header layout updated: left shows Receipt No., right shows "Order No. <id>" (replaces previous "Baanthaicafe - XX")

ระบบพร้อมใช้งานและสามารถปรับขยายเพิ่มเติมได้ในอนาคต เช่น ระบบ Inventory Management, Customer Loyalty Program, Mobile App สำหรับลูกค้า, หรือ Advanced Analytics เพื่อตอบสนองความต้องการที่เพิ่มขึ้นของธุรกิจ
