// =====================================================================
// PROCUREMENT DOC NUMBER GENERATOR — banthacha-v2 Stage 8
// เลขที่เอกสารพัสดุ: ซ.{n}/{year_be} (จัดซื้อ) หรือ จ.{n}/{year_be} (จัดจ้าง)
// n = MAX(n) ของ type เดียวกันในปีนั้น + 1 — เริ่มที่ 1 ถ้ายังไม่มีเลย (set zero ตามที่ตัดสินใจไว้ใน BLUEPRINT)
// ยังไม่ผูกกับ UI ใดๆ — Stage 14/16 จะเรียกใช้เมื่อเปิด/บันทึกฟอร์มกรอกเอกสาร
// =====================================================================

// คืน { nextNumber: int, preview: 'ซ.3/2569' }
async function getNextDocNumber(yearId, procType){
  const prefix = procType === 'จัดซื้อ' ? 'ซ' : 'จ'; // ค่าจริงใน DB คือ 'จัดซื้อ'/'จัดจ้าง' (ไม่ใช่ 'ซื้อ'/'จ้าง')

  const yearRows = await GET('years', `id=eq.${yearId}&select=year_be`);
  if(!yearRows || !yearRows.length) throw new Error('ไม่พบปีงบประมาณ id=' + yearId);
  const yearBE = yearRows[0].year_be;

  const items = await GET('procurement_items', `year_id=eq.${yearId}&select=id`);
  // ปีที่ยังไม่มีรายการพัสดุเลย → เลขแรกคือ 1 เสมอ
  // (ป้องกัน query 'in.()' ว่างเปล่าที่ PostgREST จะ error)
  if(!items || !items.length) return { nextNumber: 1, preview: `${prefix}.1/${yearBE}` };

  const itemIds = items.map(i => i.id).join(',');
  const details = await GET('procurement_details', `procurement_item_id=in.(${itemIds})&select=doc_number`);

  const nums = (details || [])
    .map(d => d.doc_number)
    .filter(dn => dn && dn.startsWith(prefix + '.'))
    .map(dn => parseInt(dn.split('.')[1].split('/')[0], 10))
    .filter(n => !isNaN(n));

  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return { nextNumber: next, preview: `${prefix}.${next}/${yearBE}` };
}

// ─── Manual test (รันใน browser console หลัง login เท่านั้น) ───────────
// await getNextDocNumber(1, 'จัดซื้อ')  // ปีปัจจุบัน (year_id=1) ยังไม่มี procurement_details เลย
//                                        // → ต้องได้ { nextNumber: 1, preview: 'ซ.1/2569' }
// await getNextDocNumber(1, 'จัดจ้าง')  // → ต้องได้ { nextNumber: 1, preview: 'จ.1/2569' }
