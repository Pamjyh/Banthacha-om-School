// =====================================================================
// PROCUREMENT DETAIL FORM (กรอกเอกสารพัสดุ) — banthacha-v2 Stage 14-15
// SECTION A: ข้อมูลหลัก auto-fill จาก procurement_item (read-only)
//            + preview เลขที่เอกสาร (create mode) หรือโหลดเลขที่ที่บันทึกแล้ว (edit mode)
// SECTION C (Stage 15): ตารางรายการย่อย (procurement_sub_items) — เพิ่ม/ลบ/แก้แถวได้ใน memory
//            (CURRENT_SUB_ITEMS) ยังไม่บันทึกลง DB จริงจนกว่าจะมีปุ่ม "บันทึก" ใน Stage 16
// SECTION B,D-I (ร้านค้า, วันที่, คณะกรรมการ, บันทึก, PDF) คือ Stage 16-17 ถัดไป
// ยังไม่สร้างตอนนี้ตามกฎ "ห้าม build ข้าม stage"
//
// CURRENT_PROC_ITEM / CURRENT_DETAIL / CURRENT_SUB_ITEMS (js/state.js) เก็บ state ไว้ให้ Stage 16 ต่อยอด
// =====================================================================

async function openDetailForm(procItemId){
  const item = PROC.find(x => x.id === procItemId);
  if(!item) return;
  CURRENT_PROC_ITEM = item;
  CURRENT_DETAIL = null;
  CURRENT_SUB_ITEMS = [];

  document.getElementById('pd-title').textContent   = item.title || '—';
  document.getElementById('pd-type').textContent    = item.type || '—';
  document.getElementById('pd-project').textContent = item.projects?.name || '— ไม่ระบุโครงการ —';
  document.getElementById('pd-year').textContent    = CYbe || '—';
  document.getElementById('pd-amount').textContent  = fmt(item.amount);
  document.getElementById('pd-docnumber').textContent = 'กำลังโหลด...';
  document.getElementById('pd-docnumber-tag').textContent = '';
  renderSubItemsTable(); // เคลียร์ตารางก่อนโหลดใหม่ กันข้อมูลของ item ก่อนหน้าค้าง
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

  // Stage 15: โหลดรายการย่อยที่เคยบันทึกไว้ (ถ้ามี) — ตาม CONSTRUCTION_PLAN Stage 15 BUILD spec
  try{
    const subRows = await GET('procurement_sub_items', 'procurement_item_id=eq.'+procItemId+'&select=*&order=seq');
    CURRENT_SUB_ITEMS = (subRows||[]).map(function(r){
      return {id:r.id, seq:r.seq, description:r.description, unit:r.unit, quantity:Number(r.quantity), unit_price:Number(r.unit_price), amount:Number(r.amount)};
    });
  }catch(e){
    CURRENT_SUB_ITEMS = [];
  }
  renderSubItemsTable();
}

function closeDetailForm(){
  document.getElementById('procDetailOverlay').classList.remove('open');
}

// ---------- SECTION C: รายการย่อย (Stage 15) ----------
function addSubItemRow(){
  CURRENT_SUB_ITEMS.push({seq: CURRENT_SUB_ITEMS.length+1, description:'', unit:'', quantity:1, unit_price:0, amount:0});
  renderSubItemsTable();
}

function removeSubItemRow(idx){
  CURRENT_SUB_ITEMS.splice(idx,1);
  CURRENT_SUB_ITEMS.forEach(function(r,i){ r.seq = i+1; });
  renderSubItemsTable();
}

// อัปเดตแค่ field ตัวเลข (quantity/unit_price) แล้ว recalc amount ของแถวนั้น — อัปเดตเฉพาะ cell/footer
// ไม่ rebuild ทั้งตาราง กัน input เสีย focus ระหว่างพิมพ์ (ต่างจาก description/unit ที่ผูก oninput ตรงๆ
// เพราะไม่กระทบยอดรวม ไม่ต้อง re-render อะไรเลย)
function updateSubItemAmount(idx, field, value){
  const row = CURRENT_SUB_ITEMS[idx];
  if(!row) return;
  row[field] = parseFloat(value) || 0;
  row.amount = (Number(row.quantity)||0) * (Number(row.unit_price)||0);
  const cell = document.getElementById('pd-sub-amt-'+idx);
  if(cell) cell.textContent = fmt(row.amount);
  updateSubItemsFooter();
}

function renderSubItemsTable(){
  const tbody = document.getElementById('pd-subitems-tbody');
  if(!tbody) return;
  if(!CURRENT_SUB_ITEMS.length){
    tbody.innerHTML = '<tr><td colspan="6" class="no-data">ยังไม่มีรายการย่อย กด "+ เพิ่มรายการ" เพื่อเริ่ม</td></tr>';
    updateSubItemsFooter();
    return;
  }
  tbody.innerHTML = CURRENT_SUB_ITEMS.map(function(row, idx){
    return '<tr>'+
      '<td><input class="fc" style="padding:6px 8px;font-size:13px" type="text" value="'+escHtml(row.description)+'" placeholder="รายละเอียด" oninput="CURRENT_SUB_ITEMS['+idx+'].description=this.value"></td>'+
      '<td><input class="fc" style="padding:6px 8px;font-size:13px" type="text" value="'+escHtml(row.unit)+'" placeholder="หน่วย" oninput="CURRENT_SUB_ITEMS['+idx+'].unit=this.value"></td>'+
      '<td><input class="fc" style="padding:6px 8px;font-size:13px;text-align:right" type="number" step="any" min="0" value="'+row.quantity+'" oninput="updateSubItemAmount('+idx+',\'quantity\',this.value)"></td>'+
      '<td><input class="fc" style="padding:6px 8px;font-size:13px;text-align:right" type="number" step="any" min="0" value="'+row.unit_price+'" oninput="updateSubItemAmount('+idx+',\'unit_price\',this.value)"></td>'+
      '<td class="r" id="pd-sub-amt-'+idx+'">'+fmt(row.amount)+'</td>'+
      '<td><button class="act-btn del" onclick="removeSubItemRow('+idx+')" title="ลบ">🗑️</button></td>'+
    '</tr>';
  }).join('');
  updateSubItemsFooter();
}

function updateSubItemsFooter(){
  const tfoot = document.getElementById('pd-subitems-tfoot');
  const sum = CURRENT_SUB_ITEMS.reduce(function(s,r){ return s+Number(r.amount||0); }, 0);
  if(tfoot) tfoot.innerHTML = CURRENT_SUB_ITEMS.length
    ? '<tr class="sum-row"><td colspan="4"><strong>รวมทั้งสิ้น</strong></td><td class="r"><strong>'+fmt(sum)+'</strong></td><td></td></tr>'
    : '';
  const warnEl = document.getElementById('pd-subitems-warning');
  if(!warnEl) return;
  const budget = Number((CURRENT_PROC_ITEM && CURRENT_PROC_ITEM.amount) || 0);
  if(CURRENT_SUB_ITEMS.length && Math.abs(sum - budget) > 0.01){
    warnEl.style.display = '';
    warnEl.textContent = '⚠️ รวมรายการย่อย ('+fmt(sum)+') ≠ วงเงิน ('+fmt(budget)+') — กรุณาตรวจสอบ';
  } else {
    warnEl.style.display = 'none';
    warnEl.textContent = '';
  }
}
