// =====================================================================
// PROCUREMENT DOC NUMBER GENERATOR — banthacha-v2 Stage 8
// เลขที่เอกสารพัสดุ: ซ.{seq}/{year_be} (จัดซื้อ) หรือ จ.{seq}/{year_be} (จัดจ้าง)
// ยังไม่ผูกกับ UI ใดๆ — Stage 14/16 จะเรียกใช้เมื่อเปิด/บันทึกฟอร์มกรอกเอกสาร
//
// ⚠️ แก้ 2026-07-09: เดิมนับ n จาก MAX(doc_number) ของ procurement_details ในปี+ประเภทเดียวกัน
// (ตัวนับแยกต่างหาก) ทำให้เลขที่เอกสารที่พิมพ์ออกมาไม่ตรงกับ "ลำดับที่" (procurement_items.seq) ที่กรอกไว้
// ตอน "เพิ่มรายการ" — Pam เจอจริง ("เลขจัดซื้อจัดจ้างในไฟล์ที่ปริ้น ไม่ตรงกับตอนกรอกเพิ่มรายการใหม่") และยืนยัน
// ให้ใช้เลขเดียวกันตั้งแต่ต้น ("รันเลขตามกันครั้งเดียวตั้งแต่แรก") — เปลี่ยนมาใช้ seq ของ item ตรงๆ เป็นเลขที่
// เอกสารทางการเลย ไม่มีตัวนับแยกอีกต่อไป — ผลคือ seq ต้องไม่ซ้ำกันภายใน type+ปีเดียวกัน (กันซ้ำไว้แล้วที่
// saveProcItem() ใน procurement.js ตอนเพิ่ม/แก้รายการ)
// =====================================================================

// คืน { nextNumber: seq, preview: 'ซ.3/2569' } — seq มาจาก procurement_items.seq ของรายการนั้นโดยตรง
async function getNextDocNumber(yearId, procType, seq){
  const prefix = procType === 'จัดซื้อ' ? 'ซ' : 'จ'; // ค่าจริงใน DB คือ 'จัดซื้อ'/'จัดจ้าง' (ไม่ใช่ 'ซื้อ'/'จ้าง')
  if(!seq) throw new Error('รายการนี้ไม่มี "ลำดับที่" กรุณาแก้ไขรายการแล้วระบุลำดับที่ก่อน');

  const yearRows = await GET('years', `id=eq.${yearId}&select=year_be`);
  if(!yearRows || !yearRows.length) throw new Error('ไม่พบปีงบประมาณ id=' + yearId);
  const yearBE = yearRows[0].year_be;

  return { nextNumber: seq, preview: `${prefix}.${seq}/${yearBE}` };
}

// ─── Manual test (รันใน browser console หลัง login เท่านั้น) ───────────
// await getNextDocNumber(1, 'จัดซื้อ', 3)  // → ต้องได้ { nextNumber: 3, preview: 'ซ.3/2569' }
// await getNextDocNumber(1, 'จัดจ้าง', 1)  // → ต้องได้ { nextNumber: 1, preview: 'จ.1/2569' }
