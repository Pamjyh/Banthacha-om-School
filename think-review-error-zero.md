# Think-Review: Error = 0 ทุกระบบ

## LEDGER (ล็อกแล้ว)
- เป้าหมาย: งานลื่นไหล ไม่ติดขัด ไม่เจอ bug ระหว่างใช้
- scope: ทั้ง 5 ระบบ
- method: code audit + live browser check ทั้งคู่
- priority: ลงเวลา → ออมทรัพย์ → สารบัญ → การเงินและพัสดุ → ค่ารถ
- fixed already: SW tag, adminGuard ใน years.js, เปลี่ยนชื่อระบบ

## CURRENT STEP
Live check — รอผู้ใช้เปิด DevTools ตรวจ console ทุกระบบ

## BUFFER
- error monitoring pg_cron (lower priority)

## DONE
- SW CACHE_NAME bump → banthacha-om-v2 ✅
- supabase-js pin @2.108.2 (ระบบลงเวลา) ✅

- ระบบลงเวลา code audit ✅ → แก้ loadFaceModels try/catch (admin 2 จุด)
- ระบบออมทรัพย์ code audit ✅ — ไม่พบ bug
- ระบบสารบัญ code audit ✅ — ไม่พบ bug
- ระบบการเงินและพัสดุ code audit ✅ — ไม่พบ bug
- ระบบค่ารถ code audit ✅ — ไม่พบ bug

## NEXT
ทำ BUFFER items ถ้าต้องการ (SW version, supabase pin)
