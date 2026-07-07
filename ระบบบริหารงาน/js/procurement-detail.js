// =====================================================================
// PROCUREMENT DETAIL FORM (กรอกเอกสารพัสดุ) — banthacha-v2 Stage 14-16
// SECTION A: ข้อมูลหลัก auto-fill จาก procurement_item (read-only)
//            + preview เลขที่เอกสาร (create mode) หรือโหลดเลขที่ที่บันทึกแล้ว (edit mode)
// SECTION C: ตารางรายการย่อย (procurement_sub_items) — เพิ่ม/ลบ/แก้แถวได้ใน memory (CURRENT_SUB_ITEMS)
// SECTION B: ร้านค้า/ผู้รับจ้าง (dropdown จาก VENDORS_LIST)
// SECTION D: วันที่ดำเนินการ 10 รายการ
// SECTION E+F: คณะกรรมการกำหนด TOR (1-3 คน) / ตรวจรับพัสดุ (1-3 คน) — dropdown จาก STAFF_LIST
//              (ไม่บังคับครบ 3 — BLUEPRINT L561 รองรับน้อยกว่า 3 คนได้ตามระเบียบพัสดุจริง)
// SECTION G+H: วัตถุประสงค์/คุณสมบัติ TOR, แหล่งงบประมาณ, VAT, ภาษีหัก ณ ที่จ่าย, ค่าปรับ (ร้อยละต่อวัน — เพิ่ม 2026-07-08)
// ปุ่ม "บันทึก" → UPSERT procurement_details + replace procurement_sub_items ทั้งหมด
// SECTION I (พิมพ์เอกสาร PDF 16 ชุด) คือ Stage 17 ถัดไป — ยังไม่สร้างตอนนี้ตามกฎ "ห้าม build ข้าม stage"
// =====================================================================

// รายชื่อวันที่ตามลำดับ workflow จริง (BLUEPRINT §2.6 L312) ใช้ทั้งตอน populate ฟอร์มและเช็คลำดับตอน save
const PD_DATE_SEQUENCE = [
  ['pd-date-request',      'date_request',      'ขอดำเนินการ'],
  ['pd-date-approve-tor',  'date_approve_tor',  'ขออนุมัติแต่งตั้งกรรมการ TOR'],
  ['pd-date-order-tor',    'date_order_tor',    'คำสั่งแต่งตั้งกรรมการ TOR'],
  ['pd-date-agree-tor',    'date_agree_tor',    'เห็นชอบ TOR'],
  ['pd-date-request-buy',  'date_request_buy',  'ขอซื้อ/จ้าง'],
  ['pd-date-announce',     'date_announce',     'ประกาศผู้ชนะการเสนอราคา'],
  ['pd-date-order',        'date_order',        'สั่งซื้อ/จ้าง'],
  ['pd-date-due',          'date_due',          'ครบกำหนดส่งมอบ']
];
// วันที่ 2 รายการนอกลำดับหลัก (เช็คแยกกับ date_due แทน) — date_withdraw ไม่มีเงื่อนไขลำดับใน BLUEPRINT
const PD_DATE_EXTRA = [
  ['pd-date-deliver',  'date_deliver',  'ส่งมอบ/ตรวจรับจริง'],
  ['pd-date-withdraw', 'date_withdraw', 'เบิกจ่าย']
];

// bug-fixer (2026-07-07): ปุ่ม "📄 กรอกเอกสาร" ที่เปิด modal นี้ (procurement.js) มองเห็นได้ด้วยเงื่อนไข
// canEdit(เจ้าของโครงการ) || canEditModule('procurement') — คือครูที่ "แก้เฉพาะโครงการตัวเอง" (ไม่มี flag
// can_edit_procurement) ก็เปิดฟอร์มกรอกเอกสารของโครงการตัวเองได้ แต่ guard เดิมในฟังก์ชัน mutate (Stage 15)
// เช็คแค่ canEditModule('procurement') อย่างเดียว — ทำให้ครูกลุ่มนี้เปิดฟอร์มได้แต่กด "+เพิ่มรายการ"/บันทึกไม่ได้
// เพราะ guard เข้มกว่าเงื่อนไขที่ปล่อยให้เข้ามาตั้งแต่แรก ต้องใช้เงื่อนไขเดียวกันทั้งสองจุด
function canEditCurrentProcItem(){
  if(!CURRENT_PROC_ITEM) return false;
  return canEdit(CURRENT_PROC_ITEM.projects?.teacher_name) || canEditModule('procurement');
}

async function openDetailForm(procItemId){
  const item = PROC.find(x => x.id === procItemId);
  if(!item) return;
  CURRENT_PROC_ITEM = item;
  CURRENT_DETAIL = null;
  CURRENT_SUB_ITEMS = [];
  CURRENT_SUB_ITEMS_ORIGINAL_IDS = [];
  SUBITEMS_LOAD_ERROR = null;

  document.getElementById('pd-title').textContent   = item.title || '—';
  document.getElementById('pd-type').textContent    = item.type || '—';
  document.getElementById('pd-project').textContent = item.projects?.name || '— ไม่ระบุโครงการ —';
  document.getElementById('pd-year').textContent    = CYbe || '—';
  document.getElementById('pd-amount').textContent  = fmt(item.amount);
  document.getElementById('pd-docnumber').textContent = 'กำลังโหลด...';
  document.getElementById('pd-docnumber-tag').textContent = '';
  renderSubItemsTable(); // เคลียร์ตารางก่อนโหลดใหม่ กันข้อมูลของ item ก่อนหน้าค้าง
  populateVendorSelect(null);
  populateStaffSelects(null, null);
  populateDetailFields(null); // เคลียร์ Section D-H ก่อน กันข้อมูลของ item ก่อนหน้าค้าง (เหมือน sub-items table)
  document.getElementById('procDetailOverlay').classList.add('open');

  try{
    const rows = await GET('procurement_details', 'procurement_item_id=eq.'+procItemId+'&select=*');
    if(rows && rows.length){
      // edit mode — เคยกรอกและออกเลขที่เอกสารแล้ว ล็อคเลขเดิมไว้ ห้ามออกเลขใหม่ทับ
      CURRENT_DETAIL = rows[0];
      document.getElementById('pd-docnumber').textContent = CURRENT_DETAIL.doc_number || '—';
      document.getElementById('pd-docnumber-tag').textContent = '(บันทึกแล้ว)';
      populateDetailFields(CURRENT_DETAIL);
      populateVendorSelect(CURRENT_DETAIL.vendor_id);
      populateStaffSelects(CURRENT_DETAIL.committee_tor, CURRENT_DETAIL.committee_inspect);
    } else {
      // create mode — ยังไม่เคยกรอก แสดง preview เลขที่จะได้ ถ้ากด "บันทึก" ใน Stage 16
      const next = await getNextDocNumber(CY, item.type);
      document.getElementById('pd-docnumber').textContent = next.preview;
      document.getElementById('pd-docnumber-tag').textContent = '(preview — ยังไม่บันทึก)';
      populateVendorSelect(null);
      populateStaffSelects(null, null);
    }
  }catch(e){
    document.getElementById('pd-docnumber').textContent = '(โหลดไม่สำเร็จ: '+e.message+')';
    populateVendorSelect(null);
    populateStaffSelects(null, null);
  }

  // โหลดรายการย่อยที่เคยบันทึกไว้ (ถ้ามี) — ตาม CONSTRUCTION_PLAN Stage 15 BUILD spec
  try{
    const subRows = await GET('procurement_sub_items', 'procurement_item_id=eq.'+procItemId+'&select=*&order=seq');
    CURRENT_SUB_ITEMS = (subRows||[]).map(function(r){
      return {id:r.id, seq:r.seq, description:r.description, unit:r.unit, quantity:Number(r.quantity), unit_price:Number(r.unit_price), amount:Number(r.amount)};
    });
    // snapshot id เดิมไว้ตอนโหลด — ใช้ตอน save (Stage 16) ลบชุดเดิมหลัง insert ชุดใหม่สำเร็จ (ดู saveDetailForm)
    CURRENT_SUB_ITEMS_ORIGINAL_IDS = CURRENT_SUB_ITEMS.map(function(r){ return r.id; }).filter(Boolean);
  }catch(e){
    // scrutinize finding (2026-07-07, MAJOR): ห้าม swallow error เงียบๆ — ถ้า fetch ล้มเหลว (network/RLS/schema)
    // สำหรับ item ที่เคยมีรายการย่อยบันทึกไว้จริง ตารางจะโชว์ "ว่างเปล่า" เหมือนไม่เคยมีอะไร
    // ถ้ากด "บันทึก" ทับตอนนั้น จะเขียนทับข้อมูลเดิมด้วยค่าว่างแบบเงียบๆ (data loss)
    // ต้องเก็บ error ไว้เตือนเด่นชัดใน updateSubItemsFooter() + block saveDetailForm() แทน
    CURRENT_SUB_ITEMS = [];
    CURRENT_SUB_ITEMS_ORIGINAL_IDS = [];
    SUBITEMS_LOAD_ERROR = e.message || 'ไม่ทราบสาเหตุ';
  }
  renderSubItemsTable();
}

function closeDetailForm(){
  document.getElementById('procDetailOverlay').classList.remove('open');
}

// ---------- SECTION B/D-H: populate dropdown + field ตอนเปิดฟอร์ม ----------
function populateVendorSelect(selectedId){
  const sel = document.getElementById('pd-vendor');
  if(!sel) return;
  sel.innerHTML = '<option value="">— ไม่ระบุ —</option>' +
    (VENDORS_LIST||[]).map(function(v){ return '<option value="'+v.id+'">'+escHtml(v.name)+'</option>'; }).join('');
  sel.value = selectedId || '';
}

// เติม dropdown กรรมการ 6 ช่อง (TOR 3 + ตรวจรับ 3) จาก STAFF_LIST (active เท่านั้น — ตาม pattern เดียวกับ
// openTeacherSelector) แล้วเลือกค่าเดิมถ้ามี (edit mode) — torArr/inspArr คือ committee_tor/committee_inspect
// jsonb array จริงจาก DB รูปแบบ [{staff_id,role}, ...] ตามลำดับ index ตรงกับตำแหน่ง fixed role ในฟอร์ม
//
// scrutinize finding (2026-07-07, MAJOR): staff.js ไม่ลบ record จริง แค่ปิดใช้งาน (is_active=false) เพื่อ
// "เก็บประวัติไว้" (staff.js header) แต่ dropdown นี้เดิมกรอง active อย่างเดียว — ถ้าคนที่เคยเป็นกรรมการถูกปิด
// ใช้งานไปแล้ว แล้วมีคนเปิดฟอร์มเก่ากลับมาแก้/บันทึกซ้ำ ช่องนั้นจะไม่มี option ให้เลือกค่าเดิม (เงียบๆ ไม่ error)
// พอกด "บันทึก" จะเขียน staff_id: null ทับ ลบชื่อกรรมการจริงออกจากประวัติถาวร ต้องเติม option ของคนที่เคย
// ถูกอ้างถึงไว้ด้วยแม้จะปิดใช้งานแล้ว เพื่อรักษาค่าเดิมไว้ได้
function populateStaffSelects(torArr, inspArr){
  const activeStaff = (STAFF_LIST||[]).filter(function(s){ return s.is_active !== false; });
  const activeIds = new Set(activeStaff.map(function(s){ return s.id; }));
  const referencedIds = [].concat(torArr||[], inspArr||[]).map(function(c){ return c.staff_id; }).filter(Boolean);
  const inactiveButReferenced = (STAFF_LIST||[]).filter(function(s){ return !activeIds.has(s.id) && referencedIds.indexOf(s.id) >= 0; });

  const opts = '<option value="">— เลือก —</option>' +
    activeStaff.map(function(s){ return '<option value="'+s.id+'">'+escHtml((s.prefix||'')+(s.name||''))+'</option>'; }).join('') +
    inactiveButReferenced.map(function(s){ return '<option value="'+s.id+'">'+escHtml((s.prefix||'')+(s.name||''))+' (ปิดใช้งาน)</option>'; }).join('');
  ['pd-tor-0','pd-tor-1','pd-tor-2','pd-insp-0','pd-insp-1','pd-insp-2'].forEach(function(id){
    const sel = document.getElementById(id);
    if(sel) sel.innerHTML = opts;
  });
  (torArr||[]).forEach(function(c, i){
    const sel = document.getElementById('pd-tor-'+i);
    if(sel) sel.value = c.staff_id || '';
  });
  (inspArr||[]).forEach(function(c, i){
    const sel = document.getElementById('pd-insp-'+i);
    if(sel) sel.value = c.staff_id || '';
  });
}

// เติม/เคลียร์ Section D (วันที่), G (TOR text), H (งบประมาณ/ภาษี) จาก procurement_details row
// (detail=null → เคลียร์ทุกช่องกลับค่าว่าง/default ใช้ตอนเปิดฟอร์ม item ใหม่กัน state ของ item ก่อนหน้าค้าง)
function populateDetailFields(detail){
  PD_DATE_SEQUENCE.concat(PD_DATE_EXTRA).forEach(function(row){
    const el = document.getElementById(row[0]);
    if(el) el.value = (detail && detail[row[1]]) ? detail[row[1]] : '';
  });
  const objEl = document.getElementById('pd-tor-objective');
  const qualEl = document.getElementById('pd-tor-qualification');
  const budgetEl = document.getElementById('pd-budget-source');
  const vatEl = document.getElementById('pd-vat');
  const whtEl = document.getElementById('pd-wht');
  const penaltyEl = document.getElementById('pd-penalty'); // ค่าปรับ (ร้อยละต่อวัน) — เพิ่มตามคำขอ Pam 2026-07-08
  if(objEl)     objEl.value     = (detail && detail.tor_objective) || '';
  if(qualEl)    qualEl.value    = (detail && detail.tor_qualification) || '';
  if(budgetEl)  budgetEl.value  = (detail && detail.budget_source) || '';
  if(vatEl)     vatEl.checked   = !!(detail && detail.vat_applicable);
  if(whtEl)     whtEl.value     = (detail && detail.withholding_tax != null) ? detail.withholding_tax : 0;
  if(penaltyEl) penaltyEl.value = (detail && detail.penalty_rate_percent != null) ? detail.penalty_rate_percent : 0;
  const warnEl = document.getElementById('pd-date-warning');
  if(warnEl){ warnEl.style.display = 'none'; warnEl.textContent = ''; }
  const cmtWarnEl = document.getElementById('pd-committee-warning');
  if(cmtWarnEl){ cmtWarnEl.style.display = 'none'; cmtWarnEl.textContent = ''; }
}

// เช็คลำดับวันที่ตาม BLUEPRINT §2.6 (L312) — เตือนแต่ไม่บล็อกการบันทึก (ผู้ใช้อาจกรอกไม่ครบระหว่างทำงานจริง)
// ข้ามช่องว่าง (ยังไม่กรอก) ไม่เช็ค เทียบเฉพาะคู่ที่กรอกแล้วทั้งคู่
function checkDateSequence(){
  let prev = null;
  for(const [elId, key, label] of PD_DATE_SEQUENCE){
    const v = document.getElementById(elId)?.value;
    if(v){
      if(prev && prev.v > v) return '⚠️ ลำดับวันที่ไม่ถูกต้อง: "'+prev.label+'" ('+prev.v+') ควรอยู่ก่อน "'+label+'" ('+v+')';
      prev = {v, label};
    }
  }
  const due = document.getElementById('pd-date-due')?.value;
  const deliver = document.getElementById('pd-date-deliver')?.value;
  if(due && deliver && deliver > due) return '⚠️ วันที่ส่งมอบจริง ('+deliver+') อยู่หลังวันครบกำหนดส่งมอบ ('+due+')';
  return null;
}

// ตาม BLUEPRINT §5.3/edge-case (L561): "committee_tor มีน้อยกว่า 3 คน → แสดง warning; PDF ยังสร้างได้แต่
// แสดง placeholder" — ตามระเบียบพัสดุจริง วงเงินต่ำ (เฉพาะเจาะจง) กรรมการน้อยกว่า 3 คนได้ (ถึงคนเดียวได้)
// จึงแค่เตือน ไม่บล็อกบันทึก — เช็คเฉพาะกรณี "กรอกบางส่วน" (1-2 คน) เท่านั้น ถ้ายังไม่กรอกเลย (0 คน) ไม่เตือน
// เพราะอาจอยู่ระหว่างทำงาน ยังไม่ถึงขั้นตอนกำหนดกรรมการ
function checkCommitteeWarning(){
  const torCount  = ['pd-tor-0','pd-tor-1','pd-tor-2'].filter(function(id){ return document.getElementById(id)?.value; }).length;
  const inspCount = ['pd-insp-0','pd-insp-1','pd-insp-2'].filter(function(id){ return document.getElementById(id)?.value; }).length;
  const msgs = [];
  if(torCount > 0 && torCount < 3)   msgs.push('คณะกรรมการ TOR มี '+torCount+' คน (ปกติ 3 คน)');
  if(inspCount > 0 && inspCount < 3) msgs.push('คณะกรรมการตรวจรับมี '+inspCount+' คน (ปกติ 3 คน)');
  if(!msgs.length) return null;
  return '⚠️ '+msgs.join(' / ')+' — ตามระเบียบพัสดุ วงเงินต่ำกรรมการน้อยกว่า 3 คนได้ กรุณาตรวจสอบว่าถูกต้องตามวงเงิน/วิธีจัดซื้อก่อนบันทึก';
}

// ---------- ปุ่ม "บันทึก" (Stage 16) ----------
// UPSERT procurement_details (PATCH ถ้ามีอยู่แล้ว / POST + ออก doc_number จริงถ้า create mode)
// แล้ว replace procurement_sub_items ทั้งหมด: insert ชุดใหม่ก่อน สำเร็จแล้วค่อยลบชุดเดิม (ตาม
// CURRENT_SUB_ITEMS_ORIGINAL_IDS) — ไม่ใช่ delete-then-insert กัน data loss ถ้า insert พังกลางทาง
async function saveDetailForm(){
  if(!CURRENT_PROC_ITEM) return;
  if(!canEditCurrentProcItem()){ alert('คุณไม่มีสิทธิ์แก้ไขเอกสารพัสดุนี้'); return; }
  // ต่อเนื่องจาก scrutinize finding MAJOR ของ Stage 15: ถ้าโหลดรายการย่อยเดิมไม่สำเร็จ ห้าม save ทับ
  // เด็ดขาด เพราะ CURRENT_SUB_ITEMS ตอนนี้อาจไม่ตรงกับของจริงใน DB (เสี่ยงเขียนทับ/ลบของจริงทิ้ง)
  if(SUBITEMS_LOAD_ERROR){
    alert('โหลดรายการย่อยเดิมไม่สำเร็จ ('+SUBITEMS_LOAD_ERROR+')\nกรุณาปิดฟอร์มแล้วเปิดใหม่ก่อนบันทึก มิฉะนั้นข้อมูลเดิมอาจถูกเขียนทับ');
    return;
  }

  const dateWarn = checkDateSequence();
  const warnEl = document.getElementById('pd-date-warning');
  if(dateWarn){
    if(warnEl){ warnEl.style.display=''; warnEl.textContent = dateWarn; }
    if(!confirm(dateWarn + '\n\nยืนยันบันทึกต่อหรือไม่?')) return;
  } else if(warnEl){
    warnEl.style.display = 'none'; warnEl.textContent = '';
  }

  // ตอบคำถาม Pam (2026-07-08): กรรมการ TOR/ตรวจรับ เลือก 1-3 คนได้จริงอยู่แล้ว (แต่ละช่องเป็น optional
  // แยกกัน) ตรงนี้แค่เพิ่ม warning ตาม BLUEPRINT L561 ที่วางแผนไว้แต่แรกแต่ยังไม่เคยสร้าง UI จริง
  const committeeWarn = checkCommitteeWarning();
  const cmtWarnEl = document.getElementById('pd-committee-warning');
  if(committeeWarn){
    if(cmtWarnEl){ cmtWarnEl.style.display=''; cmtWarnEl.textContent = committeeWarn; }
    if(!confirm(committeeWarn + '\n\nยืนยันบันทึกต่อหรือไม่?')) return;
  } else if(cmtWarnEl){
    cmtWarnEl.style.display = 'none'; cmtWarnEl.textContent = '';
  }

  const detailBody = {
    procurement_item_id: CURRENT_PROC_ITEM.id,
    vendor_id: document.getElementById('pd-vendor').value || null,
    committee_tor: [
      {staff_id: document.getElementById('pd-tor-0').value || null, role: 'ผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ'},
      {staff_id: document.getElementById('pd-tor-1').value || null, role: 'กรรมการ'},
      {staff_id: document.getElementById('pd-tor-2').value || null, role: 'กรรมการ'}
    ],
    committee_inspect: [
      {staff_id: document.getElementById('pd-insp-0').value || null, role: 'ผู้ตรวจรับพัสดุ'},
      {staff_id: document.getElementById('pd-insp-1').value || null, role: 'กรรมการ'},
      {staff_id: document.getElementById('pd-insp-2').value || null, role: 'กรรมการ'}
    ],
    tor_objective: document.getElementById('pd-tor-objective').value.trim() || null,
    tor_qualification: document.getElementById('pd-tor-qualification').value.trim() || null,
    budget_source: document.getElementById('pd-budget-source').value || null,
    vat_applicable: document.getElementById('pd-vat').checked,
    // scrutinize finding (2026-07-07, MINOR): min="0" ไม่บังคับค่าจริงเพราะไม่มี <form> ครอบ (ปัญหาเดิม
    // เจอแล้วใน sub-items Stage 15) — clamp เองกันภาษีหัก ณ ที่จ่าย/ค่าปรับติดลบหลุดเข้า DB
    withholding_tax: Math.max(0, parseFloat(document.getElementById('pd-wht').value) || 0),
    // ค่าปรับ (ร้อยละต่อวัน) — เพิ่มตามคำขอ Pam 2026-07-08, ไม่เท่ากันแต่ละสัญญา จึงเก็บแยกรายรายการ
    penalty_rate_percent: Math.max(0, parseFloat(document.getElementById('pd-penalty').value) || 0)
  };
  PD_DATE_SEQUENCE.concat(PD_DATE_EXTRA).forEach(function(row){
    detailBody[row[1]] = document.getElementById(row[0]).value || null;
  });

  show('loadingOverlay','flex');
  try{
    if(CURRENT_DETAIL && CURRENT_DETAIL.id){
      await PATCH('procurement_details', 'id=eq.'+CURRENT_DETAIL.id, detailBody);
    } else {
      // create mode — ออกเลขที่เอกสารจริงตอนนี้ (ไม่ใช่ตอนเปิดฟอร์ม) กัน race condition ถ้ามีคนเปิดฟอร์ม
      // ค้างไว้นานแล้วคนอื่นออกเลขไปก่อน — ดึงเลขถัดไปสดๆ ตอน save เท่านั้น
      const next = await getNextDocNumber(CY, CURRENT_PROC_ITEM.type);
      detailBody.doc_number = next.preview;
      const rows = await POST('procurement_details', detailBody);
      CURRENT_DETAIL = (rows && rows[0]) || detailBody;
    }

    const insertPayload = CURRENT_SUB_ITEMS.map(function(r, i){
      return {
        procurement_item_id: CURRENT_PROC_ITEM.id, seq: i+1,
        description: r.description||'', unit: r.unit||'',
        quantity: Number(r.quantity)||0, unit_price: Number(r.unit_price)||0, amount: Number(r.amount)||0
      };
    });
    if(insertPayload.length) await POST('procurement_sub_items', insertPayload);

    // scrutinize finding (2026-07-07, MAJOR): ขั้นตอน DEL นี้แยก try/catch ของตัวเองโดยตั้งใจ — ไม่รวมกับ
    // try ด้านบน เพราะถึงตรงนี้ procurement_details + รายการย่อยชุดใหม่ "บันทึกสำเร็จแล้วจริง" ถ้า DEL ชุดเก่า
    // พังตรงนี้ (เช่น network สะดุด) ไม่ควรบอกผู้ใช้ว่า "บันทึกไม่สำเร็จ" (เข้าใจผิด+เสี่ยงกด "บันทึก" ซ้ำ
    // ทำให้ CURRENT_SUB_ITEMS_ORIGINAL_IDS ที่เป็น snapshot เก่ายิ่ง insert ซ้ำสะสมใน DB โดยไม่มีใครรู้)
    // ต้องแจ้งเฉพาะเจาะจงว่า "บันทึกสำเร็จ แต่ลบชุดเก่าไม่สำเร็จ" แล้ว reload ให้เห็นแถวซ้ำเป็น signal ทันที
    try{
      if(CURRENT_SUB_ITEMS_ORIGINAL_IDS.length) await DEL('procurement_sub_items', 'id=in.('+CURRENT_SUB_ITEMS_ORIGINAL_IDS.join(',')+')');
    }catch(delErr){
      hide('loadingOverlay');
      alert('บันทึกข้อมูลหลักสำเร็จ แต่ลบรายการย่อยชุดเก่าไม่สำเร็จ ('+delErr.message+')\nอาจมีรายการย่อยซ้ำ — กรุณาตรวจสอบและลบแถวที่ซ้ำเองก่อนบันทึกซ้ำ');
      await openDetailForm(CURRENT_PROC_ITEM.id); // reload ให้เห็นสภาพจริงใน DB (รวมแถวซ้ำถ้ามี) แทนที่จะค้าง view เดิม
      return;
    }

    hide('loadingOverlay');
    showToast('บันทึกเอกสารพัสดุสำเร็จ ✓');
    await openDetailForm(CURRENT_PROC_ITEM.id); // reload จาก DB จริง — doc_number ล็อค, sub-items ได้ id ใหม่
  }catch(e){
    hide('loadingOverlay');
    alert('บันทึกไม่สำเร็จ: '+e.message);
  }
}

// ---------- SECTION C: รายการย่อย (Stage 15) ----------
// scrutinize finding (2026-07-07, NIT) + bug-fixer follow-up (Stage 16): เพิ่ม guard เป็น defense-in-depth
// ใช้ canEditCurrentProcItem() (ไม่ใช่ canEditModule() เฉยๆ) ให้ตรงกับเงื่อนไขที่ปล่อยให้เปิดฟอร์มนี้ได้
// ตั้งแต่แรก (ปุ่ม "📄" ใน procurement.js) มิฉะนั้นครูที่แก้ได้แค่โครงการตัวเองจะเปิดฟอร์มได้แต่กด
// "+เพิ่มรายการ"/บันทึกไม่ได้เลย เพราะ guard เข้มกว่าเงื่อนไขที่ยอมให้เข้ามา
function addSubItemRow(){
  if(!canEditCurrentProcItem()){ alert('คุณไม่มีสิทธิ์แก้ไขเอกสารพัสดุนี้'); return; }
  CURRENT_SUB_ITEMS.push({seq: CURRENT_SUB_ITEMS.length+1, description:'', unit:'', quantity:1, unit_price:0, amount:0});
  renderSubItemsTable();
}

function removeSubItemRow(idx){
  if(!canEditCurrentProcItem()){ alert('คุณไม่มีสิทธิ์แก้ไขเอกสารพัสดุนี้'); return; }
  CURRENT_SUB_ITEMS.splice(idx,1);
  CURRENT_SUB_ITEMS.forEach(function(r,i){ r.seq = i+1; });
  renderSubItemsTable();
}

// อัปเดตแค่ field ตัวเลข (quantity/unit_price) แล้ว recalc amount ของแถวนั้น — อัปเดตเฉพาะ cell/footer
// ไม่ rebuild ทั้งตาราง กัน input เสีย focus ระหว่างพิมพ์ (ต่างจาก description/unit ที่ผูก oninput ตรงๆ
// เพราะไม่กระทบยอดรวม ไม่ต้อง re-render อะไรเลย)
// bug-fixer (2026-07-07): ระหว่างพิมพ์ "-5" ตัว input type=number จะรายงาน value="" (ยังไม่ใช่เลขสมบูรณ์)
// ตอนพิมพ์แค่ "-" ตัวเดียว — ถ้า sync inputEl.value=0 ตอนนั้นเลย จะไปทับตัว "-" ที่เพิ่งพิมพ์ ทำให้พิมพ์
// เครื่องหมายลบไม่ได้เลย (bug ที่ Pam เจอ) แก้โดย "ไม่แตะ" input.value ระหว่างพิมพ์เด็ดขาด —
// เก็บค่าดิบ (อาจติดลบชั่วคราว) ไว้ใน state ปกติ แต่คำนวณ amount/ยอดรวมด้วย max(0,...) เสมอ กันยอดติดลบ
// ระหว่างพิมพ์ ส่วนการ clamp ค่าจริงถาวร (เขียนทับ input ที่ผู้ใช้เห็น) ทำตอน blur เท่านั้น (ดู clampSubItemField)
function updateSubItemAmount(idx, field, value){
  if(!canEditCurrentProcItem()){ alert('คุณไม่มีสิทธิ์แก้ไขเอกสารพัสดุนี้'); return; }
  const row = CURRENT_SUB_ITEMS[idx];
  if(!row) return;
  row[field] = parseFloat(value) || 0;
  row.amount = Math.max(0, Number(row.quantity)||0) * Math.max(0, Number(row.unit_price)||0);
  const cell = document.getElementById('pd-sub-amt-'+idx);
  if(cell) cell.textContent = fmt(row.amount);
  updateSubItemsFooter();
}

// clamp ค่าติดลบให้จริงถาวรตอนออกจากช่อง (blur) — HTML min="0" ไม่บังคับค่าจริงเพราะ input ไม่ได้อยู่ใน
// <form> ที่ submit จึงต้องบังคับเองตรงนี้ ตอน blur เท่านั้น (ไม่ใช่ทุก keystroke) เพื่อไม่รบกวนการพิมพ์
function clampSubItemField(idx, field, inputEl){
  const row = CURRENT_SUB_ITEMS[idx];
  if(!row) return;
  if(row[field] < 0){
    row[field] = 0;
    inputEl.value = 0;
    row.amount = Math.max(0, Number(row.quantity)||0) * Math.max(0, Number(row.unit_price)||0);
    const cell = document.getElementById('pd-sub-amt-'+idx);
    if(cell) cell.textContent = fmt(row.amount);
    updateSubItemsFooter();
  }
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
      '<td><input class="fc" style="padding:6px 8px;font-size:13px;text-align:right" type="number" step="any" min="0" value="'+row.quantity+'" oninput="updateSubItemAmount('+idx+',\'quantity\',this.value)" onblur="clampSubItemField('+idx+',\'quantity\',this)"></td>'+
      '<td><input class="fc" style="padding:6px 8px;font-size:13px;text-align:right" type="number" step="any" min="0" value="'+row.unit_price+'" oninput="updateSubItemAmount('+idx+',\'unit_price\',this.value)" onblur="clampSubItemField('+idx+',\'unit_price\',this)"></td>'+
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
