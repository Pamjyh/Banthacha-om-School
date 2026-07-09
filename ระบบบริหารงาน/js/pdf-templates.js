// =====================================================================
// DOCUMENT TEMPLATES (เอกสารพัสดุ 16 ชุด) — banthacha-v2 Stage 17 🔴 HIGH RISK
// สร้างทีละเอกสาร ทดสอบทีละชุดตาม CONSTRUCTION_PLAN ("ห้าม build ข้าม stage" ใช้ตรรกะเดียวกัน
// กับการห้าม skip stage — ห้ามสร้างครบ 16 ชุดทีเดียวโดยไม่ให้ Pam ตรวจก่อน)
//
// generateDoc(docIndex, procItemId) — dispatcher หลัก เรียกจากปุ่มใน Section I
// ตอนนี้มีแค่ Doc 1 (ขอดำเนิน) ที่ implement จริง — Doc 2-16 alert ว่ายังไม่พร้อม
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
  '.sig-center{text-align:center;margin-top:14mm;}';
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
    '<div class="row"><div>ส่วนราชการ&nbsp;&nbsp;'+escHtml(SCHOOL_FULL_NAME)+' '+escHtml(SCHOOL_EDU_OFFICE_ABBR)+'</div></div>'+
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
