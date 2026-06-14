# ระบบสารบัญ — Project Overview

## เป้าหมาย
อัปโหลดเอกสารราชการขึ้น Google Drive และแจ้งครูที่ได้รับมอบหมายทาง LINE อัตโนมัติ

## Stack
- **Frontend**: HTML/JS ไฟล์เดียว (`index.html`) — ไม่มี framework
- **Backend**: Google Apps Script Web App (`Code.gs`) — deploy บน Gmail โรงเรียน
- **Storage**: Google Drive — auto-create โฟลเดอร์ตามปี
- **Notification**: LINE Messaging API — push to group + DM ครู

## URLs / Config
| ตัวแปร | ที่ไหน | ค่า |
|--------|--------|-----|
| `API` | index.html | URL จาก Apps Script deploy |
| `LINE_TOKEN` | Code.gs | Channel Access Token (ใช้ร่วมกับระบบลงเวลา) |
| `LINE_GROUP` | Code.gs | Group ID รูปแบบ `Cxxxxxxxx` |
| `TEACHERS` | Code.gs | `[{ name, userId }]` |
| `FOLDER_NAME` | Code.gs | `'สารบัญโรงเรียนบ้านท่าชะอม'` |

## โครงสร้างโฟลเดอร์ Drive
```
สารบัญโรงเรียนบ้านท่าชะอม/
  ├── ปีการศึกษา 2568/
  ├── ปีการศึกษา 2569/
  └── ปีปฏิทิน 2569/
```

## ไฟล์
```
ระบบสารบัญ/
  ├── index.html     — UI หลัก (drop zone + form)
  ├── Code.gs        — Apps Script backend
  ├── SETUP.md       — คู่มือ deploy ตั้งแต่ต้น
  └── project.md     — ไฟล์นี้
```

## สถานะ (มิถุนายน 2569)
- ✅ UI drag & drop พร้อมใช้
- ✅ Auto-extract ชื่อเรื่องจาก PDF / DOCX
- ✅ Upload Google Drive (subfolder by year)
- ✅ ส่ง LINE Group + DM ครูโดยตรง
- ✅ @mention ใช้ชื่อจริงจาก LINE Profile API
- ✅ Year selector (ปีการศึกษา / ปีปฏิทิน)
- ⚠️ ยังไม่มีรายชื่อครูจริง — รอใส่ userId
- ⚠️ ทุกครั้งที่แก้ Code.gs ต้อง New Deployment ใหม่

## วิธี deploy ใหม่
1. แก้ Code.gs
2. Apps Script → Deploy → **New deployment** (ไม่ใช่ Manage)
3. Copy URL ใหม่ → แก้ `var API` ใน index.html
4. Push ไฟล์ขึ้น GitHub
