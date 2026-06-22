// ============================================================
// ระบบเก็บค่ารถนักเรียน — โรงเรียนบ้านท่าชะอม
// แชร์ Google Sheet เล่มเดียวกับระบบออมทรัพย์ (อ่านชีต "นักเรียน")
// เก็บข้อมูลรายเทอม / รีเซตทุกเทอม + บันทึกเงินนอกถาวร
// ============================================================

const SHEET_ID         = '1_FiMepObJro052keUyznmYCnygfNKVGta7LFA3-bVQM';
const TEACHER_PASSWORD = '61010097';
const ADMIN_PASSWORD   = 'admin61010097';
const SCHOOL_NAME      = 'โรงเรียนบ้านท่าชะอม';

const GRADES = ['อ.2','อ.3','ป.1','ป.2','ป.3','ป.4','ป.5','ป.6'];

const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

// ----- ตั้งค่าค่ารถ -----
const FARE_PER_MONTH = 100;
const TERM_MONTHS = {
  '1': ['มิ.ย.','ก.ค.','ส.ค.','ก.ย.'],   // เทอม 1 = 4 เดือน = 400
  '2': ['พ.ย.','ธ.ค.','ม.ค.','ก.พ.']    // เทอม 2 = 4 เดือน = 400
};

// ชื่อชีต
const SH_STUDENTS = 'นักเรียน';     // แชร์กับระบบออมทรัพย์ (อ่านอย่างเดียว)
const SH_RIDERS   = 'คนนั่งรถ';      // รายชื่อคนที่นั่งรถ + สายรถ (อยู่ถาวร)
const SH_FARE     = 'ค่ารถ';         // บันทึกการจ่ายรายเดือน (1 แถว = 1 เดือนที่จ่าย)
const SH_EXTERNAL = 'บันทึกเงินนอก'; // ledger ถาวร — รีเซตเทอมแล้วไม่หาย

// ============================================================
// ENTRY POINT
// ============================================================
function doGet(e)  { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action || '';
  let result;
  try {
    switch(action) {
      case 'checkRole':       result = checkRole(params); break;
      case 'getConfig':       result = getConfig(); break;
      case 'getGradeSummary': result = getGradeSummary(params); break;
      case 'getRiders':       result = getRiders(params); break;
      case 'setRider':        result = setRider(params); break;
      case 'setRoute':        result = setRoute(params); break;
      case 'getFareGrid':     result = getFareGrid(params); break;
      case 'payMonth':        result = payMonth(params); break;
      case 'unpayMonth':      result = unpayMonth(params); break;
      case 'payTerm':         result = payTerm(params); break;
      case 'getDashboard':    result = getDashboard(params); break;
      case 'recordExternal':  result = recordExternal(params); break;
      case 'getExternalLog':  result = getExternalLog(params); break;
      case 'deleteExternal':  result = deleteExternal(params); break;
      case 'initSheets':      result = initSheets(); break;
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
// CONFIG / ROLE
// ============================================================
function getConfig() {
  return {
    ok: true,
    school: SCHOOL_NAME,
    grades: GRADES,
    farePerMonth: FARE_PER_MONTH,
    termMonths: TERM_MONTHS,
    currentYear: thaiYear()
  };
}

function checkRole(p) {
  if (p.password === ADMIN_PASSWORD)   return { ok: true, role: 'admin' };
  if (p.password === TEACHER_PASSWORD) return { ok: true, role: 'teacher' };
  return { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' };
}

function checkAuth(p) {
  return p.password === TEACHER_PASSWORD || p.password === ADMIN_PASSWORD;
}

// ============================================================
// INIT SHEETS — สร้างชีตของระบบค่ารถ (ไม่แตะชีตออมทรัพย์)
// ============================================================
function initSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  let r = ss.getSheetByName(SH_RIDERS);
  if (!r) {
    r = ss.insertSheet(SH_RIDERS);
    r.getRange(1,1,1,5).setValues([['นักเรียน_id','ชื่อ','ชั้น','สายรถ','วันที่เพิ่ม']]);
    styleHeader(r, 5); r.setFrozenRows(1); r.setColumnWidth(2, 180);
  } else {
    // migrate: ถ้ายังไม่มีคอลัมน์ "สายรถ" ให้แทรกที่ตำแหน่ง 4
    const hd = r.getRange(1,1,1,r.getLastColumn()).getValues()[0].map(x => String(x).trim());
    if (hd.indexOf('สายรถ') < 0) {
      r.insertColumnBefore(4);
      r.getRange(1,4).setValue('สายรถ');
      styleHeader(r, Math.max(5, r.getLastColumn()));
    }
  }

  if (!ss.getSheetByName(SH_FARE)) {
    const s = ss.insertSheet(SH_FARE);
    s.getRange(1,1,1,7).setValues([['id','นักเรียน_id','ปีการศึกษา','เทอม','เดือน','จำนวนเงิน','วันที่']]);
    styleHeader(s, 7); s.setFrozenRows(1);
  }
  if (!ss.getSheetByName(SH_EXTERNAL)) {
    const s = ss.insertSheet(SH_EXTERNAL);
    s.getRange(1,1,1,7).setValues([['id','ปีการศึกษา','เทอม','รายการ','จำนวนเงิน','วันที่บันทึก','หมายเหตุ']]);
    styleHeader(s, 7); s.setFrozenRows(1); s.setColumnWidth(4, 200); s.setColumnWidth(7, 200);
  }
  return { ok: true, message: 'สร้าง/ตรวจชีตระบบค่ารถสำเร็จ (คนนั่งรถ, ค่ารถ, บันทึกเงินนอก)' };
}

function styleHeader(sheet, cols) {
  sheet.getRange(1,1,1,cols)
    .setFontWeight('bold').setBackground('#1C1917').setFontColor('#FFFFFF');
}

// ============================================================
// ROSTER (อ่านชีต "นักเรียน" ของระบบออมทรัพย์)
// ============================================================
function readRoster(ss) {
  const sheet = ss.getSheetByName(SH_STUDENTS);
  if (!sheet) return [];
  const all = sheet.getDataRange().getValues();
  if (all.length < 2) return [];
  const headers = all[0].map(h => String(h).trim());
  function find(names) {
    for (var n of names) { var i = headers.indexOf(n); if (i >= 0) return i; }
    return -1;
  }
  const iId    = find(['id']);
  const iName  = find(['ชื่อ-สกุล','ชื่อ สกุล','ชื่อ']);
  const iGrade = find(['ชั้นปัจจุบัน','ชั้น']);
  const iStat  = find(['สถานะ']);
  return all.slice(1)
    .filter(r => r[iId])
    .filter(r => iStat < 0 || String(r[iStat] || '').trim() !== 'จบการศึกษา')
    .map(r => ({
      id:    String(r[iId]),
      name:  iName  >= 0 ? String(r[iName]  || '') : '',
      grade: iGrade >= 0 ? String(r[iGrade] || '') : ''
    }));
}

function gradeOrderVal(g) {
  var i = GRADES.indexOf(g);
  return i < 0 ? 99 : i;
}

// ============================================================
// RIDERS — เลือกคนที่นั่งรถ + สายรถ
// อ่านคืน {sid: {route:'...'}}
// ============================================================
function readRiders(ss) {
  const sheet = ss.getSheetByName(SH_RIDERS);
  const map = {};
  if (!sheet) return map;
  const all = sheet.getDataRange().getValues();
  if (all.length < 2) return map;
  const hd = all[0].map(h => String(h).trim());
  const iId    = hd.indexOf('นักเรียน_id') >= 0 ? hd.indexOf('นักเรียน_id') : 0;
  const iRoute = hd.indexOf('สายรถ');
  all.slice(1).forEach(r => {
    if (r[iId]) map[String(r[iId])] = { route: iRoute >= 0 ? String(r[iRoute] || '') : '' };
  });
  return map;
}

function getRiders(p) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const roster = readRoster(ss);
  const riders = readRiders(ss);

  let list = roster.map(s => ({
    id: s.id, name: s.name, grade: s.grade,
    rides: !!riders[s.id],
    route: riders[s.id] ? riders[s.id].route : ''
  }));
  if (p.grade) list = list.filter(s => s.grade === p.grade);
  if (p.onlyRiders === '1') list = list.filter(s => s.rides);
  list.sort((a, b) => {
    var g = gradeOrderVal(a.grade) - gradeOrderVal(b.grade);
    return g !== 0 ? g : a.name.localeCompare(b.name, 'th');
  });
  return { ok: true, students: list };
}

function setRider(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  if (!p.studentId) return { ok: false, error: 'ไม่ระบุนักเรียน' };
  const rides = String(p.rides) === '1' || String(p.rides) === 'true';
  const route = String(p.route || '');

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SH_RIDERS);
  if (!sheet) { initSheets(); sheet = ss.getSheetByName(SH_RIDERS); }

  const sid = String(p.studentId);
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === sid) { rowIdx = i + 1; break; }
  }

  if (rides) {
    if (rowIdx < 0) {
      const roster = readRoster(ss);
      const info = roster.filter(s => s.id === sid)[0] || { name: '', grade: '' };
      // คอลัมน์: นักเรียน_id | ชื่อ | ชั้น | สายรถ | วันที่เพิ่ม
      sheet.appendRow([sid, info.name, info.grade, route, thaiDate(new Date())]);
    } else if (route) {
      sheet.getRange(rowIdx, 4).setValue(route);
    }
  } else {
    if (rowIdx > 0) sheet.deleteRow(rowIdx);
  }
  SpreadsheetApp.flush();
  return { ok: true, studentId: sid, rides: rides, route: route };
}

function setRoute(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  if (!p.studentId) return { ok: false, error: 'ไม่ระบุนักเรียน' };
  const route = String(p.route || '');
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SH_RIDERS);
  if (!sheet) { initSheets(); sheet = ss.getSheetByName(SH_RIDERS); }
  const sid = String(p.studentId);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === sid) {
      sheet.getRange(i + 1, 4).setValue(route);
      SpreadsheetApp.flush();
      return { ok: true, studentId: sid, route: route };
    }
  }
  // ยังไม่เป็นคนนั่งรถ → เพิ่มให้เลย พร้อมสายรถ
  const roster = readRoster(ss);
  const info = roster.filter(s => s.id === sid)[0] || { name: '', grade: '' };
  sheet.appendRow([sid, info.name, info.grade, route, thaiDate(new Date())]);
  SpreadsheetApp.flush();
  return { ok: true, studentId: sid, route: route, added: true };
}

// ============================================================
// GRADE SUMMARY — สำหรับหน้าเลือกชั้น
// ============================================================
function getGradeSummary(p) {
  const year = String(p.year || thaiYear());
  const term = String(p.term || '1');
  const months = TERM_MONTHS[term] || [];
  const termTotal = months.length * FARE_PER_MONTH;

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const roster = readRoster(ss);
  const riders = readRiders(ss);
  const paid = readFarePaid(ss, year, term);

  const g = {};
  GRADES.forEach(x => g[x] = { grade: x, totalStudents: 0, riders: 0, fullyPaid: 0, collected: 0, expected: 0 });
  roster.forEach(s => { if (g[s.grade]) g[s.grade].totalStudents++; });

  Object.keys(riders).forEach(sid => {
    const s = roster.filter(x => x.id === sid)[0];
    if (!s || !g[s.grade]) return;
    let cnt = 0;
    months.forEach(m => { if (paid[sid] && paid[sid][m]) cnt++; });
    g[s.grade].riders++;
    g[s.grade].collected += cnt * FARE_PER_MONTH;
    g[s.grade].expected  += termTotal;
    if (months.length > 0 && cnt === months.length) g[s.grade].fullyPaid++;
  });

  return { ok: true, year, term, termTotal,
    grades: GRADES.map(x => g[x]).filter(x => x.totalStudents > 0) };
}

// ============================================================
// FARE GRID — ตารางรายชั้น (รวมคนนั่ง/ไม่นั่ง + สายรถ + ติ๊กเดือน)
// ============================================================
function getFareGrid(p) {
  const year = String(p.year || thaiYear());
  const term = String(p.term || '1');
  const months = TERM_MONTHS[term] || [];

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const roster = readRoster(ss);
  const riders = readRiders(ss);
  const paid = readFarePaid(ss, year, term);

  let list = roster.map(s => {
    const isRider = !!riders[s.id];
    const pm = {};
    let cnt = 0;
    months.forEach(m => {
      const ok = !!(paid[s.id] && paid[s.id][m]);
      pm[m] = ok; if (ok) cnt++;
    });
    return {
      id: s.id, name: s.name, grade: s.grade,
      rides: isRider,
      route: isRider ? riders[s.id].route : '',
      months: pm,
      paidCount: cnt,
      paidAmount: cnt * FARE_PER_MONTH,
      complete: isRider && months.length > 0 && cnt === months.length
    };
  });

  if (p.grade) list = list.filter(s => s.grade === p.grade);
  list.sort((a, b) => {
    var g = gradeOrderVal(a.grade) - gradeOrderVal(b.grade);
    return g !== 0 ? g : a.name.localeCompare(b.name, 'th');
  });

  return { ok: true, year, term, monthList: months, farePerMonth: FARE_PER_MONTH, students: list };
}

function readFarePaid(ss, year, term) {
  const sheet = ss.getSheetByName(SH_FARE);
  const paid = {};
  if (!sheet) return paid;
  const all = sheet.getDataRange().getValues();
  all.slice(1).forEach(r => {
    if (!r[0]) return;
    if (String(r[2]) !== String(year)) return;
    if (String(r[3]) !== String(term)) return;
    const sid = String(r[1]), m = String(r[4]);
    if (!paid[sid]) paid[sid] = {};
    paid[sid][m] = true;
  });
  return paid;
}

function payMonth(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  const sid  = String(p.studentId || '');
  const year = String(p.year || thaiYear());
  const term = String(p.term || '1');
  const month = String(p.month || '');
  if (!sid || !month) return { ok: false, error: 'ข้อมูลไม่ครบ' };
  if ((TERM_MONTHS[term] || []).indexOf(month) < 0) return { ok: false, error: 'เดือนไม่อยู่ในเทอมนี้' };

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SH_FARE);
  if (!sheet) { initSheets(); sheet = ss.getSheetByName(SH_FARE); }

  if (isPaid(sheet, sid, year, term, month)) return { ok: true, already: true };

  const id = 'F' + Date.now();
  sheet.appendRow([id, sid, year, term, month, FARE_PER_MONTH, thaiDate(new Date())]);
  SpreadsheetApp.flush();
  return { ok: true, id: id, studentId: sid, month: month, amount: FARE_PER_MONTH };
}

function unpayMonth(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  const sid  = String(p.studentId || '');
  const year = String(p.year || thaiYear());
  const term = String(p.term || '1');
  const month = String(p.month || '');
  if (!sid || !month) return { ok: false, error: 'ข้อมูลไม่ครบ' };

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SH_FARE);
  if (!sheet) return { ok: true };
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] &&
        String(data[i][1]) === sid &&
        String(data[i][2]) === year &&
        String(data[i][3]) === term &&
        String(data[i][4]) === month) {
      sheet.deleteRow(i + 1);
    }
  }
  SpreadsheetApp.flush();
  return { ok: true, studentId: sid, month: month };
}

function payTerm(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  const sid  = String(p.studentId || '');
  const year = String(p.year || thaiYear());
  const term = String(p.term || '1');
  if (!sid) return { ok: false, error: 'ไม่ระบุนักเรียน' };
  const months = TERM_MONTHS[term] || [];

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SH_FARE);
  if (!sheet) { initSheets(); sheet = ss.getSheetByName(SH_FARE); }

  let added = 0;
  months.forEach(m => {
    if (!isPaid(sheet, sid, year, term, m)) {
      sheet.appendRow(['F' + Date.now() + '_' + m, sid, year, term, m, FARE_PER_MONTH, thaiDate(new Date())]);
      added++;
    }
  });
  SpreadsheetApp.flush();
  return { ok: true, studentId: sid, addedMonths: added, totalAmount: months.length * FARE_PER_MONTH };
}

function isPaid(sheet, sid, year, term, month) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] &&
        String(data[i][1]) === String(sid) &&
        String(data[i][2]) === String(year) &&
        String(data[i][3]) === String(term) &&
        String(data[i][4]) === String(month)) return true;
  }
  return false;
}

// ============================================================
// DASHBOARD — สรุปรายชั้น (เทอมที่เลือก)
// ============================================================
function getDashboard(p) {
  const year = String(p.year || thaiYear());
  const term = String(p.term || '1');
  const months = TERM_MONTHS[term] || [];
  const termTotal = months.length * FARE_PER_MONTH;

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const roster = readRoster(ss);
  const rosterMap = {};
  roster.forEach(s => rosterMap[s.id] = s);
  const riders = readRiders(ss);
  const paid = readFarePaid(ss, year, term);

  const grades = {};
  GRADES.forEach(g => grades[g] = {
    grade: g, riders: 0, fullyPaid: 0,
    collected: 0, expected: 0, students: []
  });

  Object.keys(riders).forEach(sid => {
    const s = rosterMap[sid];
    if (!s || !grades[s.grade]) return;
    let cnt = 0;
    months.forEach(m => { if (paid[sid] && paid[sid][m]) cnt++; });
    const amt = cnt * FARE_PER_MONTH;
    const g = grades[s.grade];
    g.riders++;
    g.expected += termTotal;
    g.collected += amt;
    if (cnt === months.length && months.length > 0) g.fullyPaid++;
    g.students.push({
      id: sid, name: s.name, route: riders[sid].route,
      paidCount: cnt, paidAmount: amt, complete: cnt === months.length
    });
  });

  Object.keys(grades).forEach(g => {
    grades[g].students.sort((a, b) => a.name.localeCompare(b.name, 'th'));
  });

  const activeGrades = GRADES.map(g => grades[g]).filter(g => g.riders > 0);
  const totals = activeGrades.reduce((acc, g) => {
    acc.riders += g.riders; acc.fullyPaid += g.fullyPaid;
    acc.collected += g.collected; acc.expected += g.expected;
    return acc;
  }, { riders: 0, fullyPaid: 0, collected: 0, expected: 0 });
  totals.outstanding = totals.expected - totals.collected;

  return { ok: true, year, term, monthList: months, termTotal, grades: activeGrades, totals };
}

// ============================================================
// EXTERNAL LEDGER (บันทึกเงินนอก) — ถาวร ไม่รีเซตตามเทอม
// ============================================================
function recordExternal(p) {
  if (!checkAuth(p)) return { ok: false, error: 'ไม่มีสิทธิ์' };
  const amount = parseFloat(p.amount);
  if (isNaN(amount) || amount <= 0) return { ok: false, error: 'จำนวนเงินไม่ถูกต้อง' };
  const year = String(p.year || thaiYear());
  const term = String(p.term || '1');
  const note = String(p.note || '');
  const label = String(p.label || ('ค่ารถ เทอม ' + term + '/' + year));

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SH_EXTERNAL);
  if (!sheet) { initSheets(); sheet = ss.getSheetByName(SH_EXTERNAL); }

  const id = 'X' + Date.now();
  sheet.appendRow([id, year, term, label, amount, thaiDate(new Date()), note]);
  SpreadsheetApp.flush();
  return { ok: true, id: id, amount: amount, label: label };
}

function getExternalLog(p) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SH_EXTERNAL);
  if (!sheet) return { ok: true, records: [], total: 0 };
  const all = sheet.getDataRange().getValues().slice(1).filter(r => r[0]);
  let records = all.map(r => ({
    id: String(r[0]), year: String(r[1]), term: String(r[2]),
    label: String(r[3] || ''), amount: parseFloat(r[4]) || 0,
    date: String(r[5] || ''), note: String(r[6] || '')
  }));
  if (p.year) records = records.filter(r => r.year === String(p.year));
  records.reverse();
  const total = records.reduce((s, r) => s + r.amount, 0);
  return { ok: true, records: records, total: total };
}

function deleteExternal(p) {
  if (p.password !== ADMIN_PASSWORD) return { ok: false, error: 'เฉพาะผู้ดูแล' };
  if (!p.id) return { ok: false, error: 'ไม่ระบุรายการ' };
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SH_EXTERNAL);
  if (!sheet) return { ok: false, error: 'ไม่พบชีต' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'ไม่พบรายการ' };
}

// ============================================================
// UTILS
// ============================================================
function thaiDate(d) {
  const y = d.getFullYear() + 543;
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return d.getDate() + ' ' + THAI_MONTHS[d.getMonth()] + ' ' + y + ' ' + hh + ':' + mm;
}
function thaiYear() { return new Date().getFullYear() + 543; }

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚌 ระบบค่ารถ')
    .addItem('⚙️ สร้าง/ตรวจชีตค่ารถ', 'initSheets')
    .addToUi();
}
