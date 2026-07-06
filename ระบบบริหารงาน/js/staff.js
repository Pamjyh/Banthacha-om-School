// =====================================================================
// STAFF MANAGEMENT (บุคลากร) — banthacha-v2 Stage 11
// CRUD สำหรับตาราง staff — เพิ่ม/แก้ไข/ปิด-เปิดใช้งาน (ไม่ลบจริง เก็บประวัติไว้)
// STAFF_LIST โหลดครั้งเดียวตอน loadAll() (js/init.js) — หน้านี้แค่ render/แก้ไข
// =====================================================================

function renderStaffTable(){
  const tbody = document.getElementById('staff-tbody');
  if(!tbody) return;
  if(!STAFF_LIST.length){
    tbody.innerHTML = '<tr><td colspan="5" class="no-data">ยังไม่มีข้อมูลบุคลากร กด "+ เพิ่มบุคลากร" เพื่อเริ่ม</td></tr>';
    return;
  }
  tbody.innerHTML = STAFF_LIST.map(function(s){
    const active = s.is_active !== false; // default true ถ้าไม่มีค่า
    return '<tr>'+
      '<td>'+escHtml(s.prefix)+'</td>'+
      '<td class="ink">'+escHtml(s.name)+'</td>'+
      '<td>'+escHtml(s.position)+'</td>'+
      '<td><button class="st-btn '+(active?'st-done':'st-pend')+' admin-only" onclick="toggleStaffActive(\''+s.id+'\','+active+')">'+
        '<span class="st-dot '+(active?'sd-done':'sd-pend')+'"></span>'+(active?'✓ ใช้งาน':'ปิดใช้งาน')+
      '</button></td>'+
      '<td><button class="act-btn admin-only" onclick="editStaff(\''+s.id+'\')" title="แก้ไข">✏️</button></td>'+
    '</tr>';
  }).join('');
}

function openStaffForm(){
  if(!adminGuard()) return;
  document.getElementById('staffEditId').value = '';
  document.getElementById('staffPrefix').value = 'นาย';
  document.getElementById('staffName').value = '';
  document.getElementById('staffPosition').value = '';
  document.getElementById('staffCanProc').checked = false;
  document.getElementById('staffCanFin').checked = false;
  document.getElementById('staffFormTitle').textContent = 'เพิ่มบุคลากร';
  document.getElementById('staffOverlay').classList.add('open');
}

function closeStaffForm(){
  document.getElementById('staffOverlay').classList.remove('open');
}

function editStaff(id){
  const s = STAFF_LIST.find(x => x.id === id);
  if(!s) return;
  document.getElementById('staffEditId').value = id;
  document.getElementById('staffPrefix').value = s.prefix || 'นาย';
  document.getElementById('staffName').value = s.name || '';
  document.getElementById('staffPosition').value = s.position || '';
  document.getElementById('staffCanProc').checked = !!s.can_edit_procurement;
  document.getElementById('staffCanFin').checked = !!s.can_edit_finance;
  document.getElementById('staffFormTitle').textContent = 'แก้ไขบุคลากร';
  document.getElementById('staffOverlay').classList.add('open');
}

async function saveStaffItem(){
  if(!adminGuard()) return;
  const prefix   = document.getElementById('staffPrefix').value;
  const name     = document.getElementById('staffName').value.trim();
  const position = document.getElementById('staffPosition').value.trim();
  if(!name)     return alert('กรุณาระบุชื่อ-สกุล');
  if(!position) return alert('กรุณาระบุตำแหน่ง');
  const canProc = document.getElementById('staffCanProc').checked;
  const canFin  = document.getElementById('staffCanFin').checked;

  const editId = document.getElementById('staffEditId').value;
  const body = { prefix, name, position, can_edit_procurement: canProc, can_edit_finance: canFin };

  show('loadingOverlay','flex');
  try{
    if(editId) await PATCH('staff', 'id=eq.'+editId, body);
    else await POST('staff', body);
    STAFF_LIST = await GET('staff','select=*&order=prefix,name') || [];
    hide('loadingOverlay');
    renderStaffTable();
    closeStaffForm();
    // Stage 13D: ถ้าแก้ไข flag ของคนที่กำลังล็อกอินอยู่ตอนนี้เอง ต้อง refresh สรุป/เต็มทันที
    if(typeof applyModulePermissionUI === 'function') applyModulePermissionUI();
    if(typeof renderProjGrid === 'function') renderProjGrid();
    showToast(editId ? 'แก้ไขข้อมูลสำเร็จ ✓' : 'เพิ่มบุคลากรสำเร็จ ✓');
  }catch(e){
    hide('loadingOverlay');
    alert('บันทึกไม่สำเร็จ: '+e.message);
  }
}

// เปิด/ปิดใช้งาน — ไม่ลบแถวจริง (deactivate เท่านั้น ตามสเปก CONSTRUCTION_PLAN Stage 11)
async function toggleStaffActive(id, currentlyActive){
  if(!adminGuard()) return;
  show('loadingOverlay','flex');
  try{
    await PATCH('staff', 'id=eq.'+id, { is_active: !currentlyActive });
    STAFF_LIST = await GET('staff','select=*&order=prefix,name') || [];
    hide('loadingOverlay');
    renderStaffTable();
    showToast(currentlyActive ? 'ปิดใช้งานแล้ว' : 'เปิดใช้งานแล้ว');
  }catch(e){
    hide('loadingOverlay');
    alert('เปลี่ยนสถานะไม่สำเร็จ: '+e.message);
  }
}
