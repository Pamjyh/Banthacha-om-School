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

> ⚠️ Cowork sandbox สร้าง lock files ทิ้งไว้เสมอ — ก่อน commit **ทุกครั้ง** ต้องรัน:
> `rm -f .git/HEAD.lock .git/index.lock`

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

### Bug fixes (2026-07-01)
- **`addTransaction`**: เปลี่ยนจาก hard-coded column index เป็น dynamic `findSColTx()` — ป้องกัน grade/name ผิดถ้า column order เปลี่ยน หรือ Sheets ทำ Table format
- **`getAllSummary`**: เปลี่ยนทุก column position เป็น dynamic `findSColSum()`
- **`loadTodaySummary` + `doLoadMonthData`**: race condition guard — ถ้า `allStus` ยังว่างให้ retry 500ms
- **`confirmTx`**: refresh today/month tab หลังฝาก/ถอน

> ⚠️ Code.gs แก้ใน local file แล้ว — ต้อง **paste เข้า GAS editor** `AKfycbzjDEIz...` ด้วยมือ

### Data issue ค้าง
อ.3 transaction เก่าอาจมีคอลัมน์ "ชั้น" ว่างหรือผิด (เกิดจาก Sheets Table format)  
→ แก้ใน sheet ธุรกรรม → กรองคอลัมน์ "ชั้น" → หา row ผิด → แก้ด้วยมือ

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
- UI mobile fix (2026-06-30): sticky ชื่อ → `min-width:100px;max-width:130px;white-space:normal` (ชื่อขึ้นบรรทัด 2 ได้, ไม่ตัด), `-webkit-overflow-scrolling:touch`, บีบคอลัมน์เดือน+สายรถ, เพิ่ม scroll hint

### 🔴 ค้างอยู่ (2026-07-01 คืน): แดชบอร์ด "สรุปสายรถ" + "สรุปรายเดือน" เขียนเสร็จแล้วแต่ยังไม่ deploy
- ฟีเจอร์ใหม่ 2 การ์ด (`routeBox`, `monthBox`) ใน `index.html` + field `months` เพิ่มใน `Code.gs getDashboard()` — **เขียนเสร็จ ทดสอบ backend จริงแล้วทำงานถูกต้อง (scrutinize ผ่าน)** แต่ยัง **uncommitted ทั้งคู่** เลยไม่ขึ้นบนเว็บจริง (GitHub Pages) — นี่คือสาเหตุที่ Pam เห็นว่า "หายไป" (จริงๆ คือไม่เคย ship เลย ไม่ใช่บั๊ก)
- ⚠️ **มี Apps Script deployment 2 ตัวลอยอยู่**: `var API` ใน index.html ที่ยังไม่ push ชี้ไป URL ใหม่ (`AKfycbxAQqA...`) ซึ่งมี Code.gs เวอร์ชันใหม่ (มี `months` field) deploy อยู่แล้วจริง — ส่วน URL เดิม (`AKfycbwBcJI...`, ตัวที่ commit ล่าสุดยังอ้างอิงอยู่) ยังเป็น Code.gs เก่า (ไม่มี `months`) **ผิดธรรมเนียมโปรเจกต์ที่ปกติจะ update deployment เดิมไม่สร้างใหม่** — แนะนำคง URL ใหม่ไว้ (ทดสอบแล้วใช้งานได้จริง) แล้ว push ไปพร้อมกัน ไม่ต้องไปแก้ deployment เดิมเพิ่ม แต่ deployment เดิมจะกลายเป็นของเหลือค้างไม่ได้ใช้แล้ว
- **ขั้นตอนถัดไป**: commit + push `ระบบค่ารถ/index.html` + `Code.gs` (เช็คแล้วไม่มี password ฝังอยู่ ปลอดภัย commit ได้)

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

### LINE Bot (Supabase pg_cron) — อัปเดต 2026-07-01

> ⚠️ **ระบบลงเวลามี LINE bot แยกต่างหาก** — ไม่ใช้ channel เดียวกับระบบสารบัญอีกต่อไป
> เหตุผล: quota 429 กลางเดือน เพราะสองระบบแย่งกัน
>
> 🔴 **บอทตัวใหม่ยังไม่ได้เข้ากลุ่มไลน์จริง** (เช็ค 2026-07-01 22:41 ด้วย group summary API → 404) ข้อความทดสอบที่ดูเหมือนสำเร็จก่อนหน้านี้เป็นการส่งไปที่ userId ส่วนตัวของ Pam ไม่ใช่กลุ่ม — เตือนปฏิทินไว้แล้ว พรุ่งนี้ (2026-07-02) 06:30 น. ให้ Pam เชิญบอทเข้ากลุ่มด้วยตัวเอง (เช็ค "Allow bot to join group chats" เปิดอยู่มั้ยก่อนด้วย) **อย่าเพิ่งเชื่อว่า evening summary จะส่งเข้ากลุ่มได้จนกว่าจะ verify ตรงนี้เสร็จ**

| Function | เวลา (ไทย) | cron (UTC) |
|----------|-----------|-----------|
| `send_line_evening_summary()` | 16:45 | `45 9 * * 1-5` |

> ส่งเย็นอย่างเดียว (ประหยัด quota) — morning unscheduled แล้ว 2026-06-30

**Bot credentials (เก็บใน Supabase SQL function — ไม่โผล่ frontend):**
- Group ID: `C45e2d8e51ad3ae86ac2e70dea43df2a7`
- Token: อยู่ใน `send_line_evening_summary()` + `get_line_quota_info()`

**`get_line_quota_info()` RPC (สร้าง 2026-07-01)**
- ยิง LINE API `/quota` + `/consumption` ผ่าน pg_net แล้ว poll response
- Return: `{type, limit, usage, remaining}` — ทดสอบแล้ว `{limited, 200, 0, 200}`
- GRANT TO anon — ใช้ใน admin badge โดยไม่เปิด token

**LINE credit badge (2026-07-01)**
- อยู่ใน `loadSettingsUI()` → `loadLineBadge()` ใน `ระบบลงเวลา/index.html`
- แสดงตัวเลขใหญ่ + progress bar + ปุ่ม ↻ refresh + ลิงก์ LINE OA Manager
- สีบาร์: เขียว (>50) / ส้ม (>10) / แดง (≤10)

**Incident (2026-07-01 16:45)**: รอบ cron วันสลับ token ล้มเหลว 429 "monthly limit" เพราะยิงก่อนสลับ token เป็น channel ใหม่ — กลุ่มไม่ได้รับสรุปเย็นวันนั้น (ไม่ resend). แก้ต้นตอแล้ว: เพิ่ม error handling ใน `send_line_evening_summary()` — poll `net._http_response` หลัง push แล้ว `RAISE EXCEPTION` ถ้า status ≠ 200 ทำให้ `cron.job_run_details` ขึ้น failed จริงแทนที่จะเงียบ (migration: `add_error_handling_line_evening_summary`)

**Badge timeout bug (2026-07-01 แก้แล้ว — ผ่าน 2 รอบ)**: `get_line_quota_info()` เดิมยิง LINE quota API ตรงๆ ตอน frontend เรียก — endpoint นี้ตอบช้าเกิน `statement_timeout=3s` ของ role `anon` ทำให้ badge error ทุกครั้ง. รอบแรกแก้เป็น cache pattern (table `line_quota_cache` + `refresh_line_quota_cache()` รันผ่าน pg_cron ทุก 5 นาที) แต่ตรวจพบภายหลังว่า**การ poll แบบ synchronous ใน function เดียว (fire แล้ว sleep-loop รอใน transaction เดียวกัน) ไม่เคยสำเร็จเลยแม้จะเพิ่ม wait ถึง 90 วิ** (8 รอบ cron จริง timeout หมด) แก้รอบ 2 โดย **redesign เป็น two-phase**: ยิง request ทิ้งไว้แล้ว resolve ในรอบถัดไป (5 นาทีให้หลัง — ชัวร์ว่า response มาแล้วแน่นอน) ไม่มี synchronous wait อีกเลย ระหว่างแก้ยังเจอบั๊กเสริม: ตัวแปร PL/pgSQL ชื่อชนกับ column `usage_val` ทำให้ UPDATE ambiguous (ซ่อนอยู่นานเพราะ path สำเร็จไม่เคยถูกรันถึง) แก้ครบแล้ว ทดสอบยืนยันด้วยการยิงจริง 2 รอบ ได้ real data สำเร็จ ไม่ใช่แค่ manual seed

**Format เย็น (format A)**:
- หัว: `📋 สรุป [วัน] [วันที่] [เดือน] [ปี พ.ศ. 2 หลัก]`
- `🌅 มา X/Y คน` → ชื่อต้น+เวลา inline คั่น `, ` (ใช้ `LTRIM(HH24:MI,'0')` ไม่ใช้ FMHH24)
- Exception เย็น: 🏫 ยังอยู่ / ✅ กลับบ้าน (ตัวเลข) / 🚌 ราชการ / 🏖️ ลา / ❌ ขาด
- Closing: หมุนเวียน 15 ข้อความตาม DOY modulo (ไม่ซ้ำในรอบ 15 วัน)

duty_types: `['ไปราชการ','อบรม','ประชุม','ศึกษาดูงาน']` — แยกจากวันลาจริง  
ชื่อต้น: `split_part(regexp_replace(name, '^(นางสาว|นาง|นาย)\s*',''), ' ', 1)` — ลำดับ regex สำคัญ นางสาว ก่อน นาง

### CDN Versions (pinned)
- `supabase-js@2.108.2` — อย่าเปลี่ยนเป็น `@2` (unpinned) อีก
- `face-api@1.7.13` — stable, ไม่ต้อง bump
- `xlsx@0.18.5` — stable

### สถานะ ✅ ครบทุกอย่าง
- face recognition: ratio test + swap-face protection (lockedId check)
- 1:N identification (ไม่ต้องเลือกชื่อก่อนสแกน)
- XSS fix: esc() ครอบทุก innerHTML user input
- Admin password: SHA-256 hash (ไม่ hardcode แล้ว)
- `loadFaceModels()` มี try/catch ทั้ง 2 จุด (photo upload + addEmp) — ไม่ค้างถ้า CDN down
- **Multi-photo face recognition (2026-07-01)**: เก็บหลาย descriptor ต่อคน → แม่นขึ้นต่างมุม/แสง
- **Year selector (2026-07-01)**: admin monthly view มี dropdown ปี (5 ปีย้อนหลัง, อัตโนมัติ)

### Face scan parameters (อัปเดต 2026-06-30)
| ค่า | เดิม | ใหม่ | เหตุผล |
|-----|------|------|--------|
| `FACE_THRESH` | 0.45 | 0.48 | match ง่ายขึ้น, ratio test ยังคุมอยู่ |
| `MATCH_NEEDED` | 3 | 2 | เร็วขึ้น ~0.6วิ |
| `scoreThreshold` | 0.5 | 0.4 | detect ง่ายขึ้นในแสงน้อย |
| countdown | 3s | 1s | GPS pre-fetched ก่อนสแกนอยู่แล้ว |
| scan interval | 600ms | 400ms | loop เร็วขึ้น |

> ถ้า Android รุ่นเก่ากระตุก → เพิ่ม interval กลับเป็น 500ms
> ถ้าจำผิดคน → ลด FACE_THRESH กลับเป็น 0.45

### Multi-photo face recognition (2026-07-01)
- **Supabase migrations**: `multi_photo_face_recognition` + `fix_add_face_descriptor_seed`
- **column ใหม่**: `employees.face_descriptors jsonb DEFAULT '[]'` — array ของ descriptors
- **RPC ใหม่**: `admin_add_face_descriptor(p_hash, p_id, p_descriptor)` — append (max 10)
  - ถ้า `face_descriptors` ว่างอยู่ จะ seed `face_descriptor` เดิมก่อน (ป้องกัน descriptor หาย)
- **RPC อัปเดต**: `admin_update_employee_photo` — reset `face_descriptors=[new_desc]` เมื่อเปลี่ยนรูปหลัก
- **Admin UI**: ปุ่ม "➕ หน้า" ต่อครู (แสดงหลัง upload รูปหลักแล้ว) + badge `📷 (N)`
- **Scan logic**: `Math.min(...descs.map(dist))` ต่อคน → ratio test ข้ามคนยังถูกต้อง
- **Fallback**: ถ้า `face_descriptors=[]` ยังใช้ `face_descriptor` เดิมได้ (backward compat)

### TODO
- 🔵 Phase 3: offline fallback สำหรับ face-api models (~6MB) — low priority

---

## 5. ระบบสารบัญ

**เป้าหมาย**: อัปโหลดเอกสารราชการขึ้น Drive + แจ้งครูทาง LINE อัตโนมัติ  
**Stack**: HTML/JS (chip UI) → GAS Web App → Google Drive + LINE Messaging API

### Config (ใน Code.gs — gitignored)
| ตัวแปร | ค่า |
|--------|-----|
| `LINE_TOKEN` | Channel Access Token ของ **ระบบสารบัญเท่านั้น** (แยกจากระบบลงเวลาแล้ว ณ 2026-07-01) |
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
- Credit badge (`loadLineQuota()`, auto-refresh 5 นาที) — ทดสอบยิงตรง 2026-07-01 ตอบกลับ ~1s ถูกต้อง ไม่มีปัญหา timeout (คนละ tech stack กับระบบลงเวลา — GAS `UrlFetchApp` sync ตรง ไม่ผ่าน anon role statement_timeout แบบ Supabase)

### ⚠️ LINE quota เกือบหมด (เช็ค 2026-07-01 22:50)
`{limit:300, used:289, remaining:11}` (verify แล้วแน่นอน) — สาเหตุยังไม่ยืนยัน 100% เพราะ LINE API ไม่คืน cycle start/end: (1) อาจตกค้างจากตอนแย่ง quota กับระบบลงเวลาก่อนแยก channel วันนี้ หรือ (2) อาจใช้งานหนักจริงในช่วงสั้นๆ ถ้า reset ตามเที่ยงคืน JST ไปแล้ว — เช็ค LINE OA Manager → Analytics เพื่อดูกราฟรายวันจะช่วยตัดสินได้ ถ้าอัปโหลดเอกสารเกิน 11 ครั้งใน cycle นี้จะเจอ 429 ทันที — รายละเอียด BUG-D11 ใน `ระบบสารบัญ/known-bugs.md`

### ไฟล์ per-system (drill-down เมื่อต้องการ)
`ระบบสารบัญ/project.md` · `decisions.md` · `known-bugs.md`

---

## 🐛 Bug Patterns ที่เคยเจอ (cross-system)

| อาการ | วิธีแก้ |
|-------|--------|
| PATCH ไม่ทำงาน | ส่ง query string: `'id=eq.'+id` |
| git lock ค้าง (index / HEAD) | `rm -f .git/HEAD.lock .git/index.lock` — Cowork sandbox สร้างทิ้งไว้เสมอ |
| git push rejected | `git push --force origin main` |
| finance ใส่ค่าไม่ได้ (column not found) | schema ใช้ `document_no` ไม่ใช่ `doc_no` |
| LINE ส่งแต่ frontend บอกสำเร็จ | ตรวจ `lineOk !== false` — guard return ต้องเป็น `false` ไม่ใช่ `undefined` |
| GAS cold start ช้า | keepWarm trigger + GAS CacheService |
| SW registration ไม่ทำงาน | SW code ต้องอยู่ **ใน** `</script>` tag — ห้ามต่อท้ายไฟล์ข้างนอก |
| Browser cache เก่า | Cmd+Shift+R (hard reload) |

---

## 🔄 แผนย้ายไปแอคเคาท์โรงเรียน (ยังไม่ทำ)

> ปัจจุบันทุกระบบรันในแอคเคาท์ส่วนตัว (Pam) แผนอนาคตคือย้ายไปแอคเคาท์โรงเรียน

### ลำดับที่ต้องทำ
1. **Backup ก่อนทุกครั้ง**
   - Export Google Sheets ออมทรัพย์ + ค่ารถ เป็น `.xlsx`
   - Supabase → Table Editor → Export CSV ทุก table ทั้ง 2 โปรเจกต์

2. **GitHub** — Transfer repository ผ่านปุ่มใน Settings → URL เปลี่ยน

3. **Google Sheets (ออมทรัพย์ + ค่ารถ)** — ไม่ต้องย้าย Sheet
   - Share Sheet ให้ school account อ่าน-เขียนได้
   - GAS ใหม่ในแอคเคาท์โรงเรียนใช้ `SHEET_ID` เดิมได้เลย ข้อมูลไม่หาย

4. **Google Apps Script (3 ระบบ)** — ก็อปโค้ดไปสร้างโปรเจกต์ใหม่ → Deploy → URL ใหม่ → อัปเดต `var API` ใน index.html

5. **Supabase** — ใช้ Transfer Project (Settings → General) ข้อมูลไม่หาย แต่ URL + anon key อาจเปลี่ยน → อัปเดตใน index.html ระบบลงเวลา + ระบบบริหารงาน

6. **LINE Bot** — สร้าง Channel ใหม่ในแอคเคาท์โรงเรียน → token ใหม่ → อัปเดตใน Supabase function + Code.gs สารบัญ (LINE Group ID เดิมใช้ได้)

### หมายเหตุ
- ข้อมูลไม่หายถ้าทำถูกขั้นตอน — code กับ data อยู่คนละที่
- ใช้เวลาประมาณ 1 วัน ทำทีละระบบ
- ทุก config อยู่บนสุดของแต่ละไฟล์ หา-แทนง่าย

---

## 📋 สิ่งที่รอทำ (Backlog)

| ระบบ | งาน | Priority |
|------|-----|----------|
| ระบบค่ารถ | **commit + push** `index.html` + `Code.gs` — ฟีเจอร์ "สรุปสายรถ"+"สรุปรายเดือน" เขียนเสร็จ ทดสอบ backend จริงแล้ว รอแค่ ship (เช็คไม่มี password ปลอดภัย) | 🔴 ทำก่อน |
| ระบบออมทรัพย์ | **paste Code.gs เข้า GAS editor** `AKfycbzjDEIz...` (dynamic header fixes) | 🔴 ทำก่อน |
| ระบบออมทรัพย์ | แก้ data อ.3 เก่า — ชั้นผิดใน sheet ธุรกรรม | 🟡 medium |
| ระบบลงเวลา | **เชิญบอทใหม่เข้ากลุ่มไลน์ครู** — เตือนแล้วในปฏิทิน พรุ่งนี้ (2026-07-02) 06:30 น. เช็ค "Allow bot to join group chats" เปิดอยู่มั้ยก่อน แล้ว invite เข้ากลุ่ม จากนั้นให้ Claude verify ด้วย group summary API | 🔴 ทำก่อน |
| ระบบลงเวลา | รอดูรอบ cron พรุ่งนี้เย็น (จ. 16:45) ว่า `send_line_evening_summary()` ส่งสำเร็จหลังเชิญบอทเข้ากลุ่ม + error handling ใหม่ทำงานถูกต้อง | 🟡 medium |
| ระบบลงเวลา | Phase 3: offline fallback face-api | 🔵 low |
| ระบบสารบัญ | LINE quota เหลือ 11/300 — สาเหตุยังไม่ยืนยัน 100% (ดู BUG-D11) ระวังอัปโหลดเกินจะเจอ 429 | 🟡 medium (เฝ้าระวัง) |
| ระบบสารบัญ | Auth บน GAS endpoint (RISK-01) — priority เดิม 🔵 low แต่ตอนนี้ quota เหลือน้อยมาก (11) ผลกระทบจะรุนแรงกว่าเดิมถ้าโดน spam ยิงตรง ยังรอ Pam ตัดสินใจ | 🟡 ยกระดับจาก low |
| ทุกระบบ (GAS) | ย้าย password → GAS PropertiesService | 🔵 low |
| ระบบค่ารถ | Apps Script deployment เก่า (`AKfycbwBcJI...`) เหลือค้างไม่ได้ใช้แล้วหลัง push — ไม่ต้องลบ แต่อย่าไปแก้ตัวนั้นอีก | 🔵 low |
| root level | ลบโฟลเดอร์ `ระบบสารบัญ/` เก่าจาก Finder | 🟡 cleanup |
