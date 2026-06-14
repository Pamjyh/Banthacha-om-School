# ระบบสารบัญ — Architecture

## Flow ภาพรวม
```
Browser (index.html)
  │
  ├─ drag & drop ไฟล์
  ├─ PDF.js / mammoth.js → extract "เรื่อง ..." 
  ├─ FileReader.readAsDataURL → base64
  │
  └─ POST JSON → Apps Script Web App (Code.gs)
                    │
                    ├─ Utilities.base64Decode → Blob
                    ├─ DriveApp → สร้าง subfolder → createFile
                    ├─ setSharing(ANYONE_WITH_LINK, VIEW)
                    │
                    └─ LINE Messaging API
                          ├─ Push to GROUP (with @mention)
                          └─ Push DM to teacher userId
```

## Frontend (index.html)

### Title Extraction
| ไฟล์ | Library | Accuracy |
|------|---------|----------|
| PDF (text-based) | PDF.js 3.11.174 | ~85-90% |
| PDF (สแกน) | — | 0% (fallback ชื่อไฟล์) |
| DOCX | mammoth.js 1.6.0 | ~90-95% |
| รูปภาพ | — | 0% (fallback ชื่อไฟล์ทันที) |

Regex: `/เรื่อง\s*[:：]?\s*([^\n\r]{3,120})/`

### Base64 Upload
```js
// ใช้ indexOf แทน split (กัน edge case data URL มี comma ใน header)
var comma = rd.result.indexOf(',');
resolve(rd.result.slice(comma + 1));
```

### Year Selector
- Radio: ปีการศึกษา / ปีปฏิทิน
- Dropdown: พ.ศ. ปัจจุบัน ±1 (generate จาก `new Date().getFullYear() + 543`)
- ส่งเป็น `yearType` + `year` ใน JSON body

## Backend (Code.gs)

### doGet
ส่งรายชื่อครูกลับไปให้ frontend populate dropdown:
```js
{ ok: true, teachers: ['ครูก', 'ครูข', ...] }
```

### doPost — uploadDoc
1. `Utilities.base64Decode` → `Utilities.newBlob`
2. `getOrCreateFolder(yearType, year)` → root folder → subfolder
3. `folder.createFile(blob)` → `setSharing(ANYONE_WITH_LINK, VIEW)`
4. `getLineDisplayName(userId)` → ดึงชื่อจริงจาก LINE Profile API
5. Push group message + @mention (mentionees array)
6. Push DM to teacherUserId (การันตีแจ้งเตือน)

### doPost — Webhook Mode (ชั่วคราว)
ใช้ตอนหา userId ครู — ส่ง DM กลับหา admin พร้อมชื่อและ userId  
หลังเก็บ userId ครบแล้ว ให้ลบโค้ดส่วนนี้ออก

### LINE Mention
```js
msg.mentionees = [{
  index:  0,              // ตำแหน่ง @ ในข้อความ
  length: mention.length, // ความยาว "@ชื่อ" (Thai = 1 code unit)
  userId: teacherUserId,
  type:   'user'
}];
```
> ⚠️ LINE Messaging API mention ใน group อาจไม่ trigger notification  
> → แก้โดยส่ง DM หาครูโดยตรงเพิ่มเติม

## โครงสร้าง Drive
```
getOrCreateFolder(yearType, year):
  DriveApp.getFoldersByName(FOLDER_NAME) → root
  root.getFoldersByName("ปีการศึกษา 2569") → subfolder
  (สร้างอัตโนมัติถ้าไม่มี)
```
