// =====================================================================
// HELPERS
// =====================================================================
function fmt(n){ return(!n&&n!==0)?'—':Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function numFmt(n){ if(n>=1000000) return (n/1000000).toFixed(1)+'M'; if(n>=1000) return (n/1000).toFixed(0)+'K'; return String(Math.round(n)); }
function numFull(n){ return (!n&&n!==0)?'—':Math.round(n).toLocaleString('th-TH'); }
function fmtDate(d){ if(!d)return'—'; const p=d.split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; }
// วันที่แบบไทยเต็ม ("8 กรกฎาคม 2569") ใช้ในเอกสารราชการ (Stage 17) — ต่างจาก fmtDate() ที่แค่สลับรูปแบบ
// ตัวเลข ค.ศ. ธรรมดา เอกสารราชการต้องเป็นชื่อเดือนไทย + ปี พ.ศ. (ค.ศ.+543)
const TH_MONTH_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function fmtDateThai(isoDate){
  if(!isoDate) return '.....................';
  const p = isoDate.split('-');
  if(p.length !== 3) return isoDate;
  const day = parseInt(p[2], 10);
  const month = TH_MONTH_FULL[parseInt(p[1], 10) - 1] || '';
  const yearBE = parseInt(p[0], 10) + 543;
  return day + ' ' + month + ' ' + yearBE;
}
function escHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&apos;').replace(/"/g,'&quot;'); }
function show(id,type='flex'){ const el=document.getElementById(id); if(el)el.style.display=type; }
function hide(id){ const el=document.getElementById(id); if(el)el.style.display='none'; }

// แปลงจำนวนเงิน (บาท) เป็นคำอ่านภาษาไทย เช่น 1250.50 → "หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์"
// ใช้ในเอกสารราชการ (Stage 17) ที่ต้องมีวงเงินเป็นตัวอักษรกำกับตัวเลข — ยังไม่เคยมี utility นี้ในระบบมาก่อน
const TH_DIGIT = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
const TH_UNIT  = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
// อ่านตัวเลขกลุ่มเดียว (ไม่เกิน 6 หลัก) เป็นคำ — hasPrefix บอกว่ามีค่า "ล้าน" นำหน้ากลุ่มนี้อยู่มั้ย
// (มีผลกับกฎ "เอ็ด": 1,000,001 ต้องอ่าน "หนึ่งล้านเอ็ด" ไม่ใช่ "หนึ่งล้านหนึ่ง" แม้กลุ่มหลังจุด
// จะมีแค่หลักเดียว (เลข 1 เดี่ยวๆ) เพราะจริงๆ แล้วมีหลักอื่นนำหน้าอยู่ในเลขเต็มทั้งก้อน)
function readThaiDigitGroup(digits, hasPrefix){
  const len = digits.length;
  let result = '';
  for(let i = 0; i < len; i++){
    const d = digits[i];
    const place = len - i - 1; // 0=หน่วย, 1=สิบ, 2=ร้อย, ...
    if(d === 0) continue;
    if(place === 0){
      // หลักหน่วย: "เอ็ด" ถ้ามีหลักสิบขึ้นไปนำหน้าในกลุ่มนี้ (21→ยี่สิบเอ็ด) หรือมี "ล้าน" นำหน้ากลุ่มนี้อยู่ (1,000,001→...เอ็ด)
      result += (d === 1 && (len > 1 || hasPrefix)) ? 'เอ็ด' : TH_DIGIT[d];
    } else if(place === 1){
      // หลักสิบ: "ยี่สิบ" ไม่ใช่ "สองสิบ", "สิบ" ไม่ใช่ "หนึ่งสิบ"
      if(d === 1) result += 'สิบ';
      else if(d === 2) result += 'ยี่สิบ';
      else result += TH_DIGIT[d] + 'สิบ';
    } else {
      result += TH_DIGIT[d] + TH_UNIT[place];
    }
  }
  return result;
}
function thaiNumberText(numInt){
  numInt = Math.floor(Math.abs(numInt));
  if(numInt === 0) return 'ศูนย์';
  let result = '';
  // ตัดเป็นช่วงละ 7 หลัก (ล้าน) แล้ววนอ่านทีละช่วง เพราะ TH_UNIT รองรับแค่ถึงหลักล้านในช่วงเดียว
  const millions = Math.floor(numInt / 1000000);
  const rest = numInt % 1000000;
  if(millions > 0) result += thaiNumberText(millions) + 'ล้าน';
  if(millions > 0 && rest === 0) return result;
  const digits = String(rest).split('').map(Number);
  result += readThaiDigitGroup(digits, millions > 0);
  return result;
}
function thaiBahtText(amount){
  amount = Number(amount) || 0;
  const baht = Math.floor(Math.abs(amount));
  const satang = Math.round((Math.abs(amount) - baht) * 100);
  let text = (amount < 0 ? 'ลบ' : '') + thaiNumberText(baht) + 'บาท';
  text += satang > 0 ? thaiNumberText(satang) + 'สตางค์' : 'ถ้วน';
  return text;
}

function paginationHTML(page, total, fn){
  var btnStyle = 'padding:6px 14px;border-radius:var(--r-btn);border:1px solid var(--dust);background:var(--canvas);color:var(--ink);font-family:var(--font);font-size:12px;cursor:pointer;';
  var disStyle = 'opacity:.35;cursor:default;';

  // สร้าง page numbers — แสดงสูงสุด 7 ปุ่ม
  var pages = [];
  if(total <= 7){
    for(var i=1;i<=total;i++) pages.push(i);
  } else {
    pages = [1];
    if(page > 3) pages.push('...');
    for(var j=Math.max(2,page-1); j<=Math.min(total-1,page+1); j++) pages.push(j);
    if(page < total-2) pages.push('...');
    pages.push(total);
  }

  var nums = pages.map(function(p){
    if(p==='...') return '<span style="padding:0 6px;color:var(--muted)">…</span>';
    var active = p===page;
    return '<button onclick="'+fn+'('+p+')" style="'+btnStyle+(active?'background:var(--ink);color:var(--canvas);border-color:var(--ink);font-weight:600;':'')+'">'+p+'</button>';
  }).join('');

  return '<div style="display:flex;align-items:center;gap:6px;padding:14px 0 4px;justify-content:center;flex-wrap:wrap">'+
    '<button onclick="'+fn+'('+(page-1)+')" '+(page<=1?'disabled':'')+' style="'+btnStyle+(page<=1?disStyle:'')+'">← ก่อนหน้า</button>'+
    nums+
    '<button onclick="'+fn+'('+(page+1)+')" '+(page>=total?'disabled':'')+' style="'+btnStyle+(page>=total?disStyle:'')+'">ถัดไป →</button>'+
    '<span style="font-size:11px;color:var(--muted);margin-left:4px">หน้า '+page+'/'+total+'</span>'+
  '</div>';
}
