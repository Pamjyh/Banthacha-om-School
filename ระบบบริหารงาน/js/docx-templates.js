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
// ⚠️ ที่อยู่โรงเรียน (Doc13 เท่านั้น) — คัดลอกตรงจากไฟล์อ้างอิงจริง "13 สั่งซื้อสั่งจ้าง.pdf" ไม่มี field
// ใน DB สำหรับที่อยู่สถานศึกษา (คงที่ ไม่ผูกกับรายการพัสดุ จึงเป็น constant เหมือน SCHOOL_FULL_NAME)
const SCHOOL_ADDRESS = '66 หมู่ 6 ตำบลเขากวางทอง อำเภอหนองฉาง จังหวัดอุทัยธานี 61110';
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

// ⚠️ ข้อความมาตรฐาน Doc 8 (รายงานขอซื้อ/จ้าง) — คัดลอกจากไฟล์อ้างอิงจริง "8 ขอซื้อจ้าง.pdf" (OCR ตกวรรณยุกต์
// หนักมาก สะกดใหม่เองจากบริบท) เป็น constant คงที่เหมือน TOR_ORDER_LEGAL_BASIS/DOC6_* — อ้างอิงกฎหมาย
// จัดซื้อจัดจ้างมาตรฐานเดียวกันทุกรายการที่ใช้วิธีเฉพาะเจาะจง ไม่ผูกกับรายการพัสดุแต่ละอัน
// ⚠️ ย่อจากข้อความเต็ม (2026-07-22, รอบ 5 กันล้นหน้า 2) — เช็คระเบียบฯ 2560 ข้อ 22 แล้ว: กฎหมายกำหนด
// แค่ "รายการ" ที่ต้องมีในรายงานขอซื้อ/จ้าง 8 หมวด ไม่ได้บังคับถ้อยคำ/ต้องท่องชื่อเต็มของกฎหมายที่อ้างอิง
// ซ้ำทุกฉบับ — คงเลขมาตรา/ข้อไว้ครบ (มาตรา 56 วรรคหนึ่ง (2)(ข), ข้อ 22/79/25(5), ข้อ 1/5) ตัดแค่ชื่อเต็ม
// ของแต่ละฉบับที่ซ้ำกันออก (สาระทางกฎหมาย/เลขอ้างอิงยังครบ ตรวจสอบย้อนกลับได้เหมือนเดิม)
const DOC8_LEGAL_CITATION_MIDDLE = 'และเพื่อให้เป็นไปตามพระราชบัญญัติการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 มาตรา 56 วรรคหนึ่ง (2) (ข) ' +
  'และระเบียบกระทรวงการคลังฯ พ.ศ. 2560 ข้อ 22 ข้อ 79 ข้อ 25 (5) และกฎกระทรวงกำหนดวงเงินฯ พ.ศ. 2560 ข้อ 1 และข้อ 5';
// ⚠️ ย่อจากข้อความเต็ม (2026-07-22, Pam ขอลองย่อข้อ 6 กันล้นหน้า 2) — สาระสำคัญ (วงเงินไม่เกิน
// 500,000 บาท ตามกฎกระทรวง) ยังอยู่ครบ ส่วนที่ตัดออก (รายละเอียดประเภทสินค้า/บริการ/ก่อสร้าง) เป็นการ
// อธิบายซ้ำกับที่ DOC8_LEGAL_CITATION_MIDDLE อ้างอิงกฎกระทรวงเต็มไว้แล้วในย่อหน้าเปิดเรื่อง
const DOC8_METHOD_JUSTIFICATION = 'เนื่องจากมีวงเงินในการจัดซื้อจัดจ้างครั้งหนึ่งไม่เกิน 500,000 บาท ตามที่กำหนดในกฎกระทรวง';

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
    // ⚠️ line:240/lineRule:'auto' = ระยะบรรทัดเดี่ยว (single) ชัดเจน (2026-07-22, Pam: "หลายอันยังเกิน 1
    // แผ่น A4") — ไม่ตั้งมาก่อนหน้านี้ ปล่อยให้ Word ใช้ default ของตัวเอง ซึ่งวัดจริงด้วย LibreOffice
    // --headless (ดู comment เต็มที่ buildDoc6) แล้วพบว่า default ไม่ใช่ single จริง (กว้างกว่าที่คิด) การ
    // ระบุ single ชัดเจนทุกย่อหน้าประหยัดพื้นที่แนวตั้งได้มากกว่าลด "after" ของแต่ละย่อหน้ารวมกันเสียอีก
    spacing: { before: mm(opts.before || 0), after: mm(opts.after == null ? 1.5 : opts.after), line: 240, lineRule: 'auto' }
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
    spacing: { before: mm(1), after: mm(1.5) },
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
    spacing: { after: mm(2) },
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
      cell(fmt(Number(r.unit_price) || 0), { align: AlignmentType.RIGHT }),
      cell(fmt(Number(r.amount) || 0), { align: AlignmentType.RIGHT })
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
  if(docIndex === 8) return await buildDoc8(procItemId, opts);
  if(docIndex === 9) return await buildDoc9(procItemId, opts);
  if(docIndex === 10) return await buildDoc10(procItemId, opts);
  if(docIndex === 11) return await buildDoc11(procItemId, opts);
  if(docIndex === 12) return await buildDoc12(procItemId, opts);
  if(docIndex === 13) return await buildDoc13(procItemId, opts);
  if(docIndex === 14) return await buildDoc14(procItemId, opts);
  alert('เอกสารชุดนี้ (#' + docIndex + ' ' + (PD_DOC_NAMES[docIndex] || '') + ') ยังไม่พร้อมใช้งาน — กำลังสร้างทีละชุดตามลำดับ');
  return null;
}

// ปุ่ม "ดาวน์โหลดรวมทั้งชุด" — รวมทุกเอกสารที่พร้อมใช้งาน (ตอนนี้ 1-4) เป็นไฟล์เดียว คั่นแต่ละเอกสารด้วย
// page break (pageBreakBefore บนรูปครุฑของเอกสารถัดไป) ถ้าเอกสารใดยังขาดข้อมูลจำเป็น (วันที่/กรรมการ/
// รายการย่อย) builder ของเอกสารนั้นจะ alert เองแล้วคืน null — หยุดทั้งชุดทันที ไม่สร้างไฟล์รวมที่เอกสารขาดไป
const DOCX_AVAILABLE_DOCS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // เพิ่มเลขที่นี่ทุกครั้งที่ Doc ถัดไปสร้างเสร็จ+ผ่าน PASS GATE
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
  // ⚠️ VAT ต้องบวกเข้ายอดจริง ไม่ใช่แค่โชว์ตัวเลขแยก (scrutinize F1, 2026-07-25) — ก่อนหน้านี้คำนวณ vatText
  // ไว้แต่ "จำนวนเงินตัวอักษร" ยังอ้างอิง totalAmount เดิม ไม่เคยบวก VAT เข้าไปเลย ขัดกับเจตนาดั้งเดิมที่เขียนไว้
  // ใน pdf-templates.js ("บวกเพิ่ม 7% จากยอดรวม") ตั้งแต่รอบ pivot แรก
  const vatAmount = detail.vat_applicable ? totalAmount * 0.07 : 0;
  const grandTotal = totalAmount + vatAmount;
  const vatText = detail.vat_applicable ? fmt(vatAmount) : '-';

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
    bodyPara('รวมเป็นเงิน ' + fmt(totalAmount) + ' บาท ภาษีมูลค่าเพิ่ม ' + vatText + ' บาท จำนวนเงินตัวอักษร (' + thaiBahtText(grandTotal) + ')', { noIndent: true, before: 2 }),
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
    para(SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { align: AlignmentType.CENTER, bold: true, after: 2 }),

    // ⚠️ ระยะห่างหัวข้อ/เนื้อหา 10 หัวข้อ ปรับให้แน่นลงรอบ 2026-07-22 (Pam: "หลายอันยังเกิน 1 แผ่น A4")
    // วัดจำนวนหน้าจริงด้วย LibreOffice --headless แปลง .docx→.pdf (font TH SarabunPSK เรียกชื่อ "TH Sarabun
    // New" ในสภาพแวดล้อม build — metric ใกล้เคียงฟอนต์จริงมากกว่าฟอนต์ทดแทนเดิม) ไม่ใช่การเดา — ก่อนแก้ Doc6
    // ยาวล้นไปหน้า 2 ตั้งแต่ประมาณหัวข้อ ๕ แก้แล้วเหลือ 1 หน้าพอดี (ยืนยันซ้ำด้วย pdfinfo หลังแก้ทุกรอบ)
    para('๑. ข้อมูลเกี่ยวกับโครงการ', { bold: true, after: 0.5 }),
    bodyPara('ชื่อโครงการ ' + projectName, { noIndent: true }),
    bodyPara('เงินงบประมาณตามโครงการ ' + totalAmountText, { noIndent: true }),
    bodyPara('ราคากลาง ' + totalAmountText, { noIndent: true, after: 1.5 }),

    para('๒. วัตถุประสงค์', { bold: true, after: 0.5 }),
    bodyPara('เพื่อ' + purpose, { noIndent: true, after: 1.5 }),

    para('๓. คุณสมบัติผู้ยื่นข้อเสนอ', { bold: true, after: 0.5 })
  ].concat(qualParas).concat([
    para('๔. รายละเอียดคุณลักษณะเฉพาะหรือขอบเขตของงาน', { bold: true, before: 1, after: 0.5 }),
    // ⚠️ ไม่ใส่ "จัด" นำหน้า buyOrHire (scrutinize F2, 2026-07-25) — buyOrHire เป็นคำเต็ม 'จัดจ้าง'/'จัดซื้อ'
    // อยู่แล้ว เคยเขียน 'จัด' + buyOrHire ได้ "จัดจัดจ้าง" คำซ้ำ (บั๊กคลาสเดียวกับที่แก้ไปแล้วใน Doc8/Doc10)
    bodyPara(buyOrHire + itemTitle + 'เพื่อใช้ประกอบการดำเนินงานในโครงการ' + projectName + 'ภายในวงเงินไม่เกิน ' +
      totalAmountText + ' โดยรายการที่จะขอ' + buyOrHireShort + 'ต้องประกอบไปด้วยรายละเอียดตามเอกสารแนบ', { noIndent: true, after: 1.5 }),

    para('๕. การเสนอราคา และกำหนดส่งมอบ', { bold: true, after: 0.5 }),
    para('1. ราคาที่เสนอจะต้องเสนอกำหนดยืนราคาไม่น้อยกว่า ' + DOC6_DEFAULT_TERM_DAYS + ' วัน นับแต่วันเสนอราคาโดยภายในกำหนดยืนราคา ' +
      'ผู้ยื่นข้อเสนอต้องรับผิดชอบราคาที่ตนได้เสนอไว้และจะถอนการเสนอราคามิได้', { noIndent: true, after: 0.5 }),
    para('2. กำหนดการส่งมอบพัสดุ หรือกำหนดให้งานแล้วเสร็จ ไม่เกิน ' + DOC6_DEFAULT_TERM_DAYS + ' วัน นับถัดจากวันลงนามในใบสั่ง' + buyOrHireShort + '/สัญญา ' +
      'หรือวันที่ได้รับหนังสือแจ้งให้ส่งมอบพัสดุ หรือวันที่ได้รับหนังสือแจ้งให้เริ่มทำงาน', { noIndent: true, after: 1.5 }),

    para('๖. ค่าปรับ', { bold: true, after: 0.5 }),
    bodyPara(penaltyText, { noIndent: true, after: 1.5 }),

    para('๗. การรับประกันความชำรุดบกพร่อง', { bold: true, after: 0.5 }),
    bodyPara('ระยะเวลารับประกันความชำรุดบกพร่อง ไม่น้อยกว่า - นับถัดจากวันที่โรงเรียนได้รับมอบ โดยผู้รับจ้าง/ผู้ขายต้องรีบจัดการซ่อมแซมแก้ไข' +
      'ให้ใช้การได้ดีดังเดิมภายใน - นับถัดจากวันที่ได้รับแจ้งความชำรุดบกพร่อง', { noIndent: true, after: 1.5 }),

    para('๘. เกณฑ์การพิจารณาผลการยื่นข้อเสนอ', { bold: true, after: 0.5 }),
    bodyPara(DOC6_EVALUATION_CRITERIA, { noIndent: true, after: 1.5 }),

    para('๙. งบประมาณในการดำเนินการ', { bold: true, after: 0.5 }),
    bodyPara('ในการจัดซื้อ/จัดจ้างครั้งนี้ ใช้งบประมาณ' + (detail.budget_source || '-') + ' โครงการ' + projectName + ' จำนวนเงิน ' + totalAmountText, { noIndent: true, after: 1.5 }),

    para('๑๐. หน่วยงานที่รับผิดชอบ', { bold: true, after: 0.5 }),
    bodyPara(SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { noIndent: true, after: 2 }),

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
  // ⚠️ VAT ต้องบวกเข้ายอดจริง (scrutinize F1, 2026-07-25) — ดู comment เต็มใน buildDoc3
  const vatAmount = detail.vat_applicable ? totalAmount * 0.07 : 0;
  const grandTotal = totalAmount + vatAmount;
  const vatText = detail.vat_applicable ? fmt(vatAmount) : '-';

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
    bodyPara('รวมเป็นเงิน ' + fmt(totalAmount) + ' บาท ภาษีมูลค่าเพิ่ม ' + vatText + ' บาท จำนวนเงินตัวอักษร (' + thaiBahtText(grandTotal) + ')', { noIndent: true, before: 2, after: 4 }),
    sigRow3
  ];

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[7] + '.docx' };
}

// ---------- Doc 8: รายงานขอซื้อ/จ้าง ----------
// รูปแบบอ้างอิงจากไฟล์จริง "8 ขอซื้อจ้าง.pdf" (OCR ตกวรรณยุกต์หนักมาก สะกดใหม่เองจากบริบท) — บันทึกข้อความ
// (pattern เดียวกับ Doc1/3/5) รายงานขออนุมัติซื้อ/จ้างจริง อ้างอิงกฎหมาย (constant DOC8_* ด้านบน) แล้วขอ
// อนุมัติ 2 เรื่องพร้อมกัน: (1) เห็นชอบรายงาน (2) แต่งตั้งผู้ตรวจรับพัสดุ (committee_inspect — คนละชุดกับ
// committee_tor ของ Doc3/4/5) — ใช้ detail.date_request_buy (field ใหม่ "ขอซื้อ/จ้าง" แยกจาก date อื่นทั้งหมด)
// ลายเซ็น: เจ้าหน้าที่/หัวหน้าเจ้าหน้าที่ 2-col แบบ Doc3 (ไม่มี checkbox ในนี้) + ผอ. ด้านล่างมี checkbox
// เห็นชอบ/อนุมัติ + วันที่กำกับแบบ Doc5 (ผสมรูปแบบ Doc3+Doc5 ตามที่ไฟล์จริงแสดง)
async function buildDoc8(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_request_buy){ alert('กรุณากรอก "วันที่ขอซื้อ/จ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
  const projectNameRaw = (item.projects && item.projects.name) || '-';
  const projectName = projectNameRaw.replace(/^โครงการ\s*/, '');
  const purpose = detail.tor_objective || item.title || '-';
  const itemTitle = item.title || '-';
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
  const totalAmountText = fmt(totalAmount) + ' บาท (' + thaiBahtText(totalAmount) + ')';

  const inspectCommittee = (detail.committee_inspect || [])
    .filter(function(c){ return c && c.staff_id; })
    .map(function(c){
      const s = (STAFF_LIST || []).find(function(x){ return String(x.id) === String(c.staff_id); });
      return { name: s ? (s.prefix + s.name) : '-', position: s ? (s.position || '-') : '-', role: c.role || 'กรรมการ' };
    });
  if(!inspectCommittee.length){
    alert('กรุณาระบุ "คณะกรรมการตรวจรับพัสดุ" อย่างน้อย 1 คนในฟอร์มก่อนพิมพ์เอกสารนี้');
    return null;
  }
  const inspectParas = inspectCommittee.map(function(c, i){
    return para((i + 1) + '. ' + c.name + ' ตำแหน่ง ' + c.position + ' ' + c.role, { noIndent: true, after: 0.2 });
  });

  const officer = findStaffByName(PROCUREMENT_OFFICER_NAME);
  const officerPrintName = officer ? (officer.prefix + officer.name) : PROCUREMENT_OFFICER_NAME;
  const head = findStaffByName(PROCUREMENT_HEAD_NAME);
  const headPrintName = head ? (head.prefix + head.name) : PROCUREMENT_HEAD_NAME;
  const director = findDirector();
  // ⚠️ รวม checkbox+ลายเซ็น+วันที่ ผอ. เป็นย่อหน้าเดียว (2026-07-22, Pam ยืนยัน Word จริงล้นไปหน้า 2
  // "9 บรรทัดครับ") — เดิมแยก 4 ย่อหน้า (checkbox/ลงชื่อ+ชื่อ+ตำแหน่ง/วันที่) ผ่าน spacer 2 อัน คั่นหน้า-หลัง
  // sigRow รวมกันเป็นย่อหน้าเดียวด้วย multiLineRuns ตัดช่องว่างระหว่างย่อหน้าที่ Word แทรกเองทิ้งไปหลายบรรทัด
  // ⚠️ รอบ 3 (2026-07-22) — รวมบรรทัดชื่อ+ตำแหน่งเป็นบรรทัดเดียว (พบว่ายังพอมีที่ว่างกว้างพอ ไม่ทำให้ตัดคำ)
  // ลดจาก 5 บรรทัดเหลือ 4 บรรทัด ประหยัดพื้นที่แนวตั้งเพิ่มอีกเล็กน้อย
  // ⚠️ รอบ 4 (2026-07-22, ค่าสุดท้าย) — ลองรวมเป็นบรรทัดเดียวทั้งหมดแล้วแต่ wrap เอง (โรงเรียนบ้านท่าชะอม
  // ยาวเกิน) ไม่ได้อะไรเพิ่ม กลับมาใช้ 2 บรรทัด (checkbox+ลงชื่อ+วันที่ / ชื่อ+ตำแหน่ง) อ่านง่ายกว่า
  const directorBlockRuns = director
    ? multiLineRuns(['( )  เห็นชอบ      ( )  อนุมัติ        ลงชื่อ .......................................        วันที่ ' + fmtDateThai(detail.date_request_buy),
        '(' + (director.prefix || '') + director.name + ')  ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : multiLineRuns(['( )  เห็นชอบ      ( )  อนุมัติ        ลงชื่อ .......................................']);

  const sigRow = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    // ⚠️ cellMargin top/bottom:0 (2026-07-22) — docx.js ค่า default ~100 twips (~1.76mm) ต่อ cell ตัดออก
    // เพราะเราคุมระยะห่างภายใน cell เองผ่าน para 'before' อยู่แล้ว ไม่ต้องการ margin ซ้ำซ้อน
    cellMargin: { top: 0, bottom: 0, left: 100, right: 100 },
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('เจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 1, after: 0 }),
        para('(' + officerPrintName + ')', { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('หัวหน้าเจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 1, after: 0 }),
        para('(' + headPrintName + ')', { align: AlignmentType.CENTER, after: 0 })
      ] })
    ] }) ]
  });

  // ⚠️ รอบ 2 (2026-07-22) — Pam ยืนยัน Word จริงล้นไปหน้า 2 พอดี "9 บรรทัดครับ" รอบแรก (รวมย่อหน้า
  // checkbox+ลายเซ็นเป็นก้อนเดียว) ยังไม่พอ ตัดเพิ่มอีก: after ของ list เลข 1-8/1-2 ทั้งหมด 0.5mm->0.2mm,
  // cellMargin ตาราง sigRow, before ของเส้นลงชื่อในตาราง 3mm->1mm, before ของ directorBlockRuns 2mm->0.5mm
  const children = [
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    para('บันทึกข้อความ', { align: AlignmentType.CENTER, bold: true, size: 29, after: 1.5, exactLinePt: 35 }),
    headerLine('ส่วนราชการ  ', SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { after: 0.5 }),
    titleRow('ที่  ', bareDocNumber, 'วันที่  ', fmtDateThai(detail.date_request_buy)),
    headerLine('เรื่อง  ', 'รายงานขอ' + buyOrHireShort + itemTitle, { after: 0.5 }),
    hrPara(),
    para('เรียน  ผู้อำนวยการ' + SCHOOL_FULL_NAME, { after: 0.5 }),
    bodyPara('ด้วย ' + SCHOOL_ADMIN_GROUP + ' ' + SCHOOL_FULL_NAME + ' มีความประสงค์จะขอทำการ' + buyOrHire + itemTitle +
      ' จำนวน ' + subItems.length + ' รายการ เพื่อ' + purpose + ' ซึ่งได้รับอนุมัติเงินจากงาน/โครงการ' + projectName +
      ' จำนวน ' + totalAmountText + ' รายละเอียดดังแนบ', { after: 0.5 }),
    // ⚠️ "ดำเนินการ" ไม่ใส่ "จัด" ต่อท้าย (scrutinize F2, 2026-07-25) — จุดที่ 2 ของบั๊กคำซ้ำใน Doc8 (คนละจุด
    // กับ "6. " ที่เคยแก้ไปแล้ว 2026-07-22) buyOrHire เป็นคำเต็ม 'จัดจ้าง'/'จัดซื้อ' อยู่แล้ว
    bodyPara('งานพัสดุได้ตรวจสอบแล้วเห็นควรดำเนินการ' + buyOrHire + 'ตามเสนอ ' + DOC8_LEGAL_CITATION_MIDDLE + ' จึงขอรายงานขอ' + buyOrHireShort + ' ดังนี้', { after: 0.5 }),
    para('1. เหตุผลและความจำเป็นที่ต้อง' + buyOrHireShort + ' คือ ' + purpose, { noIndent: true, after: 0.2 }),
    para('2. รายละเอียดพัสดุและวงเงินที่จะขอ' + buyOrHireShort + 'มีรายละเอียดตามเอกสารแนบท้าย', { noIndent: true, after: 0.2 }),
    para('3. ราคากลางของพัสดุที่จะขอ' + buyOrHireShort + 'เป็นเงิน ' + totalAmountText, { noIndent: true, after: 0.2 }),
    para('4. วงเงินที่จะขอ' + buyOrHireShort + 'ในครั้งนี้ ' + totalAmountText, { noIndent: true, after: 0.2 }),
    para('5. กำหนดเวลาที่ต้องการใช้พัสดุ ภายใน ' + DOC6_DEFAULT_TERM_DAYS + ' วัน นับถัดจากวันลงนามในสัญญา', { noIndent: true, after: 0.2 }),
    para('6. ' + buyOrHire + 'โดยวิธีเฉพาะเจาะจง ' + DOC8_METHOD_JUSTIFICATION, { noIndent: true, after: 0.2 }),
    para('7. หลักเกณฑ์การพิจารณาคัดเลือกข้อเสนอโดยใช้เกณฑ์ราคา', { noIndent: true, after: 0.2 }),
    para('8. ข้อเสนออื่น ๆ เห็นควรแต่งตั้งผู้ตรวจรับพัสดุ ตามเสนอ', { noIndent: true, after: 0.5 }),
    bodyPara('จึงเรียนมาเพื่อโปรดพิจารณา', { after: 0.5 }),
    para('1. เห็นชอบในรายงานขอ' + buyOrHireShort + 'ดังกล่าวข้างต้น', { noIndent: true, after: 0.2 }),
    para('2. อนุมัติให้แต่งตั้งบุคคลดังต่อไปนี้เป็นผู้ตรวจรับพัสดุ', { noIndent: true, after: 0.2 })
  ].concat(inspectParas).concat([
    sigRow,
    para(directorBlockRuns, { align: AlignmentType.CENTER, before: 0.5, after: 0 })
  ]);

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[8] + '.docx' };
}

// ---------- Doc 9: แนบท้าย (รายละเอียดแนบท้ายบันทึกข้อความรายงานขอซื้อ/จ้าง) ----------
// อ้างอิงไฟล์จริง "9 แนบท้าย.pdf" (OCR ตกวรรณยุกต์หนัก สะกดใหม่จากบริบท) — แนบท้าย Doc8 (บันทึกข้อความ
// รายงานขอซื้อ/จ้าง) เหมือน Doc7 แนบท้าย Doc6: หัวเรื่องอ้างอิงเลขที่/วันที่ของ Doc8 (ใช้ date_request_buy
// ตัวเดียวกับ Doc8) + ตารางรายการย่อย (subItemsTable ตัวเดียวกับ Doc2/3/4/7) + รวมภาษีมูลค่าเพิ่ม (pattern
// เดียวกับ Doc3/7) + ลายเซ็น 2 คน (เจ้าหน้าที่/หัวหน้าเจ้าหน้าที่ พร้อมวันที่กำกับ ตรงกับที่ต้นฉบับจริงแสดง)
// ⚠️ ข้อสมมติฐานใหม่ (เหมือน DOC6_DEFAULT_TERM_DAYS/VAT ก่อนหน้า): ต้นฉบับจริงมีเช็คบ็อกซ์ที่มาราคา
// "( ) ราคามาตรฐาน (/) ราคาที่ได้มาจากการสืบจากท้องตลาด" ซึ่งไม่มี field ใน DB รองรับ — hardcode ให้ติ๊ก
// "สืบจากท้องตลาด" ตามที่ต้นฉบับจริงแสดง (ราคาปกติของงานเล็กๆ แบบนี้มักมาจากการสืบราคา ไม่ใช่ราคามาตรฐาน
// ที่มีประกาศทางการ) — ถ้า Pam มีรายการที่ใช้ราคามาตรฐานจริง ต้องแจ้งเพื่อเพิ่ม field แยกในฟอร์ม
async function buildDoc9(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_request_buy){ alert('กรุณากรอก "วันที่ขอซื้อ/จ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

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
  // ⚠️ VAT ต้องบวกเข้ายอดจริง (scrutinize F1, 2026-07-25) — ดู comment เต็มใน buildDoc3
  const vatAmount = detail.vat_applicable ? totalAmount * 0.07 : 0;
  const grandTotal = totalAmount + vatAmount;
  const vatText = detail.vat_applicable ? fmt(vatAmount) : '-';

  const officer = findStaffByName(PROCUREMENT_OFFICER_NAME);
  const officerPrintName = officer ? (officer.prefix + officer.name) : PROCUREMENT_OFFICER_NAME;
  const head = findStaffByName(PROCUREMENT_HEAD_NAME);
  const headPrintName = head ? (head.prefix + head.name) : PROCUREMENT_HEAD_NAME;

  const sigRow2 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('เจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 4, after: 0 }),
        para('(' + officerPrintName + ')', { align: AlignmentType.CENTER, after: 0 }),
        para('วันที่ ' + fmtDateThai(detail.date_request_buy), { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('หัวหน้าเจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 4, after: 0 }),
        para('(' + headPrintName + ')', { align: AlignmentType.CENTER, after: 0 }),
        para('วันที่ ' + fmtDateThai(detail.date_request_buy), { align: AlignmentType.CENTER, after: 0 })
      ] })
    ] }) ]
  });

  const children = [
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    para('รายละเอียดแนบท้ายบันทึกข้อความที่ ' + bareDocNumber + ' ลงวันที่ ' + fmtDateThai(detail.date_request_buy), { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para('เรื่อง รายงานขอ' + buyOrHireShort + itemTitle + ' จำนวน ' + subItems.length + ' รายการ', { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para(SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL, { align: AlignmentType.CENTER, bold: true, after: 3 }),
    subItemsTable(subItems, buyOrHireShort, totalAmount),
    para('( )  ราคามาตรฐาน      (/)  ราคาที่ได้มาจากการสืบจากท้องตลาด', { noIndent: true, before: 1, after: 1 }),
    bodyPara('รวมเป็นเงิน ' + fmt(totalAmount) + ' บาท ภาษีมูลค่าเพิ่ม ' + vatText + ' บาท จำนวนเงินตัวอักษร (' + thaiBahtText(grandTotal) + ')', { noIndent: true, before: 1, after: 3 }),
    sigRow2
  ];

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[9] + '.docx' };
}

// ---------- Doc 10: พิจารณา (รายงานผลการพิจารณาและขออนุมัติสั่งซื้อ/จ้าง) ----------
// อ้างอิงไฟล์จริง "10 พิจารณา.pdf" (OCR ตกวรรณยุกต์หนัก+เรียงสลับ สะกด/จัดลำดับใหม่จากบริบท) — บันทึกข้อความ
// (pattern เดียวกับ Doc1/3/5/8) รายงานผลการเจรจาต่อรองราคากับร้านค้า/ผู้รับจ้างที่เลือกไว้ (Section B —
// detail.vendor_id) แล้วขออนุมัติสั่งซื้อ/จ้างจริง อ้างอิงระเบียบข้อ 24 (ต่อจากที่ ผอ.เห็นชอบรายงานขอซื้อ/
// จ้าง Doc8 ตามข้อ 22 แล้ว) และข้อ 79 (วิธีเฉพาะเจาะจง) — ลายเซ็นโครงสร้างเดียวกับ Doc8 เป๊ะ (sigRow 2 คน
// เจ้าหน้าที่/หัวหน้าเจ้าหน้าที่ ไม่มี checkbox + ผอ. แยกบล็อกมี checkbox เห็นชอบ/อนุมัติ+ลงชื่อ+วันที่)
// ⚠️ ข้อสมมติฐาน (เหมือน Doc9 ก่อนหน้า): ต้นฉบับจริงใช้ "ที่ 51/2569 วันที่ 15 มิถุนายน 2569" ตัวเดียวกับ
// Doc8 เป๊ะ (ไม่มี field วันที่แยกสำหรับ "วันที่พิจารณา" ใน DB) — ใช้ detail.doc_number/date_request_buy
// ซ้ำเหมือน Doc8 ทั้งคู่ ถ้า Pam ต้องการแยกวันที่พิจารณาออกจากวันที่รายงานขอซื้อ/จ้าง ต้องเพิ่ม field ใหม่
async function buildDoc10(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_request_buy){ alert('กรุณากรอก "วันที่ขอซื้อ/จ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }
  if(!detail.vendor_id){ alert('กรุณาเลือก "ร้านค้า/ผู้รับจ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const vendor = (VENDORS_LIST || []).find(function(v){ return String(v.id) === String(detail.vendor_id); });
  if(!vendor){ alert('ไม่พบข้อมูลร้านค้า/ผู้รับจ้างที่เลือกไว้ กรุณาตรวจสอบในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }
  const vendorName = vendor.name || '-';

  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
  const vendorOccupation = buyOrHireShort === 'ซื้อ' ? 'ขาย' : 'รับจ้าง';
  const vendorRole = buyOrHireShort === 'ซื้อ' ? 'ผู้ขาย' : 'ผู้รับจ้าง';
  const bareDocNumber = (detail.doc_number || '').replace(/^[ก-๙]+\./, '');
  const itemTitle = item.title || '-';
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
  const totalAmountText = fmt(totalAmount) + ' บาท (' + thaiBahtText(totalAmount) + ')';

  const officer = findStaffByName(PROCUREMENT_OFFICER_NAME);
  const officerPrintName = officer ? (officer.prefix + officer.name) : PROCUREMENT_OFFICER_NAME;
  const head = findStaffByName(PROCUREMENT_HEAD_NAME);
  const headPrintName = head ? (head.prefix + head.name) : PROCUREMENT_HEAD_NAME;
  const director = findDirector();

  const directorBlockRuns = director
    ? multiLineRuns(['( )  เห็นชอบ      ( )  อนุมัติ', 'ลงชื่อ .......................................        วันที่ ' + fmtDateThai(detail.date_request_buy),
        '(' + (director.prefix || '') + director.name + ')  ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : multiLineRuns(['( )  เห็นชอบ      ( )  อนุมัติ', 'ลงชื่อ .......................................']);

  const sigRow = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('เจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 1, after: 0 }),
        para('(' + officerPrintName + ')', { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('หัวหน้าเจ้าหน้าที่', { align: AlignmentType.CENTER, after: 0 }),
        para('ลงชื่อ .......................................', { align: AlignmentType.CENTER, before: 1, after: 0 }),
        para('(' + headPrintName + ')', { align: AlignmentType.CENTER, after: 0 })
      ] })
    ] }) ]
  });

  const children = [
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    para('บันทึกข้อความ', { align: AlignmentType.CENTER, bold: true, size: 29, after: 2, exactLinePt: 35 }),
    headerLine('ส่วนราชการ  ', SCHOOL_FULL_NAME + ' ' + SCHOOL_EDU_OFFICE_FULL),
    titleRow('ที่  ', bareDocNumber, 'วันที่  ', fmtDateThai(detail.date_request_buy)),
    headerLine('เรื่อง  ', 'รายงานผลการพิจารณาและขออนุมัติสั่ง' + buyOrHireShort + itemTitle),
    hrPara(),
    para('เรียน  ผู้อำนวยการ' + SCHOOL_FULL_NAME, { after: 1 }),
    bodyPara('ตามที่ ' + SCHOOL_ADMIN_GROUP + ' ' + SCHOOL_FULL_NAME + ' มีความประสงค์จะขอทำการ' + buyOrHire + itemTitle +
      ' จำนวน ' + subItems.length + ' รายการ เพื่อ' + purpose + ' จำนวน ' + totalAmountText +
      ' ตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ข้อ 24 รายละเอียดดังแนบ', { after: 1 }),
    bodyPara('ในการนี้ เจ้าหน้าที่ได้เจรจาตกลงราคากับ' + vendorName + ' ซึ่งมีอาชีพ' + vendorOccupation + 'แล้ว ปรากฏว่าเสนอราคาเป็นเงิน ' +
      totalAmountText + ' ดังนั้นเพื่อให้เป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ข้อ 79 จึงเห็นควร' +
      buyOrHire + 'จากผู้เสนอราคารายดังกล่าว', { after: 1 }),
    bodyPara('จึงเรียนมาเพื่อโปรดทราบและพิจารณา', { after: 1 }),
    para('1. อนุมัติให้สั่ง' + buyOrHireShort + 'กับ ' + vendorName + ' เป็น' + vendorRole + 'พัสดุ ' + itemTitle + ' จำนวน ' + subItems.length +
      ' รายการ ในวงเงิน ' + totalAmountText + ' กำหนดเวลาส่งมอบพัสดุภายใน ' + DOC6_DEFAULT_TERM_DAYS + ' วันนับถัดจากวันลงนามสัญญา', { noIndent: true, after: 0.5 }),
    para('2. ลงนามในใบสั่ง' + buyOrHireShort + ' ดังแนบ', { noIndent: true, after: 1 }),
    sigRow,
    para(directorBlockRuns, { align: AlignmentType.CENTER, before: 1, after: 0 })
  ];

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[10] + '.docx' };
}

// ---------- Doc 11: คำสั่งตรวจรับ (คำสั่งแต่งตั้งผู้ตรวจรับพัสดุ) ----------
// อ้างอิงไฟล์จริง "11 คำสั่ง.pdf" (OCR ตกวรรณยุกต์/สระหนักมาก สะกดใหม่จากบริบท) — โครงสร้าง "คำสั่ง" เดียวกับ
// Doc4 เป๊ะ (garudaKind:'order' 3ซม.กึ่งกลาง, "คำสั่ง{ชื่อรร.} / ที่ {เลขที่} / เรื่อง...") แต่แต่งตั้ง
// ผู้ตรวจรับพัสดุ (detail.committee_inspect — ชุดเดียวกับ Doc8) แทนผู้กำหนด TOR — อ้างระเบียบข้อ 175
// ⚠️ ข้อสมมติฐาน (เหมือน Doc9/10): ต้นฉบับจริงใช้ "ที่ 51/2569 สั่ง ณ วันที่ 15 มิถุนายน 2569" ตัวเดียวกับ
// Doc8/9/10 เป๊ะ — ไม่มี field วันที่แยกสำหรับคำสั่งฉบับนี้ใน DB จึงใช้ doc_number/date_request_buy ซ้ำ
async function buildDoc11(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_request_buy){ alert('กรุณากรอก "วันที่ขอซื้อ/จ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

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
  const itemCount = subItems.length;

  const inspectCommittee = (detail.committee_inspect || [])
    .filter(function(c){ return c && c.staff_id; })
    .map(function(c){
      const s = (STAFF_LIST || []).find(function(x){ return String(x.id) === String(c.staff_id); });
      return { name: s ? (s.prefix + s.name) : '-', position: s ? (s.position || '-') : '-', role: c.role || 'กรรมการ' };
    });
  if(!inspectCommittee.length){
    alert('กรุณาระบุ "คณะกรรมการตรวจรับพัสดุ" อย่างน้อย 1 คนในฟอร์มก่อนพิมพ์เอกสารนี้');
    return null;
  }
  let inspectParas = [];
  inspectCommittee.forEach(function(c, i){
    inspectParas.push(para((i + 1) + '. ' + c.name, { noIndent: true, before: i === 0 ? 1 : 2, after: 0 }));
    inspectParas.push(para('ตำแหน่ง ' + c.position + ' ' + c.role, { noIndent: true, after: 0 }));
  });

  const director = findDirector();
  const directorSigRuns = director
    ? multiLineRuns(['ลงชื่อ .......................................', '(' + (director.prefix || '') + director.name + ')', 'ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : [ tr('ลงชื่อ .......................................') ];

  const children = [
    garudaPara(Object.assign({ garudaKind: 'order' }, opts)),
    para('คำสั่ง' + SCHOOL_FULL_NAME, { align: AlignmentType.CENTER, bold: true, size: 20, after: 0 }),
    para('ที่ ' + bareDocNumber, { align: AlignmentType.CENTER, bold: true, size: 20, after: 4 }),
    para('เรื่อง แต่งตั้งผู้ตรวจรับพัสดุ สำหรับการ' + buyOrHire + itemTitle + ' โดยวิธีเฉพาะเจาะจง', { align: AlignmentType.CENTER, bold: true, after: 3 }),
    hrPara(),
    bodyPara('ด้วย' + SCHOOL_FULL_NAME + ' มีความประสงค์ขอทำการ' + buyOrHire + itemTitle + ' จำนวน ' + itemCount +
      ' รายการ โดยวิธีเฉพาะเจาะจง และเพื่อให้เป็นไปตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 จึงขอแต่งตั้งรายชื่อต่อไปนี้เป็นผู้ตรวจรับพัสดุ ดังนี้')
  ].concat(inspectParas).concat([
    bodyPara('ให้คณะกรรมการฯ ถือปฏิบัติตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 (ข้อ 175)', { before: 2 }),
    // "สั่ง ณ วันที่..." เยื้อง 5 ซม. (ไม่ใช่กึ่งกลาง) ตามมาตรฐาน — เหมือน Doc4
    para('สั่ง ณ วันที่ ' + fmtDateThai(detail.date_request_buy), { align: AlignmentType.LEFT, leftIndent: ORDER_DATE_INDENT_MM, before: 2, after: 0 }),
    para('', { after: 6 }),
    para(directorSigRuns, { align: AlignmentType.CENTER, after: 0 })
  ]);

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[11] + '.docx' };
}

// ---------- Doc 12: ประกาศผู้ชนะ (ประกาศผู้ชนะการเสนอราคา) ----------
// อ้างอิงไฟล์จริง "12 ประกาศ.pdf" (OCR ตกวรรณยุกต์+เรียงสลับลำดับ สะกด/จัดลำดับใหม่จากบริบท) — เป็น
// "ประกาศ" สาธารณะ (ไม่ใช่บันทึกข้อความ/คำสั่ง) **ไม่มีเลข "ที่" กำกับ** ต่างจาก Doc4/8/9/10/11 ทุกฉบับ
// ที่มี doc_number แสดงในเนื้อหา (ตรงกับธรรมเนียมจริง — ประกาศผู้ชนะฯ ปิดประกาศสาธารณะ ไม่ใช้เลขที่หนังสือ
// ภายใน) — อ้างอิงชื่อผู้ชนะจาก detail.vendor_id (ชุดเดียวกับ Doc10)
// ✅ ไม่ใช่ข้อสมมติฐาน: ใช้ detail.date_announce ตรงตัว — PD_DATE_SEQUENCE (procurement-detail.js) มี field
// นี้อยู่แล้วชื่อ "ประกาศผู้ชนะการเสนอราคา" ตรงกับเอกสารนี้เป๊ะ (ต่างจาก Doc9/10/11 ที่ไม่มี field ตรงๆ
// ต้องใช้ date_request_buy ทดแทน)
async function buildDoc12(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.date_announce){ alert('กรุณากรอก "วันที่ประกาศผู้ชนะการเสนอราคา" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }
  if(!detail.vendor_id){ alert('กรุณาเลือก "ร้านค้า/ผู้รับจ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const vendor = (VENDORS_LIST || []).find(function(v){ return String(v.id) === String(detail.vendor_id); });
  if(!vendor){ alert('ไม่พบข้อมูลร้านค้า/ผู้รับจ้างที่เลือกไว้ กรุณาตรวจสอบในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }
  const vendorName = vendor.name || '-';

  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const itemTitle = item.title || '-';
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
  const totalAmountText = fmt(totalAmount) + ' บาท (' + thaiBahtText(totalAmount) + ')';

  const director = findDirector();
  const directorSigRuns = director
    ? multiLineRuns(['ลงชื่อ .......................................', '(' + (director.prefix || '') + director.name + ')', 'ผู้อำนวยการ' + SCHOOL_FULL_NAME])
    : [ tr('ลงชื่อ .......................................') ];

  const children = [
    garudaPara(Object.assign({ garudaKind: 'order' }, opts)),
    para('ประกาศ' + SCHOOL_FULL_NAME, { align: AlignmentType.CENTER, bold: true, size: 20, after: 4 }),
    para('เรื่อง ประกาศผู้ชนะการเสนอราคาการ' + buyOrHire + itemTitle + ' โดยวิธีเฉพาะเจาะจง', { align: AlignmentType.CENTER, bold: true, after: 3 }),
    hrPara(),
    bodyPara('ตามที่' + SCHOOL_FULL_NAME + ' ได้มีการ' + buyOrHire + itemTitle + ' จำนวน ' + subItems.length +
      ' รายการ เพื่อ' + purpose + ' การประกาศผู้ได้รับการคัดเลือกโดยวิธีเฉพาะเจาะจง นั้น'),
    bodyPara('การ' + buyOrHire + itemTitle + ' จำนวน ' + subItems.length + ' รายการ ผู้ได้รับการคัดเลือกได้แก่ ' +
      vendorName + ' โดยเสนอราคาเป็นเงินทั้งสิ้น ' + totalAmountText + ' รวมภาษีมูลค่าเพิ่มและภาษีอื่น ค่าขนส่ง ค่าจดทะเบียน และค่าใช้จ่ายอื่น ๆ ทั้งปวง'),
    // "ประกาศ ณ วันที่..." เยื้อง 5 ซม. (ไม่ใช่กึ่งกลาง) ตามมาตรฐานเดียวกับ "สั่ง ณ วันที่" ของ Doc4/11
    para('ประกาศ ณ วันที่ ' + fmtDateThai(detail.date_announce), { align: AlignmentType.LEFT, leftIndent: ORDER_DATE_INDENT_MM, before: 2, after: 0 }),
    para('', { after: 6 }),
    para(directorSigRuns, { align: AlignmentType.CENTER, after: 0 })
  ];

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[12] + '.docx' };
}

// ---------- Doc 13: สั่งซื้อจ้าง (ใบสั่งซื้อ/ใบสั่งจ้าง) ----------
// อ้างอิงไฟล์จริง "13 สั่งซื้อสั่งจ้าง.pdf" (OCR ตกวรรณยุกต์/สระหนักมาก+เรียงสลับคอลัมน์ ต้องประกอบใหม่จาก
// บริบท — เดาว่าเป็นตาราง 2 คอลัมน์ [โรงเรียน/ผู้รับจ้าง] ที่ OCR อ่านเรียงแถวสลับกัน) — ฟอร์มทางการที่ใช้
// field ที่มีอยู่แล้วครบเกือบทั้งหมด ไม่ต้องเดามาก:
//   - vendor.address_no/moo/tambon/amphoe/province/postcode/phone/tax_id/contact_name (Stage 12 ครบ)
//   - detail.date_order (field จริง "สั่งซื้อ/จ้าง" ตรงกับเอกสารนี้เป๊ะ) ใช้เป็นวันที่หัวเอกสาร+ลายเซ็นทั้งคู่
//   - detail.date_due (field จริง "ครบกำหนดส่งมอบ") ใช้ในเงื่อนไขข้อ 2
//   - detail.penalty_rate_percent (field จริงเดียวกับ Doc6 ข้อ ๖) ใช้ในเงื่อนไขข้อ 5
// ⚠️ ข้อสมมติฐานที่เหลือ: "เลขที่" ในฟอร์มนี้โชว์ doc_number เต็ม (มี "จ." นำหน้า) ต่างจากเอกสารอื่นที่ตัด
// prefix ออก (bareDocNumber) — ตามที่ต้นฉบับจริงแสดง "เลขที่ จ.51/2569" ตรงๆ / ระยะเวลารับประกัน "-" (ไม่มี
// field เหมือน Doc6 ข้อ ๗) / ตาราง "รายการ" สรุปเป็นบรรทัดเดียวอ้างถึง Doc9 แนบท้าย (ไม่แตกรายการย่อย
// เหมือน Doc2/3/4/7/9 เพราะต้นฉบับจริงของ Doc13 แสดงแบบนี้) / ข้อ 7 (ห้ามจ้างช่วง) ใส่เฉพาะกรณีจัดจ้าง
// เท่านั้น (ต้นฉบับจริงเป็นแบบจัดจ้าง ยังไม่มีตัวอย่างแบบจัดซื้อมายืนยันข้อความ)
async function buildDoc13(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_order){ alert('กรุณากรอก "วันที่สั่งซื้อ/จ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }
  if(!detail.vendor_id){ alert('กรุณาเลือก "ร้านค้า/ผู้รับจ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const vendor = (VENDORS_LIST || []).find(function(v){ return String(v.id) === String(detail.vendor_id); });
  if(!vendor){ alert('ไม่พบข้อมูลร้านค้า/ผู้รับจ้างที่เลือกไว้ กรุณาตรวจสอบในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
  const vendorRole = buyOrHireShort === 'ซื้อ' ? 'ผู้ขาย' : 'ผู้รับจ้าง';
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
  // ⚠️ VAT ต้องบวกเข้ายอดจริง (scrutinize F1, 2026-07-25) — ดู comment เต็มใน buildDoc3 — Doc13 สำคัญเป็นพิเศษ
  // เพราะมีบรรทัด "รวมเป็นเงินทั้งสิ้น" แยกต่างหาก ก่อนแก้เคยโชว์ตัวเลขเดียวกับ "รวมเป็นเงิน" ก่อน VAT เป๊ะ
  // (ขัดแย้งในตัวเองกับคำว่า "ทั้งสิ้น" ที่นำหน้า)
  const vatAmount = detail.vat_applicable ? totalAmount * 0.07 : 0;
  const grandTotal = totalAmount + vatAmount;
  const vatText = detail.vat_applicable ? fmt(vatAmount) : '-';

  const vendorAddress = 'ที่อยู่ ' + (vendor.address_no || '-') + ' หมู่ ' + (vendor.moo || '-') + ' ตำบล' + (vendor.tambon || '-') +
    ' อำเภอ' + (vendor.amphoe || '-') + ' จังหวัด' + (vendor.province || '-') + ' รหัสไปรษณีย์ ' + (vendor.postcode || '-');

  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('ใบสั่ง' + buyOrHireShort, { bold: true, after: 0 }),
        para('เลขที่ ' + detail.doc_number, { after: 0 }),
        para('วันที่ ' + fmtDateThai(detail.date_order), { after: 0 }),
        para(SCHOOL_FULL_NAME, { after: 0 }),
        para(SCHOOL_ADDRESS, { after: 0 })
      ] }),
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('ชื่อ' + vendorRole + ' ' + (vendor.name || '-'), { after: 0 }),
        para(vendorAddress, { after: 0 }),
        para('โทรศัพท์ ' + (vendor.phone || '-'), { after: 0 }),
        para('เลขประจำตัวผู้เสียภาษี ' + (vendor.tax_id || '-'), { after: 0 })
      ] })
    ] }) ]
  });

  const summaryDescription = (item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง') + itemTitle + ' ' + subItems.length + ' รายการ (ตามรายละเอียดแนบท้าย)';

  // ⚠️ ตารางเฉพาะ Doc13 (ไม่ใช้ subItemsTable() ที่ใช้ร่วมกับ Doc2/3/4/7/9) — เพราะ Doc13 มีแถวเดียวเสมอ
  // (สรุปเป็นบรรทัดเดียวตามต้นฉบับจริง ไม่แตกรายการย่อย) สัดส่วนคอลัมน์จึงต่างจากตารางแบบหลายแถวทั่วไป
  // จำเป็นต้องให้คอลัมน์ "รายการ" กว้างขึ้นมาก (55% แทน 37%) กันข้อความยาวห่อบรรทัดจนล้นหน้า (2026-07-25
  // วัดจริงพบว่าคอลัมน์แคบ 37% ทำให้ข้อความห่อ 6-7 บรรทัด กินพื้นที่แนวตั้งมากกว่าจุดอื่นรวมกัน)
  function doc13ItemTable(){
    function cell(text, opts){
      opts = opts || {};
      return new TableCell({
        width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        children: [ para(text, { align: opts.align || AlignmentType.LEFT, after: 0, size: 14, bold: opts.bold }) ]
      });
    }
    const headerRow = new TableRow({ tableHeader: true, children: [
      cell('ท', { width: 5, align: AlignmentType.CENTER, bold: true }),
      cell('รายการ', { width: 55, bold: true }),
      cell('จำนวน', { width: 8, align: AlignmentType.CENTER, bold: true }),
      cell('หน่วย', { width: 10, align: AlignmentType.CENTER, bold: true }),
      cell('ราคาต่อหน่วย', { width: 11, align: AlignmentType.RIGHT, bold: true }),
      cell('จำนวนเงิน', { width: 11, align: AlignmentType.RIGHT, bold: true })
    ] });
    const dataRow = new TableRow({ children: [
      cell('1', { align: AlignmentType.CENTER }),
      cell(summaryDescription),
      cell('1', { align: AlignmentType.CENTER }),
      cell('รายการ', { align: AlignmentType.CENTER }),
      cell(fmt(totalAmount), { align: AlignmentType.RIGHT }),
      cell(fmt(totalAmount), { align: AlignmentType.RIGHT })
    ] });
    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: TABLE_BORDERS, rows: [headerRow, dataRow] });
  }

  const terms = [
    'กำหนดส่งมอบภายใน ' + DOC6_DEFAULT_TERM_DAYS + ' วัน นับถัดจากวันลงนามใบสั่ง' + buyOrHireShort,
    'ครบกำหนดส่งมอบวันที่ ' + (detail.date_due ? fmtDateThai(detail.date_due) : '-'),
    'สถานที่ส่งมอบ ' + SCHOOL_FULL_NAME,
    'ระยะเวลารับประกัน -',
    'สงวนสิทธิ์ค่าปรับกรณีส่งมอบเกินกำหนด โดยคิดค่าปรับเป็นรายวันในอัตราร้อยละ ' + (detail.penalty_rate_percent != null ? detail.penalty_rate_percent : 0) + ' ของราคาสิ่งของที่ยังไม่ได้รับมอบ',
    'โรงเรียนสงวนสิทธิ์ที่จะไม่รับมอบ ถ้าปรากฏว่าสินค้านั้นมีลักษณะไม่ตรงตามรายการที่ระบุไว้ในใบสั่ง' + buyOrHireShort
  ];
  if(buyOrHireShort === 'จ้าง'){
    terms.push('กรณีการจ้าง ผู้รับจ้างจะต้องไม่เอางานทั้งหมดหรือแต่บางส่วนแห่งสัญญานี้ไปจ้างช่วงอีกทอดหนึ่ง เว้นแต่ไม่เป็นเหตุให้ผู้รับจ้างหลุดพ้นจากความรับผิดหรือพันธะหน้าที่ตามสัญญานี้ และผู้รับจ้างจะยังคงต้องรับผิดชอบในความผิดและความประมาทเลินเล่อของผู้รับจ้างช่วง หรือของตัวแทนหรือลูกจ้างของผู้รับจ้างช่วงนั้นทุกประการ');
  }
  terms.push('การประเมินผลการปฏิบัติงานของผู้ประกอบการ หน่วยงานของรัฐสามารถนำผลการปฏิบัติงานแล้วเสร็จตามสัญญาหรือข้อตกลงของคู่สัญญาเพื่อนำมาประเมินผลการปฏิบัติงานของผู้ประกอบการได้');
  // ⚠️ after: 0.15mm (ไม่ใช่ 1.5mm default) — บีบเงื่อนไข 8 ข้อให้แน่นสุด กันล้นหน้า 2 (2026-07-25, เหมือน
  // แนวทาง Doc8 รอบ 2-3: ตัด spacing ก่อนแตะเนื้อหา — วัดจริงพบว่าซิกเนเจอร์บล็อก 3 บรรทัดสุดท้ายล้นไปหน้า 2)
  const termParas = terms.map(function(t, i){ return para((i + 1) + '. ' + t, { noIndent: true, after: 0.1 }); });

  const director = findDirector();
  const directorPrintName = director ? ('(' + (director.prefix || '') + director.name + ')') : '(...........................)';

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('ลงชื่อ .......................................  ผู้สั่ง' + buyOrHireShort, { align: AlignmentType.CENTER, after: 0 }),
        para(directorPrintName, { align: AlignmentType.CENTER, after: 0 }),
        para('ผู้อำนวยการ' + SCHOOL_FULL_NAME, { align: AlignmentType.CENTER, after: 0 }),
        para('วันที่ ' + fmtDateThai(detail.date_order), { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('ลงชื่อ .......................................  ผู้รับใบสั่ง' + buyOrHireShort, { align: AlignmentType.CENTER, after: 0 }),
        para('(' + (vendor.contact_name || vendor.name || '-') + ')', { align: AlignmentType.CENTER, after: 0 }),
        para(vendorRole, { align: AlignmentType.CENTER, after: 0 }),
        para('วันที่ ' + fmtDateThai(detail.date_order), { align: AlignmentType.CENTER, after: 0 })
      ] })
    ] }) ]
  });

  const children = [
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    infoTable,
    bodyPara('ตามที่ ' + (vendor.name || '-') + ' ได้เสนอราคาตามใบเสนอราคาไว้ต่อ ' + SCHOOL_FULL_NAME + ' ซึ่งได้รับราคาและตกลง' +
      (item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง') + 'ตามรายการดังต่อไปนี้', { before: 0.2, after: 0.3 }),
    doc13ItemTable(),
    bodyPara('รวมเป็นเงิน ' + fmt(totalAmount) + ' บาท ภาษีมูลค่าเพิ่ม ' + vatText + ' บาท จำนวนเงินตัวอักษร (' + thaiBahtText(grandTotal) + ') รวมเป็นเงินทั้งสิ้น ' + fmt(grandTotal) + ' บาท', { noIndent: true, before: 0.2, after: 0.3 }),
    bodyPara('การสั่ง' + buyOrHireShort + 'อยู่ภายใต้เงื่อนไขต่อไปนี้', { after: 0.15 })
  ].concat(termParas).concat([
    sigTable
  ]);

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[13] + '.docx' };
}

// ---------- Doc 14: แนบซื้อ (รายละเอียดแนบใบสั่งซื้อ/ใบสั่งจ้าง) ----------
// อ้างอิงไฟล์จริง "14 แนบซื้อ.pdf" (OCR ตกวรรณยุกต์+เรียงสลับหนัก ประกอบใหม่จากบริบท) — แนบท้าย Doc13
// (ใบสั่งซื้อ/ใบสั่งจ้าง) เหมือน Doc9 แนบท้าย Doc8 ในเชิงโครงสร้าง (หัวเรื่องอ้างเลขที่/วันที่เอกสารแม่ +
// subItemsTable() + checkbox ที่มาราคา + VAT/จำนวนเงินตัวอักษร) แต่ **ลายเซ็นคัดลอกจาก Doc13 เอง**
// (ผู้สั่งซื้อ/จ้าง=ผอ. + ผู้รับใบสั่งซื้อ/จ้าง=ร้านค้า) ไม่ใช่ เจ้าหน้าที่/หัวหน้าเจ้าหน้าที่แบบ Doc9 — เพราะ
// ต้นฉบับจริงแสดงชื่อ ผอ.+ร้านค้าเดียวกับที่เซ็นในใบสั่งจ้างเอง (สมเหตุสมผล เพราะเป็นเอกสารแนบใบสั่งจ้าง
// ไม่ใช่แนบบันทึกข้อความภายในแบบ Doc9)
// ⚠️ ใช้ field เดียวกับ Doc13 ทั้งหมด (doc_number เต็ม+"จ."/date_order/vendor_id) ไม่มีข้อสมมติฐานใหม่
// นอกจาก checkbox ที่มาราคา (สืบจากท้องตลาด) ซึ่งเป็นข้อสมมติฐานเดิมจาก Doc9 อยู่แล้ว
async function buildDoc14(procItemId, opts){
  const item = PROC.find(function(x){ return x.id === procItemId; });
  if(!item){ alert('ไม่พบรายการพัสดุนี้'); return null; }

  const detail = CURRENT_DETAIL;
  if(!detail){ alert('กรุณาบันทึกข้อมูลในฟอร์ม "กรอกเอกสารพัสดุ" ก่อน แล้วค่อยพิมพ์เอกสาร'); return null; }
  if(!detail.doc_number){ alert('ยังไม่มีเลขที่เอกสาร กรุณาบันทึกฟอร์มก่อน'); return null; }
  if(!detail.date_order){ alert('กรุณากรอก "วันที่สั่งซื้อ/จ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }
  if(!detail.vendor_id){ alert('กรุณาเลือก "ร้านค้า/ผู้รับจ้าง" ในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const vendor = (VENDORS_LIST || []).find(function(v){ return String(v.id) === String(detail.vendor_id); });
  if(!vendor){ alert('ไม่พบข้อมูลร้านค้า/ผู้รับจ้างที่เลือกไว้ กรุณาตรวจสอบในฟอร์มก่อนพิมพ์เอกสารนี้'); return null; }

  const buyOrHireShort = item.type === 'จัดซื้อ' ? 'ซื้อ' : 'จ้าง';
  const buyOrHire = item.type === 'จัดซื้อ' ? 'จัดซื้อ' : 'จัดจ้าง';
  const vendorRole = buyOrHireShort === 'ซื้อ' ? 'ผู้ขาย' : 'ผู้รับจ้าง';
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
  // ⚠️ VAT ต้องบวกเข้ายอดจริง (scrutinize F1, 2026-07-25) — ดู comment เต็มใน buildDoc3
  const vatAmount = detail.vat_applicable ? totalAmount * 0.07 : 0;
  const grandTotal = totalAmount + vatAmount;
  const vatText = detail.vat_applicable ? fmt(vatAmount) : '-';

  const director = findDirector();
  const directorPrintName = director ? ('(' + (director.prefix || '') + director.name + ')') : '(...........................)';

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [ new TableRow({ children: [
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('ลงชื่อ .......................................  ผู้สั่ง' + buyOrHireShort, { align: AlignmentType.CENTER, after: 0 }),
        para(directorPrintName, { align: AlignmentType.CENTER, after: 0 }),
        para('ผู้อำนวยการ' + SCHOOL_FULL_NAME, { align: AlignmentType.CENTER, after: 0 }),
        para('วันที่ ' + fmtDateThai(detail.date_order), { align: AlignmentType.CENTER, after: 0 })
      ] }),
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [
        para('ลงชื่อ .......................................  ผู้รับใบสั่ง' + buyOrHireShort, { align: AlignmentType.CENTER, after: 0 }),
        para('(' + (vendor.contact_name || vendor.name || '-') + ')', { align: AlignmentType.CENTER, after: 0 }),
        para(vendorRole, { align: AlignmentType.CENTER, after: 0 }),
        para('วันที่ ' + fmtDateThai(detail.date_order), { align: AlignmentType.CENTER, after: 0 })
      ] })
    ] }) ]
  });

  const children = [
    garudaPara(Object.assign({ garudaKind: 'memo' }, opts)),
    para('รายละเอียดแนบใบสั่ง' + buyOrHireShort + ' เลขที่ ' + detail.doc_number + ' ลงวันที่ ' + fmtDateThai(detail.date_order), { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para('งาน' + buyOrHire + 'พัสดุ' + itemTitle + ' จำนวน ' + subItems.length + ' รายการ', { align: AlignmentType.CENTER, bold: true, after: 0 }),
    para(SCHOOL_FULL_NAME, { align: AlignmentType.CENTER, bold: true, after: 3 }),
    subItemsTable(subItems, buyOrHireShort, totalAmount),
    para('( )  ราคามาตรฐาน      (/)  ราคาที่ได้มาจากการสืบจากท้องตลาด', { noIndent: true, before: 1, after: 1 }),
    bodyPara('รวมเป็นเงิน ' + fmt(totalAmount) + ' บาท ภาษีมูลค่าเพิ่ม ' + vatText + ' บาท จำนวนเงินตัวอักษร (' + thaiBahtText(grandTotal) + ')', { noIndent: true, before: 1, after: 3 }),
    sigTable
  ];

  return { children: children, filename: (detail.doc_number || 'doc').replace(/[\/\\]/g, '-') + '-' + PD_DOC_NAMES[14] + '.docx' };
}
