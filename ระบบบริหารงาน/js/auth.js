// =====================================================================
// AUTH — ตัดรหัสผ่านรวม (shared password) ออกทั้งหมด (2026-07-07 ตามคำขอ Pam)
// เดิม: ต้องกรอกรหัสผ่านรวมก่อน ถึงจะเจอ Teacher Selector ("คุณคือใคร")
// ใหม่: เจอ Teacher Selector ได้ทันทีโดยไม่ต้องมีรหัสผ่านเลย — การเลือกตัวตนเองคือ "login"
// สิทธิ์แก้ไขจริงมาจาก canEdit()/canEditModule() (ตามตัวตน+flag ที่เลือก) ไม่ใช่รหัสผ่านรวมอีกต่อไป
// จุดเดียวที่ยังมีรหัส/PIN คือตัวตน "ผู้ดูแลระบบ" (ADMIN_PIN_KEY ด้านล่าง) และหน้า "⚙️ จัดการข้อมูล"
// ที่ยังผูกกับตัวตน ADMIN เท่านั้น (ดู isAdminIdentity())
// IS_ADMIN ตอนนี้แปลว่า "เลือกตัวตนใน Teacher Selector แล้ว" (ไม่ว่าครูคนไหนหรือ ADMIN) ไม่ใช่ "ผ่านรหัสผ่านแล้ว"
// =====================================================================

async function hashPw(pw){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function setAdminMode(on){
  IS_ADMIN = on;
  document.body.classList.toggle('is-admin', on);
}

// เดิมชื่อ checkAdminSession() ตรวจรหัสผ่านรวม — ตอนนี้แค่ sync IS_ADMIN ให้ตรงกับว่าเลือกตัวตนไว้แล้วหรือยัง
// (เก็บชื่อฟังก์ชันเดิมไว้เพื่อไม่ต้องแก้ init.js/connectSupabase() ที่เรียกอยู่)
function checkAdminSession(){
  setAdminMode(!!sessionStorage.getItem(CURRENT_STAFF_KEY));
}

function adminGuard(){
  if(!IS_ADMIN){
    showToast('กรุณาเลือกตัวตนก่อนดำเนินการ');
    openTeacherSelector();
    return false;
  }
  return true;
}

// isAdminIdentity() — ใช้แยกสิทธิ์ "⚙️ จัดการข้อมูล" (staff/vendors CRUD) โดยเฉพาะ
// เพราะหน้านั้นไม่ delegate ผ่าน module flag (Q6-6) ต้องเป็นตัวตน ADMIN ที่ผ่าน PIN แล้วเท่านั้น
// ต่างจาก IS_ADMIN ทั่วไปที่ตอนนี้แปลว่า "เลือกตัวตนแล้ว" (ครูคนไหนก็ได้)
function isAdminIdentity(){
  return sessionStorage.getItem(CURRENT_STAFF_KEY) === 'ADMIN';
}

function logoutAdmin(){
  sessionStorage.removeItem(CURRENT_STAFF_KEY);
  setAdminMode(false);
  updateStaffHeaderDisplay();
  if(typeof applyModulePermissionUI === 'function') applyModulePermissionUI();
  if(typeof renderProjGrid === 'function') renderProjGrid();
  // Stage 13D scrutinize fix (2026-07-07): เดิมไม่เปลี่ยนหน้าเลย ค้างอยู่หน้าที่เปิดไว้ตอน logout
  // (รวมถึงหน้า "⚙️ จัดการข้อมูล" ที่ admin-only — พอ logout แล้ว CSS จะซ่อนหน้านั้นทันทีจน nav ดูค้าง)
  // ย้ายกลับไปหน้าแดชบอร์ดให้ชัดเจนว่าล้างตัวตนแล้วจริง
  if(typeof goPage === 'function') goPage('dashboard');
  showToast('ล้างตัวตนแล้ว — เลือกใหม่ได้ทุกเมื่อ');
}

// ---------- TEACHER SELECTOR (Stage 13 — Multi-User Soft Protection) ----------
// นี่คือจุดเข้าระบบเดียวตอนนี้ (2026-07-07 ตัดรหัสผ่านรวมออกแล้ว) — เลือกว่า "คุณคือใคร?" เก็บใน sessionStorage (หมดเมื่อปิด tab)
// ใช้กำหนดว่าใครแก้ไข/ลบโครงการของใครได้บ้าง ผ่าน canEdit() ด้านล่าง
const CURRENT_STAFF_KEY = 'current_staff_id'; // sessionStorage: uuid ของ staff หรือ 'ADMIN'
const ADMIN_PIN_KEY     = 'school_admin2_hash'; // localStorage — รหัสผู้ดูแลระบบ ใช้เฉพาะตอนเลือกตัวตน "ผู้ดูแลระบบ" เท่านั้น

function openTeacherSelector(){
  const sel = document.getElementById('teacherSelectDropdown');
  if(!sel) return;
  const activeStaff = (STAFF_LIST||[]).filter(s => s.is_active !== false);
  sel.innerHTML = '<option value="">— เลือก —</option>' +
    '<option value="ADMIN">ผู้ดูแลระบบ (แก้ไขได้ทุกอย่าง)</option>' +
    activeStaff.map(s => '<option value="'+s.id+'">'+escHtml((s.prefix||'')+(s.name||''))+'</option>').join('');
  const currentId = sessionStorage.getItem(CURRENT_STAFF_KEY);
  if(currentId) sel.value = currentId;
  document.getElementById('teacherAdminPin').value = '';
  document.getElementById('teacherAdminPinError').textContent = '';
  toggleTeacherAdminPin();
  document.getElementById('teacherSelectOverlay').classList.add('open');
}

// แสดง/ซ่อนช่องรหัส PIN ในตัวเลือก dropdown ของ Teacher Selector — โผล่เฉพาะตอนเลือก "ผู้ดูแลระบบ"
function toggleTeacherAdminPin(){
  const sel = document.getElementById('teacherSelectDropdown');
  const row = document.getElementById('teacherAdminPinRow');
  if(!sel || !row) return;
  document.getElementById('teacherAdminPinError').textContent = '';
  if(sel.value === 'ADMIN'){
    row.style.display = '';
    const stored = localStorage.getItem(ADMIN_PIN_KEY);
    document.getElementById('teacherAdminPinLabel').textContent = stored ? 'รหัสผู้ดูแลระบบ' : 'ยังไม่เคยตั้งรหัส — กดยืนยันเพื่อตั้งรหัสใหม่';
    document.getElementById('teacherAdminPin').value = '';
  } else {
    row.style.display = 'none';
  }
}

// ---------- ADMIN PIN SETUP (Stage 13C — ตั้งครั้งแรกตอนเลือก "ผู้ดูแลระบบ") ----------
function openAdminPinSetupModal(){
  document.getElementById('adminPin2-input').value = '';
  document.getElementById('adminPin2-confirm').value = '';
  document.getElementById('adminPin2-error').textContent = '';
  document.getElementById('adminPin2Overlay').classList.add('open');
}

function closeAdminPinSetupModal(){
  document.getElementById('adminPin2Overlay').classList.remove('open');
}

async function saveAdminPin(){
  const pin  = document.getElementById('adminPin2-input').value.trim();
  const pin2 = document.getElementById('adminPin2-confirm').value.trim();
  const errEl = document.getElementById('adminPin2-error');
  if(!pin)       { errEl.textContent = 'กรุณาระบุรหัส'; return; }
  if(pin !== pin2){ errEl.textContent = 'รหัสไม่ตรงกัน'; return; }
  const h = await hashPw(pin);
  localStorage.setItem(ADMIN_PIN_KEY, h);
  closeAdminPinSetupModal();
  showToast('ตั้งรหัสผู้ดูแลระบบสำเร็จ ✓');
  finalizeTeacherSelection('ADMIN'); // ตั้งเสร็จ → เข้าเป็นผู้ดูแลระบบให้เลย ไม่ต้องกรอกซ้ำ
}

async function confirmTeacherSelection(){
  const sel = document.getElementById('teacherSelectDropdown');
  const val = sel ? sel.value : '';
  if(!val){ showToast('กรุณาเลือกชื่อของท่านก่อน'); return; }

  if(val === 'ADMIN'){
    // Stage 13C: "ผู้ดูแลระบบ" ต้องผ่าน PIN แยกต่างหาก (ไม่ใช่แค่รู้รหัส login ทั่วไป)
    const stored = localStorage.getItem(ADMIN_PIN_KEY);
    if(!stored){ openAdminPinSetupModal(); return; } // ครั้งแรก — ตั้งก่อน แล้ว modal นั้นจะ finalize ให้เอง
    const pin = document.getElementById('teacherAdminPin').value;
    const errEl = document.getElementById('teacherAdminPinError');
    if(!pin){ errEl.textContent = 'กรุณากรอกรหัส'; return; }
    const h = await hashPw(pin);
    if(h !== stored){ errEl.textContent = 'รหัสไม่ถูกต้อง'; document.getElementById('teacherAdminPin').select(); return; }
  }

  finalizeTeacherSelection(val);
}

function finalizeTeacherSelection(val){
  sessionStorage.setItem(CURRENT_STAFF_KEY, val);
  setAdminMode(true); // เลือกตัวตนแล้ว (ครูคนไหนก็ได้ หรือ ADMIN) = IS_ADMIN true — ไม่มีรหัสผ่านรวมแยกต่างหากอีกต่อไป
  document.getElementById('teacherSelectOverlay').classList.remove('open');
  updateStaffHeaderDisplay();
  // renderProjGrid() ใช้ canEdit()/canViewProject() ตัดสินว่าโครงการ/ปุ่มไหนแสดง — ต้อง re-render ทันที
  // ไม่งั้นข้อมูลของคนอื่นจะยังค้างอยู่จนกว่าจะมี re-render รอบถัดไป (สลับปี/หน้า)
  if(typeof renderProjGrid === 'function') renderProjGrid();
  // Stage 13D: สลับหน้าพัสดุ/การเงิน/เงินนอก เป็นเต็ม/สรุป ตาม module flag ของตัวตนใหม่ทันที
  if(typeof applyModulePermissionUI === 'function') applyModulePermissionUI();
}

function updateStaffHeaderDisplay(){
  const el = document.getElementById('current-staff-label');
  if(!el) return;
  const currentId = sessionStorage.getItem(CURRENT_STAFF_KEY);
  if(!currentId){ el.textContent = ''; return; }
  if(currentId === 'ADMIN'){ el.textContent = 'เข้าสู่ระบบในฐานะ: ผู้ดูแลระบบ'; return; }
  const staff = (STAFF_LIST||[]).find(s => s.id === currentId);
  el.textContent = staff ? ('เข้าสู่ระบบในฐานะ: '+staff.prefix+staff.name) : '';
}

// canEdit() — BLUEPRINT §7.2 (แก้ไขแล้ว 2026-07-02: normalize whitespace ทั้งสองฝั่งก่อนเทียบ
// เพราะ teacher_name จริงใน DB ไม่มี space คั่นระหว่าง prefix กับชื่อ เช่น "นางกาญจนา บุญเกตุ"
// ในขณะที่ staff.prefix/staff.name เป็นคนละ field — ต่อแบบ prefix+' '+name เดิมจะไม่ match เลยสักคน)
function canEdit(projectTeacherName){
  const currentId = sessionStorage.getItem(CURRENT_STAFF_KEY);
  if(!currentId || currentId === 'ADMIN') return true;
  const staff = (STAFF_LIST||[]).find(s => s.id === currentId);
  if(!staff) return false;
  const norm = s => (s||'').replace(/\s+/g,'');
  return norm(staff.prefix + staff.name) === norm(projectTeacherName);
}

// canEditModule() — BLUEPRINT §7.3(B), Stage 13C
// 'ผู้ดูแลระบบ' (ผ่าน PIN แล้วเท่านั้นถึงจะเป็นค่านี้ได้ — ดู confirmTeacherSelection) แก้ได้ทุกโมดูล
// staff ทั่วไปแก้ได้เฉพาะโมดูลที่ติ๊กไว้ในหน้าจัดการข้อมูล → บุคลากร (can_edit_procurement / can_edit_finance)
// หมายเหตุ: ไม่ครอบคลุมหน้า "⚙️ จัดการข้อมูล" เอง (staff/vendors CRUD) — หน้านั้นผูกกับ isAdminIdentity() โดยเฉพาะ ไม่ delegate ผ่าน flag นี้
function canEditModule(moduleName){
  const currentId = sessionStorage.getItem(CURRENT_STAFF_KEY);
  if(currentId === 'ADMIN') return true;
  const staff = (STAFF_LIST||[]).find(s => s.id === currentId);
  if(!staff) return false;
  return moduleName === 'procurement' ? !!staff.can_edit_procurement : !!staff.can_edit_finance;
}

// canViewProject() — BLUEPRINT §7.3(C), Stage 13D
// ADMIN หรือใครก็ตามที่มี module flag (พัสดุ หรือ การเงิน) อย่างใดอย่างหนึ่ง → เห็นทุกโครงการ
// (เพราะงานพัสดุ/การเงินต้องอ้างอิงโครงการอื่นได้ ไม่ใช่แค่ของตัวเอง)
// คนอื่น → เห็นเฉพาะโครงการที่ "ชื่อ" (ไม่รวมคำนำหน้า) ปรากฏใน teacher_name
// ตั้งใจใช้ substring ไม่ใช่ exact match แบบ canEdit() — เพราะ exact match จะทำให้ "ดาราชาย สุดโสม"
// (teacher_name เดิม prefix "ครู" ≠ staff.prefix "นาย", Q5-2) และโครงการ compound-name 2 รายการ
// ("นางธนาเนตร อยู่เย็น และนางสาวดาริกา รอดไผ่" ฯลฯ) ไม่มีใครเห็นเลยสักคน (พบระหว่าง scrutinize 2026-07-06)
// ปุ่มแก้ไข/ลบยังใช้ canEdit() เทียบเป๊ะเหมือนเดิม — ฟังก์ชันนี้ใช้แค่ "มองเห็น" เท่านั้น
function canViewProject(teacherName){
  if(canEditModule('procurement') || canEditModule('finance')) return true;
  const currentId = sessionStorage.getItem(CURRENT_STAFF_KEY);
  if(!currentId) return true; // ยังไม่เลือกตัวตน — fallback เดิมของ Stage 13 (soft-open)
  const staff = (STAFF_LIST||[]).find(s => s.id === currentId);
  if(!staff) return true; // หา staff ไม่เจอ (ไม่ควรเกิด) — fail-open ไม่ซ่อนข้อมูล
  return (teacherName||'').indexOf(staff.name) >= 0;
}

// applyModulePermissionUI() — BLUEPRINT §7.3(D), Stage 13D
// สลับหน้าพัสดุ/การเงิน/เงินนอก ระหว่าง "เต็ม" (มีสิทธิ์แก้ไข) กับ "สรุปเท่านั้น" (ไม่มีสิทธิ์)
// เรียกซ้ำได้ปลอดภัย (idempotent) — เรียกจาก loadAll() ตอนเริ่ม และ finalizeTeacherSelection() ตอนสลับตัวตน
function applyModulePermissionUI(){
  // หมายเหตุสำคัญ: canEditModule() เดิมออกแบบมาเพื่อกัน "แก้ไข" เท่านั้น — คนที่ยังไม่ได้ล็อกอิน/ยังไม่เลือกตัวตน
  // (currentId ว่าง) จะได้ false เสมอ ซึ่งถูกต้องสำหรับสิทธิ์แก้ไข แต่ระบบนี้ตั้งใจให้ "ดู" ได้แบบ public
  // (ดู comment หัวไฟล์ "view-only public") — ถ้าใช้ canEditModule() ตรงๆ มาคุมการ "มองเห็น" หน้าเต็ม/สรุป
  // จะกลายเป็นซ่อนข้อมูลจากผู้เยี่ยมชมทั่วไปที่ยังไม่ล็อกอินเลย ซึ่งไม่ใช่สิ่งที่ Pam ขอ (ขอบเขตคือ
  // "ครูคนที่ไม่ได้เลือกไว้" = ล็อกอินแล้วแต่ไม่มี flag) จึงต้อง fail-open เมื่อยังไม่มี currentId เลย
  // ให้สอดคล้องกับ canViewProject() ที่ fail-open กรณีเดียวกันอยู่แล้ว (พบระหว่าง scrutinize 2026-07-06)
  const hasIdentity = !!sessionStorage.getItem(CURRENT_STAFF_KEY);
  const canProc = !hasIdentity || canEditModule('procurement');
  const canFin  = !hasIdentity || canEditModule('finance');

  // ---- พัสดุ ----
  const procWrap = document.getElementById('proc-detail-wrap');
  const procNote = document.getElementById('proc-summary-only-note');
  if(procWrap) procWrap.style.display = canProc ? '' : 'none';
  if(procNote) procNote.style.display = canProc ? 'none' : '';
  const procBtnAdd    = document.getElementById('proc-btn-add');
  const procBtnImport = document.getElementById('proc-btn-import');
  if(procBtnAdd)    procBtnAdd.style.display    = canProc ? '' : 'none';
  if(procBtnImport) procBtnImport.style.display = canProc ? '' : 'none';

  // ---- การเงิน ----
  const finDailyBtn = document.getElementById('fin-tab-daily-btn');
  const finTxBtn    = document.getElementById('fin-tab-transactions-btn');
  if(finDailyBtn) finDailyBtn.style.display = canFin ? '' : 'none';
  if(finTxBtn)    finTxBtn.style.display    = canFin ? '' : 'none';
  const finBtnAdd    = document.getElementById('fin-btn-add');
  const finBtnImport = document.getElementById('fin-btn-import');
  if(finBtnAdd)    finBtnAdd.style.display    = canFin ? '' : 'none';
  if(finBtnImport) finBtnImport.style.display = canFin ? '' : 'none';
  if(!canFin && typeof switchFinTab === 'function') switchFinTab('balance');

  // ---- เงินนอก (bundle ไปกับ flag "การเงิน" — Q6-2) ----
  const extListBtn    = document.getElementById('ext-tab-list-btn');
  const extMonthlyBtn = document.getElementById('ext-tab-monthly-btn');
  if(extListBtn)    extListBtn.style.display    = canFin ? '' : 'none';
  if(extMonthlyBtn) extMonthlyBtn.style.display = canFin ? '' : 'none';
  const extBtnAdd = document.getElementById('ext-btn-add');
  const extBtnCat = document.getElementById('ext-btn-cat');
  if(extBtnAdd) extBtnAdd.style.display = canFin ? '' : 'none';
  if(extBtnCat) extBtnCat.style.display = canFin ? '' : 'none';
  if(!canFin && typeof switchExtTab === 'function') switchExtTab('charts');

  // ---- ⚙️ จัดการข้อมูล — ยังผูกกับตัวตน ADMIN เท่านั้น (Q6-6, ไม่ delegate ผ่าน module flag) ----
  // ตัดรหัสผ่านรวมออกแล้ว (2026-07-07) ทำให้ IS_ADMIN/.admin-only เปิดให้ทุกตัวตนที่เลือกแล้วเห็น
  // ต้องซ่อน nav-tab นี้แยกต่างหากด้วย isAdminIdentity() ไม่งั้นครูทั่วไปจะเห็น/กดเข้าได้
  const isAdmin = isAdminIdentity();
  document.querySelectorAll('[data-page="manage"]').forEach(function(el){ el.style.display = isAdmin ? '' : 'none'; });
  // ป้องกันการ "ค้าง" หน้า จัดการข้อมูล ไว้ตอนสลับตัวตนจาก ADMIN ไปเป็นครูทั่วไป (เช่น เปลี่ยนตัวตนโดยไม่ได้ออกจากหน้านี้ก่อน)
  // ถ้าไม่เช็คตรงนี้ เนื้อหาหน้าจะยังค้างแสดงอยู่ (มี class active) แม้ nav-tab จะถูกซ่อนไปแล้วก็ตาม
  if(!isAdmin && document.getElementById('page-manage')?.classList.contains('active')){
    if(typeof goPage === 'function') goPage('dashboard');
  }
}

// ---------- TOAST ----------
function showToast(msg){
  var t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove('show'); }, 2500);
}
