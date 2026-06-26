# Ban Tha Cha-om School — Project Master Reference

> อ่านไฟล์นี้ก่อนทำงานทุกครั้ง  
> Repo: https://github.com/Pamjyh/Banthacha-om-School  
> Pages: https://pamjyh.github.io/Banthacha-om-School/

---

## ⚡ กฎที่ต้องจำเสมอ

| กฎ | รายละเอียด |
|----|-----------|
| **ห้าม commit Code.gs ระบบสารบัญ** | มี LINE_TOKEN จริง — gitignored แล้ว paste ขึ้น GAS editor โดยตรง |
| **Code.gs ระบบออมทรัพย์ ใน git = placeholder** | รหัสจริงอยู่ใน GAS editor (AKfycbzjDEIz...) เท่านั้น |
| **Push ต้องใช้ `--force`** | history อาจ diverge จาก remote |
| **PATCH ใช้ query string** | `PATCH('table', 'id=eq.'+id, payload)` ไม่ใช่ id ตรงๆ |
| **ห้าม commit Code.gs ระบบค่ารถ ที่มี password** | ตรวจสอบก่อน git add ทุกครั้ง |

---

## 🚀 Push Workflow

```bash
cd ~/Documents/ระบบงานโรงเรียนบ้านท่าชะอม/"School Portal"
git add -A
git commit -m "อธิบายสิ่งที่เปลี่ยน"
git push --force origin main
```

> git index.lock ค้าง → `mv .git/index.lock .git/index.lock.bak` (sandbox rename แทน rm)

---

## 🗂️ โครงสร้างโฟลเดอร์

```
ระบบงานโรงเรียนบ้านท่าชะอม/
├── School Portal/               ← git repo หลัก
│   ├── index.html               ← portal หน้าหลัก
│   ├── manifest.json + sw.js    ← PWA + Service Worker ครอบทุกระบบ (CACHE_NAME = 'banthacha-om-v2')
│   ├── assets/icons/            ← icon-192, icon-512, apple-touch-icon
│   ├── ระบบบริหารงาน/           ← Supabase (แสดงผลชื่อ "ระบบการเงินและพัสดุ")
│   ├── ระบบออมทรัพย์/           ← GAS (Code.gs = reference, password = placeholder)
│   ├── ระบบค่ารถ/               ← GAS
│   ├── ระบบลงเวลา/              ← Supabase + face-api + LINE bot
│   └── ระบบสารบัญ/              ← GAS + LINE
│       └── Code.gs              ← ⚠️ gitignored — มี LINE_TOKEN จริง
└── ระบบสารบัญ/                  ← โฟลเดอร์เก่า (ลบจาก Finder ได้เลย)
```

---

## 🌐 URLs

| ระบบ | URL | Backend |
|------|-----|---------|
| Portal | `pamjyh.github.io/Banthacha-om-School/` | static |
| ระบบการเงินและพัสดุ | `.../ระบบบริหารงาน/` | Supabase |
| ระบบออมทรัพย์ | `.../ระบบออมทรัพย์/` | GAS + Sheets |
| ระบบค่ารถ | `.../ระบบค่ารถ/` | GAS + Sheets |
| ระบบลงเวลา | `.../ระบบลงเวลา/` | Supabase + face-api |
| ระบบสารบัญ | `.../ระบบสารบัญ/` | GAS + LINE |

---

## 1. ระบบการเงินและพัสดุ

> โฟลเดอร์ยังชื่อ `ระบบบริหารงาน/` — เปลี่ยนแค่ชื่อที่แสดงผล (title, manifest, nav, portal card)

**เป้าหมาย**: บริหารงานโครงการ / พัสดุ / การเงิน / รายงาน  
**Stack**: HTML/JS (13 ไฟล์) → Supabase → GitHub Pages

### Tables สำคัญ

| Table | หมายเหตุ |
|-------|---------|
| `years` | id, year_be |
| `projects` | year_id, name, teacher_name, budget_amount |
| `procurement_items` | year_id, project_id, seq, title, amount, withdraw_status, withdraw_no |
| `fund_categories` | seed แล้ว 16 หมวด |
| `finance_transactions` | ใช้ **`document_no`** (ไม่ใช่ `doc_no`) |
| `external_transactions` | หน้าเงินนอก |

### Auth
- รหัส → SHA-256 → `localStorage['school_admin_hash']`
- Session → `sessionStorage['school_admin_session']` (หมดเมื่อปิด tab)
- `adminGuard()` ต้องเรียกก่อน save/delete ทุกฟังก์ชัน

### ลำดับ script (ห้ามสลับ)
`config → state → helpers → years → dashboard → projects → procurement → finance → delete → navigation → export → import → external → [SheetJS] → [Chart.js] → auth → init → events → app`

### State Variables
```js
CY, CYbe             // year ปัจจุบัน
PROJECTS, PROC       // data cache
FINANCE_LOADED       // false = ต้อง reload (reset เมื่อ switchYear / ลบ project)
IS_ADMIN             // boolean — set ใน auth.js
```

### สถานะ ✅ ครบทุกอย่าง
- CRUD ครบ Dashboard / โครงการ / พัสดุ / การเงิน / เงินนอก / รายงาน / Export CSV
- Auth password gate + rate limit (5 ครั้ง → block 15 นาที)
- Import CSV พัสดุ + Excel ยอดยกมา (adminGuard คุม)
- Scrutinize round 1+2: แก้ bug ครบ (delete cascade, export field name, XSS, session)
- `deleteYear()` + `addYear()` เพิ่ม `adminGuard()` แล้ว (เคย unprotected)

### TODO
- 🔵 GAS PropertiesService — ย้าย password ออกจาก plaintext (long-term, low priority)

---

## 2. ระบบออมทรัพย์

**เป้าหมาย**: บันทึกฝาก-ถอนเงินออมทรัพย์นักเรียน  
**Stack**: HTML/JS → GAS Web App → Google Sheets

### สำคัญ
- `Code.gs` ใน git = **placeholder** (`REPLACE_WITH_YOUR_ADMIN_PASSWORD`) — ห้ามใส่รหัสจริง
- Deploy จริง: GAS editor deployment ID `AKfycbzjDEIz...`
- GAS CacheService: cache 6 ชั่วโมง, invalidate เมื่อ write
- Client: single bootstrap call (รวม 8 API → 1 call)
- PWA: manifest.json theme `#1aae39`
- keepWarm trigger: ตั้งใน GAS เพื่อป้องกัน cold start

### สถานะ ✅ ครบทุกอย่าง
- เพิ่ม/ถอน/ดูยอด นักเรียนทุกห้อง
- GAS cache + client cache (ลด cold start)
- SEC fix: password ส่งผ่าน POST body ไม่ปรากฎใน URL/log
- API loading bar (3px top bar)

---

## 3. ระบบค่ารถ

**เป้าหมาย**: บันทึกค่าเดินทางรับ-ส่งนักเรียน  
**Stack**: HTML/JS → GAS Web App → Google Sheets

### สำคัญ
- GAS cache เพิ่มแล้ว (readRiders, readFarePaid + invalidation)
- Supabase RLS tighten แล้ว
- PWA: manifest.json theme `#0075de`

### สถานะ ✅ ครบทุกอย่าง

---

## 4. ระบบลงเวลา

**เป้าหมาย**: เช็คอิน/เอาท์ด้วยใบหน้า + บริหารข้อมูลครู + ลา  
**Stack**: HTML/JS → Supabase → face-api.js + LINE bot

### Auth
- Admin hash: `localStorage['thatime_admin_hash']` + `settings.admin_hash` ใน Supabase
- ตั้ง password ครั้งแรก: เข้าหน้า admin → กรอก password ใหม่ → sync ขึ้น Supabase อัตโนมัติ
- 8 admin operations → Supabase RPC `admin_*` (SECURITY DEFINER + validate hash)

### Supabase RPC (admin ops)
```
admin_add_employee, admin_update_employee_photo, admin_delete_employee
admin_delete_attendance
admin_update_leave, admin_delete_leave
admin_update_settings
admin_set_hash  ← first-run + password change
```
Public ยังทำได้: attendance INSERT (เช็คอิน) + leaves INSERT (ยื่นใบลา)

### LINE Bot (Supabase pg_cron)
| Function | เวลา (ไทย) | cron (UTC) |
|----------|-----------|-----------|
| `send_line_morning_summary()` | 08:30 | `30 1 * * 1-5` |
| `send_line_evening_summary()` | 16:30 | `30 9 * * 1-5` |

**Format เช้า**: ✅ เช็คอินแล้ว / 🏖️ ลาจริง / 🚌 ราชการ/อบรม / ⏰ ยังไม่เช็ค  
**Format เย็น**: ✅ กลับบ้าน / 🏫 ยังอยู่ / 🚌 ราชการ/อบรม / ❌ ขาด + random closing msg (สุ่ม 7 ข้อความ)  
duty_types: `['ไปราชการ','อบรม','ประชุม','ศึกษาดูงาน']` — แยกจากวันลาจริง

### CDN Versions (pinned)
- `supabase-js@2.108.2` — อย่าเปลี่ยนเป็น `@2` (unpinned) อีก
- `face-api@1.7.13` — stable, ไม่ต้อง bump
- `xlsx@0.18.5` — stable

### สถานะ ✅ ครบทุกอย่าง
- face recognition: ratio test + 3 consecutive frames + swap-face protection
- 1:N identification (ไม่ต้องเลือกชื่อก่อนสแกน)
- XSS fix: esc() ครอบทุก innerHTML user input
- Admin password: SHA-256 hash (ไม่ hardcode แล้ว)
- `loadFaceModels()` มี try/catch ทั้ง 2 จุด (photo upload + addEmp) — ไม่ค้างถ้า CDN down

### TODO
- 🔵 Phase 3: offline fallback สำหรับ face-api models (~6MB) — low priority

---

## 5. ระบบสารบัญ

**เป้าหมาย**: อัปโหลดเอกสารราชการขึ้น Drive + แจ้งครูทาง LINE อัตโนมัติ  
**Stack**: HTML/JS (chip UI) → GAS Web App → Google Drive + LINE Messaging API

### Config (ใน Code.gs — gitignored)
| ตัวแปร | ค่า |
|--------|-----|
| `LINE_TOKEN` | Channel Access Token (ใช้ร่วมกับระบบลงเวลา) |
| `LINE_GROUP` | `C45e2d8e51ad3ae86ac2e70dea43df2a7` |
| `FOLDER_NAME` | `'สารบัญโรงเรียนบ้านท่าชะอม'` |
| `TEACHERS` | 15 คน — userId ครบทุกคนแล้ว |

### LINE Message Format
- textV2 + substitution → mention สีฟ้าจริง + notification
- mentionAll: `{everyone}` → @ทุกคนในกลุ่ม
- DM รายคน: comment out (ประหยัด quota 300/เดือน)
- Webhook mode: comment out (userId ครบแล้ว มิ.ย. 2569)

### Deploy Code.gs (ทุกครั้งที่แก้)
1. เปิด GAS editor → paste Code.gs ใหม่
2. Deploy → **Manage deployments** → Edit → version ใหม่ → **Update**
3. URL เดิมใช้ได้ต่อ — ไม่ต้องแก้ `var API` ใน index.html

### Subfolder Drive
ปีการศึกษา / ปีปฏิทิน — สร้างอัตโนมัติ, year selector เพิ่มเองทุกปี (BASE=2566)

### สถานะ ✅ ครบทุกอย่าง
- Chip เลือกครูหลายคน + mentionAll
- LINE failure detection (lineOk propagation)
- Code.gs gitignored
- LINE webhook URL ตรงกับ GAS deployment แล้ว

### ไฟล์ per-system (drill-down เมื่อต้องการ)
`ระบบสารบัญ/project.md` · `decisions.md` · `known-bugs.md`

---

## 🐛 Bug Patterns ที่เคยเจอ (cross-system)

| อาการ | วิธีแก้ |
|-------|--------|
| PATCH ไม่ทำงาน | ส่ง query string: `'id=eq.'+id` |
| git index.lock ค้าง | `mv .git/index.lock .git/index.lock.bak` |
| git push rejected | `git push --force origin main` |
| finance ใส่ค่าไม่ได้ (column not found) | schema ใช้ `document_no` ไม่ใช่ `doc_no` |
| LINE ส่งแต่ frontend บอกสำเร็จ | ตรวจ `lineOk !== false` — guard return ต้องเป็น `false` ไม่ใช่ `undefined` |
| GAS cold start ช้า | keepWarm trigger + GAS CacheService |
| SW registration ไม่ทำงาน | SW code ต้องอยู่ **ใน** `</script>` tag — ห้ามต่อท้ายไฟล์ข้างนอก |
| Browser cache เก่า | Cmd+Shift+R (hard reload) |

---

## 📋 สิ่งที่รอทำ (Backlog)

| ระบบ | งาน | Priority |
|------|-----|----------|
| ระบบลงเวลา | Phase 3: offline fallback face-api | 🔵 low |
| ทุกระบบ (GAS) | ย้าย password → GAS PropertiesService | 🔵 low |
| ระบบสารบัญ | Auth บน GAS endpoint (shared secret) | 🔵 low |
| root level | ลบโฟลเดอร์ `ระบบสารบัญ/` เก่าจาก Finder | 🟡 cleanup |
