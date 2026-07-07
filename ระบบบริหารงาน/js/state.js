// =====================================================================
// STATE
// =====================================================================
let CY = null;       // current year_id (integer)
let CYbe = null;     // current year_be (display)
let YEARS = [];
let PROJECTS = [];
let PROC = [];
let PROC_TAB = 'all';
let PENDING_DEL = null;
let ACTIVE_PROJ_ID = null;
let FUND_CATEGORIES = [];
let FINANCE_BALANCES = [];
let FINANCE_TRANSACTIONS = [];
let FINANCE_LOADED = false;
let FIN_TAB = 'balance'; // 'balance' | 'transactions'

// External Expenses (เงินนอก)
let EXT_CATEGORIES   = [];
let EXT_TRANSACTIONS = [];
let EXT_LOADED       = false;

// Pagination
const PAGE_SIZE = 100;
let PROC_PAGE = 1;
let EXT_PAGE  = 1;

// Procurement year-type filter
let PROC_YEAR_TYPE = '';   // '' | 'การศึกษา' | 'งบประมาณ' | 'ปฏิทิน'
let PROC_YEAR_VAL  = 0;    // BE year number

// Auth
let IS_ADMIN = false;

// Staff (บุคลากร) — Stage 11
let STAFF_LIST = [];

// Vendors (ร้านค้า/ผู้รับจ้าง) — Stage 12
let VENDORS_LIST = [];

// Procurement Detail Form (กรอกเอกสารพัสดุ) — Stage 14
// CURRENT_PROC_ITEM = procurement_item ที่กำลังเปิดฟอร์มอยู่, CURRENT_DETAIL = แถว procurement_details
// ที่โหลดมา (null ถ้ายังไม่เคยบันทึก = create mode) — Stage 15-16 จะต่อยอดจาก state นี้
let CURRENT_PROC_ITEM = null;
let CURRENT_DETAIL = null;
// CURRENT_SUB_ITEMS (Stage 15) — array ของแถวรายการย่อยในฟอร์ม (ยังไม่บันทึกจนกว่าจะกด "บันทึก" ใน Stage 16)
// รูปแบบแต่ละแถว: {seq, description, unit, quantity, unit_price, amount} — ไม่มี id จนกว่าจะ save จริง
let CURRENT_SUB_ITEMS = [];
// SUBITEMS_LOAD_ERROR (Stage 15, bug-fixer 2026-07-07) — error message ถ้าโหลด procurement_sub_items เดิมล้มเหลว
// (null = โหลดสำเร็จ/ยังไม่โหลด) ใช้เตือนผู้ใช้ไม่ให้กด "บันทึก" ทับข้อมูลเดิมตอนโหลดพัง — ดู updateSubItemsFooter()
let SUBITEMS_LOAD_ERROR = null;
// CURRENT_SUB_ITEMS_ORIGINAL_IDS (Stage 16) — id ของแถว procurement_sub_items ที่มีอยู่แล้วใน DB ตอนเปิดฟอร์ม
// (snapshot ตอนโหลด) ใช้ตอนกด "บันทึก": insert ชุดใหม่ทั้งหมดก่อน แล้วค่อยลบชุดเดิมตาม id พวกนี้
// (ไม่ใช่ delete-then-insert) กัน data loss ถ้า insert ชุดใหม่ล้มเหลวกลางทาง
let CURRENT_SUB_ITEMS_ORIGINAL_IDS = [];
