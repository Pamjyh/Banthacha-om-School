# School Management System — Handoff

อ่านไฟล์นี้ก่อนทำงานทุกครั้ง สรุปสถานะโปรเจกต์ล่าสุด

## 1. เป้าหมายโปรเจกต์

Static web app บริหารงานโรงเรียน เชื่อม Supabase เป็น backend
โฮสต์บน GitHub Pages: **https://pamjyh.github.io/Banthacha-om-School/ระบบบริหารงาน/**

ระบบหลัก: Dashboard / งานโครงการ / งานพัสดุ / งานการเงิน / รายงาน+Export

---

## 2. โครงสร้างไฟล์

```
School Portal/ระบบบริหารงาน/       ← โฟลเดอร์หลัก (แก้ไขที่นี่เท่านั้น)
├── index.html              ← HTML structure + modal ทั้งหมด
├── css/
│   └── styles.css
├── js/
│   ├── config.js           ← Supabase config, GET/POST/PATCH/DEL helpers
│   ├── state.js            ← global variables ทั้งหมด + IS_ADMIN
│   ├── helpers.js          ← fmt, numFmt, numFull, fmtDate, show, hide
│   ├── years.js            ← year CRUD, switchYear, renderYearList, deleteYear
│   ├── dashboard.js        ← renderDashboard + finance stats (รับ/จ่าย/คงเหลือ)
│   ├── projects.js         ← project CRUD + stat cards + renderProjDetailFinance
│   ├── procurement.js      ← procurement CRUD + matchFundCategory + auto finance tx
│   ├── finance.js          ← finance CRUD + setFinType + renderDailyReport (pivot)
│   ├── delete.js           ← confirmDel — ลบ proc จะ DEL finance_transactions ด้วย
│   ├── navigation.js       ← goPage
│   ├── export.js           ← exportProcCSV, exportFinanceCSV, exportBalanceCSV
│   ├── import.js           ← import CSV (พัสดุ) + import Excel (ยอดยกมา)
│   ├── external.js         ← หน้าค่าใช้จ่าย (เงินนอก) ทั้งหมด
│   ├── auth.js             ← ✅ NEW: password gate, SHA-256, adminGuard(), CSS is-admin
│   ├── init.js             ← init, connectSupabase, loadAll, checkAdminSession()
│   ├── events.js           ← event listeners ทั้งหมด
│   └── app.js              ← DOMContentLoaded entry
├── supabase/
│   ├── schema.sql          ← ✅ รันแล้ว
│   ├── seed.sql            ← ✅ รันแล้ว (16 หมวดเงิน)
│   ├── policies.sql        ← ✅ รันแล้ว
│   └── external_schema.sql ← ✅ รันแล้ว — ยืนยันโดยผู้ใช้ (มิ.ย. 2569) ไม่พบ error
├── assets/school-logo.jpg
├── import_2569.js          ← browser console script นำเข้าข้อมูลปี 2569
└── CLAUDE_HANDOFF.md       ← ไฟล์นี้
```

**ลำดับ script ใน index.html (ห้ามสลับ):**
`config → state → helpers → years → dashboard → projects → procurement → finance → delete → navigation → export → import → external → [SheetJS CDN] → [Chart.js CDN] → auth → init → events → app`

---

## 3. Supabase

- URL/key เก็บใน localStorage (`sb_config_v1`) — ไม่ hardcode
- ใช้ anon key เท่านั้น
- API wrapper: `GET(table, query)` / `POST(table, body)` / `PATCH(table, query, body)` / `DEL(table, query)`
- **PATCH ใช้ query string**: `PATCH('table', 'id=eq.'+id, payload)` ไม่ใช่ id ตรงๆ

### Tables

| Table | Key Fields |
|-------|-----------|
| `years` | id, year_be |
| `projects` | id, year_id, name, teacher_name, budget_amount |
| `procurement_items` | id, year_id, project_id, seq, type, title, person, budget_source, report_date, amount, withdraw_status, withdraw_no |
| `fund_categories` | id, code, name, sort_order — seed แล้ว 16 หมวด |
| `finance_transactions` | id, year_id, transaction_date, transaction_type (รับ/จ่าย/ยอดยกมา), fund_category_id, holding_type, amount, **document_no** (ไม่ใช่ doc_no), description, project_id, **procurement_id**, remark |
| `external_categories` | id, name, type ('รายรับ'/'รายจ่าย'/'ทั้งคู่'), sort_order |
| `external_transactions` | id, transaction_date, type ('รายรับ'/'รายจ่าย'), category_id, amount, note |

### Views

| View | ใช้ใน |
|------|------|
| `project_summary` | dashboard, project detail |
| `finance_fund_balances` | Finance tab เงินคงเหลือ + Dashboard stats |

---

## 4. State Variables (js/state.js)

```js
CY, CYbe             // year_id และ year_be ปัจจุบัน
YEARS, PROJECTS, PROC, PROC_TAB
PENDING_DEL          // {type, id} รอยืนยันลบ
FUND_CATEGORIES      // โหลดใน loadAll() — ไม่ต้องโหลดซ้ำ
FINANCE_BALANCES
FINANCE_TRANSACTIONS // array — โหลดเมื่อเปิด tab รายการรับ-จ่าย
FINANCE_LOADED       // false = ต้อง reload (reset เมื่อ switchYear / ลบ project)
FIN_TAB              // 'balance' | 'transactions' | 'daily'
IS_ADMIN             // boolean — set ใน auth.js
```

---

## 5. Auth System (js/auth.js)

```
รหัสผ่าน → SHA-256 → localStorage['school_admin_hash']
session   → sessionStorage['school_admin_session'] (10 นาที timeout)
CSS gate  → body:not(.is-admin) .admin-only { display: none !important }
adminGuard() → เรียกก่อน save/delete ทุกฟังก์ชัน — return false = block
```

---

## 6. สิ่งที่ทำไปแล้ว ✅

- แยกไฟล์ทั้งหมดจาก single-file + CRUD ครบทุกหน้า
- Supabase schema/seed/policies รันแล้วครบ, push GitHub Pages แล้ว
- นำเข้า 25 โครงการ + 86 รายการพัสดุ ปีงบ 2569
- Phase D/E/F: ฟอร์มจ่ายเงิน, รายงานประจำวัน, Export CSV ครบ
- หน้าเงินนอก (external), Pagination, Mobile fix ครบ
- **Dashboard finance stats**: ✅ ยอดรับ/จ่าย/คงเหลือในหน้า Dashboard
- **Auth password gate**: ✅ auth.js — ดูได้ทุกคน, แก้ต้องมีรหัส
- **P0 fix**: finance description NOT NULL, project detail tab การเงิน
- **P1 fix**: ลบ project → FINANCE_LOADED reset, renderProjDetailFinance()
- **P1 fix (มิ.ย. 2569)**: Double-write finance_transaction — saveProcItem() sync finance เอง ไม่พึ่ง toggleStatus()
- **Confirmed (มิ.ย. 2569)**: external_schema.sql รันแล้ว — หน้าเงินนอกไม่มี error
- **Security fix (มิ.ย. 2569)**: ลบ password ออกจาก SETUP.md ค่ารถ (public GitHub)

---

## 7. TODO ถัดไป

### ✅ แก้แล้ว (มิ.ย. 2569): Double-write finance_transaction
`saveProcItem()` ใน procurement.js แก้ให้ sync finance เองทุกครั้ง:
- edit mode → DEL finance เก่าก่อนเสมอ → สร้างใหม่ถ้า status=เบิกแล้ว
- add mode → POST คืน created record → สร้าง finance ถ้า status=เบิกแล้ว
ป้องกัน toggle + form save สร้าง record ซ้ำกัน

### ✅ แก้แล้ว (มิ.ย. 2569): external_schema.sql
ผู้ใช้ยืนยันว่าหน้าเงินนอกไม่พบ error → schema รันแล้วครบ

### 🔵 P1 pending: Rate limit login (ระบบบริหารงาน)
auth.js ยังไม่มีการ lockout — ควรเพิ่ม: ลอง 5 ครั้งผิด → block 15 นาที (ใช้ localStorage timestamp)

### 🔵 P2 pending: SEC-1 ระบบออมทรัพย์ — password ส่งใน GET URL
`apiCall({action:'checkRole', password:pw}, ...)` → password ปรากฏใน URL/log
แก้: เปลี่ยนเป็น POST body หรือ hash ก่อนส่ง

### 🔵 P2 pending: PERF-2 ระบบออมทรัพย์ — ไม่มี loading indicator
ขณะรอ GAS response ไม่มี spinner → ผู้ใช้กดซ้ำได้

### 🔵 Phase 2: PWA manifest + service worker (ทุกระบบ)
เพิ่ม manifest.json + sw.js → ติดตั้งเป็น home screen app ได้บน iOS/Android

---

## 8. Bug Patterns ที่เคยเจอ

| Bug | วิธีแก้ |
|-----|--------|
| switchYear ไม่ refresh Finance | เพิ่ม `FINANCE_LOADED=false; FINANCE_TRANSACTIONS=[];` ก่อน loadAll() |
| PATCH ไม่ทำงาน | ต้องส่ง query string: `'id=eq.'+id` |
| git index.lock ค้าง | `rm -f .git/index.lock` ใน Mac Terminal |
| git push rejected (fetch first) | ใช้ `git push --force origin main` |
| finance form บันทึกไม่ได้ (column not found) | schema ใช้ `document_no` ไม่ใช่ `doc_no` |
| mobile procurement layout พัง | iOS select กว้างเกิน — ใช้ grid แทน flex |
| Projects ยอดเงินไม่อัป | ใช้ `PROC.filter(project_id+เบิกแล้ว)` ไม่ใช่ `p.procurement_items` |
| Can't find variable: checkAdminSession | auth.js ไม่โหลด หรือ browser cache — Cmd+Shift+R |

---

## 9. วิธีทำงาน

- **แก้ไขที่ `School Portal/ระบบบริหารงาน/` โดยตรง** — ไม่มีโฟลเดอร์ dev แยก
- **ตรวจสอบก่อน push** — ใช้ skill `school-mgmt-verify`
- **อัป HANDOFF ก่อนปิด chat** เสมอ
- **ภาษาไทย** — คุยกันภาษาไทยตลอด
- **อย่า swallow error** — ใน catch block ต้อง expose error จริงเสมอ

---

## 10. GitHub & Push Workflow

- **Repo**: https://github.com/Pamjyh/Banthacha-om-School
- **Pages**: https://pamjyh.github.io/Banthacha-om-School/
- **Branch**: main

### Push (รันจาก Mac Terminal เท่านั้น — sandbox push ไม่ได้)

```bash
cd ~/Documents/ระบบงานโรงเรียนบ้านท่าชะอม/"School Portal"
git add -A
git commit -m "ข้อความอธิบาย"
git push --force origin main
```

> ⚠️ ต้องใช้ `--force` เพราะ history อาจ diverge จาก remote
> ⚠️ **ห้าม commit Code.gs** — มี LINE_TOKEN, อยู่ใน `ระบบสารบัญ/` เท่านั้น

### URL แต่ละระบบ
| ระบบ | URL |
|------|-----|
| Portal (หน้าหลัก) | `pamjyh.github.io/Banthacha-om-School/` |
| ระบบบริหารงาน | `pamjyh.github.io/Banthacha-om-School/ระบบบริหารงาน/` |
| ระบบออมทรัพย์ | `pamjyh.github.io/Banthacha-om-School/ระบบออมทรัพย์/` |
| ระบบสารบัญ | `pamjyh.github.io/Banthacha-om-School/ระบบสารบัญ/` |

---

## 11. โครงสร้างโฟลเดอร์บน Mac (ปัจจุบัน)

```
ระบบงานโรงเรียนบ้านท่าชะอม/
├── School Portal/          ← repo หลัก (git → Banthacha-om-School.git) ✅
│   ├── index.html
│   ├── ระบบบริหารงาน/      ← แก้ไขที่นี่
│   ├── ระบบออมทรัพย์/      ← แก้ไขที่นี่
│   ├── ระบบลงเวลา/
│   └── ระบบสารบัญ/
├── ระบบสารบัญ/             ← มี Code.gs (ห้ามลบ — ไม่มีที่อื่น)
└── ระบบเช็คชื่อมาทำงาน/    ← standalone ไม่ได้ deploy
```
