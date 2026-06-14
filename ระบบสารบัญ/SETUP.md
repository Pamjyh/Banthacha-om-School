# SETUP — ระบบสารบัญ

วิธีตั้งค่าตั้งแต่ต้นจนใช้งานได้

---

## ขั้นตอนที่ 1 — สร้าง LINE OA Messaging API Channel

1. ไปที่ https://developers.line.biz → Login ด้วย LINE ของโรงเรียน
2. กด **Create a new provider** → ตั้งชื่อ เช่น "โรงเรียนบ้านท่าชะอม"
3. กด **Create a new channel** → เลือก **Messaging API**
4. กรอกข้อมูล:
   - Channel name: ชื่อบอทที่จะแสดงใน LINE (เช่น "สารบัญ รร.บ้านท่าชะอม")
   - Channel description: สักอย่าง
   - Category / Subcategory: Education
5. กด **Create** → ยืนยันเงื่อนไข

---

## ขั้นตอนที่ 2 — ได้รับ Channel Access Token

1. ใน Channel ที่สร้าง → แถบ **Messaging API**
2. เลื่อนลงหา **Channel access token (long-lived)**
3. กด **Issue** → Copy token ยาวๆ
4. นำไปใส่ใน `Code.gs`:
   ```js
   var LINE_TOKEN = 'ใส่ token ที่ copy มาตรงนี้';
   ```

---

## ขั้นตอนที่ 3 — เพิ่มบอทเข้า Group LINE ของครู

1. ในแอป LINE → Group ครูทั้งโรงเรียน
2. กด Add member → ค้นหา **LINE ID** ของบอท
   - LINE ID ของบอทอยู่ใน LINE Developers → Channel → Basic settings → **LINE Official Account features → LINE ID**
3. เพิ่มบอทเข้า Group
4. ในหน้า Channel → Messaging API → เปิด **Allow bot to join group chats**

---

## ขั้นตอนที่ 4 — ได้รับ Group ID

วิธีที่ง่ายที่สุดคือดักรับ Webhook:

1. LINE Developers → Messaging API → **Webhook URL** → ใส่ URL จาก Apps Script (ดูขั้นตอนที่ 5 ก่อน)
2. ส่งข้อความใดๆ ใน Group → ดู Apps Script Logs (Executions)
3. Log จะแสดง Group ID รูปแบบ `C1234567890abcdef...`

**หรือ** ใช้วิธีง่ายกว่า: https://www.line-insight.com/gid (เครื่องมือดู Group ID)

นำ Group ID ไปใส่ใน `Code.gs`:
```js
var LINE_GROUP = 'Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

---

## ขั้นตอนที่ 5 — Deploy Code.gs บน Apps Script

1. เปิด Google Apps Script: https://script.google.com
2. สร้างโปรเจกต์ใหม่ (ล็อกอินด้วยอีเมลโรงเรียน)
3. วางเนื้อหาจากไฟล์ `Code.gs` ลงใน editor
4. แก้ค่า `LINE_TOKEN`, `LINE_GROUP`, และ `TEACHERS` ให้ถูกต้อง
5. กด **Deploy** → **New deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. กด **Deploy** → Copy **Web app URL**
7. นำ URL ไปใส่ใน `index.html`:
   ```js
   var API = 'https://script.google.com/macros/s/AKfy.../exec';
   ```

> ⚠️ ทุกครั้งที่แก้ Code.gs ต้อง **New deployment** ใหม่ (ไม่ใช่ Manage deployments)
> URL จะเปลี่ยน → ต้องอัปเดต index.html ด้วย

---

## ขั้นตอนที่ 6 — หา LINE userId ของครูแต่ละคน (สำหรับ @mention)

1. ให้ครูแต่ละคน **ส่งข้อความหาบอท** (DM หรือใน Group)
2. Apps Script Webhook จะรับ event และ Log userId ของผู้ส่ง
3. นำ userId (Uxxxxxxxxxx) ไปใส่ใน `Code.gs`:
   ```js
   var TEACHERS = [
     { name: 'ครูสมชาย', userId: 'U1234567890abcdef...' },
     ...
   ];
   ```
4. Deploy ใหม่

> ถ้ายังไม่มี userId ทิ้งไว้เป็น `''` ได้ — ระบบจะส่งแค่ชื่อครูในข้อความแทน

---

## ขั้นตอนที่ 7 — เพิ่มรายชื่อครู

แก้ `TEACHERS` ใน `Code.gs`:
```js
var TEACHERS = [
  { name: 'ครูสมชาย ใจดี',    userId: 'Uxxxxxxxx' },
  { name: 'ครูสมหญิง ยิ้มแย้ม', userId: '' },
  { name: 'ครูอนุบาล ขยัน',   userId: '' },
];
```
แล้ว Deploy ใหม่ — ชื่อจะอัปเดตใน dropdown อัตโนมัติ

---

## สรุป Config ทั้งหมด

| ตัวแปร | ที่ไหน | วิธีหา |
|--------|--------|--------|
| `LINE_TOKEN` | Code.gs | LINE Developers → Messaging API → Issue token |
| `LINE_GROUP` | Code.gs | Webhook log หรือเครื่องมือออนไลน์ |
| `TEACHERS[].userId` | Code.gs | ให้ครูส่งข้อความหาบอท → ดู Log |
| `API` | index.html | URL จาก Apps Script → Deploy |
| `FOLDER_NAME` | Code.gs | ชื่อโฟลเดอร์ Drive (สร้างอัตโนมัติ) |
