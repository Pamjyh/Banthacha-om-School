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
  SUBITEMS_LOAD_ERROR = null;

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
    // scrutinize finding (2026-07-07, MAJOR): ห้าม swallow error เงียบๆ — ถ้า fetch ล้มเหลว (network/RLS/schema)
    // สำหรับ item ที่เคยมีรายการย่อยบันทึกไว้จริง ตารางจะโชว์ "ว่างเปล่า" เหมือนไม่เคยมีอะไร
    // ถ้า Stage 16 กด "บันทึก" ทับตอนนั้น จะเขียนทับข้อมูลเดิมด้วยค่าว่างแบบเงียบๆ (data loss)
    // ต้องเก็บ error ไว้เตือนเด่นชัดใน updateSubItemsFooter() แทน
    CURRENT_SUB_ITEMS = [];
    SUBITEMS_LOAD_ERROR = e.message || 'ไม่ทราบสาเหตุ';
  }
  renderSubItemsTable();
}

function closeDetailForm(){
  document.getElementById('procDetailOverlay').classList.remove('open');
}

// ---------- SECTION C: รายการย่อย (Stage 15) ----------
// scrutinize finding (2026-07-07, NIT): เพิ่ม canEditModule('procurement') เป็น defense-in-depth
// ตาม pattern เดิมของ Stage 13D (ต่อให้ยังไม่บันทึกลง DB จริงใน Stage 15 การกด "📄" เอง
// ก็ถูกซ่อนด้วย canEdit()/canEditModule() อยู่แล้ว แต่ฟังก์ชันที่ mutate state ควรมี guard ของตัวเองด้วย)
function addSubItemRow(){
  if(!canEditModule('procurement')){ alert('คุณไม่มีสิทธิ์แก้ไขหน้าพัสดุ'); return; }
  CURRENT_SUB_ITEMS.push({seq: CURRENT_SUB_ITEMS.length+1, description:'', unit:'', quantity:1, unit_price:0, amount:0});
  renderSubItemsTable();
}

function removeSubItemRow(idx){
  if(!canEditModule('procurement')){ alert('คุณไม่มีสิทธิ์แก้ไขหน้าพัสดุ'); return; }
  CURRENT_SUB_ITEMS.splice(idx,1);
  CURRENT_SUB_ITEMS.forEach(function(r,i){ r.seq = i+1; });
  renderSubItemsTable();
}

// อัปเดตแค่ field ตัวเลข (quantity/unit_price) แล้ว recalc amount ของแถวนั้น — อัปเดตเฉพาะ cell/footer
// ไม่ rebuild ทั้งตาราง กัน input เสีย focus ระหว่างพิมพ์ (ต่างจาก description/unit ที่ผูก oninput ตรงๆ
// เพราะไม่กระทบยอดรวม ไม่ต้อง re-render อะไรเลย)
// scrutinize finding (2026-07-07, MINOR): HTML min="0" ไม่บังคับค่าจริงเพราะ input ไม่ได้อยู่ใน <form> ที่ submit
// ต้อง clamp ค่าติดลบเองใน JS แล้ว sync กลับเข้า input.value ด้วย ไม่งั้น input จะโชว์เลขติดลบทั้งที่ state ถูก clamp เป็น 0
function updateSubItemAmount(idx, field, value, inputEl){
  if(!canEditModule('procurement')){ alert('คุณไม่มีสิทธิ์แก้ไขหน้าพัสดุ'); if(inputEl) inputEl.value = CURRENT_SUB_ITEMS[idx]?.[field] ?? 0; return; }
  const row = CURRENT_SUB_ITEMS[idx];
  if(!row) return;
  let v = parseFloat(value);
  const wasNegativeOrInvalid = isNaN(v) || v < 0;
  if(wasNegativeOrInvalid) v = 0;
  row[field] = v;
  // sync ค่ากลับเข้า input เฉพาะตอนถูก clamp เท่านั้น (ห้าม sync ทุกครั้ง — จะรบกวนการพิมพ์เลขทศนิยม
  // เช่น พิมพ์ "5." ระหว่างพิมพ์ "5.5" ถ้า sync ทุกครั้งจะโดนรีเซ็ตกลับเป็น "5" ทำให้พิมพ์ทศนิยมไม่ได้)
  if(inputEl && wasNegativeOrInvalid) inputEl.value = v;
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
      '<td><input class="fc" style="padding:6px 8px;font-size:13px;text-align:right" type="number" step="any" min="0" value="'+row.quantity+'" oninput="updateSubItemAmount('+idx+',\'quantity\',this.value,this)"></td>'+
      '<td><input class="fc" style="padding:6px 8px;font-size:13px;text-align:right" type="number" step="any" min="0" value="'+row.unit_price+'" oninput="updateSubItemAmount('+idx+',\'unit_price\',this.value,this)"></td>'+
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

  // scrutinize finding (2026-07-07, MAJOR): ถ้าโหลดรายการย่อยเดิมไม่สำเร็จ ต้องเตือนเด่นชัดกว่า
  // warning ปกติ (สีแดงแทนเหลือง) และ "ชนะ" การเช็ควงเงินด้านล่าง — ห้ามให้ผู้ใช้เข้าใจผิดว่า
  // "ไม่มีรายการย่อย" ทั้งที่จริงคือโหลดไม่สำเร็จ (เสี่ยงเขียนทับข้อมูลเดิมเมื่อกด "บันทึก" ใน Stage 16)
  if(SUBITEMS_LOAD_ERROR){
    warnEl.style.display = '';
    warnEl.style.background = '#fee2e2';
    warnEl.style.color = '#991b1b';
    warnEl.textContent = '⚠️ โหลดรายการย่อยเดิมไม่สำเร็จ ('+SUBITEMS_LOAD_ERROR+') — ห้ามกด "บันทึก" จนกว่าจะโหลดสำเร็จ มิฉะนั้นข้อมูลเดิมอาจถูกเขียนทับ';
    return;
  }
  warnEl.style.background = '#fff3cd';
  warnEl.style.color = '#856404';

  const budget = Number((CURRENT_PROC_ITEM && CURRENT_PROC_ITEM.amount) || 0);
  if(CURRENT_SUB_ITEMS.length && Math.abs(sum - budget) > 0.01){
    warnEl.style.display = '';
    warnEl.textContent = '⚠️ รวมรายการย่อย ('+fmt(sum)+') ≠ วงเงิน ('+fmt(budget)+') — กรุณาตรวจสอบ';
  } else {
    warnEl.style.display = 'none';
    warnEl.textContent = '';
  }
}
