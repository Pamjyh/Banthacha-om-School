// =====================================================================
// DOCUMENT TEMPLATES (เอกสารพัสดุ 16 ชุด) — banthacha-v2 Stage 17 🔴 HIGH RISK
// สร้างทีละเอกสาร ทดสอบทีละชุดตาม CONSTRUCTION_PLAN ("ห้าม build ข้าม stage")
//
// ⚠️ PIVOT ครั้งที่ 2 (2026-07-11): เปลี่ยนจาก HTML+browser print (js/pdf-templates.js เดิม) มาเป็น
// สร้างไฟล์ .docx จริงด้วย docx library (https://docx.js.org, โหลดผ่าน CDN เป็น window.docx)
// เหตุผล: HTML+print (pivot ครั้งแรก 2026-07-09) ยังคงต้องเดา CSS line-height/margin เพื่อกะให้พอดี
// 1 หน้ากระดาษเอง (ไม่มี browser จริงในสภาพแวดล้อมนี้ให้วัดผล) แก้ไปแล้ว 3 รอบ (2026-07-09/10/11)
// ยังเพี้ยนอยู่ — Pam ขอเปลี่ยนเป็น .docx ที่เปิด/พิมพ์ได้ใน Word แบบเดิม (เหมือนก่อนจะมีระบบนี้)
// docx library ให้ Word เองเป็นคนจัดหน้า/ตัดหน้าให้ (native pagination) ตัดปัญหาการเดา CSS ทิ้งทั้งหมด
// — ไม่ต้อง embed font เป็น base64 แบบเดิม (js/pdf-font.js) เพราะ .docx อ้างอิงชื่อฟอนต์เฉยๆ ให้ Word
// (บนเครื่องราชการไทย) หาเอง — เก็บ js/pdf-engine.js ไว้แค่ตัวเดียวเพื่อใช้ GARUDA_B64 (รูปครุฑ)
//
// downloadDoc(docIndex) — ปุ่มใน Section I เรียกทีละชุด, ดาวน์โหลด .docx 1 ไฟล์ต่อ 1 เอกสาร
// downloadAllDocs() — ปุ่ม "ดาวน์โหลดรวมทั้งชุด" รวมทุกเอกสารที่พร้อมใช้งาน (1-4) เป็นไฟล์เดียว
//   (page break คั่นแต่ละเอกสาร) — ถ้าเอกสารใดยังขาดข้อมูล (ยังไม่กรอกวันที่/กรรมการ ฯลฯ) จะ alert
//   และหยุดทั้งชุดทันที (ไม่สร้างชุดที่ขาดเอกสารทางการบางใบ)
// =====================================================================

const SCHOOL_FULL_NAME = 'โรงเรียนบ้านท่าชะอม';
const SCHOOL_EDU_OFFICE_FULL = 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุทัยธานี เขต 2';
const SCHOOL_ADMIN_GROUP = 'กลุ่มงานบริหารงานทั่วไป';
const PROCUREMENT_OFFICER_NAME = 'พศุตม์ จรรยหาญ'; // "เจ้าหน้าที่"
const PROCUREMENT_HEAD_NAME = 'สุทามาศ จบศรี'; // "หัวหน้าเจ้าหน้าที่"

const TOR_ORDER_LEGAL_BASIS = 'อาศัยอำนาจตามคำสั่งสำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน ที่ 2493/2566 สั่ง ณ วันที่ 15 พฤศจิกายน พ.ศ. 2566 ' +
  'และคำสั่งสำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน ที่ 215/2567 สั่ง ณ วันที่ 26 มกราคม พ.ศ. 2567 ที่แก้ไขเพิ่มเติม ' +
  'จึงแต่งตั้งคณะกรรมการกำหนดรายละเอียดคุณลักษณะเฉพาะและกำหนดราคากลางพัสดุ ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ข้อ 21';

const PD_DOC_NAMES = {
  1:'ขอดำเนิน', 2:'แนบขอดำเนิน', 3:'ขออนุมัติTOR', 4:'คำสั่งTOR', 5:'เห็นชอบTOR',
  6:'ขอบเขตงาน', 7:'แนบTOR', 8:'ขอซื้อจ้าง', 9:'แนบท้าย', 10:'พิจารณา',
  11:'คำสั่งตรวจรับ', 12:'ประกาศผู้ชนะ', 13:'สั่งซื้อจ้าง', 14:'แนบซื้อ', 15:'ตรวจรับ', 16:'เบิก'
};

// ===================== docx library shortcuts + helper builders =====================
// window.docx โหลดจาก CDN ใน index.html — ดึงคลาสที่ใช้บ่อยมาเป็นตัวแปรสั้นๆ
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, WidthType, BorderStyle, VerticalAlign } = docx;

const DOCX_FONT = 'TH Sarabun New';
function mm(n){ return Math.round(n * 56.6929); } // mm -> twips (หน่วยระยะใน docx)
function pxFromMm(n){ return Math.round(n * 3.7795); } // mm -> px @96dpi (สำหรับขนาดรูปภาพ)
function hp(pt){ return pt * 2; } // font size point -> half-point (หน่วยขนาดฟอนต์ใน docx)

const NONE_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NONE_BORDER, bottom: NONE_BORDER, left: NONE_BORDER, right: NONE_BORDER, insideHorizontal: NONE_BORDER, insideVertical: NONE_BORDER };
const LINE_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const TABLE_BORDERS = { top: LINE_BORDER, bottom: LINE_BORDER, left: LINE_BORDER, right: LINE_BORDER, insideHorizontal: LINE_BORDER, insideVertical: LINE_BORDER };

function base64ToUint8Array(b64){
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// TextRun เดียว (หรือหลายบรรทัดต่อกันด้วย break — ดู multiLineRuns) — ขนาด/ฟอนต์มาตรฐานเอกสารราชการ
function tr(text, opts){
  opts = opts || {};
  const o = { text: String(text == null ? '' : text), font: DOCX_FONT, size: hp(opts.size || 16) };
  if(opts.bold) o.bold = true;
  if(opts.brk) o.break = opts.brk;
  return new TextRun(o);
}

// รวมหลายบรรทัดเป็น TextRun ชุดเดียวในย่อหน้าเดียวกัน (เทียบเท่า "line1<br>line2<br>line3" เดิม)
function multiLineRuns(lines, opts){
  return lines.map(function(line, i){ return tr(line, Object.assign({}, opts, { brk: i > 0 ? 1 : 0 })); });
}

// ย่อหน้าทั่วไป — runsOrText เป็น string เดียว หรือ array ของ TextRun ก็ได้ (เผื่อกรณีหลายบรรทัด/ตัวหนาผสม)
function para(runsOrText, opts){
  opts = opts || {};
  const children = Array.isArray(runsOrText) ? runsOrText : [ tr(runsOrText, { size: opts.size, bold: opts.bold }) ];
  const p = {
    children: children,
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: mm(opts.before || 0), after: mm(opts.after == null ? 1.5 : opts.after) }
  };
  if(opts.indent) p.indent = { firstLine: mm(8) };
  if(opts.pageBreakBefore) p.pageBreakBefore = true;
  return new Paragraph(p);
}

// ย่อหน้าเนื้อหาบันทึกข้อความปกติ — ย่อหน้าแรก 8mm + justify (เทียบเท่า p.body-para เดิมใน HTML)
// ⚠️ align: LEFT ไม่ใช่ JUSTIFIED (2026-07-11, Pam เจอตัวหนังสือห่างมากใน Word จริง) — ภาษาไทยไม่มี
// ช่องว่างระหว่างคำตามธรรมชาติ (เว้นวรรคใช้แบ่งวลี/ประโยคเท่านั้น) ย่อหน้าพวกนี้มีแค่ไม่กี่ช่องว่างที่ผมแทรกเอง
// ระหว่างต่อ field (ชื่อ/ตำแหน่ง/ชื่อโรงเรียน) พอสั่ง justify Word จะยืดช่องว่างไม่กี่จุดนั้นให้เต็มบรรทัด
// กลายเป็นช่องว่างใหญ่ผิดปกติ (เอกสารราชการไทยจริงใช้ชิดซ้าย+ย่อหน้าแรกเยื้อง ไม่ justify ด้วยเหตุผลเดียวกันนี้)
function bodyPara(text, opts){
  opts = opts || {};
  return para(text, Object.assign({ align: AlignmentType.LEFT, indent: !opts.noIndent, after: 1.5 }, opts));
}

// เส้นคั่นบางๆ ใต้หัวเอกสาร (เทียบเท่า hr.sep เดิม)
function hrPara(){
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
    spacing: { before: mm(1), after: mm(2) },
    children: []
  });
}

// รูปครุฑกึ่งกลางบนสุดของทุกเอกสาร — pageBreakBefore ใช้ตอนรวมหลายเอกสารเป็นไฟล์เดียว (downloadAllDocs)
// เพื่อบังคับให้เอกสารถัดไปเริ่มหน้าใหม่เสมอ (เอกสารแรกไม่ต้องตั้งค่านี้)
function garudaPara(opts){
  opts = opts || {};
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: !!opts.pageBreakBefore,
    spacing: { after: mm(3) },
    children: [ new ImageRun({ type: 'jpg', data: base64ToUint8Array(GARUDA_B64), transformation: { width: pxFromMm(18), height: pxFromMm(22) } }) ]
  });
}

// แถว 2 คอลัมน์ไม่มีเส้นขอบ (เทียบเท่า .row สำหรับ "ที่.../วันที่..." ที่ต้องอยู่บรรทัดเดียวกัน)
function twoColRow(leftText, rightText){
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [ para(leftText, { after: 0 }) ] }),
      new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [ para(rightText, { after: 0 }) ] })
    ] }) ]
  });
}

// ตาราง "แบบประมาณการ" (ลำดับที่/รายละเอียด/จำนวน/หน่วย/ราคาต่อหน่วย/จำนวนเงิน) — ใช้ร่วมกัน Doc 2/3
function subItemsTable(subItems, buyOrHireShort, totalAmount){
  function cell(text, opts){
    opts = opts || {};
    return new TableCell({
      width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      children: [ para(text, { align: opts.align || AlignmentType.LEFT, after: 0, size: 14, bold: opts.bold }) ]
    });
  }
  const headerRow = new TableRow({ tableHeader: true, children: [
    cell('ลำดับที่', { width: 8, align: AlignmentType.CENTER, bold: true }),
    cell('รายละเอียดของพัสดุที่จะ' + buyOrHireShort, { width: 37, bold: true }),
    cell('จำนวน', { width: 10, align: AlignmentType.CENTER, bold: true }),
    cell('หน่วย', { width: 10, align: AlignmentType.CENTER, bold: true }),
    cell('ราคาต่อหน่วย', { width: 17, align: AlignmentType.RIGHT, bold: true }),
    cell('จำนวนเงิน', { width: 18, align: AlignmentType.RIGHT, bold: true })
  ] });
  const dataRows = subItems.map(function(r, i){
    return new TableRow({ children: [
      cell(String(i + 1), { align: AlignmentType.CENTER }),
      cell(r.description),
      cell(String(Number(r.quantity) || 0), { align: AlignmentType.CENTER }),
      cell(r.unit, { align: AlignmentType.CENTER }),
      cell(fmt(r.unit_price), { align: AlignmentType.RIGHT }),
      cell(fmt(r.amount), { align: AlignmentType.RIGHT })
    ] });
  });
  const totalRow = new TableRow({ children: [
    new TableCell({ columnSpan: 5, children: [ para('จำนวนเงินทั้งสิ้น', { align: AlignmentType.RIGHT, after: 0, size: 14, bold: true }) ] }),
    cell(fmt(totalAmount), { align: AlignmentType.RIGHT, bold: true })
  ] });
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: TABLE_BORDERS, rows: [headerRow].concat(dataRows).concat([totalRow]) });
}

// สร้างไฟล์ .docx จาก children array แล้วสั่งดาวน์โหลด (ทำงานเฉพาะใน browser จริง — ไม่ใช่ระหว่างเทส Node)
function buildDocxFile(children, filename){
  const doc = new Document({
    sections: [ {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4 (twips)
          margin: { top: mm(18), bottom: mm(15), left: mm(15), right: mm(15) }
        }
      },
      children: children
    } ]
  });
  Packer.toBlob(doc).then(function(blob){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  }).catch(function(e){ alert('สร้างไฟล์ Word ไม่สำเร็จ: ' + e.message); });
}

// ปุ่มใน Section I เรียกทีละชุด (ดาวน์โหลด 1 ไฟล์ต่อ 1 เอกสาร)
function downloadDoc(docIndex){
  if(!CURRENT_PROC_ITEM){ alert('ไม่พบรายการที่กำลังเปิดอยู่'); return; }
  generateDoc(docIndex, CURRENT_PROC_ITEM.id);
}

async function generateDoc(docIndex, procItemId){
  const r = await buildDocResult(docIndex, procItemId);
  if(r) buildDocxFile(r.children, r.filename);
}

// สร้าง {children, filename} ของเอกสารเดียว — ใช้ร่วมกันทั้ง generateDoc() (ทีละชุด) และ
// downloadAllDocs() (รวมชุด) เพื่อไม่ให้ตรรกะข้อมูลซ้ำ 2 จุด
async function buildDocResult(docIndex, procItemId, opts){
  if(docIndex === 1) return await buildDoc1(procItemId, opts);
  if(docIndex === 2) return await buildDoc2(procItemId, opts);
  if(docIndex === 3) return await buildDoc3(procItemId, opts);
  if(docIndex === 4) return await buildDoc4(procItemId, opts);
  alert('เอกสารชุดนี้ (#' + docIndex + ' ' + (PD_DOC_NAMES[docIndex] || '') + ') ยังไม่พร้อมใช้งาน — กำลังสร้างทีละชุดตามลำดับ');
  return null;
}

// ปุ่ม "ดาวน์โหลดรวมทั้งชุด" — รวมทุกเอกสารที่พร้อมใช้งาน (ตอนนี้ 1-4) เป็นไฟล์เดียว คั่นแต่ละเอกสารด้วย
// page break (pageBreakBefore บนรูปครุฑของเอกสารถัดไป) ถ้าเอกสารใดยังขาดข้อมูลจำเป็น (วันที่/กรรมการ/
// รายการย่อย) builder ของเอกสารนั้นจะ alert เองแล้วคืน null — หยุดทั้งชุดทันที ไม่สร้างไฟล์รวมที่เอกสารขาดไป
const DOCX_AVAILABLE_DOCS = [1, 2, 3, 4]; // เพิ่มเลขที่นี่ทุกครั้งที่ Doc ถัดไปสร้างเสร็จ+ผ่าน PASS GATE
async function downloadAllDocs(){
  if(!CURRENT_PROC_ITEM){ alert('ไม่พบรายการที่กำลังเปิดอยู่'); return; }
  const procItemId = CURRENT_PROC_ITEM.id;
  const detail = CURRENT_DETAIL;
  if(!detail || !detail.doc_number){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยดาวน์โหลด'); return; }

  let allChildren = [];
  for(let i = 0; i < DOCX_AVAILABLE_DOCS.length; i++){
    const docIndex = DOCX_AVAILABLE_DOCS[i];
    const r = await buildDocResult(docIndex, procItemId, { pageBreakBefore: i > 0 });
    if(!r) return; // builder เองได้ alert เหตุผลไปแล้ว (ขาดวันที่/กรรมการ/รายการย่อย ฯลฯ)
    allChildren = allChildren.concat(r.children);
  }
  const bareDocNumber = (detail.doc_number || '').replace(/^[ก-๙]+\./, '');
  buildDocxFile(allChildren, bareDocNumber.replace(/[\/\\]/g, '-') + '-ชุดเอกสารพัสดุ.docx');
}

// หา staff ที่ตำแหน่งเป็นผู้อำนวยการ (ไม่ hardcode ชื่อ — ถ้าเปลี่ยนตัว ผอ. แค่แก้ข้อมูลใน "จัดการข้อมูล")
function findDirector(){
  return (STAFF_LIST || []).find(function(s){
    const pos = (s.position || '').trim();
    return pos.indexOf('ผู้อำนวยการ') >= 0 && pos.indexOf('รอง') !== 0 && s.is_active !== false;
  });
}

// หา staff record ที่ตรงกับ teacherName ของโครงการ (exact match แบบเดียวกับ auth.js canEdit())
function findStaffByTeacherName(teacherName){
  const norm = function(s){ return (s || '').replace(/\s+/g, ''); };
  const target = norm(teacherName);
  if(!target) return null;
  return (STAFF_LIST || []).find(function(s){ return norm(s.prefix + s.name) === target; }) || null;
}

// หา staff record จากชื่อล้วน (ไม่มีคำนำหน้า) — ใช้กับตำแหน่งประจำตายตัว (PROCUREMENT_OFFICER/HEAD_NAME)
function findStaffByName(name){
  const norm = function(s){ return (s || '').replace(/\s+/g, ''); };
  const target = norm(name);
  if(!target) return null;
  return (STAFF_LIST || []).find(function(s){ return norm(s.name) === target; }) || null;
}

// ---------- Doc 1: ขอดำเนิน (บันทึกข้อความขออนุมัติดำเนินการจัดซื้อ/จัดจ้าง) ----------
// รูปแบบอ้างอิงจากไฟล์จริง "1 ขอดำเนิน.pdf" — ข้อมูล/ตรรกะเดิมทั้งหมดจาก pdf-templates.js (HTML pivot)
// เปลี่ยนแค่ตัว renderer เป็น docx paragraph/table objects
async function buildDoc1(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_request){ alert('กรุณากรอก "วันที่ขอดำเนินการ" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const director = findDirector();
  const teacherName = (item.projects && item.projects.teacher_name) || '';
  const proposerStaff = findStaffByTeacherName(teacherName);
  const proposerPosition = proposerStaff ? (proposerStaff.position || '-') : '-';
  const proposerPrintName = proposerStaff ? (proposerStaff.prefix + proposerStaff.name) : teacherName;
  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const projectNameRaw = (item.projects && item.projects.name) || '-';
  const projectName = projectNameRaw.replace(/^โครงการ\s*/, '');
  let itemCount = 1;
  try{
    const subRows = await GET('procurement_sub_items', 'procurement_item_id=eq.' + procItemId + '&select=id');
    itemCount = (subRows && subRows.length) || 1;
  }catch(e){
    itemCount = (CURRENT_SUB_ITEMS && CURRENT_SUB_ITEMS.length) || 1;
  }
  const purpose = detail.tor_objective || item.title || '-';
  const bareDocNumber = (detail.doc_number || '').replace(/^[ก-๙]+\./, '');

  const directorSigRuns = director
    ? multiLineRuns(['ลงชื่อ .......................................', '(' + (director.prefix || '') + director.name + ')', 'ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : [ tr('ลงชื่อ .......................................') ];

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 47, type: WidthType.PERCENTAGE }, children: [
        para('ผู้รับผิดชอบโครงการ', { after: 0 }),
        para('ลงชื่อ .......................................', { before: 6, after: 0 })
      ] }),
      new TableCell({ width: { size: 53, type: WidthType.PERCENTAGE }, children: [
        para('ความเห็นของผู้อำนวยการ', { after: 0 }),
        para('( )  เห็นชอบ      ( )  อนุมัติ', { before: 4, after: 0 }),
        para(directorSigRuns, { align: AlignmentType.CENTER, before: 4, after: 0 })
      ] })
    ] }) ]
  });

  const children = [
    garudaPara(opts),
    para('บันทึกข้อความ', { align: AlignmentType.CENTER, bold: true, size: 20, after: 4 }),
    para('ส่วนราชการ  ' + SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { after: 1 }),
    twoColRow('ที่  ' + bareDocNumber, 'วันที่  ' + fmtDateThai(detail.date_request)),
    para('เรื่อง  ขออนุมัติดำเนินงานตามโครงการ' + projectName, { after: 1 }),
    hrPara(),
    para('เรียน  ผู้อำนวยการ' + SCHOOL_FULL_NAME, { after: 2 }),
    bodyPara('ด้วยข้าพเจ้า ' + proposerPrintName + ' ตำแหน่ง ' + proposerPosition + ' ' + SCHOOL_FULL_NAME +
      ' ขออนุมัติตามที่ได้รับอนุญาตให้ดำเนินงานตามโครงการ' + projectName + ' และขออนุมัติ' + buyOrHire +
      ' จำนวน ' + itemCount + ' รายการ เป็นเงิน ' + fmt(item.amount) + ' บาท (' + thaiBahtText(item.amount) +
      ') เพื่อ' + purpose + ' ตามรายละเอียดในแบบประมาณการ' + buyOrHire + 'ดังแนบ'),
    bodyPara('จึงเรียนมาเพื่อโปรดพิจารณาเห็นชอบและอนุมัติ'),
    para('', { after: 3 }),
    sigTable
  ];

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[1] + '.docx' };
}

// ---------- Doc 2: แนบขอดำเนิน (แบบประมาณการจัดซื้อ/จัดจ้าง แนบท้าย Doc 1) ----------
async function buildDoc2(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }

  const teacherName = (item.projects && item.projects.teacher_name) || '';
  const proposerStaff = findStaffByTeacherName(teacherName);
  const proposerPrintName = proposerStaff ? (proposerStaff.prefix + proposerStaff.name) : teacherName;
  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
  const projectNameRaw = (item.projects && item.projects.name) || '-';
  const projectName = projectNameRaw.replace(/^โครงการ\s*/, '');
  const purpose = detail.tor_objective || item.title || '-';

  let subItems = [];
  try{
    subItems = await GET('procurement_sub_items', 'procurement_item_id=eq.' + procItemId + '&select=*&order=seq');
  }catch(e){
    subItems = (CURRENT_SUB_ITEMS || []);
  }
  if(!subItems || !subItems.length){
    alert('ยังไม่มีรายการย่อย กรุณาเพิ่มรายการในฟอร์ม "กรอกเอกสารพัสดุ" แล้วบันทึกก่อนพิมพ์เอกสารนี้');
    return null;
  }
  const totalAmount = subItems.reduce(function(sum, r){ return sum + (Number(r.amount) || 0); }, 0);

  const children = [
    garudaPara(opts),
    para('แบบประมาณการ' + buyOrHire + ' แนบท้ายแบบขออนุมัติ' + buyOrHire, { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para('การ' + buyOrHire + purpose + ' ในโครงการ' + projectName, { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para(SCHOOL_ADMIN_GROUP + ' ' + SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { align: AlignmentType.CENTER, bold: true, after: 3 }),
    subItemsTable(subItems, buyOrHireShort, totalAmount),
    para('', { after: 8 }),
    para(multiLineRuns(['ลงชื่อ .......................................', '(' + proposerPrintName + ')', 'ผู้รับผิดชอบโครงการ']), { align: AlignmentType.CENTER, after: 0 })
  ];

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[2] + '.docx' };
}

// ---------- Doc 3: ขออนุมัติแต่งตั้งผู้กำหนด TOR ----------
async function buildDoc3(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_approve_tor){ alert('กรุณากรอก "วันที่ขออนุมัติแต่งตั้งกรรมการ TOR" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
  const projectNameRaw = (item.projects && item.projects.name) || '-';
  const projectName = projectNameRaw.replace(/^โครงการ\s*/, '');
  const purpose = detail.tor_objective || item.title || '-';
  const bareDocNumber = (detail.doc_number || '').replace(/^[ก-๙]+\./, '');

  let subItems = [];
  try{
    subItems = await GET('procurement_sub_items', 'procurement_item_id=eq.' + procItemId + '&select=*&order=seq');
  }catch(e){
    subItems = (CURRENT_SUB_ITEMS || []);
  }
  if(!subItems || !subItems.length){
    alert('ยังไม่มีรายการย่อย กรุณาเพิ่มรายการในฟอร์ม "กรอกเอกสารพัสดุ" แล้วบันทึกก่อนพิมพ์เอกสารนี้');
    return null;
  }
  const totalAmount = subItems.reduce(function(sum, r){ return sum + (Number(r.amount) || 0); }, 0);
  const itemCount = subItems.length;
  const vatText = detail.vat_applicable ? fmt(totalAmount * 0.07) : '-';

  const officer = findStaffByName(PROCUREMENT_OFFICER_NAME);
  const officerPrintName = officer ? (officer.prefix + officer.name) : PROCUREMENT_OFFICER_NAME;
  const head = findStaffByName(PROCUREMENT_HEAD_NAME);
  const headPrintName = head ? (head.prefix + head.name) : PROCUREMENT_HEAD_NAME;
  const director = findDirector();

  const torCommittee = (detail.committee_tor || [])
    .filter(function(c){ return c && c.staff_id; })
    .map(function(c){
      const s = (STAFF_LIST || []).find(function(x){ return String(x.id) === String(c.staff_id); });
      return { name: s ? (s.prefix + s.name) : '-', position: s ? (s.position || '-') : '-', role: c.role || 'กรรมการ' };
    });
  if(!torCommittee.length){
    alert('กรุณาระบุ "คณะกรรมการกำหนด TOR" อย่างน้อย 1 คนในฟอร์มก่อนพิมพ์เอกสารนี้');
    return null;
  }
  const torParas = torCommittee.map(function(c, i){
    return para((i + 1) + '. ' + c.name + ' ตำแหน่ง ' + c.position + ' ' + c.role, { noIndent: true, after: 0.5 });
  });

  const sigRow = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('เจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 5, after: 0 }),
        para('(' + officerPrintName + ')', { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('หัวหน้าเจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 5, after: 0 }),
        para('(' + headPrintName + ')', { align: AlignmentType.CENTER, after: 0 }),
        para('( )  เห็นชอบ      ( )  อนุมัติ', { align: AlignmentType.CENTER, after: 0 })
      ] })
    ] }) ]
  });

  const directorSigRuns = director
    ? multiLineRuns(['ลงชื่อ .......................................', '(' + (director.prefix || '') + director.name + ')', 'ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : [ tr('ลงชื่อ .......................................') ];

  const children = [
    garudaPara(opts),
    para('บันทึกข้อความ', { align: AlignmentType.CENTER, bold: true, size: 20, after: 4 }),
    para('ส่วนราชการ  ' + SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { after: 1 }),
    twoColRow('ที่  ' + bareDocNumber, 'วันที่  ' + fmtDateThai(detail.date_approve_tor)),
    para('เรื่อง  ขออนุมัติแต่งตั้งผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ', { after: 1 }),
    hrPara(),
    para('เรียน  ผู้อำนวยการ' + SCHOOL_FULL_NAME, { after: 2 }),
    bodyPara('ตามที่' + SCHOOL_ADMIN_GROUP + ' ' + SCHOOL_FULL_NAME + ' มีความประสงค์จะขอทำการ' + buyOrHire + (item.title || '') +
      ' เพื่อ' + purpose + ' ในโครงการ' + projectName + ' จำนวน ' + itemCount + ' รายการ มีรายการต่อไปนี้'),
    subItemsTable(subItems, buyOrHireShort, totalAmount),
    bodyPara('รวมเป็นเงิน ' + fmt(totalAmount) + ' บาท ภาษีมูลค่าเพิ่ม ' + vatText + ' บาท จำนวนเงินตัวอักษร (' + thaiBahtText(totalAmount) + ')', { noIndent: true, before: 2 }),
    bodyPara('โดยใช้งบประมาณจาก' + (detail.budget_source || '-') + ' โครงการ' + projectName, { noIndent: true }),
    bodyPara('มอบหมายให้บุคคลดังต่อไปนี้เป็นผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ (TOR หรือ Spec)', { noIndent: true })
  ].concat(torParas).concat([
    bodyPara('จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติและมอบงานพัสดุเป็นผู้ดำเนินการจัด' + buyOrHireShort + 'ต่อไป', { noIndent: true, before: 3 }),
    para('', { after: 4 }),
    sigRow,
    para('', { after: 4 }),
    para(directorSigRuns, { align: AlignmentType.CENTER, after: 0 })
  ]);

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[3] + '.docx' };
}

// ---------- Doc 4: คำสั่งแต่งตั้งผู้กำหนด TOR ----------
async function buildDoc4(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_order_tor){ alert('กรุณากรอก "วันที่คำสั่งแต่งตั้งกรรมการ TOR" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const bareDocNumber = (detail.doc_number || '').replace(/^[ก-๙]+\./, '');
  const itemTitle = item.title || '-';

  let subItems = [];
  try{
    subItems = await GET('procurement_sub_items', 'procurement_item_id=eq.' + procItemId + '&select=*&order=seq');
  }catch(e){
    subItems = (CURRENT_SUB_ITEMS || []);
  }
  if(!subItems || !subItems.length){
    alert('ยังไม่มีรายการย่อย กรุณาเพิ่มรายการในฟอร์ม "กรอกเอกสารพัสดุ" แล้วบันทึกก่อนพิมพ์เอกสารนี้');
    return null;
  }
  const totalAmount = subItems.reduce(function(sum, r){ return sum + (Number(r.amount) || 0); }, 0);
  const itemCount = subItems.length;

  const torCommittee = (detail.committee_tor || [])
    .filter(function(c){ return c && c.staff_id; })
    .map(function(c){
      const s = (STAFF_LIST || []).find(function(x){ return String(x.id) === String(c.staff_id); });
      return { name: s ? (s.prefix + s.name) : '-', position: s ? (s.position || '-') : '-' };
    });
  if(!torCommittee.length){
    alert('กรุณาระบุ "คณะกรรมการกำหนด TOR" อย่างน้อย 1 คนในฟอร์มก่อนพิมพ์เอกสารนี้');
    return null;
  }
  let torParas = [];
  torCommittee.forEach(function(c, i){
    torParas.push(para((i + 1) + '. ' + c.name, { noIndent: true, before: i === 0 ? 1 : 2, after: 0 }));
    torParas.push(para('ตำแหน่ง ' + c.position, { noIndent: true, after: 0 }));
  });

  const director = findDirector();
  const directorSigRuns = director
    ? multiLineRuns(['ลงชื่อ .......................................', '(' + (director.prefix || '') + director.name + ')', 'ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : [ tr('ลงชื่อ .......................................') ];

  const children = [
    garudaPara(opts),
    para('คำสั่ง' + SCHOOL_FULL_NAME, { align: AlignmentType.CENTER, bold: true, size: 20, after: 0 }),
    para('ที่ ' + bareDocNumber, { align: AlignmentType.CENTER, bold: true, size: 20, after: 4 }),
    para('เรื่อง แต่งตั้งผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ (TOR หรือ Spec) การ' + buyOrHire + itemTitle, { align: AlignmentType.CENTER, bold: true, after: 3 }),
    hrPara(),
    bodyPara('ด้วย' + SCHOOL_FULL_NAME + ' จะดำเนินการ' + buyOrHire + itemTitle + ' จำนวน ' + itemCount +
      ' รายการ ภายในวงเงินทั้งสิ้นจำนวน ' + fmt(totalAmount) + ' บาท (' + thaiBahtText(totalAmount) +
      ') สำหรับใช้ในราชการของ' + SCHOOL_FULL_NAME),
    bodyPara('ฉะนั้น ' + TOR_ORDER_LEGAL_BASIS),
    bodyPara('จึงแต่งตั้งคณะกรรมการกำหนดรายละเอียดคุณลักษณะเฉพาะและราคากลางของพัสดุรายการ' + itemTitle + ' โดยวิธีเฉพาะเจาะจง ประกอบด้วย')
  ].concat(torParas).concat([
    bodyPara('ผู้กำหนดขอบเขต (TOR) ที่ได้รับแต่งตั้งมีอำนาจหน้าที่จัดทำรายละเอียดคุณลักษณะเฉพาะและราคากลาง ของ' +
      itemTitle + ' จำนวน ' + itemCount + ' รายการ และกำหนดหลักเกณฑ์การพิจารณาคัดเลือกข้อเสนอ โดยให้มีรายละเอียดเป็นไปตามกฎหมาย ระเบียบ และคำสั่งที่เกี่ยวข้อง', { noIndent: true, before: 2 }),
    bodyPara('ทั้งนี้ ตั้งแต่บัดนี้เป็นต้นไป'),
    para('สั่ง ณ วันที่ ' + fmtDateThai(detail.date_order_tor), { align: AlignmentType.CENTER, before: 2, after: 0 }),
    para('', { after: 6 }),
    para(directorSigRuns, { align: AlignmentType.CENTER, after: 0 })
  ]);

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[4] + '.docx' };
}
