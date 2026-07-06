// =====================================================================
// INIT
// =====================================================================
async function init(){
  const cfg = getConfig();
  if(!cfg){
    hide('loadingOverlay');
    show('setupScreen','block');
    return;
  }
  try{
    await loadYears();
    hide('loadingOverlay');
    show('mainApp');
    document.querySelector('.app').classList.add('show');
    checkAdminSession();
    await loadAll();
  }catch(e){
    hide('loadingOverlay');
    show('setupScreen','block');
    document.getElementById('setupError').style.display='block';
    document.getElementById('setupError').textContent = 'เชื่อมต่อไม่ได้: '+e.message+' — กรุณาตรวจสอบ URL และ Key';
  }
}

async function connectSupabase(){
  const url = document.getElementById('sbUrl').value.trim();
  const key = document.getElementById('sbKey').value.trim();
  if(!url||!key){ alert('กรุณาใส่ URL และ Key'); return; }
  setConfig(url,key);
  show('loadingOverlay','flex');
  hide('setupScreen');
  try{
    await loadYears();
    hide('loadingOverlay');
    show('mainApp');
    document.querySelector('.app').classList.add('show');
    checkAdminSession();
    await loadAll();
  }catch(e){
    hide('loadingOverlay');
    show('setupScreen','block');
    document.getElementById('setupError').style.display='block';
    document.getElementById('setupError').textContent = 'เชื่อมต่อไม่ได้: '+e.message;
  }
}

async function loadYears(){
  YEARS = await GET('years','select=*&order=year_be.desc');
  if(!YEARS||!YEARS.length){
    // Create default year
    const y = new Date().getFullYear()+543;
    const r = await POST('years',{year_be:y});
    YEARS = r||[{id:1,year_be:y}];
  }
  renderYearSel();
  if(!CY){ CY=YEARS[0].id; CYbe=YEARS[0].year_be; }
}

async function loadAll(){
  show('loadingOverlay','flex');
  try{
    var [proj, proc, fund, finBal, staff, vendors] = await Promise.all([
      GET('projects',`select=*,procurement_items(id,amount,withdraw_status)&year_id=eq.${CY}&order=sort_order`),
      GET('procurement_items',`select=*,projects(name)&year_id=eq.${CY}&order=type,seq`),
      FUND_CATEGORIES.length ? Promise.resolve(FUND_CATEGORIES) : GET('fund_categories','select=*&order=sort_order'),
      GET('finance_fund_balances',`select=*&year_id=eq.${CY}&order=fund_name`).catch(()=>[]),
      GET('staff','select=*&order=prefix,name').catch(()=>[]),
      GET('vendors','select=*&order=name').catch(()=>[])
    ]);
    PROJECTS = proj||[]; PROC = proc||[]; FUND_CATEGORIES = fund||[]; FINANCE_BALANCES = finBal||[]; STAFF_LIST = staff||[]; VENDORS_LIST = vendors||[];
    hide('loadingOverlay');
    renderDashboard();
    renderProjGrid();
    renderProc();
    fillProjSelects();
    renderStaffTable();
    renderVendorsTable();
  }catch(e){
    hide('loadingOverlay');
    alert('โหลดข้อมูลไม่ได้: '+e.message);
  }
}
