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
      if(!canEditModule('procurement')){ hide('loadingOverlay'); alert('คุณไม่มีสิทธิ์ลบรายการพัสดุนี้'); closeConfirm(); return; }
      // fn_delete_procurement_item ลบ finance_transactions ที่ผูกอยู่ให้ในตัวเดียวกัน (atomic)
      await RPC('fn_delete_procurement_item', { p_id: id, ...currentAuthParams() });
      FINANCE_LOADED=false;
    }
    else if(type==='project'){
      const proj = PROJECTS.find(function(x){ return x.id===id; });
      if(proj && !canEdit(proj.teacher_name)){ hide('loadingOverlay'); alert('คุณไม่มีสิทธิ์ลบโครงการนี้'); closeConfirm(); return; }
      await RPC('fn_delete_project', { p_id: id, ...currentAuthParams() }); FINANCE_LOADED=false;
    }
    else if(type==='finance_transaction'){
      if(!canEditModule('finance')){ hide('loadingOverlay'); alert('คุณไม่มีสิทธิ์ลบรายการการเงินนี้'); closeConfirm(); return; }
      // ถ้า transaction ผูกกับ procurement_item → revert สถานะพัสดุก่อน DEL
      // (ป้องกันพัสดุแสดง "เบิกแล้ว" ทั้งที่ไม่มี finance record รองรับแล้ว)
      var linkedTx = FINANCE_TRANSACTIONS.find(function(t){ return String(t.id)===String(id); });
      if(linkedTx && linkedTx.procurement_id){
        await RPC('fn_update_procurement_withdraw', { p_id: linkedTx.procurement_id, ...currentAuthParams(), p_status:'ยังไม่เบิก', p_withdraw_no:null });
        var linkedProc = PROC.find(function(i){ return i.id===linkedTx.procurement_id; });
        if(linkedProc){ linkedProc.withdraw_status='ยังไม่เบิก'; linkedProc.withdraw_no=null; }
      }
      await RPC('fn_delete_finance_transaction', { p_id: id, ...currentAuthParams() });
      FINANCE_LOADED=false;
    }
    else if(type==='external_transaction'){
      if(!canEditModule('finance')){ hide('loadingOverlay'); alert('คุณไม่มีสิทธิ์ลบรายการเงินนอกนี้'); closeConfirm(); return; }
      await RPC('fn_delete_external_transaction', { p_id: id, ...currentAuthParams() }); EXT_LOADED=false;
    }
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
