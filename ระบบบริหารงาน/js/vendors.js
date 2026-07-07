// =====================================================================
// VENDORS MANAGEMENT (ร้านค้า/ผู้รับจ้าง) — banthacha-v2 Stage 12
// CRUD สำหรับตาราง vendors — เพิ่ม/แก้ไข + search by ชื่อ/ประเภท/จังหวัด
// VENDORS_LIST โหลดครั้งเดียวตอน loadAll() (js/init.js) — หน้านี้แค่ render/แก้ไข
// switchMgmtTab() คุมการสลับ sub-tab ของหน้า "จัดการข้อมูล" (บุคลากร <-> ร้านค้า)
// =====================================================================

function switchMgmtTab(tab){
  document.querySelectorAll('[data-mtab]').forEach(function(btn){
    btn.classList.toggle('active', btn.dataset.mtab === tab);
  });
  var staffEl  = document.getElementById('manage-tab-staff');
  var vendorEl = document.getElementById('manage-tab-vendors');
  if(staffEl)  staffEl.style.display  = tab === 'staff'   ? 'block' : 'none';
  if(vendorEl) vendorEl.style.display = tab === 'vendors' ? 'block' : 'none';
}

function renderVendorsTable(){
  const tbody = document.getElementById('vendors-tbody');
  if(!tbody) return;
  const q = (document.getElementById('vendorSearch')?.value || '').trim().toLowerCase();
  const list = !q ? VENDORS_LIST : VENDORS_LIST.filter(function(v){
    return (v.name||'').toLowerCase().indexOf(q) >= 0 ||
           (v.type||'').toLowerCase().indexOf(q) >= 0 ||
           (v.province||'').toLowerCase().indexOf(q) >= 0;
  });
  if(!list.length){
    tbody.innerHTML = '<tr><td colspan="4" class="no-data">'+
      (VENDORS_LIST.length ? 'ไม่พบร้านค้าที่ค้นหา' : 'ยังไม่มีข้อมูลร้านค้า กด "+ เพิ่มร้านค้า" เพื่อเริ่ม')+
      '</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(function(v){
    return '<tr>'+
      '<td class="ink">'+escHtml(v.name)+'</td>'+
      '<td>'+escHtml(v.type)+'</td>'+
      '<td>'+escHtml(v.province)+'</td>'+
      '<td><button class="act-btn admin-only" onclick="editVendor(\''+v.id+'\')" title="แก้ไข">✏️</button></td>'+
    '</tr>';
  }).join('');
}

function filterVendors(){
  renderVendorsTable();
}

function openVendorForm(){
  if(!adminGuard()) return;
  if(!isAdminIdentity()){ alert('เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการข้อมูลร้านค้าได้'); return; }
  document.getElementById('vendorEditId').value = '';
  document.getElementById('vendorName').value = '';
  document.getElementById('vendorContact').value = '';
  document.getElementById('vendorType').value = 'บุคคลธรรมดา';
  document.getElementById('vendorTaxId').value = '';
  document.getElementById('vendorAddressNo').value = '';
  document.getElementById('vendorMoo').value = '';
  document.getElementById('vendorTambon').value = '';
  document.getElementById('vendorAmphoe').value = '';
  document.getElementById('vendorProvince').value = '';
  document.getElementById('vendorPostcode').value = '';
  document.getElementById('vendorPhone').value = '';
  document.getElementById('vendorBankAcctNo').value = '';
  document.getElementById('vendorBankAcctName').value = '';
  document.getElementById('vendorBankName').value = '';
  document.getElementById('vendorBankBranch').value = '';
  document.getElementById('vendorFormTitle').textContent = 'เพิ่มร้านค้า/ผู้รับจ้าง';
  document.getElementById('vendorOverlay').classList.add('open');
}

function closeVendorForm(){
  document.getElementById('vendorOverlay').classList.remove('open');
}

function editVendor(id){
  const v = VENDORS_LIST.find(x => x.id === id);
  if(!v) return;
  document.getElementById('vendorEditId').value = id;
  document.getElementById('vendorName').value = v.name || '';
  document.getElementById('vendorContact').value = v.contact_name || '';
  document.getElementById('vendorType').value = v.type || 'บุคคลธรรมดา';
  document.getElementById('vendorTaxId').value = v.tax_id || '';
  document.getElementById('vendorAddressNo').value = v.address_no || '';
  document.getElementById('vendorMoo').value = v.moo || '';
  document.getElementById('vendorTambon').value = v.tambon || '';
  document.getElementById('vendorAmphoe').value = v.amphoe || '';
  document.getElementById('vendorProvince').value = v.province || '';
  document.getElementById('vendorPostcode').value = v.postcode || '';
  document.getElementById('vendorPhone').value = v.phone || '';
  document.getElementById('vendorBankAcctNo').value = v.bank_acct_no || '';
  document.getElementById('vendorBankAcctName').value = v.bank_acct_name || '';
  document.getElementById('vendorBankName').value = v.bank_name || '';
  document.getElementById('vendorBankBranch').value = v.bank_branch || '';
  document.getElementById('vendorFormTitle').textContent = 'แก้ไขร้านค้า/ผู้รับจ้าง';
  document.getElementById('vendorOverlay').classList.add('open');
}

async function saveVendorItem(){
  if(!adminGuard()) return;
  if(!isAdminIdentity()){ alert('เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการข้อมูลร้านค้าได้'); return; }
  const name = document.getElementById('vendorName').value.trim();
  if(!name) return alert('กรุณาระบุชื่อร้านค้า/ผู้รับจ้าง');

  const body = {
    name,
    contact_name:   document.getElementById('vendorContact').value.trim() || null,
    type:           document.getElementById('vendorType').value,
    tax_id:         document.getElementById('vendorTaxId').value.trim() || null,
    address_no:     document.getElementById('vendorAddressNo').value.trim() || null,
    moo:            document.getElementById('vendorMoo').value.trim() || null,
    tambon:         document.getElementById('vendorTambon').value.trim() || null,
    amphoe:         document.getElementById('vendorAmphoe').value.trim() || null,
    province:       document.getElementById('vendorProvince').value.trim() || null,
    postcode:       document.getElementById('vendorPostcode').value.trim() || null,
    phone:          document.getElementById('vendorPhone').value.trim() || null,
    bank_acct_no:   document.getElementById('vendorBankAcctNo').value.trim() || null,
    bank_acct_name: document.getElementById('vendorBankAcctName').value.trim() || null,
    bank_name:      document.getElementById('vendorBankName').value.trim() || null,
    bank_branch:    document.getElementById('vendorBankBranch').value.trim() || null
  };

  const editId = document.getElementById('vendorEditId').value;
  show('loadingOverlay','flex');
  try{
    if(editId) await PATCH('vendors', 'id=eq.'+editId, body);
    else await POST('vendors', body);
    VENDORS_LIST = await GET('vendors','select=*&order=name') || [];
    hide('loadingOverlay');
    renderVendorsTable();
    closeVendorForm();
    showToast(editId ? 'แก้ไขข้อมูลสำเร็จ ✓' : 'เพิ่มร้านค้าสำเร็จ ✓');
  }catch(e){
    hide('loadingOverlay');
    alert('บันทึกไม่สำเร็จ: '+e.message);
  }
}
