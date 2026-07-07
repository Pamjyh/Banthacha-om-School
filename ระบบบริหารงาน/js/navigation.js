// =====================================================================
// NAVIGATION
// =====================================================================
function goPage(name){
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
