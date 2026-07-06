// =====================================================================
// AUTH — password gate (view-only public, edit requires password)
// =====================================================================
const ADMIN_PW_KEY   = 'school_admin_hash';     // localStorage — hash ถาวร
const ADMIN_SES_KEY  = 'school_admin_session';  // sessionStorage — หมดอัตโนมัติเมื่อปิด tab/browser
const ADMIN_LOCK_KEY = 'school_login_lock';     // localStorage — rate limit {count, lockedUntil}
const MAX_ATTEMPTS   = 5;
const LOCK_MS        = 15 * 60 * 1000; // 15 นาที

function getLockState(){
  try{ return JSON.parse(localStorage.getItem(ADMIN_LOCK_KEY)) || {count:0, lockedUntil:0}; }
  catch{ return {count:0, lockedUntil:0}; }
}
function setLockState(s){ localStorage.setItem(ADMIN_LOCK_KEY, JSON.stringify(s)); }
function clearLockState(){ localStorage.removeItem(ADMIN_LOCK_KEY); }

function checkLocked(){
  var s = getLockState();
  if(s.lockedUntil && Date.now() < s.lockedUntil){
    var remain = Math.ceil((s.lockedUntil - Date.now()) / 60000);
    return 'เข้าสู่ระบบล้มเหลวเกิน ' + MAX_ATTEMPTS + ' ครั้ง กรุณารอ ' + remain + ' นาที';
  }
  // lock หมดอายุแล้ว → reset
  if(s.lockedUntil && Date.now() >= s.lockedUntil) clearLockState();
  return null;
}

function recordFailedAttempt(){
  var s = getLockState();
  s.count = (s.count || 0) + 1;
  if(s.count >= MAX_ATTEMPTS){
    s.lockedUntil = Date.now() + LOCK_MS;
    s.count = 0;
  }
  setLockState(s);
}

async function hashPw(pw){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function setAdminMode(on){
  IS_ADMIN = on;
  document.body.classList.toggle('is-admin', on);
  var btn = document.getElementById('nav-lock-btn');
  if(btn) btn.textContent = on ? '🔓 ออก' : '🔒 เข้าระบบ';
}

function checkAdminSession(){
  var stored = localStorage.getItem(ADMIN_PW_KEY);
  if(!stored){
    // ยังไม่เคยตั้งรหัส → admin mode โดยอัตโนมัติ (ครั้งแรก)
    setAdminMode(true);
    return;
  }
  var ses = sessionStorage.getItem(ADMIN_SES_KEY);
  setAdminMode(ses === 'ok');
}

function adminGuard(){
  if(!IS_ADMIN){
    showToast('กรุณาเข้าสู่ระบบก่อนดำเนินการ');
    openLoginModal();
    return false;
  }
  return true;
}

// ---------- LOGIN MODAL ----------
function openLoginModal(){
  if(IS_ADMIN){ logoutAdmin(); return; }
  var stored = localStorage.getItem(ADMIN_PW_KEY);
  if(!stored){ openSetPasswordModal(); return; }
  document.getElementById('login-pw-input').value = '';
  document.getElementById('login-error').textContent = '';
  document.getElementById('loginOverlay').classList.add('open');
  setTimeout(function(){ document.getElementById('login-pw-input').focus(); }, 100);
}

function closeLoginModal(){
  document.getElementById('loginOverlay').classList.remove('open');
}

async function loginAdmin(){
  var errEl = document.getElementById('login-error');
  // ตรวจ rate limit ก่อน
  var lockMsg = checkLocked();
  if(lockMsg){ errEl.textContent = lockMsg; return; }

  var stored = localStorage.getItem(ADMIN_PW_KEY);
  var pw = document.getElementById('login-pw-input').value;
  if(!pw){ errEl.textContent = 'กรุณาระบุรหัสผ่าน'; return; }
  var h = await hashPw(pw);
  if(h === stored){
    clearLockState(); // reset นับเมื่อเข้าสำเร็จ
    sessionStorage.setItem(ADMIN_SES_KEY, 'ok');
    setAdminMode(true);
    closeLoginModal();
    showToast('เข้าสู่ระบบสำเร็จ ✓');
    openTeacherSelector();
  } else {
    recordFailedAttempt();
    var s = getLockState();
    var lockMsg2 = checkLocked();
    if(lockMsg2){
      errEl.textContent = lockMsg2;
    } else {
      var left = MAX_ATTEMPTS - (s.count || 0);
      errEl.textContent = 'รหัสผ่านไม่ถูกต้อง (เหลืออีก ' + left + ' ครั้ง)';
    }
    document.getElementById('login-pw-input').select();
  }
}

function logoutAdmin(){
  sessionStorage.removeItem(ADMIN_SES_KEY);
  sessionStorage.removeItem(CURRENT_STAFF_KEY);
  setAdminMode(false);
  updateStaffHeaderDisplay();
  showToast('ออกจากระบบแล้ว');
}

// ---------- TEACHER SELECTOR (Stage 13 — Multi-User Soft Protection) ----------
// หลัง login สำเร็จ → เลือกว่า "คุณคือใคร?" เก็บใน sessionStorage (หมดเมื่อปิด tab)
// ใช้กำหนดว่าใครแก้ไข/ลบโครงการของใครได้บ้าง ผ่าน canEdit() ด้านล่าง
const CURRENT_STAFF_KEY = 'current_staff_id'; // sessionStorage: uuid ของ staff หรือ 'ADMIN'
const ADMIN_PIN_KEY     = 'school_admin2_hash'; // localStorage — รหัสผู้ดูแลระบบ Stage 13C แยกจาก ADMIN_PW_KEY (รหัส login ทั่วไป)

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
// หมายเหตุ: ไม่ครอบคลุมหน้า "⚙️ จัดการข้อมูล" เอง (staff/vendors CRUD) — หน้านั้นผูก admin-only (IS_ADMIN) อย่างเดียวเหมือนเดิม ไม่ delegate
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
}

// ---------- SET PASSWORD MODAL ----------
function openSetPasswordModal(){
  document.getElementById('setpw-input').value = '';
  document.getElementById('setpw-confirm').value = '';
  document.getElementById('setpw-error').textContent = '';
  document.getElementById('setpwOverlay').classList.add('open');
  setTimeout(function(){ document.getElementById('setpw-input').focus(); }, 100);
}

function closeSetPasswordModal(){
  document.getElementById('setpwOverlay').classList.remove('open');
}

async function saveAdminPassword(){
  var pw  = document.getElementById('setpw-input').value.trim();
  var pw2 = document.getElementById('setpw-confirm').value.trim();
  var errEl = document.getElementById('setpw-error');
  if(!pw)      { errEl.textContent = 'กรุณาระบุรหัสผ่าน'; return; }
  if(pw !== pw2){ errEl.textContent = 'รหัสผ่านไม่ตรงกัน'; return; }
  var h = await hashPw(pw);
  localStorage.setItem(ADMIN_PW_KEY, h);
  sessionStorage.setItem(ADMIN_SES_KEY, 'ok');
  setAdminMode(true);
  closeSetPasswordModal();
  showToast('ตั้งรหัสผ่านสำเร็จ ✓');
  openTeacherSelector();
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
