// =====================================================================
// NAVIGATION
// =====================================================================
function goPage(name){
  // scrutinize finding (2026-07-07): ตัดรหัสผ่านรวมออกทำให้ IS_ADMIN เปิดกว้างให้ทุกตัวตนแล้ว
  // nav-tab "จัดการข้อมูล" ถูกซ่อนด้วย JS เท่านั้น (applyModulePermissionUI) — แต่ goPage('manage') เองไม่มี guard
  // ใครก็เรียกผ่าน console ตรงๆ ได้โดยไม่ต้องเป็น ADMIN เพิ่ม guard ตรงนี้เป็น defense-in-depth
  if(name === 'manage' && typeof isAdminIdentity === 'function' && !isAdminIdentity()){
    name = 'dashboard';
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name)?.classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.toggle('active',t.dataset.page===name));
  if(name === 'finance'  && !FINANCE_LOADED) loadFinanceData();
  if(name === 'external' && !EXT_LOADED)    loadExternalData();
  // ตัดรหัสผ่านรวมออก (2026-07-07 ตามคำขอ Pam) — เข้าเมนูพัสดุ/การเงิน/เงินนอกครั้งแรกในเซสชัน
  // ให้เลือกตัวตนก่อนทันที (ไม่ต้องผ่านรหัสผ่านรวมอีกต่อไป) โครงการ/ภาพรวมยังดูได้แบบ public ตามเดิม
  var moduleGatedPages = ['procurement','finance','external'];
  if(moduleGatedPages.indexOf(name) >= 0 && !sessionStorage.getItem('current_staff_id')){
    if(typeof openTeacherSelector === 'function') openTeacherSelector();
  }
}
