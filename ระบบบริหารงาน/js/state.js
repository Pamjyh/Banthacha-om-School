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
