# ระบบสารบัญ — Known Bugs & Fixes

## BUG-D01: dragleave false positive
**อาการ**: drop zone หาย highlight เมื่อ mouse เข้า child element ภายใน zone
**สาเหตุ**: `dragleave` fires ทุกครั้งที่ mouse ออกจาก element รวมถึง child
**แก้**: ตรวจ `e.relatedTarget` ก่อน remove class
```js
zone.addEventListener('dragleave', function(e) {
  if (!zone.contains(e.relatedTarget)) {
    zone.classList.remove('over');
  }
});
```
**สถานะ**: ✅ แก้แล้ว

---

## BUG-D02: toBase64 split พัง edge case
**อาการ**: base64 ผิดถ้า data URL header มี comma เช่น `data:application/vnd.ms-excel;base64,...`
**สาเหตุ**: `rd.result.split(',')[1]` ตัดที่ comma แรกเท่านั้น ถ้ามีหลาย comma จะได้ค่าผิด
**แก้**: ใช้ `indexOf` + `slice`
```js
var comma = rd.result.indexOf(',');
resolve(rd.result.slice(comma + 1));
```
**สถานะ**: ✅ แก้แล้ว

---

## BUG-D03: รูปภาพแสดง spinner แล้วค้าง
**อาการ**: อัปโหลดรูปภาพแล้วหน้าจอแสดง "⏳ กำลังดึงหัวเรื่อง..." แต่ไม่มีผล
**สาเหตุ**: ไม่ได้ branch ออกก่อน เรียก extractTitle กับไฟล์รูปซึ่ง return ว่าง
**แก้**: ตรวจ extension ก่อน ถ้าเป็นรูปภาพให้ fallback ชื่อไฟล์ทันที
**สถานะ**: ✅ แก้แล้ว

---

## BUG-D04: LINE mention ใน group ไม่ trigger notification (เวอร์ชันเก่า)
**อาการ**: ส่งข้อความใน group พร้อม `mentionees` array แต่ครูไม่ได้รับแจ้งเตือน
**สาเหตุ**: LINE Messaging API format เก่าไม่รองรับ real mention
**แก้ (ปัจจุบัน)**: เปลี่ยนเป็น LINE textV2 + substitution format (DEV CON 2024)
— mention สีฟ้าจริง + DM ถูกตัดออกแล้ว ประหยัด quota (ดู D3 ใน decisions.md)
**สถานะ**: ✅ แก้แล้ว (textV2 mention — ไม่ใช้ DM แล้ว)

---

## BUG-D05: ชื่อใน mention ไม่ตรงชื่อ LINE จริง
**อาการ**: @mention แสดงชื่อในระบบแทนชื่อ LINE จริง
**แก้**: ดึงชื่อจาก LINE Profile API ด้วย `fetchDisplayNames()` แบบ parallel
**สถานะ**: ✅ แก้แล้ว

---

## BUG-D06: populateTeachers render [object Object] ใน dropdown
**อาการ**: dropdown ครูแสดง `[object Object]` ทุก option — เลือกครูไม่ได้จริง
**สาเหตุ**: `doGet` return array ของ `{name, lineDisplayName, hasUserId}` object
แต่ `populateTeachers` ใช้ `opt.value = name` โดยที่ `name` เป็น object
**แก้**: แยก string กับ object ด้วย typeof
```js
opt.value       = typeof t === 'string' ? t : t.name;
opt.textContent = typeof t === 'string' ? t : (t.lineDisplayName || t.name);
opt.dataset.hasUserId = typeof t === 'string' ? 'true' : (t.hasUserId ? 'true' : 'false');
```
**สถานะ**: ✅ แก้แล้ว (มิถุนายน 2569)

---

## BUG-D07: userId ของนางอัจฉรา ซ้ำกับนายภานุวัฒน์
**อาการ**: ส่งเอกสารถึงนางอัจฉรา → mention ไปหานายภานุวัฒน์ 2 ครั้ง
**สาเหตุ**: copy-paste userId ผิดใน TEACHERS array
**แก้**: แก้ userId ของนางอัจฉรา เป็น `U58fe8810fb2e0f3129dda3dd9d2636dc`
**สถานะ**: ✅ แก้แล้ว (มิถุนายน 2569)

---

## BUG-D08: LINE failure ถูก swallow — frontend แสดง "สำเร็จ" แม้ LINE fail
**อาการ**: LINE token หมดอายุหรือ network error → user เห็น ✅ แต่ครูไม่ได้รับอะไร
**สาเหตุ**: `sendLineGroup` catch block ทำแค่ `Logger.log` ไม่ propagate error
**แก้**:
- `sendLineGroup` return `code === 200` (boolean)
- `uploadDoc` return `{ ok, url, fileName, lineOk }`
- `showSuccess` รับ `lineOk` — แสดง ⚠️ ถ้า LINE fail พร้อมข้อความแจ้งให้แจ้งครูด้วยตนเอง
**สถานะ**: ✅ แก้แล้ว (มิถุนายน 2569)

---

## BUG-D09: year selector มีแค่ 5 ปีแล้วไม่เพิ่ม
**อาการ**: ปีถัดไปต้องแก้โค้ดเพิ่มเอง
**แก้**: กำหนด `BASE = 2566` แล้ว loop จาก `thaiYear + 1` ลงมาถึง BASE
— เพิ่มปีอัตโนมัติทุกปีโดยไม่ต้องแก้โค้ด
**สถานะ**: ✅ แก้แล้ว (มิถุนายน 2569)

---

## BUG-D10: sendLineGroup guard return undefined → frontend แสดง ✅ ทั้งที่ไม่ได้ส่ง
**อาการ**: ถ้า LINE_TOKEN ไม่ได้ตั้งค่า `sendLineGroup` return undefined → lineOk = undefined → `undefined !== false` = true → แสดง "แจ้ง LINE แล้ว" ทั้งที่ไม่ได้ส่งอะไร
**แก้**: early-return guard เปลี่ยนเป็น `return false` ทั้งสองบรรทัด
**สถานะ**: ✅ แก้แล้ว (มิถุนายน 2569)

---

## BUG-D11: LINE quota เกือบหมด (289/300 ใช้ไป, เหลือ 11) — 2026-07-01
**อาการ**: Pam ถามว่าทำไม credit ลดลงมาก และบางครั้งส่ง LINE ไม่ได้
**ตรวจสอบ**: ยิง `/v2/bot/message/quota` + `/v2/bot/message/quota/consumption` ตรงด้วย token จริงของช่องนี้ → `{limit:300, used:289, remaining:11}` (เช็ค 2026-07-01 22:50 น.) — ข้อมูลนี้ verify แล้วแน่นอน
**สาเหตุ**: LINE ทั้ง 2 endpoint นี้**ไม่คืนช่วงเวลา (cycle start/end) มาด้วย** จึงบอกไม่ได้แบบ 100% ว่า 289 นับตั้งแต่เมื่อไหร่ แต่ Pam ยืนยันว่าวันนี้ (2026-07-01) ส่งจริงแค่ **17 ข้อความ** → 289 − 17 = **272 ข้อความเกิดขึ้นก่อนวันนี้** ตัดทฤษฎี "ใช้งานหนักผิดปกติในวันเดียว" ออกได้เกือบหมด เหลือแค่ทฤษฎีเดียวที่สมเหตุสมผล: **สะสมมาจากตอนแย่ง quota กับระบบลงเวลา (ก่อนแยก channel วันนี้ — ดู D2 ใน decisions.md) สะสมมาหลายสัปดาห์** ไม่ใช่บั๊กหรือ anomaly
**ตรวจโค้ดแล้ว (2026-07-01)**: จุดเดียวที่ยิง LINE push คือ `sendLineGroup()` เรียก 1 ครั้ง/upload ไม่มี retry loop, `submitBtn` disable ทันทีตอนกด (index.html:884) ป้องกัน double-click อยู่แล้ว — **ไม่พบบั๊กที่ทำให้เปลือง quota เกินจริง**
**ผลกระทบ**: ถ้า cycle ปัจจุบันมีเอกสารอัปโหลดเกิน 11 ครั้งอีก จะเจอ `429 monthly limit` ทันที
**แนวทาง**: แอปมี warning banner ใกล้ปุ่มส่งอยู่แล้วเมื่อ `remaining ≤ 30` (index.html:594-596, ตอนนี้ขึ้นอยู่เพราะเหลือ 11) — Pam ตัดสินใจแล้วว่าเตือนอย่างเดียวพอ ไม่ต้อง hard-block การส่ง
**สถานะ**: ⚠️ ติดตามอยู่ ไม่ใช่บั๊ก ไม่ต้องแก้โค้ดเพิ่ม — รอ quota reset ตามรอบของ LINE (ไม่ทราบวันที่แน่ชัด)

**เช็คไปด้วย: credit badge ของระบบสารบัญเอง (`loadLineQuota()` ใน index.html)** — ทดสอบยิง `?action=getLineQuota` ตรงแล้ว ตอบกลับสำเร็จ ไม่ timeout ได้ข้อมูลถูกต้อง **ไม่มีปัญหาแบบระบบลงเวลา** เพราะ GAS `UrlFetchApp.fetchAll` เป็น synchronous เรียกตรงจาก Google server ไม่ผ่าน role/statement_timeout แบบ Supabase/PostgREST ที่ทำให้ระบบลงเวลาพัง (คนละสถาปัตยกรรมเลย ไม่ใช่แค่บังเอิญเร็ว) — **ไม่ต้องแก้อะไรในส่วนนี้**

---

## ⚠️ Known Risk ที่ยังค้าง

### RISK-01: ไม่มี auth บน GAS endpoint
**อาการ**: ใครรู้ URL ก็ POST มา spam LINE group ได้
**ความเสี่ยง**: ต่ำ — URL ไม่ได้เปิดเผย, ใช้เฉพาะภายในโรงเรียน
**ถ้าอยากแก้**: เพิ่ม shared secret key ใน header ทั้ง index.html และ Code.gs

---

## ข้อควรระวัง

- **Deploy Code.gs**: ไปที่ Apps Script → Deploy → **Manage deployments** → Edit → เลือก version ใหม่ → Update — **ไม่ต้อง New deployment** URL เดิมยังใช้ได้
- **PDF สแกน**: ไม่มี OCR — accuracy 0% สำหรับไฟล์สแกน ต้องพิมพ์ชื่อเรื่องเอง
- **Webhook mode**: ปิดแล้ว (comment out) — ถ้าต้องการหา userId ครูใหม่ ให้ uncomment block ใน `doPost` แล้ว deploy ใหม่ ปิดอีกครั้งหลังได้ userId แล้ว
