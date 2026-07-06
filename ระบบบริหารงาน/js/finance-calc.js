// =====================================================================
// FINANCE BALANCE CALCULATOR — banthacha-v2 Stage 10
// คำนวณเงินคงเหลือแยกตามหมวดงบประมาณ (fund_categories) จากรายการจริงใน
// finance_transactions ของปีงบประมาณที่ระบุ
// =====================================================================

// คืน array ของ { category_id, name, total_income, total_expense, balance }
// yearId: FK ไปยัง years.id (bigint)
//
// การจัดกลุ่มรายรับ/รายจ่าย: ยึดตาม convention เดิมที่ใช้อยู่แล้วใน js/finance.js
// (ฟังก์ชัน renderTransactions บรรทัด ~104): transaction_type === 'จ่าย' → รายจ่าย,
// ค่าอื่นทั้งหมด ('รับ', 'ยอดยกมา') → นับเป็นรายรับ — ทำตามนี้เพื่อให้ตัวเลขตรงกับ
// dashboard เดิมที่มีอยู่แล้ว (ไม่ใช่คิดค้นกฎใหม่)
// ตรวจสอบข้อมูลจริงแล้ว (2026-07-04): transaction_type ที่มีอยู่จริงคือ 'จ่าย' และ
// 'ยอดยกมา' เท่านั้น (33 rows) แต่ form เพิ่มรายการ (finance.js) รองรับ 'รับ' ด้วย —
// ฟังก์ชันนี้ครอบคลุมทั้ง 3 ค่า
//
// รายการที่ไม่มีหมวด (fund_category_id เป็น null): พบจริง 1 รายการ (900 บาท,
// "จ้างซ่อมบำรุงรถรับส่งนักเรียน นข 1305") ตอน scrutinize 2026-07-04 — ฟอร์มเพิ่ม
// รายการปกติใน finance.js บังคับเลือกหมวดอยู่แล้ว (บรรทัด ~352 `if(!fundId) return
// alert(...)`) ดังนั้นแถวนี้น่าจะเข้ามาจากช่องทางอื่น (เช่น sync จากระบบค่ารถ) —
// Pam ขอให้ไม่ข้ามเงียบๆ แต่รวมเป็นแถวพิเศษ "ไม่ระบุหมวด" (category_id: null) แทน
// จะได้เห็นในตาราง Stage 18 แล้วกดแก้ไขรายการนั้นในหน้ารายการรับ-จ่ายเดิมได้เลย
// (ฟอร์มแก้ไขเดิมมี dropdown เลือกหมวดอยู่แล้ว — ไม่ต้องสร้าง UI ใหม่)
async function calcDailyBalance(yearId){
  const cats = await GET('fund_categories', 'select=id,name,code,sort_order&order=sort_order');
  const txns = await GET(
    'finance_transactions',
    `year_id=eq.${yearId}&select=fund_category_id,transaction_type,amount`
  );

  // รวมยอดต่อหมวด — รายการที่ไม่ผูก fund_category_id ถูกรวมแยกไว้ในคีย์ 'unassigned'
  // (แทนที่จะข้ามทิ้งเงียบๆ) ตาม convention การจัดกลุ่มเดียวกันทั้งหมด
  const sums = {}; // { [category_id | 'unassigned']: { income: number, expense: number } }
  for (const t of (txns || [])) {
    const key = t.fund_category_id || 'unassigned';
    if (!sums[key]) sums[key] = { income: 0, expense: 0 };
    if (t.transaction_type === 'จ่าย') {
      sums[key].expense += Number(t.amount) || 0;
    } else {
      sums[key].income += Number(t.amount) || 0;
    }
  }

  const result = (cats || []).map(cat => {
    const s = sums[cat.id] || { income: 0, expense: 0 };
    return {
      category_id: cat.id,
      name: cat.name,
      total_income: s.income,
      total_expense: s.expense,
      balance: s.income - s.expense
    };
  });

  // เพิ่มแถว "ไม่ระบุหมวด" ต่อท้าย — เฉพาะตอนมีรายการจริงที่ไม่มีหมวด (ไม่ต้องโชว์
  // แถวเปล่าๆ ถ้าไม่มี) category_id เป็น null เพื่อให้ฝั่งเรียกใช้ (Stage 18) รู้ว่า
  // แถวนี้พิเศษ ไม่ผูกกับ fund_categories จริง — ไปแก้ที่หน้ารายการรับ-จ่ายแทน
  if (sums['unassigned']) {
    const s = sums['unassigned'];
    result.push({
      category_id: null,
      name: 'ไม่ระบุหมวด',
      total_income: s.income,
      total_expense: s.expense,
      balance: s.income - s.expense
    });
  }

  return result;
}

// ─── Manual test (รันใน browser console หลัง login เท่านั้น) ───────────
// await calcDailyBalance(1)  // ปีปัจจุบัน (year_id=1)
//   → คืน array 32 แถว (หลัง Stage 7B) เรียงตาม sort_order + แถว "ไม่ระบุหมวด" ต่อท้าย
//     ถ้ามีรายการไม่มีหมวดอยู่จริง (ตอนนี้มี 1 รายการ 900 บาท → เห็นแถวนี้)
//   → หมวดที่ยังไม่มีรายการ: { total_income: 0, total_expense: 0, balance: 0 }
