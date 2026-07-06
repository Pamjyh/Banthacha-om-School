// =====================================================================
// EVENT LISTENERS
// =====================================================================
document.querySelectorAll('.nav-tab').forEach(t=>t.addEventListener('click',()=>goPage(t.dataset.page)));
document.querySelectorAll('[data-ptab2]').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('[data-ptab2]').forEach(x=>x.classList.remove('active'));
  t.classList.add('active'); PROC_TAB=t.dataset.ptab2; PROC_PAGE=1; renderProc();
}));
document.querySelectorAll('[data-ptab]').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('[data-ptab]').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  const tab = t.dataset.ptab;
  if(tab==='items'){
    const items = PROC.filter(i=>i.project_id===ACTIVE_PROJ_ID);
    renderProjDetailItems(items);
  } else if(tab==='finance'){
    renderProjDetailFinance();
  }
}));
// Finance tabs
document.querySelectorAll('[data-ftab]').forEach(t=>t.addEventListener('click',()=>switchFinTab(t.dataset.ftab)));

// Finance form — toggle proc dropdown เมื่อเปลี่ยนประเภท หรือเปลี่ยนโครงการ
const finTypeEl    = document.getElementById('finType');
const finProjectEl = document.getElementById('finProject');
if(finTypeEl)    finTypeEl.addEventListener('change', toggleFinProcGroup);
if(finProjectEl) finProjectEl.addEventListener('change', ()=>{ if(document.getElementById('finType').value==='จ่าย') populateProcDropdown(); });

['proc-search','proc-ftype','proc-fstatus','proc-fproject'].forEach(id=>{
  const el=document.getElementById(id);
  if(el){
    el.addEventListener('input', ()=>{ PROC_PAGE=1; renderProc(); });
    el.addEventListener('change',()=>{ PROC_PAGE=1; renderProc(); });
  }
});

// Year-type filter
const procYearTypeEl = document.getElementById('proc-fyeartype');
const procYearEl     = document.getElementById('proc-fyear');
if(procYearTypeEl) procYearTypeEl.addEventListener('change', ()=>{
  PROC_YEAR_TYPE = procYearTypeEl.value;
  if(PROC_YEAR_TYPE){
    populateProcYears();
    procYearEl.style.display = '';
  } else {
    PROC_YEAR_VAL = 0;
    procYearEl.style.display = 'none';
  }
  PROC_PAGE=1; renderProc();
});
if(procYearEl) procYearEl.addEventListener('change', ()=>{
  PROC_YEAR_VAL = parseInt(procYearEl.value)||0;
  PROC_PAGE=1; renderProc();
});
['procOverlay','projOverlay','yearOverlay','confirmOverlay','finOverlay','importOverlay','importExcelOverlay','extOverlay','extCatOverlay','loginOverlay','setpwOverlay','staffOverlay','vendorOverlay','procDetailOverlay','adminPin2Overlay'].forEach(id=>{
  document.getElementById(id)?.addEventListener('click',function(e){
    if(e.target!==this)return;
    if(id==='confirmOverlay')          closeConfirm();
    else if(id==='yearOverlay')        closeYearModal();
    else if(id==='projOverlay')        closeProjForm();
    else if(id==='finOverlay')         closeFinanceForm();
    else if(id==='importOverlay')      closeImportModal();
    else if(id==='importExcelOverlay') closeImportExcelModal();
    else if(id==='extOverlay')         closeExtForm();
    else if(id==='extCatOverlay')      closeExtCatModal();
    else if(id==='loginOverlay')       closeLoginModal();
    else if(id==='setpwOverlay')       closeSetPasswordModal();
    else if(id==='staffOverlay')       closeStaffForm();
    else if(id==='vendorOverlay')      closeVendorForm();
    else if(id==='procDetailOverlay')  closeDetailForm();
    else if(id==='adminPin2Overlay')   closeAdminPinSetupModal();
    else closeProcForm();
  });
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeProcForm();closeProjForm();closeYearModal();closeConfirm();closeFinanceForm();closeImportModal();closeImportExcelModal();closeExtForm();closeExtCatModal();closeLoginModal();closeSetPasswordModal();closeStaffForm();closeVendorForm();closeDetailForm();closeAdminPinSetupModal();}
  if(e.key==='Enter'&&document.getElementById('loginOverlay')?.classList.contains('open')) loginAdmin();
  if(e.key==='Enter'&&document.getElementById('setpwOverlay')?.classList.contains('open')) saveAdminPassword();
  if(e.key==='Enter'&&document.getElementById('adminPin2Overlay')?.classList.contains('open')) saveAdminPin();
});

// External tab buttons
document.querySelectorAll('[data-etab]').forEach(t=>t.addEventListener('click',()=>switchExtTab(t.dataset.etab)));

// Manage-page tabs (บุคลากร / ร้านค้า) — Stage 11-12
document.querySelectorAll('[data-mtab]').forEach(t=>t.addEventListener('click',()=>switchMgmtTab(t.dataset.mtab)));
