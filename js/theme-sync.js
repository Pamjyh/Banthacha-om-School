/* ─────────────────────────────────────────────
   THEME SYNC — ใช้ร่วมกันทุกระบบงานย่อย (บริหารงาน/ออมทรัพย์/ลงเวลา/สารบัญ/ค่ารถ/ดูแลนักเรียน)
   อ่าน localStorage คีย์เดียวกับปุ่มสลับมืด/สว่างใน School Portal/index.html (#theme-toggle-btn)
   ระบบงานย่อยแต่ละตัว "ไม่มีปุ่มสลับของตัวเอง" — sync ทางเดียวจาก Portal เท่านั้น
   (ปุ่มลอยมุมขวาล่างของ Portal ถูกซ่อนตอนเปิดระบบงานย่อยอยู่ ผู้ใช้ต้องกลับไปกดที่ Portal)

   ต้องโหลดให้เร็วที่สุดใน <head> (ก่อน </head>) เพื่อกันเห็นแฟลชสว่างก่อนสลับมืด
   ไฟล์นี้เป็น standalone ไม่ผูกกับ script อื่นของ Portal — เลยต้องคัดลอก isAutoDark() มาไว้ที่นี่ด้วย
   (ดูต้นทางที่ School Portal/index.html — ถ้าแก้ช่วงเวลา "ตอนดึก" ที่นั่น ต้องแก้ที่นี่ให้ตรงกันด้วย)
───────────────────────────────────────────── */
(function () {
  var THEME_KEY = 'schoolPortalTheme'; // 'dark' | 'light' — ไม่มีคีย์ = auto ตามเวลา (เหมือน Portal)

  function isAutoDark() {
    var h = new Date().getHours();
    return h >= 21 || h < 5; // ช่วงเดียวกับ Portal (badge "🌙 ตอนดึก")
  }

  function currentThemeIsDark() {
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); }
    catch (e) { /* storage ถูกบล็อก/ไม่รองรับ (บาง in-app browser) — ตกไปใช้ auto ตามเวลาแทน ไม่ throw ต่อ */ }
    if (stored === 'dark')  return true;
    if (stored === 'light') return false;
    return isAutoDark();
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark-mode', currentThemeIsDark());
  }

  applyTheme();

  // สลับที่ Portal (หรือแท็บ/ระบบงานอื่นที่เปิดพร้อมกัน) → sync มาที่นี่ทันทีโดยไม่ต้อง reload
  window.addEventListener('storage', function (e) {
    if (e.key === THEME_KEY) applyTheme();
  });
})();
