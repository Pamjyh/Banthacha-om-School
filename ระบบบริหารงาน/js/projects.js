// =====================================================================
// PROJECTS
// =====================================================================
function renderProjGrid(){
  const el = document.getElementById('proj-grid');
  // คำนวณจาก PROC (อัปเดตใน memory เสมอ) — เฉพาะ เบิกแล้ว เท่านั้น
  const totalBudget = PROJECTS.reduce((s,p)=>s+Number(p.budget_amount||0),0);
  const totalSpent  = PROC.filter(i=>i.withdraw_status==='เบิกแล้ว').reduce((s,i)=>s+Number(i.amount||0),0);
  document.getElementById('proj-stat-count').textContent  = PROJECTS.length;
  document.getElementById('proj-stat-budget').textContent = numFull(totalBudget);
  document.getElementById('proj-stat-spent').textContent  = numFull(totalSpent);
  document.getElementById('proj-stat-remain').textContent = numFull(totalBudget - totalSpent);
  if(!PROJECTS.length){ el.innerHTML='<div class="no-data">ยังไม่มีโครงการ กด "+ เพิ่มโครงการ"</div>'; return; }
  el.innerHTML = PROJECTS.map(p=>{
    // ใช้ PROC โดยตรง — อัปเดตทันทีเมื่อ toggle status
    const projItems = PROC.filter(i=>i.project_id===p.id);
    const spent  = projItems.filter(i=>i.withdraw_status==='เบิกแล้ว').reduce((a,i)=>a+Number(i.amount||0),0);
    const remain = Number(p.budget_amount||0)-spent;
    const pct = p.budget_amount>0?Math.min(spent/p.budget_amount*100,100):0;
    const over = remain<0;
    return `<div class="proj-card ${ACTIVE_PROJ_ID===p.id?'active-card':''}" onclick="openProjectDetail('${p.id}','${escHtml(p.name)}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div class="proj-name">${p.name}</div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          ${canEdit(p.teacher_name) ? `
          <button class="act-btn admin-only" onclick="event.stopPropagation();editProj('${p.id}')" title="แก้ไข">✏️</button>
          <button class="act-btn del admin-only" onclick="event.stopPropagation();askDel('project','${p.id}','${escHtml(p.name)}')" title="ลบ">🗑️</button>
          ` : ''}
        </div>
      </div>
      <div class="proj-teacher">${p.teacher_name||'—'}</div>
      <div class="proj-budget-bar"><div class="proj-bar-fill ${over?'over':''}" style="width:${pct}%"></div></div>
      <div class="proj-numbers">
        <span class="proj-spent">ใช้ไป ${fmt(spent)}</span>
        <span class="proj-remain ${over?'neg':''}">คงเหลือ ${fmt(remain)}</span>
      </div>
    </div>`;
  }).join('');
}

async function openProjectDetail(projId, projName){
  ACTIVE_PROJ_ID = projId;
  renderProjGrid();
  document.getElementById('proj-grid').style.display='none';
  document.getElementById('proj-detail').style.display='block';
  document.getElementById('proj-detail-name').textContent = projName;
  const items = PROC.filter(i=>i.project_id===projId);
  renderProjDetailItems(items);
}

function closeProjectDetail(){
  ACTIVE_PROJ_ID = null;
  document.getElementById('proj-grid').style.display='grid';
  document.getElementById('proj-detail').style.display='none';
}

function renderProjDetailItems(items){
  const el = document.getElementById('proj-detail-content');
  if(!items.length){ el.innerHTML='<div class="no-data">ยังไม่มีรายการพัสดุที่เชื่อมกับโครงการนี้</div>'; return; }
  const sum = items.reduce((s,i)=>s+Number(i.amount||0),0);
  el.innerHTML=`<table>
    <thead><tr><th>ลำดับ</th><th>ประเภท</th><th>รายการ</th><th class="r">วงเงิน</th><th>สถานะ</th></tr></thead>
    <tbody>${items.map(i=>`<tr>
      <td style="font-family:var(--mono);font-size:12px">จ.${i.seq}</td>
      <td><span class="badge ${i.type==='จัดซื้อ'?'b-buy':'b-hire'}">${i.type}</span></td>
      <td class="ink">${i.title}</td>
      <td class="r">${fmt(i.amount)}</td>
      <td><span class="badge ${i.withdraw_status==='เบิกแล้ว'?'b-done':'b-pend'}">${i.withdraw_status==='เบิกแล้ว'?'เบิกแล้ว':'รอเบิก'}</span></td>
    </tr>`).join('')}</tbody>
    <tfoot><tr class="sum-row"><td colspan="3"><strong>รวม ${items.length} รายการ</strong></td><td class="r"><strong>${fmt(sum)}</strong></td><td></td></tr></tfoot>
  </table>`;
}

// ---------- PROJECT DETAIL: FINANCE TAB ----------
async function renderProjDetailFinance(){
  const el = document.getElementById('proj-detail-content');
  if(!ACTIVE_PROJ_ID){ el.innerHTML='<div class="no-data">ไม่พบโครงการ</div>'; return; }
  el.innerHTML='<div class="no-data">กำลังโหลด...</div>';
  try{
    const txs = await GET('finance_transactions',
      `select=*,fund_categories(name)&project_id=eq.${ACTIVE_PROJ_ID}&order=transaction_date.desc`
    ) || [];
    if(!txs.length){
      el.innerHTML='<div class="no-data">ยังไม่มีรายการการเงินที่เชื่อมกับโครงการนี้</div>';
      return;
    }
    const totalOut = txs.filter(t=>t.transaction_type==='จ่าย').reduce((s,t)=>s+Number(t.amount||0),0);
    el.innerHTML=`<table>
      <thead><tr><th>วันที่</th><th>ประเภท</th><th>หมวดเงิน</th><th>รายละเอียด</th><th>เลขที่</th><th class="r">จำนวนเงิน</th></tr></thead>
      <tbody>${txs.map(t=>{
        const typeColor=t.transaction_type==='รับ'?'var(--up)':t.transaction_type==='จ่าย'?'var(--signal)':'var(--slate)';
        const fundName=(t.fund_categories&&t.fund_categories.name)?t.fund_categories.name:'—';
        return `<tr>
          <td style="white-space:nowrap">${fmtDate(t.transaction_date)}</td>
          <td><span style="font-size:11px;font-weight:700;color:${typeColor}">${t.transaction_type||'—'}</span></td>
          <td class="ink">${fundName}</td>
          <td>${t.description||'—'}</td>
          <td><span style="font-family:var(--mono);font-size:12px">${t.document_no||'—'}</span></td>
          <td class="r" style="color:${typeColor}">${fmt(t.amount)}</td>
        </tr>`;
      }).join('')}</tbody>
      <tfoot><tr class="sum-row">
        <td colspan="5"><strong>รวม ${txs.length} รายการ</strong></td>
        <td class="r"><strong style="color:var(--signal)">${fmt(totalOut)}</strong></td>
      </tr></tfoot>
    </table>`;
  }catch(e){
    el.innerHTML='<div class="no-data">โหลดรายการการเงินไม่ได้: '+e.message+'</div>';
  }
}

// Project form
function openProjectForm(){ document.getElementById('projEditId').value=''; document.getElementById('projName').value=''; document.getElementById('projTeacher').value=''; document.getElementById('projBudget').value=''; document.getElementById('projFormTitle').textContent='เพิ่มโครงการ'; document.getElementById('projOverlay').classList.add('open'); }
function closeProjForm(){ document.getElementById('projOverlay').classList.remove('open'); }
function editProj(id){ const p=PROJECTS.find(x=>x.id===id); if(!p)return; document.getElementById('projEditId').value=id; document.getElementById('projName').value=p.name; document.getElementById('projTeacher').value=p.teacher_name||''; document.getElementById('projBudget').value=p.budget_amount||''; document.getElementById('projFormTitle').textContent='แก้ไขโครงการ'; document.getElementById('projOverlay').classList.add('open'); }
async function saveProjItem(){
  if(!adminGuard()) return;
  const name=document.getElementById('projName').value.trim();
  if(!name){alert('กรุณาระบุชื่อโครงการ');return}
  const eid=document.getElementById('projEditId').value;
  if(eid){
    const existing = PROJECTS.find(x=>x.id===eid);
    if(existing && !canEdit(existing.teacher_name)){ alert('คุณไม่มีสิทธิ์แก้ไขโครงการนี้'); return; }
  }
  const body={year_id:CY,name,teacher_name:document.getElementById('projTeacher').value.trim(),budget_amount:parseFloat(document.getElementById('projBudget').value)||0};
  show('loadingOverlay','flex');
  try{
    if(eid) await PATCH('projects',`id=eq.${eid}`,body);
    else await POST('projects',body);
    await loadAll(); closeProjForm();
  }catch(e){ hide('loadingOverlay'); alert('บันทึกไม่ได้: '+e.message); }
}
