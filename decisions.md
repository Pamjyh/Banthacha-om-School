# Decisions — เหตุผลการตัดสินใจ

## D1: ไม่มีระบบล็อกอิน
**เลือก**: เปิด Portal ได้เลยโดยไม่ต้องล็อกอิน
**เหตุผล**: Portal เป็นแค่หน้ารวม link ไม่มีข้อมูลส่วนตัว การล็อกอินเพิ่มความซับซ้อนโดยไม่จำเป็น ระบบย่อยแต่ละอันมีการจัดการสิทธิ์ของตัวเองอยู่แล้ว
**Trade-off**: ใครก็เปิด Portal ได้ (แต่ยังต้องล็อกอินในระบบย่อย เช่น ระบบออมทรัพย์)

## D2: เปิดระบบในหน้าเดิมด้วย iframe แทน new tab
**เลือก**: iframe full-screen overlay ใน index.html
**เหตุผล**: ผู้ใช้ไม่ต้องจัดการ tab หลายอัน กลับหน้าหลักได้ง่ายด้วยปุ่ม "← กลับหน้าหลัก" ประสบการณ์ใช้งานต่อเนื่องกว่า
**Trade-off**: ระบบที่ block iframe (X-Frame-Options: DENY) จะโหลดไม่ได้ — ต้องตรวจสอบทีละระบบ
**หมายเหตุ**: ทั้ง 3 ระบบที่ active ในปัจจุบันรองรับการโหลดใน iframe แล้ว

## D3: Single HTML file ไม่แยก CSS/JS
**เลือก**: ทุกอย่างรวมใน index.html ไฟล์เดียว
**เหตุผล**: เปิดจาก local ได้เลยโดยไม่ต้อง server ไม่ต้อง build step แก้ไขง่าย
**Trade-off**: ไฟล์ใหญ่ขึ้นเมื่อเพิ่มระบบ

## D4: Notion Design System
**เลือก**: ใช้ style ที่ inspired by Notion (neutral canvas, clean cards, subtle shadows)
**เหตุผล**: ดูทันสมัย เรียบ ไม่ล้าสมัย Sarabun font อ่านง่ายภาษาไทย สีไม่ฉูดฉาด เหมาะกับโรงเรียน
**รายละเอียด**: ดู `DESIGN-notion.md` ในโฟลเดอร์หลัก

## D5: ไม่ใช้ Firebase / Supabase / Backend ใดๆ ใน Portal
**เลือก**: Static HTML ล้วน ไม่มี backend
**เหตุผล**: Portal ทำหน้าที่แค่เป็นหน้ารวม link ไม่มีข้อมูลที่ต้องเก็บ backend เพิ่ม complexity โดยไม่จำเป็น
**ก่อนหน้า**: version เก่ามี Firebase login แต่ถูกเอาออกเพราะซับซ้อนเกินไป

## D6: role="button" บน div แทน <button>
**เลือก**: `<div role="button" tabindex="0">` สำหรับ card
**เหตุผล**: ต้องการ layout แบบ grid card ที่มี child elements หลายอัน `<button>` มีข้อจำกัด styling บางอย่าง
**Trade-off**: ต้องเพิ่ม keydown handler (Enter/Space) เอง และ aria attributes ให้ครบ

## D7: Greeting badge แยกต่างหาก
**เลือก**: แสดง emoji badge (🌅 🌤 ฯลฯ) แยกจากข้อความทักทาย
**เหตุผล**: ช่วยให้ผู้ใช้รู้ว่าระบบรับรู้เวลาจริง เพิ่ม personality ให้หน้า
**การ implement**: `getGreetingData(hour)` คืน `{text, emoji, color}` แล้ว render แยก

## D8: prefers-reduced-motion support
**เลือก**: ข้าม animation ทั้งหมดถ้า user ตั้ง reduced motion
**เหตุผล**: Accessibility — ผู้ใช้บางคนมีปัญหากับ animation (motion sickness, vestibular disorders)
**การ implement**: CSS media query `@media (prefers-reduced-motion: reduce)` suppress `cardSlideUp`, `pulse` animations
