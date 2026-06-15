// =====================================================================
// AUTH — password gate (view-only public, edit requires password)
// =====================================================================
const ADMIN_PW_KEY  = 'school_admin_hash';    // localStorage — hash ถาวร
const ADMIN_SES_KEY = 'school_admin_session'; // sessionStorage — หมดเมื่อปิด tab

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
  var stored = localStorage.getItem(ADMIN_PW_KEY);
  var pw = document.getElementById('login-pw-input').value;
  if(!pw){ document.getElementById('login-error').textContent = 'กรุณาระบุรหัสผ่าน'; return; }
  var h = await hashPw(pw);
  if(h === stored){
    sessionStorage.setItem(ADMIN_SES_KEY, 'ok');
    setAdminMode(true);
    closeLoginModal();
    showToast('เข้าสู่ระบบสำเร็จ ✓');
  } else {
    document.getElementById('login-error').textContent = 'รหัสผ่านไม่ถูกต้อง';
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
