// =====================================================================
// PDF TEMPLATES (เอกสารพัสดุ 16 ชุด) — banthacha-v2 Stage 17 🔴 HIGH RISK
// สร้างทีละเอกสาร ทดสอบทีละชุดตาม CONSTRUCTION_PLAN ("ห้าม build ข้าม stage" ใช้ตรรกะเดียวกัน
// กับการห้าม skip stage — ห้ามสร้างครบ 16 ชุดทีเดียวโดยไม่ให้ Pam ตรวจก่อน)
//
// generateDoc(docIndex, procItemId) — dispatcher หลัก เรียกจากปุ่มใน Section I
// ตอนนี้มีแค่ Doc 1 (ขอดำเนิน) ที่ implement จริง — Doc 2-16 alert ว่ายังไม่พร้อม
//
// ⚠️ ใช้ thaiText(doc, str, x, y, opts) เท่านั้นสำหรับข้อความไทย (js/pdf-engine.js) ห้ามเรียก
// doc.text() ตรงๆ กับข้อความไทยเด็ดขาด (ดู BLUEPRINT §6.2 — บั๊กสระ/วรรณยุกต์ซ้อนตำแหน่งผิด)
// =====================================================================

const PD_DOC_NAMES = {
  1:'ขอดำเนิน', 2:'แนบขอดำเนิน', 3:'ขออนุมัติTOR', 4:'คำสั่งTOR', 5:'เห็นชอบTOR',
  6:'ขอบเขตงาน', 7:'แนบTOR', 8:'ขอซื้อจ้าง', 9:'แนบท้าย', 10:'พิจารณา',
  11:'คำสั่งตรวจรับ', 12:'ประกาศผู้ชนะ', 13:'สั่งซื้อจ้าง', 14:'แนบซื้อ', 15:'ตรวจรับ', 16:'เบิก'
};

// wrapper ให้ปุ่มใน Section I เรียกง่ายๆ โดยไม่ต้อง interpolate procItemId เข้า onclick string ทุกปุ่ม
// (CURRENT_PROC_ITEM ถูกตั้งไว้แล้วตอน openDetailForm() — ใช้ตัวเดียวกับที่ sub-items table ใช้)
function printDoc(docIndex){
  if(!CURRENT_PROC_ITEM){ alert('ไม่พบรายการที่กำลังเปิดอยู่'); return; }
  generateDoc(docIndex, CURRENT_PROC_ITEM.id);
}

async function generateDoc(docIndex, procItemId){
  if(docIndex !== 1){
    alert('เอกสารชุดนี้ (#'+docIndex+' '+(PD_DOC_NAMES[docIndex]||'')+') ยังไม่พร้อมใช้งาน — กำลังสร้างทีละชุดตามลำดับ');
    return;
  }
  await generateDoc1(procItemId);
}

// หา staff ที่ตำแหน่งเป็นผู้อำนวยการ (ไม่ hardcode ชื่อ — ถ้าเปลี่ยนตัว ผอ. แค่แก้ข้อมูลใน "จัดการข้อมูล")
function findDirector(){
  return (STAFF_LIST||[]).find(function(s){ return (s.position||'').indexOf('ผู้อำนวยการ') >= 0 && s.is_active !== false; });
}

// ---------- Doc 1: ขอดำเนิน (บันทึกข้อความขออนุมัติดำเนินการจัดซื้อ/จัดจ้าง) ----------
async function generateDoc1(procItemId){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item) return alert('ไม่พบรายการพัสดุนี้');

  let detail;
  try{
    const rows = await GET('procurement_details', 'procurement_item_id=eq.'+procItemId+'&select=*');
    if(!rows || !rows.length){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return; }
    detail = rows[0];
  }catch(e){
    alert('โหลดข้อมูลไม่สำเร็จ: '+e.message);
    return;
  }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return; }
  if(!detail.date_request){ alert('กรุณากรอก "วันที่ขอดำเนินการ" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return; }

  const doc = createDocBase('บันทึกข้อความ');
  const director = findDirector();
  const proposerName = (item.projects && item.projects.teacher_name) || '-';
  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';

  thaiText(doc, 'ส่วนราชการ  โรงเรียนบ้านท่าชะอม สพป.รบ.2', 25, 52);
  thaiText(doc, 'ที่  ศธ ........../'+ (CYbe||''), 25, 59);
  thaiText(doc, 'วันที่  '+fmtDateThai(detail.date_request), 140, 59);
  thaiText(doc, 'เรื่อง  ขออนุมัติดำเนินการ'+buyOrHire+' '+(item.title||'-'), 25, 66);
  doc.line(25, 70, 185, 70);
  thaiText(doc, 'เรียน  ผู้อำนวยการโรงเรียนบ้านท่าชะอม', 25, 77);

  let y = 87;
  const projectName = (item.projects && item.projects.name) || '-';
  const budgetSrc = detail.budget_source || '-';
  const bodyLines = [
    '     ด้วย'+projectName+' มีความจำเป็นต้อง'+buyOrHire,
    (item.title||'-')+' จำนวนเงิน '+fmt(item.amount)+' บาท',
    '('+thaiBahtText(item.amount)+') โดยใช้เงิน'+budgetSrc+'เป็นแหล่งงบประมาณ',
    '',
    '     จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติให้ดำเนินการตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้าง',
    'และการบริหารพัสดุภาครัฐ พ.ศ. 2560 ต่อไป'
  ];
  bodyLines.forEach(function(line){ if(line) thaiText(doc, line, 25, y); y += 8; });

  y += 20;
  thaiText(doc, '(ลงชื่อ) .......................................', 115, y, {align:'left'});
  y += 8;
  thaiText(doc, '(' + proposerName + ')', 130, y, {align:'center'});
  y += 8;
  thaiText(doc, 'ผู้เสนอ', 130, y, {align:'center'});

  if(director){
    y += 16;
    thaiText(doc, 'ความเห็นผู้อำนวยการ  [ ] อนุมัติ   [ ] ไม่อนุมัติ เนื่องจาก .......................................', 25, y);
    y += 12;
    thaiText(doc, '(ลงชื่อ) .......................................', 115, y, {align:'left'});
    y += 8;
    thaiText(doc, '(' + (director.prefix||'') + director.name + ')', 130, y, {align:'center'});
    y += 8;
    thaiText(doc, 'ผู้อำนวยการโรงเรียนบ้านท่าชะอม', 130, y, {align:'center'});
  }

  const fileName = (detail.doc_number||'doc').replace(/[\/\\]/g,'-') + '-' + PD_DOC_NAMES[1] + '.pdf';
  doc.save(fileName);
}
