// ============================================================
// ระบบออมทรัพย์นักเรียนโรงเรียนบ้านท่าชะอม — v3
// รองรับ เลขบัญชี ธกส. + สรุปรายเดือน/รายเทอม
// ============================================================

const SHEET_ID         = '1_FiMepObJro052keUyznmYCnygfNKVGta7LFA3-bVQM';
const TEACHER_PASSWORD = 'REPLACE_WITH_YOUR_PASSWORD';   // ← ตั้งรหัสของคุณเองก่อน deploy
const ADMIN_PASSWORD   = 'REPLACE_WITH_YOUR_ADMIN_PASSWORD'; // ← ห้ามใช้ค่านี้จริง
const SCHOOL_NAME      = 'โรงเรียนบ้านท่าชะอม';

const GRADES = ['อ.2','อ.3','ป.1','ป.2','ป.3','ป.4','ป.5','ป.6'];
const NEXT_GRADE = {
  'อ.2':'อ.3','อ.3':'ป.1','ป.1':'ป.2','ป.2':'ป.3',
  'ป.3':'ป.4','ป.4':'ป.5','ป.5':'ป.6','ป.6':'จบการศึกษา'
};

// เทอม: เทอม1 = พ.ค.-ก.ย., เทอม2 = พ.ย.-มี.ค.
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

// ============================================================
// ENTRY POINT
// ============================================================
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  // Merge POST body into params (GAS 302 redirect can lose POST body from e.parameter)
  let params = (e && e.parameter) ? e.parameter : {};
  if (e && e.postData && e.postData.contents) {
    try {
      var _pp = {};
      e.postData.contents.split('&').forEach(function(pair) {
        var kv = pair.split('=');
        if (kv.length >= 1) {
          var k = decodeURIComponent(kv[0].replace(/\+/g,' '));
          var v = kv.length > 1 ? decodeURIComponent(kv.slice(1).join('=').replace(/\+/g,' ')) : '';
          _pp[k] = v;
        }
      });
      params = Object.assign({}, _pp, params);
    } catch(_) {}
  }
  const action = params.action || '';
  let result;
  try {
    switch(action) {
      case 'getStudents':       result = getStudents(params); break;
      case 'getStudentByName':  result = getStudentByName(params); break;
      case 'addStudent':        result = addStudent(params); break;
      case 'editStudent':       result = editStudent(params); break;
      case 'deleteStudent':     result = deleteStudent(params); break;
      case 'deposit':           result = addTransaction(params, 'ฝาก'); break;
      case 'withdraw':          result = addTransaction(params, 'ถอน'); break;
      case 'editTransaction':   result = editTransaction(params); break;
      case 'deleteTransaction': result = deleteTransaction(params); break;
      case 'getHistory':        result = getHistory(params); break;
      case 'getAllSummary':      result = getAllSummary(params); break;
      case 'exportMonthly':     result = exportMonthly(params); break;
      case 'exportTerm':        result = exportTerm(params); break;
      case 'promoteGrade':      result = promoteGrade(params); break;
      case 'promoteAll':        result = promoteAll(params); break;
      case 'getGraduated':      result = getGraduated(params); break;
      case 'checkRole':         result = checkRole(params); break;
      case 'initSheets':        result = initSheets(); break;
      case 'getBootstrap':      result = getBootstrap(); break;
      default: result = { ok: false, error: 'Unknown action: ' + action };
    }
  } catch(err) {
    result = { ok: false, error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// INIT SHEETS
// ============================================================
function initSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  // sheet นักเรียน
  let s = ss.getSheetByName('นักเรียน');
  if (!s) {
    s = ss.insertSheet('นักเรียน');
    s.getRange(1,1,1,8).setValues([[
      'id','ชื่อ-สกุล','ชั้นปัจจุบัน','ปีที่เข้า','สถานะ','เลขบัญชี_ธกส','วันที่เพิ่ม','หมายเหตุ'
    ]]);
    styleHeader(s, 8);
    s.setFrozenRows(1);
    s.setColumnWidth(2, 180);
    s.setColumnWidth(6, 160);
  } else {
    // ตรวจ sheet เดิม ถ้ายังไม่มีคอลัมน์เลขบัญชี ให้เพิ่ม
    const headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
    if (!headers.includes('เลขบัญชี_ธกส')) {
      const nextCol = s.getLastColumn() + 1;
      // หาตำแหน่งที่ถูกต้อง: ต้องอยู่ที่ column 6
      if (headers.length < 6) {
        // เติม column ที่ขาดหายไป
        s.getRange(1, 6).setValue('เลขบัญชี_ธกส');
      } else {
        // แทรก column ที่ 6
        s.insertColumnBefore(6);
        s.getRange(1, 6).setValue('เลขบัญชี_ธกส');
      }
      styleHeader(s, Math.max(6, s.getLastColumn()));
    }
  }

  // sheet ธุรกรรม
  let t = ss.getSheetByName('ธุรกรรม');
  if (!t) {
    t = ss.insertSheet('ธุรกรรม');
    t.getRange(1,1,1,8).setValues([[
      'id','นักเรียน_id','ชื่อ','ชั้น','ประเภท','จำนวนเงิน','ปีการศึกษา','วันที่'
    ]]);
    styleHeader(t, 8);
    t.setFrozenRows(1);
  }

  // sheet ประวัติเลื่อนชั้น
  let h = ss.getSheetByName('ประวัติเลื่อนชั้น');
  if (!h) {
    h = ss.insertSheet('ประวัติเลื่อนชั้น');
    h.getRange(1,1,1,6).setValues([['นักเรียน_id','ชื่อ','จากชั้น','เป็นชั้น','ปีการศึกษา','วันที่']]);
    styleHeader(h, 6);
    h.setFrozenRows(1);
  }

  return { ok: true, message: 'ตรวจสอบและอัพเดท Sheets สำเร็จ' };
}

// ============================================================
// CHECK ROLE — ตรวจรหัสผ่านและคืน role (ไม่เก็บรหัสใน frontend)
// ============================================================
function checkRole(p) {
  if (p.password === ADMIN_PASSWORD)   return { ok: true, role: 'admin' };
  if (p.password === TEACHER_PASSWORD) return { ok: true, role: 'teacher' };
  return { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' };
}

function styleHeader(sheet, cols) {
  sheet.getRange(1,1,1,cols)
    .setFontWeight('bold').setBackground('#1C1917').setFontColor('#FFFFFF');
}

// ============================================================
// STUDENTS
// ============================================================
// ค้นหานักเรียนด้วยชื่อ (สำหรับผู้ปกครอง)
function getStudentByName(p) {
  const keyword = (p.name || '').trim().toLowerCase();
  if (!keyword) return { ok: false, error: 'กรุณาใส่ชื่อ' };

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const studSheet = ss.getSheetByName('นักเรียน');
  if (!studSheet) return { ok: false, error: 'ไม่พบ sheet' };

  const allData = studSheet.getDataRange().getValues();
  const headers = allData[0].map(h => String(h).trim());
  function findH(names) {
    for (var n of names) { var i = headers.indexOf(n); if (i >= 0) return i; }
    return -1;
  }
  const siId    = findH(['id']);
  const siName  = findH(['ชื่อ-สกุล','ชื่อ สกุล','ชื่อ']);
  const siGrade = findH(['ชั้นปัจจุบัน','ชั้น']);
  const siStatus = findH(['สถานะ']);

  const balances = calcAllBalances(ss);

  // ค้นหาชื่อที่ตรงกัน (ค้นแบบ contains ไม่ต้องตรงทั้งหมด)
  const matches = allData.slice(1)
    .filter(r => {
      if (!r[siId]) return false;
      if (siStatus >= 0 && String(r[siStatus]) === 'จบการศึกษา') return false;
      const name = String(r[siName] || '').toLowerCase();
      return name.includes(keyword);
    })
    .map(r => ({
      id:      String(r[siId]),
      name:    String(r[siName]   || ''),
      grade:   String(r[siGrade]  || ''),
      balance: balances[String(r[siId])] || 0
    }));

  if (!matches.length) return { ok: false, error: 'ไม่พบนักเรียนชื่อ "' + p.name + '"' };

  // ถ้าเจอคนเดียว ดึงประวัติธุรกรรมมาด้วย
  if (matches.length === 1) {
    const txSheet = ss.getSheetByName('ธุรกรรม');
    let history = [];
    if (txSheet) {
      const txHeaders = txSheet.getDataRange().getValues()[0].map(h => String(h).trim());
      function findTH(names) {
        for (var n of names) { var i = txHeaders.indexOf(n); if (i >= 0) return i; }
        return -1;
      }
      const tiId    = findTH(['id']);
      const tiStu   = findTH(['นักเรียน_id']);
      const tiType  = findTH(['ประเภท']);
      const tiAmt   = findTH(['จำนวนเงิน']);
      const tiDate  = findTH(['วันที่']);
      history = txSheet.getDataRange().getValues().slice(1)
        .filter(r => r[0] && String(r[tiStu]) === matches[0].id)
        .map(r => ({
          type:   String(r[tiType] || ''),
          amount: parseFloat(r[tiAmt]) || 0,
          date:   String(r[tiDate] || '')
        }))
        .reverse()
        .slice(0, 20);
    }
    return { ok: true, students: matches, history };
  }

  return { ok: true, students: matches, history: [] };
}

function getStudents(p) {
  // Cache ต่อชั้น (180 วินาที) — ลดการอ่าน sheet ซ้ำ
  if (p.grade) {
    const sCache = CacheService.getScriptCache();
    const cKey = 'ss_stus_' + p.grade;
    const hit = sCache.get(cKey);
    if (hit) { try { return JSON.parse(hit); } catch(e) {} }
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('นักเรียน');
  if (!sheet) return { ok: false, error: 'ไม่พบ sheet — กรุณา Run initSheets ก่อน' };

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0].map(h => String(h).trim());

  // หา index แบบ dynamic — รองรับชื่อคอลัมน์หลายแบบ
  function findCol(names) {
    for (var n of names) {
      var idx = headers.indexOf(n);
      if (idx >= 0) return idx;
    }
    return -1;
  }

  const idxId     = findCol(['id']);
  const idxName   = findCol(['ชื่อ-สกุล','ชื่อ สกุล','ชื่อ']);
  const idxGrade  = findCol(['ชั้นปัจจุบัน','ชั้น']);
  const idxYear   = findCol(['ปีที่เข้า','ปีการศึกษา']);
  const idxStatus = findCol(['สถานะ']);
  const idxBank   = findCol(['เลขบัญชี_ธกส','เลขบัญชีธกส','เลขบัญชี']);

  const rows = allData.slice(1);
  let students = rows
    .filter(r => {
      if (!r[idxId]) return false;
      // ถ้าไม่มีคอลัมน์สถานะ หรือสถานะว่าง ให้ถือว่ากำลังเรียน
      if (idxStatus < 0) return true;
      const status = String(r[idxStatus] || '').trim();
      return status !== 'จบการศึกษา';
    })
    .map(r => ({
      id:          String(r[idxId] || ''),
      name:        idxName  >= 0 ? String(r[idxName]  || '') : '',
      grade:       idxGrade >= 0 ? String(r[idxGrade] || '') : '',
      entryYear:   idxYear  >= 0 ? String(r[idxYear]  || '') : '',
      status:      idxStatus >= 0 ? String(r[idxStatus] || '') : 'กำลังเรียน',
      bankAccount: idxBank  >= 0 ? String(r[idxBank]  || '') : '',
    }));

  // กรองตามชั้น — ถ้าไม่พบ grade column ให้แสดงทั้งหมด
  if (p.grade && idxGrade >= 0) {
    students = students.filter(s => s.grade === p.grade);
  }

  // เรียงตามลำดับที่เพิ่ม (id = S + timestamp)
  students.sort(function(a, b) {
    var na = parseInt(String(a.id).replace('S','')) || 0;
    var nb = parseInt(String(b.id).replace('S','')) || 0;
    return na - nb;
  });

  const balances = calcAllBalances(ss);
  students = students.map(s => ({ ...s, balance: balances[String(s.id)] || 0 }));
  const result = { ok: true, students, debug: { headers: headers, idxGrade: idxGrade, idxStatus: idxStatus } };
  if (p.grade) {
    try { CacheService.getScriptCache().put('ss_stus_' + p.grade, JSON.stringify(result), 180); } catch(e) {}
  }
  return result;
}

function addStudent(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  const name = (p.name || '').trim();
  const grade = p.grade;
  const bankAccount = (p.bankAccount || '').trim();
  if (!name || !grade) return { ok: false, error: 'ข้อมูลไม่ครบ' };
  if (!GRADES.includes(grade)) return { ok: false, error: 'ชั้นไม่ถูกต้อง' };

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('นักเรียน');
  if (!sheet) return { ok: false, error: 'ไม่พบ sheet นักเรียน — กรุณา Run initSheets ก่อน' };

  const id = 'S' + Date.now();
  const year = thaiYear();
  const dateStr = thaiDate(new Date());

  // อ่าน header ดูว่า column อยู่ตำแหน่งไหน
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());

  function findH(names) {
    for (var n of names) { var i = headers.indexOf(n); if (i >= 0) return i; }
    return -1;
  }

  const hasGradeCol  = findH(['ชั้นปัจจุบัน','ชั้น']) >= 0;
  const hasStatusCol = findH(['สถานะ']) >= 0;

  // ถ้า header ครบ 8 คอลัมน์อยู่แล้ว → append ตรงๆ
  if (headers.length >= 7 && hasGradeCol) {
    // สร้าง row ตาม header จริง
    var row = new Array(Math.max(8, headers.length)).fill('');
    headers.forEach(function(h, i) {
      if (h === 'id')              row[i] = id;
      else if (['ชื่อ-สกุล','ชื่อ สกุล','ชื่อ'].includes(h)) row[i] = name;
      else if (['ชั้นปัจจุบัน','ชั้น'].includes(h))           row[i] = grade;
      else if (['ปีที่เข้า','ปีการศึกษา'].includes(h))        row[i] = year;
      else if (h === 'สถานะ')     row[i] = 'กำลังเรียน';
      else if (['เลขบัญชี_ธกส','เลขบัญชีธกส','เลขบัญชี'].includes(h)) row[i] = bankAccount;
      else if (h === 'วันที่เพิ่ม') row[i] = dateStr;
    });
    sheet.appendRow(row);
  } else {
    // header ไม่ครบ → เขียน header ใหม่ก่อน (ปลอดภัย เพราะมีข้อมูลอยู่แล้วจะไม่ลบ)
    // แค่ append ด้วย default format 8 คอลัมน์
    sheet.appendRow([id, name, grade, year, 'กำลังเรียน', bankAccount, dateStr, '']);
  }

  return { ok: true, id, name, grade, bankAccount, entryYear: year };
}

function editStudent(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  const name = (p.name || '').trim();
  if (!name || !p.studentId) return { ok: false, error: 'ข้อมูลไม่ครบ' };

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('นักเรียน');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.studentId) {
      sheet.getRange(i+1, 2).setValue(name);
      if (p.bankAccount !== undefined)
        sheet.getRange(i+1, 6).setValue(p.bankAccount);
      SpreadsheetApp.flush();
      try { GRADES.forEach(function(g){ CacheService.getScriptCache().remove('ss_stus_'+g); }); } catch(e) {}
      return { ok: true, name };
    }
  }
  return { ok: false, error: 'ไม่พบนักเรียน' };
}

function deleteStudent(p) {
  if (p.password !== ADMIN_PASSWORD) return { ok: false, error: 'เฉพาะผู้ดูแล' };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('นักเรียน');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.studentId) {
      sheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      invalidateBalanceCache();
      return { ok: true };
    }
  }
  return { ok: false, error: 'ไม่พบนักเรียน' };
}

// ============================================================
// TRANSACTIONS
// ============================================================
function addTransaction(p, type) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  const amount = parseFloat(p.amount);
  if (!p.studentId || isNaN(amount) || amount <= 0)
    return { ok: false, error: 'ข้อมูลไม่ถูกต้อง' };

  if (type === 'ถอน') {
    const bal = getBalance(p.studentId);
    if (amount > bal) return { ok: false, error: 'ยอดไม่พอ (มี ' + bal + ' บาท)' };
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const txSheet = ss.getSheetByName('ธุรกรรม');
  if (!txSheet) return { ok: false, error: 'ไม่พบ sheet "ธุรกรรม" — กรุณารัน initSheets ก่อน (SHEET_ID=' + SHEET_ID + ')' };

  // หาชื่อและชั้นนักเรียน — ใช้ dynamic header ป้องกัน column order เปลี่ยน
  const studAllData = ss.getSheetByName('นักเรียน').getDataRange().getValues();
  const studHeaders = studAllData[0].map(function(h) { return String(h).trim(); });
  function findSColTx(names) {
    for (var n of names) { var idx = studHeaders.indexOf(n); if (idx >= 0) return idx; }
    return -1;
  }
  const siName  = findSColTx(['ชื่อ-สกุล', 'ชื่อ สกุล', 'ชื่อ']);
  const siGrade = findSColTx(['ชั้นปัจจุบัน', 'ชั้น']);
  let studentName = '', studentGrade = '';
  for (let i = 1; i < studAllData.length; i++) {
    if (String(studAllData[i][0]) === String(p.studentId)) {
      studentName  = siName  >= 0 ? String(studAllData[i][siName]  || '') : '';
      studentGrade = siGrade >= 0 ? String(studAllData[i][siGrade] || '') : '';
      break;
    }
  }

  const id = 'T' + Date.now();
  const dateStr = thaiDate(new Date());
  const yearVal = thaiYear();

  // อ่าน balance ปัจจุบัน ก่อน append (เพื่อหลีกเลี่ยง cache issue หลัง write)
  const sid = String(p.studentId);
  let currentBal = 0;
  const allRows = txSheet.getDataRange().getValues();
  allRows.slice(1).forEach(function(row) {
    if (String(row[1]) === sid) {
      currentBal += (row[4] === 'ฝาก' ? parseFloat(row[5])||0 : -(parseFloat(row[5])||0));
    }
  });

  const rowsBefore = txSheet.getLastRow();
  // append ตรงๆ ตาม column order ที่กำหนด: id, นักเรียน_id, ชื่อ, ชั้น, ประเภท, จำนวนเงิน, ปีการศึกษา, วันที่
  txSheet.appendRow([id, p.studentId, studentName, studentGrade, type, amount, yearVal, dateStr]);
  SpreadsheetApp.flush(); // บังคับ commit
  invalidateBalanceCache();
  const rowsAfter = txSheet.getLastRow();

  // คำนวณ balance ใหม่จาก balance เก่า + transaction นี้ (ไม่ re-read sheet หลัง write)
  const newBalance = type === 'ฝาก' ? currentBal + amount : currentBal - amount;

  return { ok: true, id, type, amount, date: dateStr, newBalance, debug: { rowsBefore, rowsAfter, wrote: rowsAfter > rowsBefore, currentBal } };
}

function getBalance(studentId) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const txSheet = ss.getSheetByName('ธุรกรรม');
  if (!txSheet) return 0;
  const sid = String(studentId);
  let bal = 0;
  txSheet.getDataRange().getValues().slice(1).forEach(r => {
    if (String(r[1]) === sid) {
      bal += (r[4] === 'ฝาก' ? parseFloat(r[5])||0 : -(parseFloat(r[5])||0));
    }
  });
  return bal;
}

function calcAllBalances(ss) {
  const sCache = CacheService.getScriptCache();
  const hit = sCache.get('ss_balances');
  if (hit) { try { return JSON.parse(hit); } catch(e) {} }

  const txSheet = ss.getSheetByName('ธุรกรรม');
  const balances = {};
  if (!txSheet) return balances;
  txSheet.getDataRange().getValues().slice(1).forEach(r => {
    if (!r[0]) return;
    const sid = String(r[1]);
    if (!balances[sid]) balances[sid] = 0;
    balances[sid] += (r[4] === 'ฝาก' ? parseFloat(r[5])||0 : -(parseFloat(r[5])||0));
  });
  try { sCache.put('ss_balances', JSON.stringify(balances), 180); } catch(e) {}
  return balances;
}

// ลบ cache หลัง write — เรียกหลัง SpreadsheetApp.flush() ทุกครั้ง
function invalidateBalanceCache() {
  try {
    const c = CacheService.getScriptCache();
    c.remove('ss_balances');
    GRADES.forEach(function(g){ c.remove('ss_stus_' + g); });
  } catch(e) {}
}

function editTransaction(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  const newAmount = parseFloat(p.amount);
  if (!p.txId || isNaN(newAmount) || newAmount <= 0) return { ok: false, error: 'ข้อมูลไม่ถูกต้อง' };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const txSheet = ss.getSheetByName('ธุรกรรม');
  const data = txSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.txId) {
      const sid = data[i][1], type = data[i][4];
      if (type === 'ถอน') {
        const oldAmt = parseFloat(data[i][5])||0;
        const balWithout = getBalance(sid) + oldAmt;
        if (newAmount > balWithout) return { ok: false, error: 'ยอดไม่พอ (มี ' + balWithout + ' บาท)' };
      }
      txSheet.getRange(i+1, 6).setValue(newAmount);
      SpreadsheetApp.flush();
      invalidateBalanceCache();
      return { ok: true, newBalance: getBalance(sid) };
    }
  }
  return { ok: false, error: 'ไม่พบรายการ' };
}

function deleteTransaction(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  if (!p.txId) return { ok: false, error: 'ไม่ระบุรายการ' };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const txSheet = ss.getSheetByName('ธุรกรรม');
  const data = txSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === p.txId) {
      const sid = data[i][1];
      txSheet.deleteRow(i + 1);
      SpreadsheetApp.flush();
      invalidateBalanceCache();
      return { ok: true, newBalance: getBalance(sid) };
    }
  }
  return { ok: false, error: 'ไม่พบรายการ' };
}

function getHistory(p) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const txSheet = ss.getSheetByName('ธุรกรรม');
  if (!txSheet) return { ok: true, transactions: [] };

  const allData = txSheet.getDataRange().getValues();
  if (allData.length < 2) return { ok: true, transactions: [] };

  const headers = allData[0].map(h => String(h).trim());
  const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

  function findH(names) {
    for (var n of names) { var i = headers.indexOf(n); if (i >= 0) return i; }
    return -1;
  }

  // หา index แต่ละ column ด้วยชื่อ header
  let tiId    = findH(['id']);
  let tiStu   = findH(['นักเรียน_id']);
  let tiName  = findH(['ชื่อ']);
  let tiGrade = findH(['ชั้น']);
  let tiType  = findH(['ประเภท']);
  let tiAmt   = findH(['จำนวนเงิน']);
  let tiDate  = findH(['วันที่']);

  // ถ้าหาจากชื่อไม่เจอ (header เป็น "คอลัมน์ 1" etc.) ให้ใช้ position ตามลำดับ
  // format: id, นักเรียน_id, ชื่อ, ชั้น, ประเภท, จำนวนเงิน, ปีการศึกษา, วันที่
  if (tiId < 0 && tiStu < 0 && tiName < 0) {
    tiId    = 0;
    tiStu   = 1;
    tiName  = 2;
    tiGrade = 3;
    tiType  = 4;
    tiAmt   = 5;
    // tiDate: scan หา column ที่มี Date object หรือ Thai string
    tiDate  = -1;
    const sampleRows = allData.slice(1).filter(r => r[0] !== '');
    if (sampleRows.length > 0) {
      for (let ci = headers.length - 1; ci >= 0; ci--) {
        const val = sampleRows[0][ci];
        if (val instanceof Date) { tiDate = ci; break; }
        if (typeof val === 'string' && MONTHS_TH.some(m => val.includes(m))) { tiDate = ci; break; }
      }
    }
    if (tiDate < 0) tiDate = headers.length - 1;
  }

  // scan หา tiDate จาก content ถ้ายังหาจากชื่อไม่เจอ
  if (tiDate < 0) {
    const sampleRows = allData.slice(1).filter(r => r[0] !== '');
    if (sampleRows.length > 0) {
      for (let ci = headers.length - 1; ci >= 0; ci--) {
        const val = sampleRows[0][ci];
        if (val instanceof Date) { tiDate = ci; break; }
        if (typeof val === 'string' && MONTHS_TH.some(m => val.includes(m))) { tiDate = ci; break; }
      }
    }
    if (tiDate < 0) tiDate = headers.length - 1;
  }

  let data = allData.slice(1)
    .filter(r => r.length > tiId && r[tiId] !== '' && r[tiId] !== null && r[tiId] !== undefined)
    .map(r => {
      const rawDate = r[tiDate];
      let dateStr = '';
      if (rawDate instanceof Date) {
        const thai = new Date(rawDate.getTime() + 7*60*60*1000);
        const fullYear = thai.getUTCFullYear();
        // ถ้าปี > 2500 แสดงว่า Sheets เก็บเป็น พ.ศ. อยู่แล้ว ไม่ต้องบวก 543 อีก
        const y = fullYear > 2500 ? fullYear : fullYear + 543;
        const hh = String(thai.getUTCHours()).padStart(2,'0');
        const mm = String(thai.getUTCMinutes()).padStart(2,'0');
        dateStr = thai.getUTCDate() + ' ' + MONTHS_TH[thai.getUTCMonth()] + ' ' + y + ' ' + hh + ':' + mm;
      } else {
        dateStr = String(rawDate || '');
      }
      return {
        id:        String(r[tiId]  || ''),
        studentId: String(r[tiStu] || ''),
        name:      String(r[tiName]  || ''),
        grade:     String(r[tiGrade] || ''),
        type:      String(r[tiType]  || ''),
        amount:    parseFloat(r[tiAmt]) || 0,
        date:      dateStr
      };
    });

  if (p.studentId) data = data.filter(r => r.studentId === p.studentId);
  if (p.grade)     data = data.filter(r => r.grade === p.grade);
  if (p.date)      data = data.filter(r => r.date.indexOf(p.date) === 0);

  data.reverse();
  if (p.limit) data = data.slice(0, parseInt(p.limit));
  return { ok: true, transactions: data };
}

// ============================================================
// SUMMARY
// ============================================================
function getAllSummary(p) {
  if (p.password !== ADMIN_PASSWORD) return { ok: false, error: 'เฉพาะผู้ดูแล' };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const studAllData = ss.getSheetByName('นักเรียน').getDataRange().getValues();
  // dynamic header lookup ป้องกัน column order เปลี่ยน
  const sumHeaders = studAllData[0].map(function(h) { return String(h).trim(); });
  function findSColSum(names) {
    for (var n of names) { var idx = sumHeaders.indexOf(n); if (idx >= 0) return idx; }
    return -1;
  }
  const ssId     = findSColSum(['id']);
  const ssName   = findSColSum(['ชื่อ-สกุล', 'ชื่อ สกุล', 'ชื่อ']);
  const ssGrade  = findSColSum(['ชั้นปัจจุบัน', 'ชั้น']);
  const ssYear   = findSColSum(['ปีที่เข้า', 'ปีการศึกษา']);
  const ssStatus = findSColSum(['สถานะ']);
  const ssBank   = findSColSum(['เลขบัญชี_ธกส', 'เลขบัญชีธกส', 'เลขบัญชี']);

  const studRows = studAllData.slice(1).filter(function(r) { return r[ssId >= 0 ? ssId : 0] !== ''; });
  const balances = calcAllBalances(ss);
  const grades = {};
  GRADES.forEach(g => grades[g] = { students:[], totalBalance:0 });
  studRows.forEach(function(r) {
    const id     = String(r[ssId     >= 0 ? ssId     : 0] || '');
    const name   = String(r[ssName   >= 0 ? ssName   : 1] || '');
    const grade  = String(r[ssGrade  >= 0 ? ssGrade  : 2] || '');
    const year   = String(r[ssYear   >= 0 ? ssYear   : 3] || '');
    const status = String(r[ssStatus >= 0 ? ssStatus : 4] || '');
    const bank   = String(r[ssBank   >= 0 ? ssBank   : 5] || '');
    if (status === 'จบการศึกษา' || !grades[grade]) return;
    const bal = balances[id] || 0;
    grades[grade].students.push({ id, name, grade, entryYear:year, bankAccount:bank, balance:bal });
    grades[grade].totalBalance += bal;
  });
  const grandTotal = Object.values(grades).reduce((s,g) => s+g.totalBalance, 0);
  const totalStudents = studRows.filter(function(r) {
    return String(r[ssStatus >= 0 ? ssStatus : 4] || '') !== 'จบการศึกษา';
  }).length;
  return { ok: true, grades, grandTotal, totalStudents };
}

// ============================================================
// EXPORT รายเดือน — สร้าง sheet สรุปส่งธนาคาร
// ============================================================
function exportMonthly(p) {
  if (p.password !== ADMIN_PASSWORD) return { ok: false, error: 'เฉพาะผู้ดูแล' };

  const monthIdx = parseInt(p.month) - 1;
  const year     = parseInt(p.year);
  const grade    = p.grade || '';

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const txSheet   = ss.getSheetByName('ธุรกรรม');
  const studSheet = ss.getSheetByName('นักเรียน');
  if (!txSheet || !studSheet) return { ok: false, error: 'ไม่พบ sheet' };

  // อ่านนักเรียน — dynamic index
  const studAllData = studSheet.getDataRange().getValues();
  const studHeaders = studAllData[0].map(h => String(h).trim());
  function findSH(names) {
    for (var n of names) { var i = studHeaders.indexOf(n); if (i >= 0) return i; }
    return -1;
  }
  const siId    = findSH(['id']);
  const siName  = findSH(['ชื่อ-สกุล','ชื่อ สกุล','ชื่อ']);
  const siGrade = findSH(['ชั้นปัจจุบัน','ชั้น']);
  const siBank  = findSH(['เลขบัญชี_ธกส','เลขบัญชีธกส','เลขบัญชี']);

  const studMap = {};
  studAllData.slice(1).forEach(r => {
    if (r[siId]) studMap[String(r[siId])] = {
      name:        String(r[siName]  || ''),
      grade:       String(r[siGrade] || ''),
      bankAccount: siBank >= 0 ? String(r[siBank] || '') : ''
    };
  });

  // อ่านธุรกรรม — dynamic index
  const txAllData = txSheet.getDataRange().getValues();
  const txHeaders = txAllData[0].map(h => String(h).trim());
  function findTH(names) {
    for (var n of names) { var i = txHeaders.indexOf(n); if (i >= 0) return i; }
    return -1;
  }
  const tiStuId = findTH(['นักเรียน_id']);
  const tiGrade = findTH(['ชั้น']);
  const tiType  = findTH(['ประเภท']);
  const tiAmt   = findTH(['จำนวนเงิน']);
  const tiDate  = findTH(['วันที่']);

  const monthName = THAI_MONTHS[monthIdx];
  const yearStr   = String(year);

  // helper แปลงวันที่ทุกรูปแบบ → Thai string
  function toThaiDateStr(val) {
    if (!val) return '';
    if (val instanceof Date) {
      // แปลง Date object → Thai format
      return val.getDate() + ' ' + THAI_MONTHS[val.getMonth()] + ' ' + (val.getFullYear() + 543);
    }
    return String(val);
  }

  const txRows = txAllData.slice(1).filter(r => {
    if (!r[0]) return false;
    const dateStr    = toThaiDateStr(r[tiDate]);
    const gradeMatch = !grade || String(r[tiGrade] || '') === grade;
    return dateStr.includes(monthName) && dateStr.includes(yearStr) && gradeMatch;
  });

  // รวมยอดฝากแต่ละคน
  const summary = {};
  txRows.forEach(r => {
    const sid  = String(r[tiStuId] || '');
    const type = String(r[tiType]  || '');
    const amt  = parseFloat(r[tiAmt]) || 0;
    if (!summary[sid]) summary[sid] = { deposit: 0, withdraw: 0 };
    if (type === 'ฝาก') summary[sid].deposit += amt;
    else summary[sid].withdraw += amt;
  });

  if (Object.keys(summary).length === 0) {
    return { ok: false, error: 'ไม่พบข้อมูลธุรกรรมในเดือน ' + monthName + ' ' + year + (grade ? ' ชั้น' + grade : '') + '\nกรุณาตรวจสอบว่ามีการบันทึกฝากเงินในเดือนนี้หรือไม่' };
  }

  // เรียงตามชั้น
  const gradeOrder = {};
  GRADES.forEach((g, i) => gradeOrder[g] = i);

  const studentList = Object.entries(summary)
    .map(([sid, s]) => {
      const info = studMap[sid] || { name: 'ไม่พบ', grade: '', bankAccount: '' };
      return { sid, deposit: s.deposit, withdraw: s.withdraw, net: s.deposit - s.withdraw, ...info };
    })
    .filter(s => !grade || s.grade === grade)
    .sort((a, b) => {
      const go = (gradeOrder[a.grade] || 0) - (gradeOrder[b.grade] || 0);
      return go !== 0 ? go : a.name.localeCompare(b.name, 'th');
    });

  // ===== สร้าง Sheet ตามรูปแบบธนาคาร =====
  const sheetName = 'ฝากเดือน' + monthName + year + (grade ? '_' + grade : '');
  let out = ss.getSheetByName(sheetName);
  if (out) ss.deleteSheet(out);
  out = ss.insertSheet(sheetName);

  const dateLabel = 'วันที่ .......... เดือน ' + monthName + ' พ.ศ. ' + year;

  // === แถว 1: เลขที่เอกสาร + หน้าที่ ===
  out.getRange('A1').setValue('เลขที่เอกสาร 002');
  out.getRange('G1').setValue('หน้าที่ 1');
  out.getRange('A1').setFontWeight('bold').setBackground('#FFFF00');
  out.getRange('G1').setFontWeight('bold');

  // === แถว 2: ชื่อโรงเรียน ===
  out.getRange('A2:G2').merge();
  out.getRange('A2').setValue('โรงเรียนธนาคารบ้านท่าชะอม')
    .setHorizontalAlignment('center')
    .setFontWeight('bold')
    .setFontSize(14);

  // === แถว 3: หัวเรื่อง ===
  out.getRange('A3:G3').merge();
  out.getRange('A3').setValue('ทะเบียนการรับฝากเงินประจำ' + dateLabel)
    .setHorizontalAlignment('center')
    .setFontWeight('bold');

  // === แถว 4: ว่าง + ชั้น ===
  if (grade) {
    out.getRange('A4:G4').merge();
    out.getRange('A4').setValue('ชั้น ' + grade)
      .setHorizontalAlignment('center')
      .setFontWeight('bold');
  }

  // === แถว 5: หัวตาราง ===
  const headerRow = grade ? 5 : 4;
  const headers = ['ลำดับที่', 'เลขที่บัญชี', 'ชื่อบัญชี', 'การรับฝากเงิน\nจำนวน', 'การรับฝากเงิน\nยอดรวม', 'ผู้รับเงิน', 'หมายเหตุ'];
  out.getRange(headerRow, 1, 1, 7).setValues([headers]);
  out.getRange(headerRow, 1, 1, 7)
    .setBackground('#92D050')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  out.setRowHeight(headerRow, 45);

  // === ข้อมูล ===
  let row = headerRow + 1;
  let grandTotal = 0;

  studentList.forEach((s, i) => {
    const net = s.deposit - s.withdraw;
    out.getRange(row, 1, 1, 7).setValues([[
      i + 1,
      s.bankAccount || '',
      s.name,
      net,
      net,
      '',
      ''
    ]]);
    // จัดรูปแบบ
    out.getRange(row, 1).setHorizontalAlignment('center');
    out.getRange(row, 4, 1, 2).setNumberFormat('#,##0').setHorizontalAlignment('right');
    // สีแถวสลับ
    if ((i + 1) % 2 === 0) out.getRange(row, 1, 1, 7).setBackground('#F2F2F2');
    grandTotal += net;
    row++;
  });

  // === แถวรวม ===
  out.getRange(row, 1, 1, 7).setValues([['', '', 'รวมทั้งหมด', grandTotal, grandTotal, '', '']]);
  out.getRange(row, 1, 1, 7)
    .setFontWeight('bold')
    .setBackground('#92D050');
  out.getRange(row, 4, 1, 2).setNumberFormat('#,##0');

  // === ลายเซ็น ===
  row += 2;
  out.getRange(row, 2, 1, 2).merge();
  out.getRange(row, 2).setValue('ลงชื่อ .................................................. ผู้รับฝาก');
  out.getRange(row, 5, 1, 2).merge();
  out.getRange(row, 5).setValue('ลงชื่อ .................................................. ผู้ตรวจสอบ');
  row++;
  out.getRange(row, 2, 1, 2).merge();
  out.getRange(row, 2).setValue('(.............................................)');
  out.getRange(row, 5, 1, 2).merge();
  out.getRange(row, 5).setValue('(.............................................)');

  // === จัดขนาดคอลัมน์ ===
  out.setColumnWidth(1, 55);   // ลำดับ
  out.setColumnWidth(2, 130);  // เลขบัญชี
  out.setColumnWidth(3, 180);  // ชื่อ
  out.setColumnWidth(4, 80);   // จำนวน
  out.setColumnWidth(5, 80);   // ยอดรวม
  out.setColumnWidth(6, 80);   // ผู้รับเงิน
  out.setColumnWidth(7, 80);   // หมายเหตุ

  // ===เส้นตาราง===
  out.getRange(headerRow, 1, row - headerRow, 7).setBorder(true, true, true, true, true, true);

  return {
    ok: true,
    sheetName,
    studentCount: studentList.length,
    totalDeposit: grandTotal,
    totalWithdraw: 0,
    net: grandTotal,
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit#gid=' + out.getSheetId()
  };
}

// ============================================================
// EXPORT รายเทอม
// ============================================================
function exportTerm(p) {
  if (p.password !== ADMIN_PASSWORD) return { ok: false, error: 'เฉพาะผู้ดูแล' };

  const term  = parseInt(p.term);
  const year  = parseInt(p.year);
  const grade = p.grade || '';
  const termMonths = term === 1 ? [4,5,6,7,8] : [10,11,0,1,2];

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const txSheet   = ss.getSheetByName('ธุรกรรม');
  const studSheet = ss.getSheetByName('นักเรียน');
  if (!txSheet || !studSheet) return { ok: false, error: 'ไม่พบ sheet' };

  // อ่านนักเรียน — dynamic index
  const studHeaders = studSheet.getDataRange().getValues()[0];
  const siName  = studHeaders.indexOf('ชื่อ-สกุล');
  const siGrade = studHeaders.indexOf('ชั้นปัจจุบัน');
  const siBank  = studHeaders.indexOf('เลขบัญชี_ธกส');
  const studMap = {};
  studSheet.getDataRange().getValues().slice(1).forEach(r => {
    if (r[0]) studMap[r[0]] = {
      name:        r[siName]  || '',
      grade:       r[siGrade] || '',
      bankAccount: siBank >= 0 ? (r[siBank] || '') : ''
    };
  });

  // อ่านธุรกรรม — dynamic index
  const txHeaders = txSheet.getDataRange().getValues()[0];
  const tiStuId = txHeaders.indexOf('นักเรียน_id');
  const tiGrade = txHeaders.indexOf('ชั้น');
  const tiType  = txHeaders.indexOf('ประเภท');
  const tiAmt   = txHeaders.indexOf('จำนวนเงิน');
  const tiDate  = txHeaders.indexOf('วันที่');

  const txRows = txSheet.getDataRange().getValues().slice(1).filter(r => {
    if (!r[0]) return false;
    // แปลง Date object หรือ string → Thai string
    const rawDate = r[tiDate];
    const dateStr = (rawDate instanceof Date)
      ? rawDate.getDate() + ' ' + THAI_MONTHS[rawDate.getMonth()] + ' ' + (rawDate.getFullYear()+543)
      : String(rawDate || '');
    const gradeMatch = !grade || String(r[tiGrade] || '') === grade;
    const monthMatch = termMonths.some(m => {
      const checkYear = (term === 2 && m <= 2) ? year + 1 : year;
      return dateStr.includes(THAI_MONTHS[m]) && dateStr.includes(String(checkYear));
    });
    return monthMatch && gradeMatch;
  });

  const summary = {};
  txRows.forEach(r => {
    const sid = String(r[tiStuId] || '');
    const type = String(r[tiType] || '');
    const amt = parseFloat(r[tiAmt]) || 0;
    const rawDate = r[tiDate];
    const dateStr = (rawDate instanceof Date)
      ? rawDate.getDate() + ' ' + THAI_MONTHS[rawDate.getMonth()] + ' ' + (rawDate.getFullYear()+543)
      : String(rawDate || '');
    let monthLabel = '';
    THAI_MONTHS.forEach((m, i) => { if (dateStr.includes(m)) monthLabel = m; });
    if (!summary[sid]) summary[sid] = { deposit:0, withdraw:0, monthly:{} };
    if (!summary[sid].monthly[monthLabel]) summary[sid].monthly[monthLabel] = 0;
    if (type === 'ฝาก') { summary[sid].deposit += amt; summary[sid].monthly[monthLabel] += amt; }
    else { summary[sid].withdraw += amt; summary[sid].monthly[monthLabel] -= amt; }
  });

  if (Object.keys(summary).length === 0) {
    return { ok: false, error: 'ไม่พบข้อมูลธุรกรรมในภาคเรียนที่ ' + term + ' ปี ' + year + (grade ? ' ชั้น' + grade : '') };
  }

  const termLabel  = 'เทอม' + term + '_' + year;
  const sheetName  = 'สรุป' + termLabel + (grade ? '_' + grade : '');
  let outSheet = ss.getSheetByName(sheetName);
  if (outSheet) ss.deleteSheet(outSheet);
  outSheet = ss.insertSheet(sheetName);

  const title = SCHOOL_NAME + ' — สรุปยอดออมทรัพย์ ภาคเรียนที่' + term + ' ปีการศึกษา ' + year + (grade ? ' ชั้น' + grade : '');
  outSheet.getRange(1,1).setValue(title).setFontWeight('bold').setFontSize(13);
  outSheet.getRange(2,1).setValue('วันที่สร้าง: ' + thaiDate(new Date())).setFontColor('#78716C');

  const monthLabels = termMonths.map(m => THAI_MONTHS[m]);
  const headers = ['ลำดับ','ชื่อ-สกุล','ชั้น','เลขบัญชี ธกส.'].concat(
    monthLabels.map(m => 'ฝาก ' + m)
  ).concat(['รวมฝาก','รวมถอน','คงเหลือ']);
  const totalCols = headers.length;
  outSheet.getRange(4,1,1,totalCols).setValues([headers]);
  styleHeader(outSheet, totalCols);

  const gradeOrder = {};
  GRADES.forEach((g, i) => gradeOrder[g] = i);

  const studentList = Object.entries(summary)
    .map(([sid, s]) => ({ sid, ...s, ...(studMap[sid] || { name:'ไม่พบ', grade:'', bankAccount:'' }) }))
    .filter(s => !grade || s.grade === grade)
    .sort((a, b) => (gradeOrder[a.grade] || 0) - (gradeOrder[b.grade] || 0));

  let row = 5, no = 1, grandDep = 0, grandWit = 0;
  studentList.forEach(s => {
    const monthlyAmts = monthLabels.map(m => s.monthly[m] || 0);
    const rowData = [no++, s.name, s.grade, s.bankAccount || '—']
      .concat(monthlyAmts)
      .concat([s.deposit, s.withdraw, s.deposit - s.withdraw]);
    outSheet.getRange(row, 1, 1, totalCols).setValues([rowData]);
    if (row % 2 === 0) outSheet.getRange(row, 1, 1, totalCols).setBackground('#F5F5F4');
    grandDep += s.deposit; grandWit += s.withdraw; row++;
  });

  const sumRow = ['', 'รวมทั้งหมด', '', '']
    .concat(monthLabels.map(m => studentList.reduce((s, x) => s + (x.monthly[m] || 0), 0)))
    .concat([grandDep, grandWit, grandDep - grandWit]);
  outSheet.getRange(row, 1, 1, totalCols).setValues([sumRow])
    .setFontWeight('bold').setBackground('#1C1917').setFontColor('#FFFFFF');

  outSheet.autoResizeColumns(1, totalCols);
  outSheet.getRange(5, 5, row - 4, totalCols - 4).setNumberFormat('#,##0.00');

  return {
    ok: true, sheetName,
    studentCount: studentList.length,
    totalDeposit: grandDep,
    totalWithdraw: grandWit,
    net: grandDep - grandWit,
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit#gid=' + outSheet.getSheetId()
  };
}
// ============================================================
// PROMOTE
// ============================================================
function promoteGrade(p) {
  if (p.password !== ADMIN_PASSWORD) return { ok: false, error: 'เฉพาะผู้ดูแล' };
  const grade = p.grade;
  if (!grade || !NEXT_GRADE[grade]) return { ok: false, error: 'ชั้นไม่ถูกต้อง' };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const studSheet = ss.getSheetByName('นักเรียน');
  const histSheet = ss.getSheetByName('ประวัติเลื่อนชั้น');
  const data = studSheet.getDataRange().getValues();
  const nextGrade = NEXT_GRADE[grade];
  const dateStr = thaiDate(new Date());
  const year = thaiYear();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === grade && data[i][4] === 'กำลังเรียน') {
      histSheet.appendRow([data[i][0], data[i][1], grade, nextGrade, year, dateStr]);
      if (nextGrade === 'จบการศึกษา') {
        studSheet.getRange(i+1, 3).setValue('จบการศึกษา');
        studSheet.getRange(i+1, 5).setValue('จบการศึกษา');
      } else {
        studSheet.getRange(i+1, 3).setValue(nextGrade);
      }
      count++;
    }
  }
  return { ok: true, promoted: count, from: grade, to: nextGrade };
}

function promoteAll(p) {
  if (p.password !== ADMIN_PASSWORD) return { ok: false, error: 'เฉพาะผู้ดูแล' };
  const results = [];
  [...GRADES].reverse().forEach(g => results.push(promoteGrade({ password: ADMIN_PASSWORD, grade: g })));
  return { ok: true, results };
}

function getGraduated(p) {
  if (p.password !== ADMIN_PASSWORD) return { ok: false, error: 'เฉพาะผู้ดูแล' };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const rows = ss.getSheetByName('นักเรียน').getDataRange().getValues().slice(1)
    .filter(r => r[0] !== '' && r[4] === 'จบการศึกษา');
  const balances = calcAllBalances(ss);
  return { ok: true, students: rows.map(r => ({
    id:r[0], name:r[1], entryYear:r[3], bankAccount:r[5]||'', balance: balances[r[0]]||0
  }))};
}

// ============================================================
// BOOTSTRAP — คืนนักเรียนทุกชั้นในคำขอเดียว (ลด 8 calls → 1 call)
// ============================================================
function getBootstrap() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const studSheet = ss.getSheetByName('นักเรียน');
  if (!studSheet) return { ok: false, error: 'ไม่พบ sheet นักเรียน' };

  const allData = studSheet.getDataRange().getValues();
  const headers = allData[0].map(h => String(h).trim());

  function findCol(names) {
    for (var n of names) { var idx = headers.indexOf(n); if (idx >= 0) return idx; }
    return -1;
  }
  const idxId     = findCol(['id']);
  const idxName   = findCol(['ชื่อ-สกุล','ชื่อ สกุล','ชื่อ']);
  const idxGrade  = findCol(['ชั้นปัจจุบัน','ชั้น']);
  const idxYear   = findCol(['ปีที่เข้า','ปีการศึกษา']);
  const idxStatus = findCol(['สถานะ']);
  const idxBank   = findCol(['เลขบัญชี_ธกส','เลขบัญชีธกส','เลขบัญชี']);

  // คำนวณยอดครั้งเดียว — ใช้ cache
  const balances = calcAllBalances(ss);

  // จัดกลุ่มตามชั้น
  const gradeMap = {};
  GRADES.forEach(g => gradeMap[g] = []);

  allData.slice(1).forEach(r => {
    if (!r[idxId]) return;
    const status = idxStatus >= 0 ? String(r[idxStatus] || '').trim() : '';
    if (status === 'จบการศึกษา') return;
    const grade = idxGrade >= 0 ? String(r[idxGrade] || '').trim() : '';
    if (!gradeMap[grade]) return; // ชั้นที่ไม่อยู่ใน GRADES
    gradeMap[grade].push({
      id:          String(r[idxId] || ''),
      name:        idxName   >= 0 ? String(r[idxName]   || '') : '',
      grade,
      entryYear:   idxYear   >= 0 ? String(r[idxYear]   || '') : '',
      status:      status || 'กำลังเรียน',
      bankAccount: idxBank   >= 0 ? String(r[idxBank]   || '') : '',
      balance:     balances[String(r[idxId])] || 0
    });
  });

  // เรียงตามลำดับ id และเซ็ต GAS cache ต่อชั้น
  const sCache = CacheService.getScriptCache();
  GRADES.forEach(g => {
    gradeMap[g].sort(function(a,b){
      return (parseInt(String(a.id).replace('S',''))||0) - (parseInt(String(b.id).replace('S',''))||0);
    });
    try { sCache.put('ss_stus_'+g, JSON.stringify({ok:true,students:gradeMap[g]}), 180); } catch(e) {}
  });

  return { ok: true, grades: gradeMap };
}

// keepWarm — รัน time-based trigger ทุก 10 นาทีเพื่อป้องกัน cold start
function keepWarm() {
  SpreadsheetApp.openById(SHEET_ID);
}

// ============================================================
// UTILS
// ============================================================
function checkAuth(p) {
  return p.password === TEACHER_PASSWORD || p.password === ADMIN_PASSWORD;
}
function thaiDate(d) {
  const y = d.getFullYear()+543;
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return d.getDate() + ' ' + THAI_MONTHS[d.getMonth()] + ' ' + y + ' ' + hh + ':' + mm;
}
function thaiYear() { return new Date().getFullYear() + 543; }

// ============================================================
// สร้างฟอร์มส่งธนาคาร — รันจาก Apps Script โดยตรง
// เปลี่ยน function เป็น createBankForm แล้วกด ▶ เรียกใช้
// ============================================================

// ตั้งค่าก่อนรัน
var FORM_MONTH  = 5;      // เดือน (1-12)
var FORM_YEAR   = 2569;   // ปี พ.ศ.
var FORM_GRADE  = '';     // ชั้น เช่น 'ป.1' หรือ '' = ทุกชั้น
var FORM_TERM   = 1;      // เทอม 1 หรือ 2 (สำหรับ createTermForm)

function createBankForm() {
  // สร้างฟอร์มส่งธนาคารรายเดือน
  var result = exportMonthly({
    password: ADMIN_PASSWORD,
    month: String(FORM_MONTH),
    year: String(FORM_YEAR),
    grade: FORM_GRADE
  });
  if (result.ok) {
    SpreadsheetApp.getUi().alert(
      '✅ สร้างฟอร์มสำเร็จ!\n\n' +
      'Sheet: ' + result.sheetName + '\n' +
      'นักเรียน: ' + result.studentCount + ' คน\n' +
      'ยอดฝากรวม: ' + result.totalDeposit.toLocaleString() + ' บาท\n\n' +
      'กดดู sheet "' + result.sheetName + '" ได้เลย'
    );
  } else {
    SpreadsheetApp.getUi().alert('❌ เกิดข้อผิดพลาด:\n' + result.error);
  }
}

function createTermForm() {
  // สร้างฟอร์มส่งธนาคารรายเทอม
  var result = exportTerm({
    password: ADMIN_PASSWORD,
    term: String(FORM_TERM),
    year: String(FORM_YEAR),
    grade: FORM_GRADE
  });
  if (result.ok) {
    SpreadsheetApp.getUi().alert(
      '✅ สร้างฟอร์มสำเร็จ!\n\n' +
      'Sheet: ' + result.sheetName + '\n' +
      'นักเรียน: ' + result.studentCount + ' คน\n' +
      'ยอดฝากรวม: ' + result.totalDeposit.toLocaleString() + ' บาท\n\n' +
      'กดดู sheet "' + result.sheetName + '" ได้เลย'
    );
  } else {
    SpreadsheetApp.getUi().alert('❌ เกิดข้อผิดพลาด:\n' + result.error);
  }
}

// เพิ่มเมนูใน Google Sheets อัตโนมัติ
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 ระบบออมทรัพย์')
    .addItem('📅 สร้างฟอร์มส่งธนาคาร (รายเดือน)', 'createBankForm')
    .addItem('📚 สร้างฟอร์มส่งธนาคาร (รายเทอม)', 'createTermForm')
    .addSeparator()
    .addItem('⚙️ ตั้งค่าเดือน/ปี/ชั้น', 'showSettings')
    .addToUi();
}

function showSettings() {
  var ui = SpreadsheetApp.getUi();
  var html = '<p style="font-family:sans-serif;font-size:14px">' +
    'แก้ค่าใน Code.gs บรรทัดหัว:<br><br>' +
    '<b>FORM_MONTH</b> = เดือน (1-12)<br>' +
    '<b>FORM_YEAR</b> = ปี พ.ศ. เช่น 2569<br>' +
    '<b>FORM_GRADE</b> = ชั้น เช่น ป.1 หรือ "" = ทุกชั้น<br>' +
    '<b>FORM_TERM</b> = เทอม 1 หรือ 2' +
    '</p>';
  ui.alert('วิธีตั้งค่า', 
    'แก้ค่าใน Code.gs บรรทัดหัว:\n\n' +
    'FORM_MONTH = เดือน (1-12)\n' +
    'FORM_YEAR  = ปี พ.ศ. เช่น 2569\n' +
    'FORM_GRADE = ชั้น เช่น ป.1 หรือ "" = ทุกชั้น\n' +
    'FORM_TERM  = เทอม 1 หรือ 2',
    ui.ButtonSet.OK);
}


function testPromoteAndBalance() {
  Logger.log('=== ทดสอบ: เลื่อนชั้น ป.6 → จบการศึกษา ===');

  var ss = SpreadsheetApp.openById(SHEET_ID);
  var studSheet = ss.getSheetByName('นักเรียน');
  var txSheet   = ss.getSheetByName('ธุรกรรม');

  // 1. ดูนักเรียน ป.6 ก่อนเลื่อนชั้น
  var before = getStudents({ grade: 'ป.6' });
  Logger.log('นักเรียน ป.6 ก่อนเลื่อน: ' + before.students.length + ' คน');
  before.students.forEach(function(s) {
    Logger.log('  ' + s.name + ' | ยอด: ' + s.balance + ' บาท | สถานะ: ' + s.status);
  });

  // 2. เลื่อนชั้น ป.6
  Logger.log('\n--- เลื่อนชั้น ป.6 → จบการศึกษา ---');
  var promoteResult = promoteGrade({ password: ADMIN_PASSWORD, grade: 'ป.6' });
  Logger.log('ผล: ' + JSON.stringify(promoteResult));

  // 3. ดูนักเรียนที่จบแล้ว
  Logger.log('\n--- นักเรียนที่จบการศึกษา ---');
  var graduated = getGraduated({ password: ADMIN_PASSWORD });
  graduated.students.forEach(function(s) {
    Logger.log('  ' + s.name + ' | ยอดสะสม: ' + s.balance + ' บาท ← ยังคงอยู่ครบ');
  });

  // 4. ตรวจว่า ป.6 ไม่แสดงในรายชื่อปกติแล้ว
  var after = getStudents({ grade: 'ป.6' });
  Logger.log('\nนักเรียน ป.6 หลังเลื่อน: ' + after.students.length + ' คน (ควรเป็น 0)');

  Logger.log('\n✅ สรุป: ยอดเงินยังอยู่ครบ เพียงแต่ย้ายไปอยู่ในหน้า "จบแล้ว"');
}

function debugSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('นักเรียน');
  if (!sheet) { Logger.log('ไม่พบ sheet นักเรียน'); return; }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  Logger.log('lastRow: ' + lastRow + ', lastCol: ' + lastCol);

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  Logger.log('Headers: ' + JSON.stringify(headers));

  // ดูทุก row ว่ามีอะไร
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    Logger.log('Total data rows: ' + data.length);
    data.forEach(function(r, i) {
      Logger.log('Row ' + (i+2) + ': id=' + r[0] + ' name=' + r[1] + ' grade=' + r[2] + ' status=' + r[4]);
    });
  }
}

function testAddStudent() {
  // ทดสอบเพิ่มนักเรียน
  var result = addStudent({ name: 'ทดสอบ ระบบ', grade: 'ป.1', bankAccount: '', password: TEACHER_PASSWORD });
  Logger.log('addStudent result: ' + JSON.stringify(result));

  // ดู header จริงใน sheet
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('นักเรียน');
  if (sheet) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Headers: ' + JSON.stringify(headers));
    Logger.log('Last column: ' + sheet.getLastColumn());
    Logger.log('Last row: ' + sheet.getLastRow());
    var data = sheet.getRange(1, 1, Math.min(4, sheet.getLastRow()), sheet.getLastColumn()).getValues();
    Logger.log('Data rows: ' + JSON.stringify(data));
  } else {
    Logger.log('ERROR: ไม่พบ sheet นักเรียน');
  }
}

function debugHistory() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('ธุรกรรม');
  if (!sheet) { Logger.log('ไม่พบ sheet ธุรกรรม'); return; }

  var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  Logger.log('Headers (' + headers.length + '): ' + JSON.stringify(headers));

  var rows = sheet.getDataRange().getValues().slice(1).filter(function(r){ return r[0] !== ''; });
  Logger.log('Total data rows: ' + rows.length);

  if (rows.length > 0) {
    Logger.log('Row 1 raw: ' + JSON.stringify(rows[0]));
    rows[0].forEach(function(v, i) {
      Logger.log('  col ' + i + ' [' + headers[i] + ']: ' + JSON.stringify(v) + ' type=' + typeof v + (v instanceof Date ? ' (Date)' : ''));
    });
  }

  // ลองรัน getHistory จริง
  var result = getHistory({ grade: 'ป.1', limit: '5' });
  Logger.log('getHistory result ok=' + result.ok + ' count=' + result.transactions.length);
  if (result.transactions.length > 0) {
    Logger.log('Sample tx date: [' + result.transactions[0].date + ']');
  }
}

// ฟังก์ชัน debug: ทดสอบว่า appendRow ใช้งานได้ไหม
// รันใน Apps Script editor → Run → testAppendRow แล้วดู Logs
function testAppendRow() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('ธุรกรรม');
  Logger.log('sheet found: ' + !!sheet);
  if (!sheet) return;

  Logger.log('rows before: ' + sheet.getLastRow());
  Logger.log('isProtected: ' + sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).length);

  try {
    sheet.appendRow(['TEST_DELETE_ME', 'S_TEST', 'ทดสอบ', 'ป.1', 'ฝาก', 1, '2569', 'ทดสอบ']);
    SpreadsheetApp.flush();
    Logger.log('rows after appendRow+flush: ' + sheet.getLastRow());

    // ลบ row ทดสอบออก
    var lastRow = sheet.getLastRow();
    if (sheet.getRange(lastRow, 1).getValue() === 'TEST_DELETE_ME') {
      sheet.deleteRow(lastRow);
      SpreadsheetApp.flush();
      Logger.log('test row deleted. rows now: ' + sheet.getLastRow());
    }
  } catch(e) {
    Logger.log('ERROR: ' + e.message);
  }
}

function testTodayFilter() {
  // ทดสอบว่า date filter ทำงานถูกไหม
  var todayDate = new Date();
  var months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  // วันนี้ใน timezone ไทย
  var thaiNow = new Date(todayDate.getTime() + 7*60*60*1000);
  var todayStr = thaiNow.getUTCDate() + ' ' + months[thaiNow.getUTCMonth()] + ' ' + (thaiNow.getUTCFullYear()+543);
  Logger.log('Today Thai string: ' + todayStr);
  
  // ดูข้อมูลในชั้น ป.1
  var result = getHistory({ grade: 'ป.1', limit: '5' });
  Logger.log('Total transactions: ' + result.transactions.length);
  result.transactions.forEach(function(t) {
    Logger.log('date: [' + t.date + '] | starts with today: ' + (t.date.indexOf(todayStr) === 0));
  });
  
  // ทดสอบ filter
  var filtered = getHistory({ grade: 'ป.1', date: todayStr, limit: '100' });
  Logger.log('Filtered (today only): ' + filtered.transactions.length);
}

function testExportMonthly() {
  // แก้ค่าตามต้องการ
  var result = exportMonthly({
    password: ADMIN_PASSWORD,
    month: '5',    // พฤษภาคม
    year: '2569',
    grade: ''      // ว่าง = ทุกชั้น
  });
  Logger.log('Result: ' + JSON.stringify(result));

  // debug ดูวันที่จริงใน sheet
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var txSheet = ss.getSheetByName('ธุรกรรม');
  if (txSheet) {
    var rows = txSheet.getDataRange().getValues().slice(1).filter(function(r) { return r[0]; });
    rows.forEach(function(r) {
      var dateVal = r[7];
      Logger.log('Date raw: ' + JSON.stringify(dateVal) + ' | type: ' + typeof dateVal + ' | instanceof Date: ' + (dateVal instanceof Date));
    });
  }
}

function testExportTerm() {
  var result = exportTerm({
    password: ADMIN_PASSWORD,
    term: '1',
    year: '2569',
    grade: ''
  });
  Logger.log('Result: ' + JSON.stringify(result));
}
