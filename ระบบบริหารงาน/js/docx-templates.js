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

// ⚠️ ข้อความมาตรฐาน Doc 6 (ขอบเขตงาน) — คัดลอกจากไฟล์อ้างอิงจริง "6 ขอบเขต.pdf" เป็น constant คงที่
// (เหมือน TOR_ORDER_LEGAL_BASIS ของ Doc4) เพราะเป็นข้อความมาตรฐานตาม พรบ.จัดซื้อจัดจ้างฯ 2560 ใช้ซ้ำทุกรายการ
const DOC6_BIDDER_QUALIFICATIONS = [
  'มีความสามารถตามกฎหมาย',
  'ไม่เป็นบุคคลล้มละลาย',
  'ไม่อยู่ระหว่างเลิกกิจการ',
  'ไม่เป็นบุคคลซึ่งอยู่ระหว่างถูกระงับการยื่นข้อเสนอหรือทำสัญญากับหน่วยงานของรัฐไว้ชั่วคราว เนื่องจากเป็นผู้ไม่ผ่านเกณฑ์การประเมินผลการปฏิบัติงานของผู้ประกอบการตามระเบียบที่รัฐมนตรีว่าการกระทรวงการคลังกำหนดตามที่ประกาศเผยแพร่ในระบบเครือข่ายสารสนเทศของกรมบัญชีกลาง',
  'ไม่เป็นบุคคลซึ่งถูกระบุชื่อไว้ในบัญชีรายชื่อผู้ทิ้งงานและได้แจ้งเวียนชื่อให้เป็นผู้ทิ้งงานของหน่วยงานของรัฐในระบบเครือข่ายสารสนเทศของกรมบัญชีกลาง ซึ่งรวมถึงนิติบุคคลที่ผู้ทิ้งงานเป็นหุ้นส่วนผู้จัดการ กรรมการผู้จัดการ ผู้บริหาร ผู้มีอำนาจในการดำเนินงานในกิจการของนิติบุคคลนั้นด้วย',
  'มีคุณสมบัติและไม่มีลักษณะต้องห้ามตามที่คณะกรรมการนโยบายการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐกำหนดในราชกิจจานุเบกษา',
  'เป็นบุคคลธรรมดาหรือนิติบุคคล ผู้มีอาชีพขายวัสดุ/อาชีพรับจ้างงานดังกล่าว',
  'ไม่เป็นผู้ได้รับเอกสิทธิ์หรือความคุ้มกัน ซึ่งอาจปฏิเสธไม่ยอมขึ้นศาลไทย เว้นแต่รัฐบาลของผู้ยื่นข้อเสนอได้มีคำสั่งให้สละเอกสิทธิ์และความคุ้มกันเช่นว่านั้น'
];
// ⚠️ "1 วัน" กำหนดยืนราคา/ส่งมอบ — ไฟล์อ้างอิงจริงใช้ค่านี้ (งานเร่งด่วนแบบล้างแอร์) แต่ยังไม่มีฟิลด์ข้อมูล
// จริงในฟอร์มสำหรับ "จำนวนวัน" นี้ (ต่างจาก detail.penalty_rate_percent ที่มีฟิลด์จริงแล้ว) — ใช้ค่าคงที่
// ไปก่อนตามตัวอย่าง สมมติฐานนี้ต้องให้ Pam ยืนยัน/แก้ถ้าอยากให้กรอกต่อรายการได้ (เหมือนสมมติฐาน VAT ของ Doc3)
const DOC6_DEFAULT_TERM_DAYS = 1;
const DOC6_EVALUATION_CRITERIA = 'ในการพิจารณาผลการยื่นข้อเสนอครั้งนี้ โรงเรียนจะพิจารณาตัดสินโดยใช้เกณฑ์ราคา หรือ เกณฑ์ราคาประกอบเกณฑ์อื่น โดยพิจารณาจากราคารวม หรือ ราคาต่อหน่วย หรือ ราคาต่อรายการ';

const PD_DOC_NAMES = {
  1:'ขอดำเนิน', 2:'แนบขอดำเนิน', 3:'ขออนุมัติTOR', 4:'คำสั่งTOR', 5:'เห็นชอบTOR',
  6:'ขอบเขตงาน', 7:'แนบTOR', 8:'ขอซื้อจ้าง', 9:'แนบท้าย', 10:'พิจารณา',
  11:'คำสั่งตรวจรับ', 12:'ประกาศผู้ชนะ', 13:'สั่งซื้อจ้าง', 14:'แนบซื้อ', 15:'ตรวจรับ', 16:'เบิก'
};

// ===================== docx library shortcuts + helper builders =====================
// window.docx โหลดจาก CDN ใน index.html — ดึงคลาสที่ใช้บ่อยมาเป็นตัวแปรสั้นๆ
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, WidthType, BorderStyle, VerticalAlign, TabStopType, Tab, OnOffElement } = docx;

const DOCX_FONT = 'TH Sarabun New';

// ⚠️ Thai Complex-Script formatting ครบชุด (2026-07-20) — Pam เปิด Word จริงเจอตัวหนังสือห่างกันมาก +
// font box โชว์ "Angsana New" ขนาด 10 แทน TH Sarabun New 16pt ทั้งที่โค้ดตั้ง font/size ทุก run แล้ว
// ตรวจด้วย skill thai-font-normalize (fix-thai-font --check) พบว่า Word ต้องการ "complex-script"
// (cs) formatting ครบ 3 อย่างพร้อมกันถึงจะ "เชื่อ" font/size ที่ตั้งไว้ ไม่งั้น fallback ไปใช้ default
// style (Angsana New 10pt เดิมของ Word) สำหรับ "วัดความกว้าง" ตอนจัด layout/thaiDistribute — ทำให้
// วาดด้วยฟอนต์ใหญ่ (16pt) แต่คำนวณระยะห่างจากฟอนต์เล็ก (10pt Angsana) เกิดช่องว่างมหาศาลระหว่างตัวอักษร:
//   1. w:szCs (sizeComplexScript) — ขนาดฟอนต์ฝั่ง complex-script แยกจาก w:sz ปกติ
//   2. w:lang w:bidi="th-TH" (language.bidirectional) — บอก Word ว่านี่คือภาษาที่ใช้ complex-script
//   3. <w:cs/> toggle จริง (ไม่มี option ตรงใน docx.js API — ต้อง push OnOffElement('w:cs', true)
//      เข้า run.properties เองหลังสร้าง TextRun ดู trThaiCs() ด้านล่าง)
// + Document.styles.default.document.run ต้องตั้งค่าเดียวกันเป็นค่า default ทั้งไฟล์ (docDefaults ใน
// styles.xml) กัน paragraph mark/ย่อหน้าว่างที่ไม่มี run ชัดเจน fallback เป็น Angsana New เช่นกัน
function trThaiCs(run){
  run.properties.push(new OnOffElement('w:cs', true));
  return run;
}
const THAI_LANG = { value: 'th-TH', eastAsia: 'th-TH', bidirectional: 'th-TH' };
function mm(n){ return Math.round(n * 56.6929); } // mm -> twips (หน่วยระยะใน docx)
function pxFromMm(n){ return Math.round(n * 3.7795); } // mm -> px @96dpi (สำหรับขนาดรูปภาพ)
function hp(pt){ return pt * 2; } // font size point -> half-point (หน่วยขนาดฟอนต์ใน docx)

// ⚠️ ค่ามาตรฐานเอกสารราชการไทย (2026-07-15) — อ่านจาก "ผนวก คำแนะนำและแบบมาตรฐานการพิมพ์หนังสือราชการ
// ภาษาไทยด้วยโปรแกรมการพิมพ์ในเครื่องคอมพิวเตอร์" ท้ายระเบียบสำนักนายกรัฐมนตรีว่าด้วยงานสารบรรณ พ.ศ. 2526
// (Pam ขอให้ศึกษาก่อนแก้ หลังเจอ Doc พิมพ์แล้วดูไม่เป็นทางการ) แทนที่จะเดาจากไฟล์อ้างอิงอย่างเดียวแบบเดิม —
// รอบนี้แก้ตามมาตรฐานจริง: ระยะขอบ, ระยะย่อหน้า, ขนาดครุฑ/ตำแหน่ง, ขนาดตัวอักษรหัวเรื่อง ล้วนอิงจากนี้
const OFFICIAL_MARGIN_MM = { top: 25, bottom: 20, left: 30, right: 20 }; // ซ้าย 3ซม./ขวา 2ซม./บน 2.5ซม./ล่าง~2ซม.
const PARA_INDENT_MM = 25; // ย่อหน้าข้อความ 2.5 ซม. ตามมาตรฐาน (ไม่ใช่ 8mm ที่เคยเดาไว้)
const ORDER_DATE_INDENT_MM = 50; // "สั่ง ณ วันที่..." ของ Doc คำสั่ง เยื้อง 5 ซม. (เพิ่มจากย่อหน้าปกติ 1 เท่า)

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
// ⚠️ ตั้ง complex-script formatting ครบชุด (sizeComplexScript/language/cs toggle) ทุก run เสมอ — ดูเหตุผล
// เต็มที่ comment เหนือ trThaiCs() ด้านบน (2026-07-20 แก้ตัวหนังสือห่างกันผิดปกติใน Word จริง)
function tr(text, opts){
  opts = opts || {};
  const sz = hp(opts.size || 16);
  const o = { text: String(text == null ? '' : text), font: DOCX_FONT, size: sz, sizeComplexScript: sz, language: THAI_LANG };
  if(opts.bold){ o.bold = true; o.boldComplexScript = true; }
  if(opts.brk) o.break = opts.brk;
  return trThaiCs(new TextRun(o));
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
  // ย่อหน้าแรก 2.5 ซม. ตามมาตรฐานราชการ (ปรับจาก 8mm ที่เคยเดาไว้ผิด — ดู PARA_INDENT_MM ด้านบน)
  if(opts.indent) p.indent = { firstLine: mm(PARA_INDENT_MM) };
  if(opts.leftIndent) p.indent = { left: mm(opts.leftIndent) };
  if(opts.tabStops) p.tabStops = opts.tabStops;
  if(opts.pageBreakBefore) p.pageBreakBefore = true;
  // ระยะบรรทัดตายตัว (ไม่ใช่ทวีคูณจากขนาดฟอนต์) — ใช้กับหัวข้อ "บันทึกข้อความ" ที่มาตรฐานกำหนดตัวเลขตายตัวไว้
  if(opts.exactLinePt) p.spacing.line = opts.exactLinePt * 20, p.spacing.lineRule = 'exact';
  return new Paragraph(p);
}

// ย่อหน้าเนื้อหาบันทึกข้อความปกติ — ย่อหน้าแรกเยื้อง 2.5 ซม. ตามมาตรฐานราชการ
// ⚠️ align: THAI_DISTRIBUTE ไม่ใช่ LEFT/JUSTIFIED (2026-07-15) — รอบก่อน (2026-07-11) เปลี่ยนจาก
// JUSTIFIED (Western) เป็น LEFT เพื่อแก้ปัญหาช่องว่างระหว่างคำใหญ่ผิดปกติ (Word ยืดช่องว่างไม่กี่จุดที่
// แทรกเองระหว่างต่อ field ให้เต็มบรรทัด) แต่ LEFT ทำให้ขอบขวาไม่เสมอ/มีช่องว่างเหลือท้ายบรรทัดเห็นได้ชัด
// (Pam ชี้ในภาพจริง — "ไม่ขยายให้เต็มสัดส่วน") ทางแก้ที่ถูกต้องคือ "กระจายแบบไทย" (Thai Distributed —
// AlignmentType.THAI_DISTRIBUTE, ค่า OOXML "thaiDistribute") ซึ่ง Word มีโหมดนี้ไว้เฉพาะสำหรับข้อความ
// ที่ไม่มีช่องว่างระหว่างคำตามธรรมชาติ (ไทย/ลาว ฯลฯ) — กระจายพื้นที่ส่วนเกินไปทั่วทุกตัวอักษรในบรรทัด
// (ไม่ใช่ยืดแค่ช่องว่างไม่กี่จุดแบบ justify ปกติ) ได้ขอบขวาเสมอเหมือนเอกสารราชการจริง โดยไม่เกิดช่องว่างใหญ่
function bodyPara(text, opts){
  opts = opts || {};
  return para(text, Object.assign({ align: AlignmentType.THAI_DISTRIBUTE, indent: !opts.noIndent, after: 1.5 }, opts));
}

// หัวข้อแบบ "label ตัวหนา 20pt + ข้อมูลปกติ 16pt" บนบรรทัดเดียวกัน (เทียบเท่า "ส่วนราชการ/ที่/วันที่/เรื่อง"
// ตามมาตรฐาน — ๓.๒.๒ "คำว่า ส่วนราชการ ที่ วันที่ เรื่อง พิมพ์ด้วยอักษรตัวหนาขนาด ๒๐ พอยท์" ส่วนข้อมูลเป็น 16pt ปกติ)
function headerLine(label, value, opts){
  opts = opts || {};
  return para([ tr(label, { bold: true, size: 20 }), tr(value, { size: 16 }) ],
    Object.assign({ after: opts.after == null ? 1 : opts.after }, opts));
}

// แถว "ที่ .... / วันที่ ...." บรรทัดเดียวกัน ใช้ tab stop แทน table เดิม (ตรงกับที่มาตรฐานกำหนดให้อยู่
// บรรทัดเดียวกันโดยเว้นระยะด้วย tab ไม่ใช่ตาราง — table เดิมโชว์ cell-end marker แปลกๆ ตอนเปิด Word จริง
// ตามที่ Pam เจอ "คำขาดๆ") tab stop ตั้งไว้กลางความกว้างหน้าใช้งาน (~16 ซม.) ให้ "วันที่" เริ่มไม่ชิดกับ "ที่" เกินไป
function titleRow(leftLabel, leftValue, rightLabel, rightValue){
  return para(
    [ tr(leftLabel, { bold: true, size: 20 }), tr(leftValue, { size: 16 }), new Tab(),
      tr(rightLabel, { bold: true, size: 20 }), tr(rightValue, { size: 16 }) ],
    { after: 1, tabStops: [ { type: TabStopType.LEFT, position: mm(85) } ] }
  );
}

// เส้นคั่นบางๆ ใต้หัวเอกสาร (เทียบเท่า hr.sep เดิม)
function hrPara(){
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } },
    spacing: { before: mm(1), after: mm(2) },
    children: []
  });
}

// รูปครุฑ — ขนาด/ตำแหน่งต่างกันตามชนิดเอกสารจริงตามมาตรฐาน (2026-07-15):
//   kind='memo'  (บันทึกข้อความ — Doc 1/2/3): สูง 1.5 ซม. ชิดขอบบนด้านซ้าย (ไม่ใช่กึ่งกลาง)
//   kind='order' (คำสั่ง/หนังสือภายนอก — Doc 4): สูง 3 ซม. กึ่งกลางหน้า
// อัตราส่วนรูปจริง 163:177 (~0.921) ล็อกทั้ง width/height ตามอัตราส่วนนี้เสมอ (scrutinize 2026-07-09 เดิม)
// pageBreakBefore ใช้ตอนรวมหลายเอกสารเป็นไฟล์เดียว (downloadAllDocs) บังคับเอกสารถัดไปขึ้นหน้าใหม่เสมอ
function garudaPara(opts){
  opts = opts || {};
  const kind = opts.garudaKind || 'memo';
  const heightMm = kind === 'order' ? 30 : 15;
  const widthMm = heightMm * (163 / 177);
  return new Paragraph({
    alignment: kind === 'order' ? AlignmentType.CENTER : AlignmentType.LEFT,
    pageBreakBefore: !!opts.pageBreakBefore,
    spacing: { after: mm(3) },
    children: [ new ImageRun({ type: 'jpg', data: base64ToUint8Array(GARUDA_B64), transformation: { width: pxFromMm(widthMm), height: pxFromMm(heightMm) } }) ]
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
    // ⚠️ docDefaults (styles.xml) — ตั้ง TH Sarabun New + complex-script ครบชุดเป็นค่า default ทั้งไฟล์
    // กัน paragraph mark/เนื้อหาที่ไม่มี run ชัดเจน (เช่นย่อหน้าว่าง) fallback เป็น Angsana New 10pt ของ Word
    // (ดู comment เต็มที่ trThaiCs() ด้านบน — ตรวจยืนยันด้วย skill thai-font-normalize แล้วว่าจำเป็นคู่กับ
    // การตั้งค่าระดับ run ใน tr())
    styles: {
      default: {
        document: {
          run: { font: DOCX_FONT, size: hp(16), sizeComplexScript: hp(16), language: THAI_LANG }
        }
      }
    },
    sections: [ {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4 (twips)
          margin: { top: mm(OFFICIAL_MARGIN_MM.top), bottom: mm(OFFICIAL_MARGIN_MM.bottom), left: mm(OFFICIAL_MARGIN_MM.left), right: mm(OFFICIAL_MARGIN_MM.right) }
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
  if(docIndex === 5) return await buildDoc5(procItemId, opts);
  if(docIndex === 6) return await buildDoc6(procItemId, opts);
  if(docIndex === 7) return await buildDoc7(procItemId, opts);
  alert('เอกสารชุดนี้ (#' + docIndex + ' ' + (PD_DOC_NAMES[docIndex] || '') + ') ยังไม่พร้อมใช้งาน — กำลังสร้างทีละชุดตามลำดับ');
  return null;
}

// ปุ่ม "ดาวน์โหลดรวมทั้งชุด" — รวมทุกเอกสารที่พร้อมใช้งาน (ตอนนี้ 1-4) เป็นไฟล์เดียว คั่นแต่ละเอกสารด้วย
// page break (pageBreakBefore บนรูปครุฑของเอกสารถัดไป) ถ้าเอกสารใดยังขาดข้อมูลจำเป็น (วันที่/กรรมการ/
// รายการย่อย) builder ของเอกสารนั้นจะ alert เองแล้วคืน null — หยุดทั้งชุดทันที ไม่สร้างไฟล์รวมที่เอกสารขาดไป
const DOCX_AVAILABLE_DOCS = [1, 2, 3, 4, 5, 6, 7]; // เพิ่มเลขที่นี่ทุกครั้งที่ Doc ถัดไปสร้างเสร็จ+ผ่าน PASS GATE
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
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    // "บันทึกข้อความ" ตัวหนา 29pt ระยะบรรทัดตายตัว 35pt ตามมาตรฐาน (๓.๒.๑)
    para('บันทึกข้อความ', { align: AlignmentType.CENTER, bold: true, size: 29, after: 3, exactLinePt: 35 }),
    headerLine('ส่วนราชการ  ', SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL),
    titleRow('ที่  ', bareDocNumber, 'วันที่  ', fmtDateThai(detail.date_request)),
    headerLine('เรื่อง  ', 'ขออนุมัติดำเนินงานตามโครงการ' + projectName),
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
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
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
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    para('บันทึกข้อความ', { align: AlignmentType.CENTER, bold: true, size: 29, after: 3, exactLinePt: 35 }),
    headerLine('ส่วนราชการ  ', SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL),
    titleRow('ที่  ', bareDocNumber, 'วันที่  ', fmtDateThai(detail.date_approve_tor)),
    headerLine('เรื่อง  ', 'ขออนุมัติแต่งตั้งผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ'),
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
    garudaPara(Object.assign({ garudaKind: 'order' }, opts)),
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
    // "สั่ง ณ วันที่..." เยื้อง 5 ซม. (ไม่ใช่กึ่งกลาง) ตามมาตรฐาน — ๓.๓ "ให้มีระยะย่อหน้าเท่ากับ ๕ เซนติเมตร"
    para('สั่ง ณ วันที่ ' + fmtDateThai(detail.date_order_tor), { align: AlignmentType.LEFT, leftIndent: ORDER_DATE_INDENT_MM, before: 2, after: 0 }),
    para('', { after: 6 }),
    para(directorSigRuns, { align: AlignmentType.CENTER, after: 0 })
  ]);

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[4] + '.docx' };
}

// ---------- Doc 5: เห็นชอบ TOR (ขอความเห็นชอบรายละเอียดคุณลักษณะเฉพาะและราคากลาง) ----------
// รูปแบบอ้างอิงจากไฟล์จริง "5 เห็นชอบ.pdf" — บันทึกข้อความอ้างอิงคำสั่ง Doc 4 (เลขที่เดียวกัน คนละวันที่:
// ที่/วันที่ของ Doc 5 เองใช้ date_agree_tor ส่วนวันที่ที่อ้างถึงคำสั่ง Doc 4 ใช้ date_order_tor)
// แล้วรายงานราคากลางที่คำนวณได้ ให้ "ผู้กำหนดรายละเอียด" (คนใน committee_tor ที่มี role
// "ผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ" — คนเดียวกับที่ใช้ใน Doc3/Doc4) ลงชื่อฝั่งซ้าย + ผู้อำนวยการ
// เห็นชอบฝั่งขวา (checkbox เหมือน Doc1/Doc3) — ⚠️ ไฟล์อ้างอิงเขียน "จะซื้อ" ตายตัว (ตัวอย่างจริงเป็นงานจ้าง)
// ปรับให้ใช้ buyOrHireShort ตาม item.type แทน (ธรรมเนียมเดียวกับที่แก้ Doc4 "ครุภัณฑ์"→"พัสดุ")
async function buildDoc5(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_order_tor){ alert('กรุณากรอก "วันที่คำสั่งแต่งตั้งกรรมการ TOR" ในฟอร์มก่อนพิมพ์เอกสารนี้ (เอกสารนี้อ้างอิงคำสั่งดังกล่าว)'); return null; }
  if(!detail.date_agree_tor){ alert('กรุณากรอก "วันที่เห็นชอบ TOR" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
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

  // ผู้กำหนดรายละเอียด = คนใน committee_tor ที่มี role "ผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ" (เดียวกับ Doc3/4)
  // fallback: คนแรกที่มี staff_id ถ้าไม่พบ role ตรงเป๊ะ (กันเคสข้อมูลเก่า/พิมพ์ role ต่างเล็กน้อย)
  const committeeTor = detail.committee_tor || [];
  const designerEntry = committeeTor.find(function(c){ return c && c.staff_id && (c.role || '').indexOf('ผู้กำหนดรายละเอียด') >= 0; })
    || committeeTor.filter(function(c){ return c && c.staff_id; })[0];
  if(!designerEntry){
    alert('กรุณาระบุ "คณะกรรมการกำหนด TOR" (ผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ) ในฟอร์มก่อนพิมพ์เอกสารนี้');
    return null;
  }
  const designerStaff = (STAFF_LIST || []).find(function(x){ return String(x.id) === String(designerEntry.staff_id); });
  const designerPrintName = designerStaff ? (designerStaff.prefix + designerStaff.name) : '-';

  const director = findDirector();
  const directorSigRuns = director
    ? multiLineRuns(['ลงชื่อ .......................................', '(' + (director.prefix || '') + director.name + ')', 'ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : [ tr('ลงชื่อ .......................................') ];

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 47, type: WidthType.PERCENTAGE }, children: [
        para('ผู้กำหนดรายละเอียด', { after: 0 }),
        para('ลงชื่อ .......................................', { before: 6, after: 0 }),
        para('(' + designerPrintName + ')', { after: 0 })
      ] }),
      new TableCell({ width: { size: 53, type: WidthType.PERCENTAGE }, children: [
        para('( )  เห็นชอบ      ( )  อนุมัติ', { after: 0 }),
        para(directorSigRuns, { align: AlignmentType.CENTER, before: 4, after: 0 }),
        para('วันที่ ' + fmtDateThai(detail.date_agree_tor), { align: AlignmentType.CENTER, after: 0 })
      ] })
    ] }) ]
  });

  const children = [
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    para('บันทึกข้อความ', { align: AlignmentType.CENTER, bold: true, size: 29, after: 3, exactLinePt: 35 }),
    headerLine('ส่วนราชการ  ', SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL),
    titleRow('ที่  ', bareDocNumber, 'วันที่  ', fmtDateThai(detail.date_agree_tor)),
    headerLine('เรื่อง  ', 'ขอความเห็นชอบรายละเอียดคุณลักษณะเฉพาะและราคากลางของ' + buyOrHire + itemTitle),
    hrPara(),
    para('เรียน  ผู้อำนวยการ' + SCHOOL_FULL_NAME, { after: 2 }),
    bodyPara('ตามคำสั่ง' + SCHOOL_FULL_NAME + ' ที่ ' + bareDocNumber + ' ลงวันที่ ' + fmtDateThai(detail.date_order_tor) +
      ' เรื่อง แต่งตั้งผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ (TOR หรือ Spec) การ' + buyOrHire + itemTitle + ' นั้น'),
    bodyPara('บัดนี้ คณะกรรมการจัดทำราคากลาง ได้ดำเนินการจัดทำรายละเอียดคุณลักษณะเฉพาะพัสดุและราคากลางของงานพัสดุที่จะ' +
      buyOrHireShort + 'ดังกล่าวเสร็จเรียบร้อยแล้ว ราคากลางที่คำนวณได้ เป็นเงิน ' + fmt(totalAmount) + ' บาท (' + thaiBahtText(totalAmount) +
      ') ตามรายละเอียดคุณลักษณะเฉพาะและการคำนวณราคากลางที่แนบ'),
    bodyPara('จึงเรียนมาเพื่อโปรดพิจารณาเห็นชอบ'),
    para('', { after: 3 }),
    sigTable
  ];

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[5] + '.docx' };
}

// ---------- Doc 6: ขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะ (TOR/Spec 10 หัวข้อ) ----------
// รูปแบบอ้างอิงจากไฟล์จริง "6 ขอบเขต.pdf" — เอกสารแนบ (ไม่ใช่บันทึกข้อความ ไม่มีที่/วันที่/เรียน เหมือน Doc2)
// หัวเรื่องกึ่งกลาง 3 บรรทัด แล้วตามด้วย ๑๐ หัวข้อ ปิดท้ายด้วยลายเซ็น 3 คน (ผู้กำหนดรายละเอียด/เจ้าหน้าที่/ผอ.)
// ⚠️ หัวข้อ ๓ (คุณสมบัติผู้ยื่นข้อเสนอ), ๕ (กำหนดยืนราคา/ส่งมอบ), ๗ (รับประกันชำรุดบกพร่อง), ๘ (เกณฑ์พิจารณา)
// เป็นข้อความมาตรฐานคงที่ (ดู DOC6_* ด้านบน) — ๕ กับ ๗ มีค่าตัวเลขที่ยังไม่มีฟิลด์ข้อมูลจริงในฟอร์ม (1 วัน / "-")
// ใช้ค่าจากตัวอย่างไปก่อน ต้องให้ Pam ยืนยัน — ๖ (ค่าปรับ) ใช้ detail.penalty_rate_percent ฟิลด์จริงที่มีอยู่แล้ว
async function buildDoc6(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }

  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
  const projectNameRaw = (item.projects && item.projects.name) || '-';
  const projectName = projectNameRaw.replace(/^โครงการ\s*/, '');
  const purpose = detail.tor_objective || item.title || '-';
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
  const totalAmountText = fmt(totalAmount) + ' บาท (' + thaiBahtText(totalAmount) + ')';

  // ผู้กำหนดรายละเอียด — ใช้ lookup เดียวกับ Doc5 (role match ใน committee_tor)
  const committeeTor = detail.committee_tor || [];
  const designerEntry = committeeTor.find(function(c){ return c && c.staff_id && (c.role || '').indexOf('ผู้กำหนดรายละเอียด') >= 0; })
    || committeeTor.filter(function(c){ return c && c.staff_id; })[0];
  if(!designerEntry){
    alert('กรุณาระบุ "คณะกรรมการกำหนด TOR" (ผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ) ในฟอร์มก่อนพิมพ์เอกสารนี้');
    return null;
  }
  const designerStaff = (STAFF_LIST || []).find(function(x){ return String(x.id) === String(designerEntry.staff_id); });
  const designerPrintName = designerStaff ? (designerStaff.prefix + designerStaff.name) : '-';

  const officer = findStaffByName(PROCUREMENT_OFFICER_NAME);
  const officerPrintName = officer ? (officer.prefix + officer.name) : PROCUREMENT_OFFICER_NAME;
  const director = findDirector();
  const directorSigRuns = director
    ? multiLineRuns(['ลงชื่อ .......................................', '(' + (director.prefix || '') + director.name + ')', 'ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : [ tr('ลงชื่อ .......................................') ];

  const qualParas = DOC6_BIDDER_QUALIFICATIONS.map(function(q, i){
    return para((i + 1) + '. ' + q, { noIndent: true, after: 0.5 });
  });

  const penaltyText = item.type === 'จัดซื้อ'
    ? 'งานซื้อให้คิดค่าปรับอัตราร้อยละ ' + (detail.penalty_rate_percent || 0) + ' ต่อวัน ของราคาพัสดุที่ยังไม่ได้รับมอบ'
    : 'งานจ้างให้คิดค่าปรับเป็นรายวันเป็นจำนวนเงินตายตัวในอัตราร้อยละ ' + (detail.penalty_rate_percent || 0) + ' ของราคางาน' + buyOrHireShort + 'นั้น แต่จะต้องไม่ต่ำกว่าวันละ 100.00 บาท';

  const sigRow3 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, children: [
        para('ผู้กำหนดรายละเอียด', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 5, after: 0 }),
        para('(' + designerPrintName + ')', { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, children: [
        para('เจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 5, after: 0 }),
        para('(' + officerPrintName + ')', { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, children: [
        para('( )  เห็นชอบ      ( )  อนุมัติ', { align: AlignmentType.CENTER, after: 0 }),
        para(directorSigRuns, { align: AlignmentType.CENTER, before: 4, after: 0 })
      ] })
    ] }) ]
  });

  const children = [
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    para('ขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะ', { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para('การ' + buyOrHire + itemTitle + ' ในโครงการ' + projectName, { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para(SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { align: AlignmentType.CENTER, bold: true, after: 3 }),

    para('๑. ข้อมูลเกี่ยวกับโครงการ', { bold: true, after: 1 }),
    bodyPara('ชื่อโครงการ ' + projectName, { noIndent: true }),
    bodyPara('เงินงบประมาณตามโครงการ ' + totalAmountText, { noIndent: true }),
    bodyPara('ราคากลาง ' + totalAmountText, { noIndent: true, after: 3 }),

    para('๒. วัตถุประสงค์', { bold: true, after: 1 }),
    bodyPara('เพื่อ' + purpose, { noIndent: true, after: 3 }),

    para('๓. คุณสมบัติผู้ยื่นข้อเสนอ', { bold: true, after: 1 })
  ].concat(qualParas).concat([
    para('๔. รายละเอียดคุณลักษณะเฉพาะหรือขอบเขตของงาน', { bold: true, before: 2, after: 1 }),
    bodyPara('จัด' + buyOrHire + itemTitle + 'เพื่อใช้ประกอบการดำเนินงานในโครงการ' + projectName + 'ภายในวงเงินไม่เกิน ' +
      totalAmountText + ' โดยรายการที่จะขอ' + buyOrHireShort + 'ต้องประกอบไปด้วยรายละเอียดตามเอกสารแนบ', { noIndent: true, after: 3 }),

    para('๕. การเสนอราคา และกำหนดส่งมอบ', { bold: true, after: 1 }),
    para('1. ราคาที่เสนอจะต้องเสนอกำหนดยืนราคาไม่น้อยกว่า ' + DOC6_DEFAULT_TERM_DAYS + ' วัน นับแต่วันเสนอราคาโดยภายในกำหนดยืนราคา ' +
      'ผู้ยื่นข้อเสนอต้องรับผิดชอบราคาที่ตนได้เสนอไว้และจะถอนการเสนอราคามิได้', { noIndent: true, after: 0.5 }),
    para('2. กำหนดการส่งมอบพัสดุ หรือกำหนดให้งานแล้วเสร็จ ไม่เกิน ' + DOC6_DEFAULT_TERM_DAYS + ' วัน นับถัดจากวันลงนามในใบสั่ง' + buyOrHireShort + '/สัญญา ' +
      'หรือวันที่ได้รับหนังสือแจ้งให้ส่งมอบพัสดุ หรือวันที่ได้รับหนังสือแจ้งให้เริ่มทำงาน', { noIndent: true, after: 3 }),

    para('๖. ค่าปรับ', { bold: true, after: 1 }),
    bodyPara(penaltyText, { noIndent: true, after: 3 }),

    para('๗. การรับประกันความชำรุดบกพร่อง', { bold: true, after: 1 }),
    bodyPara('ระยะเวลารับประกันความชำรุดบกพร่อง ไม่น้อยกว่า - นับถัดจากวันที่โรงเรียนได้รับมอบ โดยผู้รับจ้าง/ผู้ขายต้องรีบจัดการซ่อมแซมแก้ไข' +
      'ให้ใช้การได้ดีดังเดิมภายใน - นับถัดจากวันที่ได้รับแจ้งความชำรุดบกพร่อง', { noIndent: true, after: 3 }),

    para('๘. เกณฑ์การพิจารณาผลการยื่นข้อเสนอ', { bold: true, after: 1 }),
    bodyPara(DOC6_EVALUATION_CRITERIA, { noIndent: true, after: 3 }),

    para('๙. งบประมาณในการดำเนินการ', { bold: true, after: 1 }),
    bodyPara('ในการจัดซื้อ/จัดจ้างครั้งนี้ ใช้งบประมาณ' + (detail.budget_source || '-') + ' โครงการ' + projectName + ' จำนวนเงิน ' + totalAmountText, { noIndent: true, after: 3 }),

    para('๑๐. หน่วยงานที่รับผิดชอบ', { bold: true, after: 1 }),
    bodyPara(SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { noIndent: true, after: 4 }),

    sigRow3
  ]);

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[6] + '.docx' };
}

// ---------- Doc 7: แนบ TOR (รายละเอียดแนบท้ายขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะ) ----------
// รูปแบบอ้างอิงจากไฟล์จริง "7 แนบ TOR.pdf" (OCR ตกวรรณยุกต์/สระหนักมาก ต้องสะกดใหม่เองทั้งหมดจากบริบท) —
// เป็นตารางรายการย่อยแนบท้าย Doc6 เหมือน Doc2 เป็นตารางแนบท้าย Doc1: หัวเรื่อง 3 บรรทัดรูปแบบเดียวกับ
// Doc6 (แค่บรรทัดแรกเปลี่ยนเป็น "รายละเอียดแนบท้าย...") + ตารางรายการย่อย (ใช้ subItemsTable() ตัวเดียวกับ
// Doc2/3/4 — คอลัมน์ตรงกันเป๊ะ: ลำดับที่/รายละเอียด/จำนวน/หน่วย/ราคาต่อหน่วย/จำนวนเงิน) + บรรทัดรวมภาษี
// มูลค่าเพิ่ม+จำนวนเงินตัวอักษร (pattern เดียวกับ Doc3) + ลายเซ็น 3 คนแบบเดียวกับ Doc6 (sigRow3)
async function buildDoc7(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }

  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
  const projectNameRaw = (item.projects && item.projects.name) || '-';
  const projectName = projectNameRaw.replace(/^โครงการ\s*/, '');
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
  const vatText = detail.vat_applicable ? fmt(totalAmount * 0.07) : '-';

  const committeeTor = detail.committee_tor || [];
  const designerEntry = committeeTor.find(function(c){ return c && c.staff_id && (c.role || '').indexOf('ผู้กำหนดรายละเอียด') >= 0; })
    || committeeTor.filter(function(c){ return c && c.staff_id; })[0];
  if(!designerEntry){
    alert('กรุณาระบุ "คณะกรรมการกำหนด TOR" (ผู้กำหนดรายละเอียดคุณลักษณะเฉพาะ) ในฟอร์มก่อนพิมพ์เอกสารนี้');
    return null;
  }
  const designerStaff = (STAFF_LIST || []).find(function(x){ return String(x.id) === String(designerEntry.staff_id); });
  const designerPrintName = designerStaff ? (designerStaff.prefix + designerStaff.name) : '-';

  const officer = findStaffByName(PROCUREMENT_OFFICER_NAME);
  const officerPrintName = officer ? (officer.prefix + officer.name) : PROCUREMENT_OFFICER_NAME;
  const director = findDirector();
  const directorSigRuns = director
    ? multiLineRuns(['ลงชื่อ .......................................', '(' + (director.prefix || '') + director.name + ')', 'ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : [ tr('ลงชื่อ .......................................') ];

  const sigRow3 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 34, type: WidthType.PERCENTAGE }, children: [
        para('ผู้กำหนดรายละเอียด', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 5, after: 0 }),
        para('(' + designerPrintName + ')', { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, children: [
        para('เจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 5, after: 0 }),
        para('(' + officerPrintName + ')', { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, children: [
        para('( )  เห็นชอบ      ( )  อนุมัติ', { align: AlignmentType.CENTER, after: 0 }),
        para(directorSigRuns, { align: AlignmentType.CENTER, before: 4, after: 0 })
      ] })
    ] }) ]
  });

  const children = [
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    para('รายละเอียดแนบท้ายขอบเขตของงานหรือรายละเอียดคุณลักษณะเฉพาะ', { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para('การ' + buyOrHire + itemTitle + ' ในโครงการ' + projectName, { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para(SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { align: AlignmentType.CENTER, bold: true, after: 3 }),
    subItemsTable(subItems, buyOrHireShort, totalAmount),
    bodyPara('รวมเป็นเงิน ' + fmt(totalAmount) + ' บาท ภาษีมูลค่าเพิ่ม ' + vatText + ' บาท จำนวนเงินตัวอักษร (' + thaiBahtText(totalAmount) + ')', { noIndent: true, before: 2, after: 4 }),
    sigRow3
  ];

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[7] + '.docx' };
}
