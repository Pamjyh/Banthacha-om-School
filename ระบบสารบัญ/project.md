# ระบบสารบัญ — Project Overview

## เป้าหมาย
อัปโหลดเอกสารราชการขึ้น Google Drive และแจ้งครูที่ได้รับมอบหมายทาง LINE อัตโนมัติ

## Stack
- **Frontend**: HTML/JS ไฟล์เดียว (`index.html`) — ไม่มี framework
- **Backend**: Google Apps Script Web App (`Code.gs`) — deploy บน Gmail โรงเรียน
- **Storage**: Google Drive — auto-create โฟลเดอร์ตามปี
- **Notification**: LINE Messaging API — push to group (textV2 real @mention)

## URLs / Config
| ตัวแปร | ที่ไหน | ค่า |
|--------|--------|-----|
| `API` | index.html | URL จาก Apps Script deploy |
| `LINE_TOKEN` | Code.gs | Channel Access Token ของระบบสารบัญเท่านั้น (แยกจากระบบลงเวลาแล้ว 2026-07-01 — เดิมใช้ร่วมกัน) |
| `LINE_GROUP` | Code.gs | Group ID รูปแบบ `Cxxxxxxxx` |
| `TEACHERS` | Code.gs | `[{ name, userId }]` — userId ครบทุกคนแล้ว (มิถุนายน 2569) |
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
  ├── index.html      — UI หลัก (chip เลือกครู, drag & drop, mentionAll)
  ├── Code.gs         — Apps Script backend (local only — gitignored, deploy จาก GAS editor)
  ├── manifest.json   — PWA manifest
  ├── known-bugs.md   — bug log + ข้อควรระวัง
  ├── decisions.md    — สรุป key decisions
  ├── SETUP.md        — คู่มือ deploy ตั้งแต่ต้น
  └── project.md      — ไฟล์นี้
```

> ⚠️ Code.gs อยู่ใน .gitignore — มี LINE_TOKEN จริง ห้าม commit ลง git

## สถานะ (มิถุนายน 2569)
- ✅ UI chip เลือกครูหลายคนพร้อมกัน + mentionAll (@ทุกคน)
- ✅ Drag & drop + auto-extract ชื่อเรื่องจาก PDF / DOCX
- ✅ Upload Google Drive (subfolder ตามปีการศึกษา/ปีปฏิทิน)
- ✅ ส่ง LINE Group — textV2 real @mention (สีฟ้า + notification จริง)
- ✅ ดึงชื่อจริงจาก LINE Profile API (fetchDisplayNames parallel)
- ✅ userId ครูทุกคนพร้อมแล้ว — Webhook mode ปิดแล้ว (comment out)
- ✅ LINE failure detection — แสดง ⚠️ ถ้าส่งไม่สำเร็จ + guard return false ถ้า token ไม่ set
- ✅ Year selector auto-extend (BASE=2566 → ปัจจุบัน+1, เพิ่มเองทุกปีไม่ต้องแก้โค้ด)
- ✅ Tooltip แสดงสถานะ userId ของแต่ละครูบน chip
- ✅ apiWarn แจ้งเตือนถ้า API URL ยังไม่ตั้งค่า
- ✅ Code.gs gitignored — ป้องกัน LINE_TOKEN รั่วลง git
- ⚠️ ไม่มี auth บน GAS endpoint (RISK-01 — ความเสี่ยงต่ำ ยังไม่ implement)

## วิธี deploy เมื่อแก้ Code.gs
1. แก้ Code.gs ใน GAS editor (paste จาก reference copy ในโฟลเดอร์)
2. Apps Script → Deploy → **Manage deployments**
3. กด Edit (ดินสอ) → เลือก version ล่าสุด → **Update**
4. URL เดิมใช้ได้ต่อเลย — **ไม่ต้องแก้ `var API` ใน index.html**

> หมายเหตุ: "New deployment" สร้าง URL ใหม่ ใช้ก็ต่อเมื่อต้องการ URL แยก (เช่น ระบบ staging) เท่านั้น
