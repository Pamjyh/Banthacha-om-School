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
```js
var imgTypes = ['png','jpg','jpeg','gif','webp'];
if (imgTypes.indexOf(ext) !== -1) {
  document.getElementById('docTitle').value = f.name.replace(/\.[^.]+$/, '');
  setNote('warn', '⚠️ ไฟล์รูปภาพ — ไม่สามารถดึงหัวเรื่องได้ กรุณาพิมพ์เอง');
}
```
**สถานะ**: ✅ แก้แล้ว

---

## BUG-D04: LINE @mention ใน group ไม่ trigger notification
**อาการ**: ส่งข้อความใน group พร้อม `mentionees` array แต่ครูไม่ได้รับแจ้งเตือน @mention
**สาเหตุ**: LINE Messaging API push message กับ `mentionees` ไม่การันตี notification บนมือถือ (ต่างจาก native mention ในแอป)
**แก้**: ส่ง DM หาครูโดยตรงเพิ่มเติมเมื่อมี `userId`
```js
// ส่งเข้า Group (mention เพื่อ highlight ในกลุ่ม)
// + ส่ง DM หาครูโดยตรง (การันตีแจ้งเตือน)
if (teacherUserId) {
  UrlFetchApp.fetch(...{ to: teacherUserId, messages: [...] });
}
```
**สถานะ**: ✅ แก้แล้ว

---

## BUG-D05: ชื่อในข้อความ LINE ไม่ตรงชื่อจริง
**อาการ**: @mention แสดงชื่อในระบบ เช่น "ครูตัวอย่าง ก" แทนชื่อ LINE จริง
**สาเหตุ**: ใช้ `teacherName` จาก TEACHERS config ไม่ได้ดึงจาก LINE
**แก้**: เรียก LINE Profile API ก่อนส่ง แล้วใช้ `displayName` แทน
```js
function getLineDisplayName(userId) {
  var res = UrlFetchApp.fetch(
    'https://api.line.me/v2/bot/group/' + LINE_GROUP + '/member/' + userId, ...
  );
  return JSON.parse(res.getContentText()).displayName;
}
```
**สถานะ**: ✅ แก้แล้ว

---

## ข้อควรระวัง

- **Deploy**: ทุกครั้งที่แก้ Code.gs ต้อง **New deployment** (ไม่ใช่ Manage) URL จะเปลี่ยน → ต้องอัปเดต `var API` ใน index.html
- **Webhook mode**: หลังเก็บ userId ครูครบแล้ว ต้องกลับโค้ด doPost ให้ละเว้น webhook event ไม่งั้นบอทจะ DM admin ทุกครั้งที่ใครพูดในกลุ่ม
- **PDF สแกน**: ไม่มี OCR — accuracy 0% ต้องพิมพ์ชื่อเรื่องเอง
