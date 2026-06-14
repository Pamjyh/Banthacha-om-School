# Known Bugs — School Portal

## BUG-P01: หัว header แสดง "วันที่ —" แทนวันที่จริง ✅ FIXED
**อาการ**: ส่วน header clock แสดง "วันที่ —" หรือว่างเปล่า ทั้งที่ section hero มีวันที่ถูกต้อง
**สาเหตุ**: `updateGreeting()` ตั้งค่า `#greeting-date` แต่ลืมตั้งค่า `#clock-date` ในส่วน header
**แก้**: สร้าง `dateStr` ก่อน if-blocks แล้วตั้งค่าทั้งสอง element พร้อมกัน
```js
const dateStr = `วันที่ ${day} ${THAI_MONTHS[month]} ${year}`;
document.getElementById('greeting-date').textContent = dateStr;
document.getElementById('clock-date').textContent    = dateStr;  // ← เพิ่มบรรทัดนี้
```
**ไฟล์**: `index.html` ใน `updateGreeting()`

---

## BUG-P02: Card "สารบัญ" (inactive) มองไม่เห็น ✅ FIXED
**อาการ**: การ์ด "สารบัญ" หายไปหรือมองไม่เห็นในช่วง animation
**สาเหตุ**: CSS `.sys-card--inactive.animate { opacity: 0.5 }` override animation keyframe `from { opacity: 0 }` ทำให้ transition ผิดปกติ และ `animation-play-state: paused` ทำให้การ์ดค้างที่ opacity: 0
**แก้**: ลบ `opacity: 0.5` ออกจาก `.sys-card--inactive.animate` ใช้แค่ `animation-play-state: running` แทน opacity ที่ต้องการ (ใช้ CSS ปกติของ inactive class แทน)
```css
/* ถูก */
.sys-card--inactive.animate {
  animation-play-state: running;
}
/* ผิด — opacity จาก .animate override keyframe */
.sys-card--inactive.animate {
  animation-play-state: running;
  opacity: 0.5;  /* ← ลบออก */
}
```
**ไฟล์**: `index.html` CSS section

---

## BUG-P03: ARIA roles ไม่ถูกต้องบน card grid ✅ FIXED
**อาการ**: Screen reader ประกาศ card เป็น "listitem" แทน "button"
**สาเหตุ**: ใช้ `role="list"` บน grid container และ `role="listitem"` บน card แต่ card ทำหน้าที่เป็น interactive button
**แก้**: เปลี่ยนเป็น `role="group"` บน container และ `role="button"` บน card แต่ละอัน
**ไฟล์**: `index.html` HTML structure

---

## BUG-P04: Focus ค้างอยู่ที่ card ที่ถูกซ่อนเมื่อเปิด overlay ✅ FIXED
**อาการ**: เมื่อกดเปิดระบบ focus อยู่ที่ card ที่ถูก `display:none` ทำให้ screen reader สับสน
**สาเหตุ**: `openSystem()` ไม่ย้าย focus ไปยัง overlay
**แก้**: บันทึก `_lastFocused = document.activeElement` ก่อนเปิด แล้ว `document.getElementById('back-btn').focus()` เมื่อเปิด overlay ปิดคืน focus เมื่อ `closeSystem()`
**ไฟล์**: `index.html` `openSystem()` / `closeSystem()`

---

## BUG-P05: Logo fallback ใช้ `nextElementSibling` แบบเปราะบาง ✅ FIXED
**อาการ**: ถ้า HTML structure เปลี่ยน `nextElementSibling` อาจชี้ไปผิด element
**แก้**: เปลี่ยนเป็น `document.getElementById('logo-placeholder')` ซึ่งไม่ขึ้นกับ DOM position
**ไฟล์**: `index.html` `handleLogoError()`

---

## BUG-P06: `getGreetingData` ใช้ `h+24` trick ที่เปราะบาง ✅ FIXED
**อาการ**: Logic `if (h >= 21 || h < 5)` ไม่ครอบคลุมทุกกรณีถ้าเขียนด้วย h+24
**แก้**: เขียน if-else แบบตรงไปตรงมา
```js
if (h >= 5 && h < 12) return GREETINGS[0];  // เช้า
if (h >= 12 && h < 13) return GREETINGS[1]; // เที่ยง
if (h >= 13 && h < 18) return GREETINGS[2]; // บ่าย
if (h >= 18 && h < 21) return GREETINGS[3]; // เย็น
return GREETINGS[4];                         // ดึก
```
**ไฟล์**: `index.html` `getGreetingData()`

---

## KNOWN LIMITATION (ไม่ใช่ bug แต่ควรรู้)

### L-P01: ระบบที่ block iframe จะโหลดไม่ได้
ถ้า sub-system ตั้ง HTTP header `X-Frame-Options: DENY` หรือ `Content-Security-Policy: frame-ancestors 'none'` จะโหลดใน iframe ไม่ได้
→ ปัจจุบัน 3 ระบบที่ใช้งานได้อยู่ทั้งหมด ถ้าเพิ่มระบบใหม่ต้องตรวจสอบก่อน

### L-P02: Portal ยังไม่ได้ host บน web
ต้องเปิดจาก local file เท่านั้น ลิงก์ระบบลงเวลา (`../ระบบเช็คชื่อมาทำงาน/index.html`) จะพังถ้าย้ายไป host บน web
→ ต้องแก้ path ก่อน deploy

### L-P03: ไม่รองรับ offline
Card icon และ font โหลดจาก CDN (Google Fonts) ถ้าไม่มีอินเทอร์เน็ต font จะ fallback เป็น system font
