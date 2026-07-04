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
| **Cowork sandbox push ไม่ได้** | ไม่มี GitHub credentials ใน sandbox — Claude commit ให้ได้ แต่ push ต้องให้ Pam รันเองใน Terminal เครื่องจริง (ดู 🔴 ด้านล่างถ้ามี commit ค้าง) |

---

## 🚀 Push Workflow

```bash
cd ~/Documents/ระบบงานโรงเรียนบ้านท่าชะอม/"School Portal"
git add -A
git commit -m "อธิบายสิ่งที่เปลี่ยน"
git push --force origin main
```

> ⚠️ Cowork sandbox สร้าง lock files ทิ้งไว้เสมอ (แก้แล้วด้วย `rm -f` บางทีก็ยัง unlink ไม่ได้ ใช้ `mv .git/index.lock .git/index.lock.bak$(date +%s)` แทนได้) — ก่อน commit **ทุกครั้ง** ต้องล้าง lock ก่อน
>
> ⚠️ **Cowork sandbox commit ได้แต่ push ไม่ได้** (`fatal: could not read Username for 'https://github.com'` — ไม่มี credentials) — ทุกครั้งที่ Claude commit ให้ใน session ต้องให้ Pam รัน `git push --force origin main` เองใน Terminal เครื่องจริงเสมอ ไม่ต้อง commit ซ้ำ

### ✅ Push ล่าสุดสำเร็จแล้ว (2026-07-01 คืน)
commit `2352462` (รวมงาน: ระบบลงเวลา LINE bot ใหม่, ระบบออมทรัพย์ dynamic header fix, ระบบค่ารถ dashboard ใหม่) push ขึ้น `origin/main` เรียบร้อย ยืนยันด้วย `git fetch` แล้ว branch up to date
(ไม่ได้ commit ไฟล์ `DESIGN-notion.md`, โฟลเดอร์ `ระบบบริหารงาน/โครงการ/`, ไฟล์ `.xlsb` จัดซื้อจัดจ้าง — Pam เลือกข้ามเพราะเป็นเอกสารภายในไม่ใช่โค้ดเว็บ ยังอยู่ใน working directory เป็น untracked เฉยๆ ไม่ได้หาย)

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

## 0. School Portal (หน้าแรก)

**เป้าหมาย**: หน้ารวมทางเข้า 5 ระบบ — static ล้วน ไม่ต้อง login เพื่อใช้งานปกติ

### ✅ ปิด/เปิดระบบชั่วคราว (admin toggle) — 2026-07-04, ผ่าน Supabase
> ⚠️ Pivot: ตอนแรกทำเป็นไฟล์ `system-status.js` + git push (ไม่มี backend) แต่ Pam ทดลองใช้จริงแล้วติดปัญหา git lock/diverge วนหลายรอบ ทำเองไม่ได้จริง → **เปลี่ยนมาใช้ Supabase + ปุ่มกดจริงในเว็บแทน** ไฟล์ `system-status.js` เดิมกลายเป็นไฟล์ไม่ได้ใช้แล้ว (เหลือค้างไว้เฉยๆ ปลอดภัย ลบจาก Finder ได้เมื่อสะดวก)

**Backend**: Supabase project `cgwtgqyllalaogdgyxlo` (school-attendance — ใช้ project เดียวกับระบบลงเวลา ไม่สร้างใหม่)
- Table `portal_system_status` (`system_id` PK, `status` on/off, `updated_at`) — seed 5 แถว: finance, savings, attendance, sarabun, karod
- RLS: `anon` อ่านได้อย่างเดียว (`select` policy `using(true)`) — **ไม่มี insert/update/delete policy ให้ anon เลย** กันปัญหาแบบ RLS เปิดโล่งที่เจอในระบบการเงินฯ
- ฟังก์ชัน `public.portal_toggle_status(p_password, p_system_id, p_status)` — `SECURITY DEFINER`, เช็ครหัสผ่าน admin ที่ hardcode ไว้ในตัวฟังก์ชัน (ฝั่ง server เท่านั้น ไม่โผล่ผ่าน REST API), validate system_id/status ก่อนเขียนเสมอ, GRANT EXECUTE ให้ `anon` (รูปแบบเดียวกับ `admin_update_settings` ที่ระบบลงเวลาใช้อยู่แล้ว)
- รหัสผ่าน admin: Pam ตั้งเอง 2026-07-04 — **เก็บอยู่ในโค้ดฟังก์ชัน Supabase เท่านั้น ห้ามเขียนรหัสจริงไว้ในไฟล์นี้หรือไฟล์ใดๆ ที่ push ขึ้น GitHub เด็ดขาด** (repo นี้เป็น public) — ถ้าลืมให้ถาม Pam โดยตรง หรือ Pam ขอให้ Claude แก้รหัสใหม่ผ่าน Supabase migration ได้เลยโดยไม่ต้องรู้รหัสเดิม

**Frontend** (`index.html`):
- โหลดสถานะจาก Supabase REST (`GET /rest/v1/portal_system_status`) ด้วย anon key ตอนเข้าเว็บ — fail-open ทุกจุด (fetch พัง/ไม่มี id นี้ → ถือว่า "on")
- Card จับคู่กับ config ผ่าน `data-sys-id` (`finance`/`savings`/`attendance`/`sarabun`/`karod`)
- Click/keydown handler ผูกครั้งเดียวตอนโหลดหน้า แต่ **เช็คสถานะปัจจุบันสดๆ ตอนกดจริงทุกครั้ง** (ไม่ใช่ตอน bind) — ปลอดภัยแม้ toggle เปลี่ยนหลายรอบระหว่าง session เดียวกัน
- `off` = badge ส้ม "ปิดปรับปรุงชั่วคราว" + กดเข้าไม่ได้ + aria-label บอกด้วย (screen reader)
- **Admin panel**: คลิกชื่อโรงเรียนตรงท้ายหน้า (`.footer-school`) 5 ครั้งติดกันภายใน 3 วิ → เปิด modal ใส่รหัสผ่าน + ปุ่ม toggle 5 ระบบ กดแล้วมีผลทันทีไม่ต้อง reload (เรียก `initCards()` ใหม่หลัง toggle สำเร็จ)
- ไม่มีข้อความกำหนดเอง (เช่น "จะกลับมา 18:00") และไม่มีสวิตช์ปิดทุกระบบพร้อมกัน — พักไว้เป็นไอเดียอนาคตถ้าต้องการ

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

### 🔴 RLS gap พบระหว่าง scrutinize (2026-07-02) — กำลังแก้อยู่คนละ session
ทั้ง 7 ตาราง RLS policy เปิด `qual=true, with_check=true` ให้ **anon อ่าน/เขียน/ลบได้หมดโดยไม่ต้อง auth** — ยืนยันด้วย Supabase security advisor ตรง สาเหตุคือ auth เป็น client-side gate ล้วน (`auth.js` เช็คใน browser) ไม่มี server-side validation แบบ SECURITY DEFINER RPC ที่ระบบลงเวลาใช้ — password gate ปัจจุบันเป็นแค่ UI cosmetic ใครเปิด devtools ก็แก้/ลบข้อมูลการเงินได้ (รายละเอียดเต็ม: memory `project_finance_rls_gap`) — Pam แจ้งว่ากำลังแก้อยู่อีก session แล้ว ไม่ต้อง action ซ้ำจากตรงนี้

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

### ✅ UX improvements — commit `752a2b9` push แล้ว (2026-07-02)
Frontend ล้วนๆ ไม่แตะ `Code.gs`/ชีตเลย (ยืนยันผ่าน think-review ก่อนทำ, scrutinize หลังทำ — ไม่กระทบข้อมูลจริง):
- **ตัวกรองวันที่** ในหน้า "ประวัติทั้งหมด" (`tx-grade`) — client-side filter จาก `date` string ที่ backend คืนมาอยู่แล้ว (`dateOnly()` ตัด 3 ส่วนแรก "D MMM YYYY" ทิ้งเวลา) ไม่ต้องแก้ `getHistory` เลย
- **Teacher soft-scope**: จำชั้นล่าสุดที่เลือกไว้ใน `localStorage['sv_teacherLastGrade']` → login ครั้งถัดไปเด้งไปชั้นเดิมอัตโนมัติ (ยังกด ← สลับชั้นอื่นได้เสมอ ไม่ล็อกเข้ม — ตามที่ Pam เลือก)
- **Mobile card layout**: แปลงตารางสรุป 4 จุด (รายชื่อมีธุรกรรม/ไม่มีธุรกรรม/ฝากแล้ว/ยังไม่ฝากวันนี้) จาก `<table>` เป็นการ์ดแบบ `.txi` เดิม — ใช้ helper ใหม่ `cardRowsHtml()`
- 🐛 เจอ+แก้บั๊กระหว่าง scrutinize: เศษ `</tbody></table></div>` ตกค้างจากตารางเก่าในบล็อก "ยังไม่ได้ฝากวันนี้"

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

### ✅ แดชบอร์ด "สรุปสายรถ" + "สรุปรายเดือน" — ship แล้ว (2026-07-01 คืน)
- ฟีเจอร์ใหม่ 2 การ์ด (`routeBox`, `monthBox`) ใน `index.html` + field `months` เพิ่มใน `Code.gs getDashboard()` — เขียนเสร็จ ทดสอบ backend จริงแล้วทำงานถูกต้อง (scrutinize ผ่าน) commit `2352462` push ขึ้น GitHub แล้ว
- ⚠️ **มี Apps Script deployment เก่าเหลือค้างไม่ได้ใช้แล้ว** (`AKfycbwBcJI...`) — `var API` ที่ push ไปใช้ URL ใหม่ (`AKfycbxAQqA...`) แทน ไม่ต้องไปยุ่งกับตัวเก่าอีก ปล่อยทิ้งไว้ได้

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
> 🔴 **บอทตัวใหม่ยังไม่ได้เข้ากลุ่มไลน์จริง (อัปเดต 2026-07-02)** — root cause ที่แท้จริงเจอแล้ว: **LINE อนุญาตให้มี Official Account ได้แค่ 1 ตัวต่อ 1 กลุ่มเท่านั้น** กลุ่มเดิม (`C45e2d8e51ad3ae86ac2e70dea43df2a7`) มีบอทสารบัญอยู่แล้ว พอเชิญบอทลงเวลาเข้าไปซ้อน LINE เลยเตะออกอัตโนมัติทันที (เปิด "Allow bot to join group chats" แล้วก็ไม่ช่วย) — **ต้องใช้กลุ่มใหม่แยกต่างหาก ไม่ใช่กลุ่มเดิม**
>
> **แผนที่กำลังทำอยู่**: สร้าง Edge Function ชั่วคราว `line-webhook-capture` (project `cgwtgqyllalaogdgyxlo`) + table `line_webhook_log` ไว้จับ groupId ของกลุ่มใหม่ — ตั้ง Webhook URL `https://cgwtgqyllalaogdgyxlo.supabase.co/functions/v1/line-webhook-capture` ในหน้า LINE Developers Console (channel ลงเวลา) เรียบร้อยแล้ว, เปิด Use webhook = ON แล้ว
> ขั้นตอนที่ Pam ต้องทำต่อ: (1) สร้างกลุ่มไลน์ใหม่ (2) เชิญครู/staff เข้า (3) เชิญบอทลงเวลาเข้ากลุ่มใหม่นี้ (4) ส่งข้อความทัก 1 ครั้งในกลุ่มเพื่อ trigger event → แจ้ง Claude อ่าน groupId จาก `line_webhook_log` แล้วอัปเดตใน `send_line_evening_summary()` + ลบ webhook/table ชั่วคราวทิ้ง
> **อย่าเพิ่งเชื่อว่า evening summary จะส่งเข้ากลุ่มได้จนกว่าขั้นตอนนี้จะเสร็จและ verify กลุ่มใหม่แล้ว**

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

### ✅ ไฟล์แนบหลายไฟล์ (multi-attachment) — commit `f86d6f4` push แล้ว (2026-07-04)
- โมเดล: เอกสารหลัก 1 ไฟล์ (ดึงหัวเรื่องอัตโนมัติเหมือนเดิม) + ไฟล์แนบเพิ่มได้หลายไฟล์ (ลากวาง/เลือกได้หลายไฟล์ ไม่ดึงหัวเรื่อง)
- **สร้างโฟลเดอร์ย่อยเฉพาะตอนมีไฟล์แนบเท่านั้น** (ชื่อจาก `docTitle`, กันชื่อชนด้วย `createUniqueSubfolder()` — ห้าม reuse ชื่อเดิมต่างจาก `getOrCreateFolder` ของปี) — ไม่มีไฟล์แนบ = พฤติกรรมเดิม 100% (ไฟล์เดี่ยวอยู่ในโฟลเดอร์ปีตรงๆ)
- อัปโหลดไฟล์แนบ **ทีละไฟล์แยก request** (action `uploadAttachment`) กัน GAS payload/เวลาทำงานเกิน + ไฟล์ไหนพังรีลองแค่ไฟล์นั้นได้ (resume-safe ด้วย `_pendingFolderId`/`_pendingUrl` ไม่อัปไฟล์หลักซ้ำ)
- **แจ้ง LINE หลังไฟล์แนบครบทุกไฟล์เท่านั้น** (action ใหม่ `notifyTeachers`) — กันครูกดลิงก์โฟลเดอร์แล้วเห็นไฟล์ไม่ครบ (เจอ + แก้ตอน scrutinize แผนก่อนเขียนโค้ด)
- `file.setSharing()` เรียกตรงๆ ทุกไฟล์ (หลัก+แนบ) ไม่พึ่งการสืบทอดสิทธิ์จากโฟลเดอร์ (เจอระหว่าง scrutinize โค้ด — Drive ไม่รับประกัน inherit อัตโนมัติ)
- ⚠️ **Deployment URL เปลี่ยนใหม่ตอน paste Code.gs รอบนี้** (คลิกพลาดจุดใดจุดหนึ่งระหว่าง deploy ทำให้ได้ deployment ใหม่แทนที่จะ edit ของเดิม) — `var API` ใน index.html อัปเดตให้ตรงกับ URL ใหม่แล้ว ใช้งานได้ปกติ ยืนยันแล้ว 2026-07-04 — อาจมี deployment เก่าเหลือค้างใน GAS editor (Manage deployments) ไม่กระทบอะไร ลบทิ้งได้เมื่อสะดวก

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

## 🔄 แผนย้ายไปแอคเคาท์โรงเรียน (ยังไม่ทำ — อัปเดตแผน 2026-07-02 หลังตรวจละเอียด)

> ปัจจุบัน GitHub repo + ทั้ง 2 Supabase project อยู่ใต้บัญชี/org ส่วนตัว Pam ("Pamjyh_") ยืนยันแล้วตรง — GAS ของ **ระบบออมทรัพย์ + ระบบค่ารถ** ก็อยู่บัญชีส่วนตัวเช่นกัน (ระบบสารบัญยังไม่ได้ตรวจละเอียดจุดนี้)

### พบสำคัญ: ออมทรัพย์ + ค่ารถ ใช้ Google Sheet เล่มเดียวกัน
`SHEET_ID: 1_FiMepObJro052keUyznmYCnygfNKVGta7LFA3-bVQM` — ออมทรัพย์เป็นเจ้าของ tab นักเรียน/ธุรกรรม/ประวัติเลื่อนชั้น, ค่ารถอ่าน "นักเรียน" (read-only) + เป็นเจ้าของ คนนั่งรถ/ค่ารถ/บันทึกเงินนอก → **ย้าย sheet เล่มเดียวครอบคลุมข้อมูลทั้ง 2 ระบบ** ทั้งสองเป็น standalone script (`openById`, ไม่ bound) เป็นไฟล์ Drive แยกต่างหากอีก 2 ไฟล์ ไม่มี Calendar/Gmail/Form/Drive service อื่นมาเกี่ยวข้อง ไม่มี trigger ฝังในโค้ด (ต้องเช็ค Triggers panel ใน GAS editor เองว่ามีตั้งผ่าน UI มั้ย)

### แผนที่แนะนำ — Option A: Transfer ownership (zero data loss, URL ไม่เปลี่ยน)
1. Backup กันเหนียวก่อน: Sheet → File → Make a copy
2. Sheet → Share → เพิ่มอีเมลบัญชีโรงเรียนเป็น Editor → กด "Transfer ownership" (ไอคอนมงกุฎ) → บัญชีโรงเรียน login แล้วกด Accept
3. ทำแบบเดียวกันกับไฟล์ Apps Script อีก 2 ไฟล์ (หาใน Drive/script.google.com)
4. ⚠️ ถ้าบัญชีโรงเรียนเป็น Google Workspace โดเมนเฉพาะ อาจต้องให้ IT เปิด "อนุญาต transfer จากนอกโดเมน" ก่อน — ถ้าเป็น Gmail ธรรมดาไม่มีปัญหานี้
5. Login บัญชีโรงเรียนเข้า GAS editor → Deploy → Manage deployments → **Edit deployment เดิม** (ห้ามกด "New deployment" เด็ดขาด จะได้ URL ใหม่ทันทีแล้ว `var API` ใน index.html จะพัง) → เปลี่ยน Execute as = Me → Deploy ทับของเดิม (URL คงที่ ไม่ต้องแก้ frontend)
6. เช็ค Triggers panel ทั้ง 2 โปรเจกต์
7. ทดสอบ end-to-end (เพิ่ม/ลบ transaction ทดสอบ) ก่อนใช้งานจริง
8. เพิ่มบัญชี Pam กลับเป็น Editor (ไม่ใช่ owner) ถ้ายังอยากมีสิทธิ์แก้ต่อ

**Option B (fallback ถ้า A ติด Workspace block)**: copy sheet + copy script ไปบัญชีใหม่ → แก้ `SHEET_ID` ในสคริปต์ที่ copy → deploy ใหม่ (ได้ URL ใหม่) → ต้องแก้ `var API` ใน index.html ทั้ง 2 ระบบ + commit/push — เสีย revision history เดิม เสี่ยงกว่า A

### ระบบอื่นที่ยังไม่ได้ตรวจละเอียดสำหรับย้ายบัญชี
5. **Supabase** (ระบบลงเวลา + ระบบการเงินฯ) — ใช้ Transfer Project (Settings → General) ข้อมูล/ref/anon key **ไม่เปลี่ยน** แค่เปลี่ยนเจ้าของ billing (เบากว่า GAS มาก)
6. **GitHub** — repo `Pamjyh/Banthacha-om-School` (หลัก) + `pamjyh/School-Savings` (ระบบออมทรัพย์ ใช้ domain แยก, มี URL hardcode ในหน้าเว็บเองด้วย ต้องเช็คหลัง transfer) — Transfer repository ผ่าน Settings, URL อาจเปลี่ยนถ้าไม่ตั้ง custom domain
7. **LINE Bot** (2 channel: สารบัญ, ลงเวลา) — ยังไม่ตรวจว่า transfer เจ้าของ channel ได้โดยไม่ต้องออก token ใหม่หรือไม่ ต้องเช็ค LINE Official Account Manager
8. **GAS ระบบสารบัญ** — ยังไม่ตรวจว่าอยู่บัญชีไหน (สันนิษฐานว่าเหมือน 2 ระบบข้างต้น)

### 🔵 GitHub ownership — ตัดสินใจแล้ว (2026-07-02): พักไว้ก่อน
ตรวจยืนยันแล้ว (web search): **GitHub ไม่ redirect เว็บ Pages อัตโนมัติเวลา transfer repo ไปเจ้าของใหม่** (ต่างจากหน้า source code ที่ redirect ให้) — ถ้า transfer ไปเป็นชื่อโรงเรียนตรงๆ ลิงก์เดิมที่ผู้ปกครองมีอยู่แล้ว (โดยเฉพาะ `pamjyh.github.io/School-Savings`) จะขึ้น 404 ทันที

**ทางแก้ถ้าจะทำ**: transfer repo ไป Organization ของโรงเรียน + สร้างหน้า redirect ทิ้งไว้ที่ URL เดิม (meta refresh ไปหา URL ใหม่) — ผู้ปกครองกดลิงก์เดิมได้เหมือนเดิม แค่เด้งเสี้ยววินาที

**Pam ตัดสินใจ (2026-07-02)**: ยังไม่ทำตอนนี้ เพราะ (1) ไม่อยากเพิ่มความยุ่งยากตอนนี้ ลิงก์แจกไปแล้ว (2) ความเสี่ยงต่างจากฝั่ง Google — ถ้า Pam ออกจากโรงเรียน ฝั่ง Google (ข้อมูลจริง) เข้าถึงไม่ได้ทันที แต่ฝั่ง GitHub (โค้ด+หน้าเว็บ) เสี่ยงแค่ถ้าบัญชี GitHub ส่วนตัวหายไปเฉยๆ (โอกาสต่ำกว่า) — **เป้าหมายระยะยาวยังคงอยู่**ที่จะย้ายเป็นของโรงเรียน แค่ priority ต่ำกว่า Google Sheet/GAS

รายละเอียดเต็ม + evidence ทั้งหมด: memory `project_gas_migration_plan`

---

## 📋 สิ่งที่รอทำ (Backlog)

| ระบบ | งาน | Priority |
|------|-----|----------|
| ระบบออมทรัพย์ | **paste Code.gs เข้า GAS editor** `AKfycbzjDEIz...` (dynamic header fixes) | 🔴 ทำก่อน |
| ระบบออมทรัพย์ | แก้ data อ.3 เก่า — ชั้นผิดใน sheet ธุรกรรม | 🟡 medium |
| ระบบลงเวลา | **สร้างกลุ่มไลน์ใหม่แยกจากสารบัญ** (LINE จำกัด 1 OA/กลุ่ม เจอ root cause แล้ว 2026-07-02) → เชิญ staff + บอทลงเวลาเข้ากลุ่มใหม่ → ส่งข้อความทัก 1 ครั้ง → แจ้ง Claude อ่าน groupId จาก `line_webhook_log` (Supabase `cgwtgqyllalaogdgyxlo`) แล้วอัปเดต `send_line_evening_summary()` | 🔴 ทำก่อน |
| ระบบลงเวลา | ลบ Edge Function `line-webhook-capture` + table `line_webhook_log` ทิ้งหลังได้ groupId แล้ว (เป็นของชั่วคราว) | 🟡 cleanup หลังเสร็จข้อบน |
| ระบบลงเวลา | รอดูรอบ cron เย็น (16:45) ว่า `send_line_evening_summary()` ส่งสำเร็จหลังกลุ่มใหม่พร้อม | 🟡 medium |
| ระบบลงเวลา | Phase 3: offline fallback face-api | 🔵 low |
| ระบบสารบัญ | LINE quota เหลือ 11/300 — สาเหตุยังไม่ยืนยัน 100% (ดู BUG-D11) ระวังอัปโหลดเกินจะเจอ 429 | 🟡 medium (เฝ้าระวัง) |
| ระบบสารบัญ | Auth บน GAS endpoint (RISK-01) — priority เดิม 🔵 low แต่ตอนนี้ quota เหลือน้อยมาก (11) ผลกระทบจะรุนแรงกว่าเดิมถ้าโดน spam ยิงตรง ยังรอ Pam ตัดสินใจ | 🟡 ยกระดับจาก low |
| ระบบสารบัญ | เช็ค GAS editor → Manage deployments ว่ามี deployment เก่าเหลือค้างจากตอนแก้ Code.gs รอบ multi-attachment (2026-07-04) มั้ย — ไม่กระทบอะไร ลบทิ้งได้เมื่อสะดวก | 🔵 low (cleanup) |
| ระบบการเงินและพัสดุ | RLS เปิดโล่งทุกตาราง (anon เขียน/ลบได้หมด) — พบ 2026-07-02, **Pam กำลังแก้อีก session อยู่แล้ว** | 🔴 กำลังแก้ (คนละ session) |
| ทุกระบบ (GAS) | ย้าย password → GAS PropertiesService | 🔵 low |
| ระบบค่ารถ | Apps Script deployment เก่า (`AKfycbwBcJI...`) เหลือค้างไม่ได้ใช้แล้วหลัง push — ไม่ต้องลบ แต่อย่าไปแก้ตัวนั้นอีก (deploy ใหม่ครบแล้ว ไม่ต้องทำอะไรเพิ่ม) | 🔵 low |
| ทุกระบบ | **แผนย้ายบัญชีโรงเรียน (Phase 2)** — ออมทรัพย์+ค่ารถ ตรวจละเอียดแล้ว (แชร์ sheet เดียวกัน, แนะนำ transfer ownership) รอวัน/เวลาที่คนไม่ใช้งาน (เย็น/วันหยุด) ตาม Pam เลือกไว้ + ต้องเช็ค keepWarm trigger ก่อนย้ายด้วย (ดู scrutinize findings ในบทสนทนา) — สารบัญ/LINE bot ยังไม่ตรวจละเอียด | 🟡 planning (รอเวลานัด) |
| GitHub | ย้ายเป็น Organization ของโรงเรียน — พักไว้ก่อนตามที่ Pam ตัดสินใจ (ลิงก์แจกไปแล้ว, ความเสี่ยงต่ำกว่าฝั่ง Google) เป้าหมายระยะยาวยังอยู่ ถ้าจะทำต้องตั้ง redirect page ที่ URL เดิมด้วย | 🔵 low (deferred, เป้าหมายค้างไว้) |
| root level | ลบโฟลเดอร์ `ระบบสารบัญ/` เก่าจาก Finder | 🟡 cleanup |
