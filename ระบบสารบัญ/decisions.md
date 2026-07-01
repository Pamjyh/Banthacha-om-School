# ระบบสารบัญ — Decisions

## D1: ใช้ Apps Script แทน Node/Python backend
**เหตุผล**: ไม่ต้องมี server แยก, deploy ฟรีบน Google, ใช้ DriveApp ได้โดยตรง, ทีมคุ้นเคยกับ pattern เดียวกับระบบออมทรัพย์

## D2: ~~ใช้ LINE OA ตัวเดียวกับระบบลงเวลา~~ — เลิกใช้ร่วมแล้ว (2026-07-01)
**เหตุผลเดิม**: ประหยัด, LINE OA 1 ช่องส่งได้หลาย Group และหลายระบบพร้อมกัน แค่ใช้ Channel Access Token เดิม
**อัปเดต 2026-07-01**: แยก channel แล้ว — ระบบลงเวลาสร้าง LINE OA ใหม่ของตัวเอง (token เก็บใน Supabase SQL function) เพราะสองระบบแย่ง quota กันจนหมดกลางเดือน (429) ระบบสารบัญยังใช้ channel เดิม (token ใน `Code.gs`) เป็นระบบเดียวแล้ว
**ผลตกค้าง**: ตอนแยกวันที่ 2026-07-01 quota ของ channel นี้เหลือ **11/300** (ใช้ไป 289) — สาเหตุที่แน่ชัดยังไม่ยืนยัน (การแย่งกันมาก่อนเป็นแค่หนึ่งในสองทฤษฎี) รายละเอียด+ทฤษฎีที่สอง ดู BUG-D11 ใน known-bugs.md

## D3: ส่ง LINE Group (textV2 mention) เท่านั้น — ไม่ส่ง DM
**เหตุผล (อัปเดต มิถุนายน 2569)**: เดิมส่ง DM รายคนด้วย แต่ LINE Messaging API push message นับ quota (300/เดือน ฟรีเทียร์) และ reply ไม่นับ ครูทุกคนได้รับ notification ผ่าน @mention ใน group แล้ว การส่ง DM ซ้ำซ้อนและเปลือง quota
**การเปลี่ยนแปลง**: `sendLineDM()` ใน Code.gs ยังอยู่แต่ถูก comment out ทั้งบล็อก สามารถ uncomment คืนได้ถ้าจำเป็น

## D4: ดึงชื่อจริงจาก LINE Profile API ตอนส่ง
**เหตุผล**: ชื่อในระบบ (`TEACHERS[].name`) อาจไม่ตรงกับชื่อ LINE ของครู การดึง displayName จาก API ทำให้ข้อความ @mention ตรงกับที่เห็นในกลุ่มเสมอ

## D5: Base64 file upload ผ่าน JSON body
**เหตุผล**: Apps Script Web App รับ multipart/form-data ได้ไม่ดี, JSON + base64 ทำงานได้เสถียรกว่า ขนาดสูงสุด 20 MB (Drive อนุญาต)

## D6: subfolder ตามปีการศึกษา/ปีปฏิทิน
**เหตุผล**: ง่ายต่อการค้นหาย้อนหลัง, สร้างอัตโนมัติถ้าไม่มี ไม่ต้องสร้างมือ

## D7: ชื่อไฟล์บน Drive = ชื่อเรื่อง + นามสกุลเดิม
**เหตุผล**: ค้นหาได้ง่ายกว่าชื่อไฟล์ต้นฉบับที่มักเป็น `scan001.pdf`
```js
var safeName = title.replace(/[/\\?%*:|"<>\r\n]/g, '_') + '.' + ext;
```

## D8: ไม่มี login / authentication
**เหตุผล**: ระบบใช้ในโรงเรียน URL ไม่เปิดเผย ผู้ใช้คือเจ้าหน้าที่ธุรการเท่านั้น ความง่ายใช้งานสำคัญกว่า
**หมายเหตุ**: risk ที่ยังค้างอยู่ใน RISK-01 ของ known-bugs.md — ถ้า URL รั่วออกไปมีคนส่ง spam LINE group ได้ แก้ได้โดยเพิ่ม shared secret header

## D9: Webhook mode สำหรับหา userId — ปิดแล้ว
**เหตุผล**: userId ครูทุกคนได้มาครบแล้ว (มิถุนายน 2569) Webhook mode ถูก comment out ทั้งบล็อกใน `doPost` แล้ว
**ถ้าต้องการใช้อีก**: uncomment block ใน `doPost` ของ Code.gs, deploy ใหม่, รับ userId แล้ว comment กลับและ deploy อีกครั้ง

## D10: ไปราชการ/อบรม แยกออกจาก "วันลา" ในสรุป LINE
**เหตุผล**: การไปราชการ/อบรม/ประชุม/ศึกษาดูงาน ไม่ใช่วันลาจริง แต่ครูไม่อยู่โรงเรียน ควรแสดงแยกให้ชัดเจน
**การ implement**: ใช้ `duty_types TEXT[] := ARRAY['ไปราชการ','อบรม','ประชุม','ศึกษาดูงาน']` ใน Supabase function
— `leave_type = ANY(duty_types)` → 🚌 ราชการ/อบรม
— `leave_type <> ALL(duty_types)` → 🏖️ ลาจริง

## D11: Year selector ใช้ BASE=2566 เพิ่มอัตโนมัติ
**เหตุผล**: ไม่ต้องแก้โค้ดทุกปี loop จาก `thaiYear + 1` ลงถึง BASE=2566 เพิ่มปีถัดไปอัตโนมัติเมื่อถึงปีนั้น

## D12: Code.gs อยู่ใน .gitignore — ไม่ commit ลง git
**เหตุผล**: Code.gs มี LINE_TOKEN จริง การ commit จะทำให้ token อยู่ใน git history ตลอดไป แม้จะลบในภายหลัง
**การจัดการ**: เก็บ Code.gs ไว้ใน `School Portal/ระบบสารบัญ/` (local) โดยไม่ commit — paste เข้า GAS editor โดยตรงเมื่อต้อง deploy
