// =====================================================================
// YEAR
// =====================================================================
function renderYearSel(){
  const sel = document.getElementById('yearSel');
  sel.innerHTML = YEARS.map(y=>`<option value="${y.id}" ${y.id===CY?'selected':''}>${y.year_be}</option>`).join('');
}
function switchYear(){
  const sel = document.getElementById('yearSel');
  CY = parseInt(sel.value);
  CYbe = YEARS.find(y=>y.id===CY)?.year_be;
  FINANCE_LOADED = false;
  FINANCE_TRANSACTIONS = [];
  loadAll();
  if(document.getElementById('page-finance')?.classList.contains('active')){
    loadFinanceData();
  }
}
function renderYearList(){
  const el = document.getElementById('yearList');
  if(!el) return;
  if(!YEARS.length){ el.innerHTML=''; return; }
  el.innerHTML = YEARS.map(y=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:10px;background:${y.id===CY?'rgba(20,20,19,.06)':'transparent'}">
      <span style="font-size:15px;font-weight:${y.id===CY?'700':'400'};color:var(--ink)">${y.year_be}${y.id===CY?' <span style="font-size:11px;color:var(--slate)">(ปัจจุบัน)</span>':''}</span>
      ${y.id===CY?'<span style="font-size:11px;color:var(--muted)">ใช้งานอยู่</span>':
        `<button onclick="deleteYear(${y.id},${y.year_be})" style="background:transparent;border:none;cursor:pointer;font-size:13px;color:var(--signal);padding:4px 8px;border-radius:8px" title="ลบปีนี้">ลบ</button>`}
    </div>`).join('');
}
function openYearModal(){ renderYearList(); document.getElementById('yearOverlay').classList.add('open'); setTimeout(()=>document.getElementById('newYear').focus(),100); }
function closeYearModal(){ document.getElementById('yearOverlay').classList.remove('open'); }

// RLS fix (2026-07-11): ลบปีงบยกระดับเป็น Tier 2 (ต้อง Admin PIN) — เดิมกันแค่ adminGuard() (เลือกตัวตนแล้ว)
// ทั้งที่ลบปีงบ = ลบโครงการ/พัสดุ/การเงินทั้งปีทิ้งแบบ cascade เป็น one-way door จริง (ตัดสินใจ Pam 2026-07-11)
async function deleteYear(id, yearBe){
  if(!adminGuard()) return;
  if(!isAdminIdentity()){ alert('เฉพาะผู้ดูแลระบบเท่านั้นที่ลบปีงบประมาณได้'); return; }
  if(!confirm(`ลบปีงบประมาณ ${yearBe}?\n⚠️ ข้อมูลโครงการ พัสดุ และการเงินในปีนี้จะถูกลบทั้งหมด`)) return;
  try{
    await RPC('fn_delete_year', { p_id: id, ...currentAuthParams() });
    await loadYears();
    await loadAll();
    renderYearList();
  }catch(e){ alert('ลบไม่ได้: '+e.message); }
}
async function addYear(){
  if(!adminGuard()) return;
  const y = parseInt(document.getElementById('newYear').value);
  if(!y||y<2560||y>2599){ alert('กรุณาระบุปีงบประมาณ พ.ศ. (2560–2599)'); return; }
  const exists = YEARS.find(r=>r.year_be===y);
  if(exists){ CY=exists.id; CYbe=exists.year_be; renderYearSel(); await loadAll(); closeYearModal(); return; }
  if(!isAdminIdentity()){ alert('เฉพาะผู้ดูแลระบบเท่านั้นที่เพิ่มปีงบประมาณได้'); return; }
  const r = await RPC('fn_save_year', { ...currentAuthParams(), p_year_be: y });
  if(r){ CY=r.id; CYbe=r.year_be; }
  await loadYears();
  await loadAll();
  closeYearModal();
}
