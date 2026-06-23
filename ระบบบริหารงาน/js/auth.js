// =====================================================================
// AUTH — password gate (view-only public, edit requires password)
// =====================================================================
const ADMIN_PW_KEY   = 'school_admin_hash';     // localStorage — hash ถาวร
const ADMIN_SES_KEY  = 'school_admin_session';  // sessionStorage — หมดเมื่อปิด tab
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
  setAdminMode(false);
  showToast('ออกจากระบบแล้ว');
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
