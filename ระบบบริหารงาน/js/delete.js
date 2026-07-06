// =====================================================================
// DELETE
// =====================================================================
function askDel(type,id,name){ PENDING_DEL={type,id}; document.getElementById('confirmMsg').textContent=`"${name}" จะถูกลบออกจากระบบ`; document.getElementById('confirmOverlay').classList.add('open'); }
function closeConfirm(){ PENDING_DEL=null; document.getElementById('confirmOverlay').classList.remove('open'); }
async function confirmDel(){
  if(!PENDING_DEL)return;
  if(!adminGuard()){ closeConfirm(); return; }
  var type=PENDING_DEL.type, id=PENDING_DEL.id;
  show('loadingOverlay','flex');
  try{
    if(type==='proc'){
      await DEL('finance_transactions',`procurement_id=eq.${id}`);
      await DEL('procurement_items',`id=eq.${id}`);
      FINANCE_LOADED=false;
    }
    else if(type==='project'){
      const proj = PROJECTS.find(function(x){ return x.id===id; });
      if(proj && !canEdit(proj.teacher_name)){ hide('loadingOverlay'); alert('คุณไม่มีสิทธิ์ลบโครงการนี้'); closeConfirm(); return; }
      await DEL('projects',`id=eq.${id}`); FINANCE_LOADED=false;
    }
    else if(type==='finance_transaction'){
      // ถ้า transaction ผูกกับ procurement_item → revert สถานะพัสดุก่อน DEL
      // (ป้องกันพัสดุแสดง "เบิกแล้ว" ทั้งที่ไม่มี finance record รองรับแล้ว)
      var linkedTx = FINANCE_TRANSACTIONS.find(function(t){ return String(t.id)===String(id); });
      if(linkedTx && linkedTx.procurement_id){
        await PATCH('procurement_items','id=eq.'+linkedTx.procurement_id,{withdraw_status:'ยังไม่เบิก', withdraw_no:null});
        var linkedProc = PROC.find(function(i){ return i.id===linkedTx.procurement_id; });
        if(linkedProc){ linkedProc.withdraw_status='ยังไม่เบิก'; linkedProc.withdraw_no=null; }
      }
      await DEL('finance_transactions',`id=eq.${id}`);
      FINANCE_LOADED=false;
    }
    else if(type==='external_transaction'){ await DEL('external_transactions',`id=eq.${id}`); EXT_LOADED=false; }
    if(type==='finance_transaction'){
      await loadFinanceData();
      if(FIN_TAB==='transactions') loadTransactions();
    } else if(type==='external_transaction'){
      await loadExternalData();
    } else {
      await loadAll();
    }
    closeConfirm();
  }catch(e){ hide('loadingOverlay'); alert('ลบไม่ได้: '+e.message); }
}
