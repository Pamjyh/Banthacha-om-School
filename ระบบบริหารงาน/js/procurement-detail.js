// =====================================================================
// PROCUREMENT DETAIL FORM (กรอกเอกสารพัสดุ) — banthacha-v2 Stage 14
// SECTION A เท่านั้น: ข้อมูลหลัก auto-fill จาก procurement_item (read-only)
// + preview เลขที่เอกสาร (create mode) หรือโหลดเลขที่ที่บันทึกแล้ว (edit mode)
// SECTION B-I (ร้านค้า, รายการย่อย, วันที่, คณะกรรมการ, บันทึก, PDF) คือ Stage 15-17
// ถัดไป — ยังไม่สร้างตอนนี้ตามกฎ "ห้าม build ข้าม stage"
//
// CURRENT_PROC_ITEM / CURRENT_DETAIL (js/state.js) เก็บ state ไว้ให้ Stage 15-16 ต่อยอด
// =====================================================================

async function openDetailForm(procItemId){
  const item = PROC.find(x => x.id === procItemId);
  if(!item) return;
  CURRENT_PROC_ITEM = item;
  CURRENT_DETAIL = null;

  document.getElementById('pd-title').textContent   = item.title || '—';
  document.getElementById('pd-type').textContent    = item.type || '—';
  document.getElementById('pd-project').textContent = item.projects?.name || '— ไม่ระบุโครงการ —';
  document.getElementById('pd-year').textContent    = CYbe || '—';
  document.getElementById('pd-amount').textContent  = fmt(item.amount);
  document.getElementById('pd-docnumber').textContent = 'กำลังโหลด...';
  document.getElementById('pd-docnumber-tag').textContent = '';
  document.getElementById('procDetailOverlay').classList.add('open');

  try{
    const rows = await GET('procurement_details', 'procurement_item_id=eq.'+procItemId+'&select=*');
    if(rows && rows.length){
      // edit mode — เคยกรอกและออกเลขที่เอกสารแล้ว ล็อคเลขเดิมไว้ ห้ามออกเลขใหม่ทับ
      CURRENT_DETAIL = rows[0];
      document.getElementById('pd-docnumber').textContent = CURRENT_DETAIL.doc_number || '—';
      document.getElementById('pd-docnumber-tag').textContent = '(บันทึกแล้ว)';
    } else {
      // create mode — ยังไม่เคยกรอก แสดง preview เลขที่จะได้ ถ้ากด "บันทึก" ใน Stage 16
      const next = await getNextDocNumber(CY, item.type);
      document.getElementById('pd-docnumber').textContent = next.preview;
      document.getElementById('pd-docnumber-tag').textContent = '(preview — ยังไม่บันทึก)';
    }
  }catch(e){
    document.getElementById('pd-docnumber').textContent = '(โหลดไม่สำเร็จ: '+e.message+')';
  }
}

function closeDetailForm(){
  document.getElementById('procDetailOverlay').classList.remove('open');
}
