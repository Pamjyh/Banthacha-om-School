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

// ชื่อโรงเรียน/เขตพื้นที่ — ใช้ constant กลางแทนพิมพ์ซ้ำในทุก template (16 ชุด) กัน typo/ข้อมูลผิด
// ซ้ำแบบที่เคยพิมพ์ผิดเป็น "สพป.รบ.2" (ราชบุรี) ทั้งที่จริงคือ สพป.อุทัยธานี เขต 2 — Pam แก้ 2026-07-08
const SCHOOL_FULL_NAME = 'โรงเรียนบ้านท่าชะอม';
const SCHOOL_EDU_OFFICE_ABBR = 'สพป.อุทัยธานี เขต 2';

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
// position เป็นช่อง text อิสระ (staff.js) ไม่ใช่ dropdown — ต้องกันไม่ให้ match "รองผู้อำนวยการ"
// (มี "ผู้อำนวยการ" เป็น substring เหมือนกัน) เพราะถ้า match ผิดคนจะไปเซ็นชื่อผิดบนเอกสารราชการจริง
// (scrutinize 2026-07-08 — ยังไม่ trigger จริงตอนนี้เพราะ DB มีแค่ ผอ. ตัวจริงคนเดียว แต่กันไว้ก่อน)
function findDirector(){
  return (STAFF_LIST||[]).find(function(s){
    const pos = (s.position||'').trim();
    return pos.indexOf('ผู้อำนวยการ') >= 0 && pos.indexOf('รอง') !== 0 && s.is_active !== false;
  });
}

// วาดข้อความไทยแบบ auto word-wrap ถ้ายาวเกิน maxWidth (มม.) — body paragraph เดิมเป็น string คงที่
// ที่ pre-split มือครั้งเดียว พอความยาวจริงขึ้นกับข้อมูล (ชื่อโครงการ/จำนวนเงินเป็นตัวหนังสือ ฯลฯ) ที่ไม่รู้
// ล่วงหน้าว่ายาวแค่ไหน มีโอกาสล้นขอบกระดาษ (เจอจริงจาก Pam ทดสอบ 2026-07-08 — บรรทัด "และขออนุมัติ...
// จำนวน...รายการ" วิ่งเลยขอบขวา) ตัดคำที่ space เท่านั้น (ไม่ตัดกลางคำ) คืนค่า y ใหม่หลังวาดบรรทัดสุดท้าย
// firstLineIndent (มม.) — เลื่อน x เฉพาะบรรทัดแรกเท่านั้น (จำลองการเยื้องย่อหน้า) — ใช้แทนการฝัง space
// นำหน้าข้อความตรงๆ เพราะ split(' ') จะกิน leading space หายไปตอน wrap (คำว่างไม่ผ่านเงื่อนไข line ที่ยังไม่เริ่ม)
function thaiTextWrapped(doc, text, x, y, maxWidth, lineHeight, firstLineIndent){
  lineHeight = lineHeight || 8;
  const words = String(text).split(' ').filter(function(w){ return w !== ''; });
  let line = '';
  let firstLine = true;
  for(let i = 0; i < words.length; i++){
    const test = line ? (line + ' ' + words[i]) : words[i];
    const lineX = firstLine ? x + (firstLineIndent||0) : x;
    if(line && doc.getTextWidth(test) > maxWidth - (firstLine ? (firstLineIndent||0) : 0)){
      thaiText(doc, line, lineX, y);
      y += lineHeight;
      line = words[i];
      firstLine = false;
    } else {
      line = test;
    }
  }
  if(line){ thaiText(doc, line, firstLine ? x + (firstLineIndent||0) : x, y); y += lineHeight; }
  return y;
}

// หา staff record ที่ตรงกับ teacherName ของโครงการ เพื่อดึง "ตำแหน่ง" มาใส่เอกสาร (เอกสารจริงมีบรรทัด
// "ด้วยข้าพเจ้า {ชื่อ} ตำแหน่ง {ตำแหน่ง}" — projects.teacher_name เป็น text อิสระไม่ผูก staff.id
// ใช้ normalize+exact-match แบบเดียวกับ canEdit() (auth.js) ไม่ใช่ substring แบบ canViewProject()
// เพราะจะเอาไปพิมพ์บนเอกสารราชการ ผิดคนไม่ได้ — ถ้าหาไม่เจอ (ชื่อไม่ตรงเป๊ะ) ปล่อยว่างดีกว่าเดา
function findStaffByTeacherName(teacherName){
  const norm = function(s){ return (s||'').replace(/\s+/g,''); };
  const target = norm(teacherName);
  if(!target) return null;
  return (STAFF_LIST||[]).find(function(s){ return norm(s.prefix + s.name) === target; }) || null;
}

// ---------- Doc 1: ขอดำเนิน (บันทึกข้อความขออนุมัติดำเนินการจัดซื้อ/จัดจ้าง) ----------
// รูปแบบอ้างอิงจากไฟล์จริง "1 ขอดำเนิน.pdf" ที่ Pam อัปใน Google Drive (Q8-4) ไม่ใช่เดาจาก BLUEPRINT §6.4
async function generateDoc1(procItemId){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item) return alert('ไม่พบรายการพัสดุนี้');

  // ใช้ CURRENT_DETAIL ตรงๆ แทนการ GET ใหม่ — openDetailForm()/saveDetailForm() sync ตัวนี้
  // กับผลลัพธ์ DB ทุกครั้งอยู่แล้ว (procurement-detail.js) การ GET ซ้ำเป็นแค่ network call
  // ที่ไม่จำเป็น (scrutinize 2026-07-08)
  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return; }
  if(!detail.date_request){ alert('กรุณากรอก "วันที่ขอดำเนินการ" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return; }

  const doc = createDocBase('บันทึกข้อความ');
  const director = findDirector();
  const teacherName = (item.projects && item.projects.teacher_name) || '';
  const proposerStaff = findStaffByTeacherName(teacherName);
  const proposerPosition = proposerStaff ? (proposerStaff.position || '-') : '-';
  // ใช้ชื่อ+คำนำหน้าจาก staff record ที่ match ได้ (format ถูกต้องเสมอ เช่น "นางสาวสุทามาศ")
  // แทน teacher_name ดิบ — teacher_name บางที่เก็บเป็น "ครูสุทามาศ..." (คำนำหน้าไม่เป็นทางการ ดู
  // auth.js:151-153, Q5-2) ไม่เหมาะพิมพ์บนเอกสารราชการ — fallback เป็น raw text เฉพาะหา staff ไม่เจอ
  const proposerPrintName = proposerStaff ? (proposerStaff.prefix + proposerStaff.name) : teacherName;
  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  // ตัดคำว่า "โครงการ" ที่ขึ้นต้นชื่อโครงการออกถ้ามี (บางโครงการใน DB พิมพ์ชื่อรวมคำนี้ไว้แล้ว บางโครงการไม่มี)
  // กัน "ตามโครงการโครงการ..." ซ้ำคำเวลาต่อกับ prefix "ตามโครงการ"/"เรื่อง...โครงการ" ที่ template เขียนไว้เอง
  // (เจอจริงจาก Pam ทดสอบ 2026-07-08)
  const projectNameRaw = (item.projects && item.projects.name) || '-';
  const projectName = projectNameRaw.replace(/^โครงการ\s*/, '');
  // จำนวน "รายการ" — ดึงสดจาก DB (ไม่ใช้ CURRENT_SUB_ITEMS.length) เพราะ addSubItemRow()/removeSubItemRow()
  // แก้ array ใน memory ตรงๆ ไม่เขียน DB จนกว่าจะกด "บันทึก" (procurement-detail.js:320-331) — ถ้าใช้
  // ค่า in-memory เอกสารอาจโชว์จำนวนรายการที่ยังไม่ถูกบันทึกจริง ขัดกับที่ปุ่มสัญญาไว้ว่า "ดึงจาก DB เท่านั้น"
  // (scrutinize 2026-07-08)
  let itemCount = 1;
  try{
    const subRows = await GET('procurement_sub_items', 'procurement_item_id=eq.'+procItemId+'&select=id');
    itemCount = (subRows && subRows.length) || 1;
  }catch(e){
    itemCount = (CURRENT_SUB_ITEMS && CURRENT_SUB_ITEMS.length) || 1; // fallback ถ้า network พลาด ดีกว่า block การพิมพ์
  }
  // "เพื่อ..." (วัตถุประสงค์) — ใช้ tor_objective ถ้ากรอกไว้ (เอกสารจริงไม่ได้บังคับผ่าน TOR ก่อนเสมอ
  // สำหรับงานวงเงินต่ำ) ถ้ายังไม่กรอกใช้ชื่อรายการแทนเป็น fallback
  const purpose = detail.tor_objective || item.title || '-';
  // doc_number เก็บเป็น "ซ.51/2569"/"จ.51/2569" — เอกสาร "บันทึกข้อความ" ของจริงโชว์แค่เลขล้วน "51/2569"
  // ไม่มี prefix (prefix โผล่เฉพาะใบสั่งซื้อ/สั่งจ้างจริง Doc 13/14) — ตัด prefix ตัวอักษร+จุดออก
  const bareDocNumber = (detail.doc_number || '').replace(/^[ก-๙]+\./, '');

  // แยก "ส่วนราชการ" กับ "ที่/วันที่" เป็นคนละแถว (เดิม commit 0ed91a3 รวมบรรทัดเดียวตามลำดับ text ที่
  // OCR extract มาจากไฟล์จริง ซึ่งไม่ใช่ตำแหน่ง visual จริง — รวมกันยาว ~60 ตัวอักษรเสี่ยงล้นขอบกระดาษ
  // กว้าง 160mm ที่ font 16pt — ทั้ง 17 ไฟล์อ้างอิงจริงแยกเป็นคนละแถวเสมอ, scrutinize 2026-07-08)
  // เนื้อหากว้างสูงสุด 155mm (เขตเขียนจริง 25-185mm เผื่อ safety margin 5mm) — ทุกบรรทัดที่ยาวขึ้นกับ
  // ข้อมูล (ชื่อโครงการ/จำนวนเงิน ฯลฯ) ต้องผ่าน thaiTextWrapped ไม่ใช่ thaiText ตรงๆ กันล้นขอบ (scrutinize
  // + Pam ทดสอบจริง 2026-07-08 พบ "และขออนุมัติ...จำนวน...รายการ" วิ่งเลยขอบขวา)
  const CONTENT_MAX_WIDTH = 155;
  thaiText(doc, 'ส่วนราชการ  '+SCHOOL_FULL_NAME+' '+SCHOOL_EDU_OFFICE_ABBR, 25, 52);
  thaiText(doc, 'ที่  '+bareDocNumber, 25, 59);
  thaiText(doc, 'วันที่  '+fmtDateThai(detail.date_request), 105, 59);
  let y = thaiTextWrapped(doc, 'เรื่อง  ขออนุมัติดำเนินงานตามโครงการ'+projectName, 25, 66, CONTENT_MAX_WIDTH, 7);
  y += 2;
  doc.line(25, y, 185, y);
  y += 7;
  thaiText(doc, 'เรียน  ผู้อำนวยการ'+SCHOOL_FULL_NAME, 25, y);
  y += 10;

  // ย่อหน้า 1 — ต่อเป็น string เดียวแล้วให้ wrap function จัดบรรทัดเอง (ไม่ pre-split มือแบบเดิมที่แต่ละ
  // ท่อนอาจยาวเกินบรรทัดได้เอง ไม่ขึ้นกับท่อนอื่น) — ตัด "จัด" ซ้ำหน้า buyOrHire ออก (buyOrHire มีคำว่า
  // "จัด" อยู่ในตัวเองแล้ว "จัดซื้อ"/"จัดจ้าง" ต่อกับ "ขออนุมัติจัด" เดิมเลยกลายเป็น "ขออนุมัติจัดจัดซื้อ" ซ้ำคำ
  // — เจอจริงจาก Pam ทดสอบ 2026-07-08)
  const para1 = 'ด้วยข้าพเจ้า '+proposerPrintName+' ตำแหน่ง '+proposerPosition+' '+SCHOOL_FULL_NAME+
    ' ขออนุมัติตามที่ได้รับอนุญาตให้ดำเนินงานตามโครงการ'+projectName+' และขออนุมัติ'+buyOrHire+
    ' จำนวน '+itemCount+' รายการ เป็นเงิน '+fmt(item.amount)+' บาท ('+thaiBahtText(item.amount)+
    ') เพื่อ'+purpose+' ตามรายละเอียดในแบบประมาณการ'+buyOrHire+'ดังแนบ';
  y = thaiTextWrapped(doc, para1, 25, y, CONTENT_MAX_WIDTH, 7, 8);

  y += 10;
  const para2 = 'จึงเรียนมาเพื่อโปรดพิจารณาเห็นชอบและอนุมัติ';
  y = thaiTextWrapped(doc, para2, 25, y, CONTENT_MAX_WIDTH, 7, 8);

  // กันเนื้อหายาวเกินหน้ากระดาษดันบล็อกลายเซ็นหลุดออกนอกหน้าไปเงียบๆ (silent failure) — "วัตถุประสงค์"
  // (tor_objective) เป็น textarea อิสระไม่จำกัดความยาว ถ้ากรอกยาวมาก wrap หลายบรรทัดจน y เกินหน้า A4
  // (297mm) ได้จริง บล็อกลายเซ็นที่เหลือ (ผู้รับผิดชอบ/ผอ./checkbox) กินพื้นที่ ~53mm — เตือนก่อนแทนที่จะ
  // ปล่อยให้ PDF ออกมาขาดส่วนลายเซ็นโดยไม่มีใครรู้ (scrutinize 2026-07-08)
  const SIGNATURE_BLOCK_HEIGHT = 53;
  if(y + SIGNATURE_BLOCK_HEIGHT > 290){
    alert('เนื้อหาในเอกสารยาวเกินไป (มักเกิดจากช่อง "วัตถุประสงค์ TOR" ที่กรอกไว้ยาวมาก) ทำให้บล็อกลายเซ็นล้นออกนอกหน้ากระดาษ กรุณาย่อข้อความในฟอร์มให้สั้นลงแล้วลองพิมพ์ใหม่');
    return;
  }

  y += 13;
  thaiText(doc, 'ผู้รับผิดชอบโครงการ', 25, y);
  thaiText(doc, 'ความเห็นของผู้อำนวยการ'+SCHOOL_FULL_NAME, 115, y);
  doc.line(25, y + 3, 90, y + 3);   // เว้นบรรทัดเซ็นผู้เสนอ (เอกสารจริงไม่มีชื่อพิมพ์กำกับ — ชื่ออยู่ในเนื้อหาแล้ว)
  y += 10;
  thaiText(doc, '( ) เห็นชอบ   ( ) อนุมัติ', 115, y);

  // เส้นเซ็นวาดเสมอ (ไม่ผูกกับ director) — คนจริงยังต้องมีที่เซ็นแม้หา staff record ของ ผอ. ไม่เจอ
  // (เช่น ช่วงเปลี่ยนตัว ผอ. ข้อมูลว่างชั่วคราว) ส่วนชื่อ/ตำแหน่งพิมพ์กำกับค่อยขึ้นกับว่าหาเจอมั้ย (scrutinize 2026-07-08)
  y += 14;
  thaiText(doc, 'ลงชื่อ .......................................', 115, y);
  if(director){
    y += 8;
    thaiText(doc, '(' + (director.prefix||'') + director.name + ')', 150, y, {align:'center'});
    y += 8;
    thaiText(doc, 'ผู้อำนวยการ'+SCHOOL_FULL_NAME, 150, y, {align:'center'});
  }

  // ชื่อไฟล์ยังใช้ doc_number เต็ม (มี prefix ซ./จ.) ตาม BLUEPRINT §6.7 — bareDocNumber ใช้แค่พิมพ์ในเอกสาร
  const fileName = (detail.doc_number||'doc').replace(/[\/\\]/g,'-') + '-' + PD_DOC_NAMES[1] + '.pdf';
  doc.save(fileName);
}
