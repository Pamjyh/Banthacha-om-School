// =====================================================================
// DOCUMENT TEMPLATES (เอกสารพัสดุ 16 ชุด) — banthacha-v2 Stage 17 🔴 HIGH RISK
// สร้างทีละเอกสาร ทดสอบทีละชุดตาม CONSTRUCTION_PLAN ("ห้าม build ข้าม stage" ใช้ตรรกะเดียวกัน
// กับการห้าม skip stage — ห้ามสร้างครบ 16 ชุดทีเดียวโดยไม่ให้ Pam ตรวจก่อน)
//
// generateDoc(docIndex, procItemId) — dispatcher หลัก เรียกจากปุ่มใน Section I
// ตอนนี้มี Doc 1 (ขอดำเนิน) + Doc 2 (แนบขอดำเนิน) implement จริง — Doc 3-16 alert ว่ายังไม่พร้อม
//
// ⚠️ PIVOT (2026-07-09): เปลี่ยนจาก jsPDF วาดเอง (js/pdf-engine.js, thaiText/thaiTextWrapped) มาเป็น
// สร้าง HTML แล้วสั่ง browser print (window.print()) แทน — jsPDF เดิมต้องเขียนโค้ด custom จัดตำแหน่ง
// สระ/วรรณยุกต์ไทยเอง (thaiText) และประเมินความกว้างข้อความเอง (doc.getTextWidth ไม่ตรงกับที่วาดจริง)
// ทำให้เจอบั๊กขอบ/wrap ซ้ำ 4 รอบติดต่อกัน (2026-07-08) — HTML+browser print ให้ browser จัดการ Thai text
// shaping/wrap/justify เองทั้งหมด (เหมือนหน้าเว็บปกติ) ไม่มีทางล้นขอบอีกในทางทฤษฎี, margin กำหนดด้วย CSS
// ตรงๆ ไม่ต้องเดา — Doc 2-16 ที่จะสร้างต่อจากนี้ให้ใช้ pattern เดียวกับ generateDoc1 (buildDoc1Html +
// printHtmlDoc) ไม่ใช้ thaiText/jsPDF อีกต่อไป (ดู Q8-6 ใน BLUEPRINT)
// =====================================================================

// ชื่อโรงเรียน/เขตพื้นที่ — ใช้ constant กลางแทนพิมพ์ซ้ำในทุก template (16 ชุด) กัน typo/ข้อมูลผิด
// ซ้ำแบบที่เคยพิมพ์ผิดเป็น "สพป.รบ.2" (ราชบุรี) ทั้งที่จริงคือ อุทัยธานี เขต 2 — Pam แก้ 2026-07-08
// แก้อีกรอบ 2026-07-10: ตอนอ่านไฟล์อ้างอิงจริงของ Doc 2 (แนบขอดำเนิน) พบว่าเอกสารจริงสะกดชื่อเขตแบบ
// เต็ม "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุทัยธานี เขต 2" ไม่ใช่แบบย่อ "สพป." ที่ผมเดา/ใช้มาตลอด
// Doc 1 (ตรวจ "1 ขอดำเนิน.pdf" อ้างอิงตัวเองซ้ำอีกที) — ยืนยันเดียวกัน แก้เป็นชื่อเต็มให้ตรงของจริง
const SCHOOL_FULL_NAME = 'โรงเรียนบ้านท่าชะอม';
const SCHOOL_EDU_OFFICE_FULL = 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุทัยธานี เขต 2';
// กลุ่มงานที่รับผิดชอบงานพัสดุ — โผล่ในหัวเอกสาร Doc 2 (แนบขอดำเนิน) ตามไฟล์อ้างอิงจริง
const SCHOOL_ADMIN_GROUP = 'กลุ่มงานบริหารงานทั่วไป';
// "เจ้าหน้าที่"/"หัวหน้าเจ้าหน้าที่" ใน Doc 3 เป็นตำแหน่งประจำที่กำหนดตายตัว ต่างจาก ผอ./ผู้เสนอโครงการ ที่หาได้จาก position/
// teacher_name — ไม่มีช่องในระบบให้ตั้งค่า 2 ตำแหน่งนี้ได้เอง (Pam ยืนยัน 2026-07-10 ว่าเป็นคนประจำ 2 คน
// ไม่เปลี่ยนตามรายการ) เก็บชื่อไว้ตรงนี้แล้ว lookup จาก STAFF_LIST ตอน print เพื่อให้ prefix/ตำแหน่งที่พิมพ์
// ตรงกับข้อมูลล่าสุดใน "จัดการข้อมูล" เสมอ — ถ้าเปลี่ยนตัวคนในตำแหน่งนี้ ต้องแก้ชื่อ 2 ค่านี้ในโค้ดโดยตรง
const PROCUREMENT_OFFICER_NAME = 'พศุตม์ จรรยหาญ'; // "เจ้าหน้าที่"
const PROCUREMENT_HEAD_NAME = 'สุทามาศ จบศรี'; // "หัวหน้าเจ้าหน้าที่"

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
  if(docIndex === 1) return await generateDoc1(procItemId);
  if(docIndex === 2) return await generateDoc2(procItemId);
  if(docIndex === 3) return await generateDoc3(procItemId);
  alert('เอกสารชุดนี้ (#'+docIndex+' '+(PD_DOC_NAMES[docIndex]||'')+') ยังไม่พร้อมใช้งาน — กำลังสร้างทีละชุดตามลำดับ');
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

// หา staff record จากชื่อล้วน (ไม่มีคำนำหน้า) — ใช้กับตำแหน่งประจำตายตัวที่ hardcode ไว้เป็นชื่อ
// (PROCUREMENT_OFFICER_NAME/PROCUREMENT_HEAD_NAME) ต่างจาก findStaffByTeacherName ที่เทียบ prefix+name
// เพราะ constant พวกนี้เก็บแค่ชื่อ ไม่มีคำนำหน้า (ผู้เขียนโค้ดพิมพ์เอง ไม่ได้มาจาก DB field ที่มี prefix อยู่แล้ว)
function findStaffByName(name){
  const norm = function(s){ return (s||'').replace(/\s+/g,''); };
  const target = norm(name);
  if(!target) return null;
  return (STAFF_LIST||[]).find(function(s){ return norm(s.name) === target; }) || null;
}

// escape ข้อความก่อนแทรกเข้า HTML string ตรงๆ — กัน data จาก DB (ชื่อโครงการ/ชื่อคน ฯลฯ) ที่อาจมีอักขระ
// พิเศษ (<, >, &) ทำให้ HTML พัง หรือแย่กว่านั้นคือ XSS ถ้ามีคนแอบใส่ <script> ไว้ในชื่อโครงการ
// escape quote (", ') ด้วยแม้ Doc 1 ยังไม่มีจุดที่แทรกลง attribute — กัน Doc 2-16 ที่จะสร้างต่อ (อาจมี
// table cell ที่ใช้ attribute เช่น title=) ลืมแล้วเจอ broken markup/injection (scrutinize 2026-07-09)
function escHtml(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// สร้างหน้าเอกสารเป็น HTML แล้วสั่งพิมพ์ผ่าน browser (window.print()) แทนการวาด PDF เอง — ใช้ hidden
// iframe แทนการเปิด window ใหม่ (window.open มักโดน popup blocker แม้เรียกจาก click handler บางเบราว์เซอร์)
// ฝัง TH Sarabun font เป็น base64 (@font-face, จาก js/pdf-font.js ตัวเดียวกับที่ jsPDF เคยใช้) กัน
// พึ่งพา Google Fonts ผ่านเน็ตตอนพิมพ์ (ถ้าเน็ตช้า/ขาดตอนพิมพ์ ฟอนต์จะไม่ครบ) — delay 300ms ก่อนสั่ง print
// เผื่อเวลา browser โหลด/render font ให้เสร็จก่อน (fonts.ready มีปัญหาความเข้ากันได้ใน iframe บางเบราว์เซอร์
// เก่า จึงใช้ setTimeout ธรรมดาแทน ซึ่งพอสำหรับฟอนต์ที่ฝัง base64 ไว้ในหน้าเดียวกันอยู่แล้ว ไม่ต้องโหลดเน็ต)
function printHtmlDoc(html){
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.onload = function(){
    setTimeout(function(){
      try{
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }catch(e){
        alert('เปิดหน้าต่างพิมพ์ไม่สำเร็จ: ' + e.message);
      }
      // ลบ iframe หลังพิมพ์เสร็จ (ให้เวลาผู้ใช้กดพิมพ์/ยกเลิกใน dialog ก่อน)
      setTimeout(function(){ if(iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 1000);
    }, 300);
  };
  document.body.appendChild(iframe);
  const idoc = iframe.contentWindow.document;
  idoc.open();
  idoc.write(html);
  idoc.close();
}

// CSS ร่วมของทุกเอกสารราชการ — margin ซ้าย/ขวา 15mm ตามไฟล์อ้างอิงจริงที่ Pam เทียบ screenshot ไว้
// (เดิม jsPDF ใช้ x=25mm ผิด กว้างเกินไป — ตอนนี้ margin กำหนดด้วย CSS ตรงๆ ไม่ต้องคำนวณ/เดาความกว้างข้อความเอง)
function officialDocCss(){
  return '@font-face{font-family:"TH Sarabun New";src:url(data:font/ttf;base64,'+THSARABUN_REGULAR_B64+') format("truetype");font-weight:normal;}'+
  '@font-face{font-family:"TH Sarabun New";src:url(data:font/ttf;base64,'+THSARABUN_BOLD_B64+') format("truetype");font-weight:bold;}'+
  '@page{size:A4;margin:0;}'+
  '*{box-sizing:border-box;}'+
  'body{margin:0;padding:18mm 15mm 15mm 15mm;font-family:"TH Sarabun New",sans-serif;font-size:16pt;line-height:1.6;color:#000;}'+
  // ⚠️ ต้องกำหนดทั้ง width และ height — ไฟล์ครุฑจริงมี native ratio 163:177 (~0.92) ไม่ตรงกับ 18:22 (~0.82)
  // ที่ jsPDF เดิมเคยใช้ ถ้ากำหนดแค่ height ตัวเดียว browser จะ auto-scale width ตาม native ratio แทน
  // ทำให้ครุฑกว้างขึ้น ~13% จากที่ Pam เคยเห็น (scrutinize 2026-07-09) — ล็อกทั้งคู่ให้ตรงสัดส่วนเดิม
  '.garuda{display:block;margin:0 auto 4mm auto;width:18mm;height:22mm;}'+
  '.doc-title{text-align:center;font-weight:bold;font-size:20pt;margin-bottom:6mm;}'+
  '.row{display:flex;}'+
  '.row .col-r{width:65mm;}'+
  'hr.sep{border:none;border-top:1px solid #000;margin:3mm 0 5mm 0;}'+
  'p.body-para{text-indent:8mm;margin:0 0 4mm 0;text-align:justify;}'+
  '.sig-block{display:flex;justify-content:space-between;margin-top:12mm;}'+
  '.sig-col{width:47%;}'+
  '.sig-line{border-bottom:1px solid #000;width:65mm;margin-top:6mm;}'+
  '.sig-center{text-align:center;margin-top:14mm;}'+
  // ตาราง "แบบประมาณการ" (Doc 2 เป็นต้นไป) — เอกสารราชการไทยใช้ตารางเส้นขอบเต็มเป็นมาตรฐาน
  '.doc-title2{text-align:center;font-weight:bold;margin-bottom:6mm;}'+
  'table.sub-table{width:100%;border-collapse:collapse;margin-top:4mm;}'+
  'table.sub-table th,table.sub-table td{border:1px solid #000;padding:1.5mm 2.5mm;}'+
  'table.sub-table th{text-align:center;font-weight:bold;}'+
  'table.sub-table td.tc{text-align:center;}'+
  'table.sub-table td.tr{text-align:right;}'+
  'table.sub-table td.total-label{text-align:right;font-weight:bold;}'+
  // แถวลายเซ็น 3 คน (Doc 3 เป็นต้นไป) — เจ้าหน้าที่/หัวหน้าเจ้าหน้าที่ วางคู่กันแถวบน ผอ. อยู่กึ่งกลางแถวล่าง
  // (ตามลำดับการอนุมัติจริง: เจ้าหน้าที่เสนอ → หัวหน้าเจ้าหน้าที่เห็นชอบ → ผอ.อนุมัติ)
  '.sig-row3{display:flex;justify-content:space-around;margin-top:14mm;text-align:center;}'+
  '.sig-col3{width:42%;}';
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

  const director = findDirector();
  const teacherName = (item.projects && item.projects.teacher_name) || '';
  const proposerStaff = findStaffByTeacherName(teacherName);
  const proposerPosition = proposerStaff ? (proposerStaff.position || '-') : '-';
  // ใช้ชื่อ+คำนำหน้าจาก staff record ที่ match ได้ (format ถูกต้องเสมอ เช่น "นางสาวสุทามาศ")
  // แทน teacher_name ดิบ — teacher_name บางที่เก็บเป็น "ครูสุทามาศ..." (คำนำหน้าไม่เป็นทางการ ดู
  // auth.js:151-153, Q5-2) ไม่เหมาะพิมพ์บนเอกสารราชการ — fallback เป็น raw text ถ้าหาไม่เจอ
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

  const sigRight = director
    ? 'ลงชื่อ .......................................<br>('+escHtml((director.prefix||'')+director.name)+')<br>ผู้อำนวยการ'+escHtml(SCHOOL_FULL_NAME)
    : 'ลงชื่อ .......................................';

  const html = '<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">'+
    '<title>'+escHtml((detail.doc_number||'doc').replace(/[\/\\]/g,'-')+'-'+PD_DOC_NAMES[1])+'</title>'+
    '<style>'+officialDocCss()+'</style></head><body>'+
    '<img class="garuda" src="data:image/jpeg;base64,'+GARUDA_B64+'">'+
    '<div class="doc-title">บันทึกข้อความ</div>'+
    '<div class="row"><div>ส่วนราชการ&nbsp;&nbsp;'+escHtml(SCHOOL_FULL_NAME)+' '+escHtml(SCHOOL_EDU_OFFICE_FULL)+'</div></div>'+
    '<div class="row"><div style="flex:1">ที่&nbsp;&nbsp;'+escHtml(bareDocNumber)+'</div><div class="col-r">วันที่&nbsp;&nbsp;'+escHtml(fmtDateThai(detail.date_request))+'</div></div>'+
    '<div class="row"><div>เรื่อง&nbsp;&nbsp;ขออนุมัติดำเนินงานตามโครงการ'+escHtml(projectName)+'</div></div>'+
    '<hr class="sep">'+
    '<div>เรียน&nbsp;&nbsp;ผู้อำนวยการ'+escHtml(SCHOOL_FULL_NAME)+'</div>'+
    '<p class="body-para">ด้วยข้าพเจ้า '+escHtml(proposerPrintName)+' ตำแหน่ง '+escHtml(proposerPosition)+' '+escHtml(SCHOOL_FULL_NAME)+
      ' ขออนุมัติตามที่ได้รับอนุญาตให้ดำเนินงานตามโครงการ'+escHtml(projectName)+' และขออนุมัติ'+buyOrHire+
      ' จำนวน '+itemCount+' รายการ เป็นเงิน '+fmt(item.amount)+' บาท ('+thaiBahtText(item.amount)+
      ') เพื่อ'+escHtml(purpose)+' ตามรายละเอียดในแบบประมาณการ'+buyOrHire+'ดังแนบ</p>'+
    '<p class="body-para">จึงเรียนมาเพื่อโปรดพิจารณาเห็นชอบและอนุมัติ</p>'+
    '<div class="sig-block">'+
      '<div class="sig-col">ผู้รับผิดชอบโครงการ<div class="sig-line"></div></div>'+
      '<div class="sig-col">ความเห็นของผู้อำนวยการ<div style="margin-top:10mm">( ) เห็นชอบ&nbsp;&nbsp;&nbsp;( ) อนุมัติ</div>'+
        '<div class="sig-center">'+sigRight+'</div></div>'+
    '</div>'+
    '</body></html>';

  printHtmlDoc(html);
}

// ---------- Doc 2: แนบขอดำเนิน (แบบประมาณการจัดซื้อ/จัดจ้าง แนบท้าย Doc 1) ----------
// รูปแบบอ้างอิงจากไฟล์จริง "2 แนบขอดำเนิน.pdf" ที่ Pam อัปใน Google Drive (Q8-4) — ตารางรายการย่อย
// (ลำดับที่/รายละเอียด/จำนวน/หน่วย/ราคาต่อหน่วย/จำนวนเงิน) + รวมเงินท้ายตาราง + ลงชื่อผู้รับผิดชอบโครงการ
// คนเดียว (ไม่มีบล็อกความเห็น ผอ. เหมือน Doc 1 — ของจริงมีแค่ลายเซ็นผู้เสนอ)
async function generateDoc2(procItemId){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item) return alert('ไม่พบรายการพัสดุนี้');

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return; }

  const teacherName = (item.projects && item.projects.teacher_name) || '';
  const proposerStaff = findStaffByTeacherName(teacherName);
  const proposerPrintName = proposerStaff ? (proposerStaff.prefix + proposerStaff.name) : teacherName;
  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง'; // หัวตาราง "...ที่จะซื้อ/จะจ้าง" ตามไฟล์จริง
  const projectNameRaw = (item.projects && item.projects.name) || '-';
  const projectName = projectNameRaw.replace(/^โครงการ\s*/, '');
  const purpose = detail.tor_objective || item.title || '-';

  // ดึงรายการย่อยสดจาก DB เสมอ (เหตุผลเดียวกับ itemCount ใน Doc 1 — ไม่เชื่อ CURRENT_SUB_ITEMS ที่อาจ
  // ยังไม่บันทึก) ต่างจาก Doc 1 ตรงที่ Doc 2 ต้องใช้ "ทั้งแถว" ไม่ใช่แค่นับจำนวน
  let subItems = [];
  try{
    subItems = await GET('procurement_sub_items', 'procurement_item_id=eq.'+procItemId+'&select=*&order=seq');
  }catch(e){
    subItems = (CURRENT_SUB_ITEMS || []);
  }
  if(!subItems || !subItems.length){
    alert('ยังไม่มีรายการย่อย กรุณาเพิ่มรายการในฟอร์ม "กรอกเอกสารพัสดุ" แล้วบันทึกก่อนพิมพ์เอกสารนี้');
    return;
  }

  // รวมเงินจากแถวจริงในตารางนี้ (ไม่ใช้ item.amount) — ตารางต้องรวมยอดของตัวเองให้ตรงกับแถวที่แสดง แม้ปกติ
  // ควรเท่ากับ item.amount อยู่แล้ว (คำนวณจาก sub-items เดียวกันตอนบันทึก) แต่ถ้าไม่ตรงกันด้วยเหตุผลใดก็ตาม
  // ตารางต้องซื่อสัตย์กับแถวที่ตัวเองแสดง ไม่ใช่โชว์ยอดจากที่อื่นที่ผู้ดูตารางตรวจสอบไม่ได้
  const totalAmount = subItems.reduce(function(sum, r){ return sum + (Number(r.amount) || 0); }, 0);

  const rows = subItems.map(function(r, i){
    return '<tr><td class="tc">'+(i + 1)+'</td><td>'+escHtml(r.description)+'</td>'+
      '<td class="tc">'+(Number(r.quantity) || 0)+'</td><td class="tc">'+escHtml(r.unit)+'</td>'+
      '<td class="tr">'+fmt(r.unit_price)+'</td><td class="tr">'+fmt(r.amount)+'</td></tr>';
  }).join('');

  const html = '<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">'+
    '<title>'+escHtml((detail.doc_number||'doc').replace(/[\/\\]/g,'-')+'-'+PD_DOC_NAMES[2])+'</title>'+
    '<style>'+officialDocCss()+'</style></head><body>'+
    '<img class="garuda" src="data:image/jpeg;base64,'+GARUDA_B64+'">'+
    '<div class="doc-title2">แบบประมาณการ'+buyOrHire+' แนบท้ายแบบขออนุมัติ'+buyOrHire+'<br>'+
      'การ'+buyOrHire+escHtml(purpose)+' ในโครงการ'+escHtml(projectName)+'<br>'+
      escHtml(SCHOOL_ADMIN_GROUP)+' '+escHtml(SCHOOL_FULL_NAME)+' '+escHtml(SCHOOL_EDU_OFFICE_FULL)+'</div>'+
    '<table class="sub-table"><thead><tr>'+
      '<th>ลำดับที่</th><th>รายละเอียดของพัสดุที่จะ'+buyOrHireShort+'</th><th>จำนวน</th><th>หน่วย</th>'+
      '<th>ราคาต่อหน่วย</th><th>จำนวนเงิน</th>'+
    '</tr></thead><tbody>'+
      rows +
      '<tr><td colspan="5" class="total-label">จำนวนเงินทั้งสิ้น</td><td class="tr">'+fmt(totalAmount)+'</td></tr>'+
    '</tbody></table>'+
    '<div class="sig-center" style="margin-top:20mm">ลงชื่อ .......................................<br>'+
      '('+escHtml(proposerPrintName)+')<br>ผู้รับผิดชอบโครงการ</div>'+
    '</body></html>';

  printHtmlDoc(html);
}

// ---------- Doc 3: ขออนุมัติแต่งตั้งผู้กำหนด TOR ----------
// รูปแบบอ้างอิงจากไฟล์จริง "3 ขออนุมัติ.pdf" ที่ Pam อัปใน Google Drive (Q8-4) — คนเซ็น 3 คน: เจ้าหน้าที่/
// หัวหน้าเจ้าหน้าที่ (ตำแหน่งประจำตายตัว ยืนยันจาก Pam 2026-07-10 — ไม่ใช่ผู้เสนอโครงการ/ผอ.) + ผอ. อนุมัติ
// รายชื่อ "ผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ" = คณะกรรมการ TOR ที่กรอกในฟอร์ม (detail.committee_tor,
// ยืนยันจาก Pam 2026-07-10) — role ต่อคนติดมากับ DB อยู่แล้ว (index 0 = "ผู้กำหนดรายละเอียดฯ", อื่นๆ = "กรรมการ")
// ⚠️ ภาษีมูลค่าเพิ่ม: ไฟล์อ้างอิงตัวอย่างไม่ติ๊ก VAT (โชว์ "-") เลยไม่เห็นรูปแบบตอนมี VAT จริง — สมมติฐานคือ
// บวกเพิ่ม 7% จากยอดรวม (ราคากลางไม่รวม VAT) ถ้าไม่ตรงของจริง Pam ต้องแก้ให้บอกด้วย
async function generateDoc3(procItemId){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item) return alert('ไม่พบรายการพัสดุนี้');

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return; }
  if(!detail.date_approve_tor){ alert('กรุณากรอก "วันที่ขออนุมัติแต่งตั้งกรรมการ TOR" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return; }

  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
  const projectNameRaw = (item.projects && item.projects.name) || '-';
  const projectName = projectNameRaw.replace(/^โครงการ\s*/, '');
  const purpose = detail.tor_objective || item.title || '-';
  const bareDocNumber = (detail.doc_number || '').replace(/^[ก-๙]+\./, '');

  let subItems = [];
  try{
    subItems = await GET('procurement_sub_items', 'procurement_item_id=eq.'+procItemId+'&select=*&order=seq');
  }catch(e){
    subItems = (CURRENT_SUB_ITEMS || []);
  }
  if(!subItems || !subItems.length){
    alert('ยังไม่มีรายการย่อย กรุณาเพิ่มรายการในฟอร์ม "กรอกเอกสารพัสดุ" แล้วบันทึกก่อนพิมพ์เอกสารนี้');
    return;
  }
  const totalAmount = subItems.reduce(function(sum, r){ return sum + (Number(r.amount) || 0); }, 0);
  const itemCount = subItems.length;
  const vatText = detail.vat_applicable ? fmt(totalAmount * 0.07) : '-';

  // เจ้าหน้าที่/หัวหน้าเจ้าหน้าที่ — lookup จากชื่อ hardcode (ดู PROCUREMENT_OFFICER_NAME/HEAD_NAME ด้านบน)
  // fallback เป็นชื่อดิบถ้าหา staff record ไม่เจอ (เช่น พิมพ์ชื่อผิด/ยังไม่มีใน "จัดการข้อมูล")
  const officer = findStaffByName(PROCUREMENT_OFFICER_NAME);
  const officerPrintName = officer ? (officer.prefix + officer.name) : PROCUREMENT_OFFICER_NAME;
  const head = findStaffByName(PROCUREMENT_HEAD_NAME);
  const headPrintName = head ? (head.prefix + head.name) : PROCUREMENT_HEAD_NAME;
  const director = findDirector();

  // คณะกรรมการ TOR — เอาเฉพาะที่กรอกจริง (staff_id ไม่ว่าง) role ต่อคนติดมากับ DB อยู่แล้ว ไม่ต้องเดา
  const torCommittee = (detail.committee_tor || [])
    .filter(function(c){ return c && c.staff_id; })
    .map(function(c){
      const s = (STAFF_LIST||[]).find(function(x){ return String(x.id) === String(c.staff_id); });
      return {
        name: s ? (s.prefix + s.name) : '-',
        position: s ? (s.position || '-') : '-',
        role: c.role || 'กรรมการ'
      };
    });
  if(!torCommittee.length){
    alert('กรุณาระบุ "คณะกรรมการกำหนด TOR" อย่างน้อย 1 คนในฟอร์มก่อนพิมพ์เอกสารนี้');
    return;
  }

  const torRows = torCommittee.map(function(c, i){
    return '<div>'+(i + 1)+'. '+escHtml(c.name)+' ตำแหน่ง '+escHtml(c.position)+' '+escHtml(c.role)+'</div>';
  }).join('');

  const rows = subItems.map(function(r, i){
    return '<tr><td class="tc">'+(i + 1)+'</td><td>'+escHtml(r.description)+'</td>'+
      '<td class="tc">'+(Number(r.quantity) || 0)+'</td><td class="tc">'+escHtml(r.unit)+'</td>'+
      '<td class="tr">'+fmt(r.unit_price)+'</td><td class="tr">'+fmt(r.amount)+'</td></tr>';
  }).join('');

  const html = '<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">'+
    '<title>'+escHtml((detail.doc_number||'doc').replace(/[\/\\]/g,'-')+'-'+PD_DOC_NAMES[3])+'</title>'+
    '<style>'+officialDocCss()+'</style></head><body>'+
    '<img class="garuda" src="data:image/jpeg;base64,'+GARUDA_B64+'">'+
    '<div class="doc-title">บันทึกข้อความ</div>'+
    '<div class="row"><div>ส่วนราชการ&nbsp;&nbsp;'+escHtml(SCHOOL_FULL_NAME)+' '+escHtml(SCHOOL_EDU_OFFICE_FULL)+'</div></div>'+
    '<div class="row"><div style="flex:1">ที่&nbsp;&nbsp;'+escHtml(bareDocNumber)+'</div><div class="col-r">วันที่&nbsp;&nbsp;'+escHtml(fmtDateThai(detail.date_approve_tor))+'</div></div>'+
    '<div class="row"><div>เรื่อง&nbsp;&nbsp;ขออนุมัติแต่งตั้งผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ</div></div>'+
    '<hr class="sep">'+
    '<div>เรียน&nbsp;&nbsp;ผู้อำนวยการ'+escHtml(SCHOOL_FULL_NAME)+'</div>'+
    '<p class="body-para">ตามที่'+escHtml(SCHOOL_ADMIN_GROUP)+' '+escHtml(SCHOOL_FULL_NAME)+' มีความประสงค์จะขอทำการ'+buyOrHire+escHtml(item.title||'')+
      ' เพื่อ'+escHtml(purpose)+' ในโครงการ'+escHtml(projectName)+' จำนวน '+itemCount+' รายการ มีรายการต่อไปนี้</p>'+
    '<table class="sub-table"><thead><tr>'+
      '<th>ลำดับที่</th><th>รายละเอียดของพัสดุที่จะ'+buyOrHireShort+'</th><th>จำนวน</th><th>หน่วย</th>'+
      '<th>ราคาต่อหน่วย</th><th>จำนวนเงิน</th>'+
    '</tr></thead><tbody>'+
      rows +
      '<tr><td colspan="5" class="total-label">จำนวนเงินทั้งสิ้น</td><td class="tr">'+fmt(totalAmount)+'</td></tr>'+
    '</tbody></table>'+
    '<p class="body-para" style="text-indent:0;margin-top:3mm">รวมเป็นเงิน '+fmt(totalAmount)+' บาท '+
      'ภาษีมูลค่าเพิ่ม '+vatText+' บาท จำนวนเงินตัวอักษร ('+thaiBahtText(totalAmount)+')</p>'+
    '<p class="body-para" style="text-indent:0">โดยใช้งบประมาณจาก'+escHtml(detail.budget_source||'-')+' โครงการ'+escHtml(projectName)+'</p>'+
    '<p class="body-para" style="text-indent:0">มอบหมายให้บุคคลดังต่อไปนี้เป็นผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ (TOR หรือ Spec)</p>'+
    torRows +
    '<p class="body-para" style="text-indent:0;margin-top:4mm">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติและมอบงานพัสดุเป็นผู้ดำเนินการจัด'+buyOrHireShort+'ต่อไป</p>'+
    '<div class="sig-row3">'+
      '<div class="sig-col3">เจ้าหน้าที่<div class="sig-line" style="margin:6mm auto"></div>('+escHtml(officerPrintName)+')</div>'+
      '<div class="sig-col3">หัวหน้าเจ้าหน้าที่<div class="sig-line" style="margin:6mm auto"></div>('+escHtml(headPrintName)+')<br>'+
        '( ) เห็นชอบ&nbsp;&nbsp;&nbsp;( ) อนุมัติ</div>'+
    '</div>'+
    '<div class="sig-center">ลงชื่อ .......................................<br>'+
      (director ? '('+escHtml((director.prefix||'')+director.name)+')<br>ผู้อำนวยการ'+escHtml(SCHOOL_FULL_NAME) : '') +
    '</div>'+
    '</body></html>';

  printHtmlDoc(html);
}
