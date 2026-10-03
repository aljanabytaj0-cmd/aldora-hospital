'use strict';
var STAFF_FILTER='active',HIRES={},HIRE_SALARIES={},NOTIFICATIONS={},READ_MARKERS={},FINANCE=null,FINANCE_SEQ=0,FINANCE_TARGET=null;
var MUTATION_IDS=new Map();
var oldCall=call;
call=async function(name,data){
  var retryKey,id;
  if(name==='hrMutate'){
    retryKey=CURRENT_UID+':'+JSON.stringify(data);id=MUTATION_IDS.get(retryKey)||crypto.randomUUID();MUTATION_IDS.set(retryKey,id);data={...data,mutationId:id};
  }
  var result=await oldCall(name,data);if(retryKey)MUTATION_IDS.delete(retryKey);return result;
};
var oldWipe=wipeData;
wipeData=function(){
  oldWipe();HIRES={};HIRE_SALARIES={};NOTIFICATIONS={};READ_MARKERS={};FINANCE=null;FINANCE_TARGET=null;FINANCE_SEQ++;MUTATION_IDS.clear();
  ['hires-list','notifications-list','finance-body','finance-detail','finance-dept','finance-employee'].forEach(function(id){el(id).replaceChildren();});el('bell-count').textContent='0';
  ['notifications-modal','terminate-modal','finance-modal'].forEach(function(id){el(id).classList.remove('show');});
  ['term-dept','term-key','term-date','term-reason','finance-month'].forEach(function(id){el(id).value='';});el('term-name').textContent='';el('finance-title').textContent='تفاصيل الموظف';
};
var oldReset=resetSession;
resetSession=function(){STAFF_FILTER='active';el('staff-filter').value='active';oldReset();};
var oldVisible=visiblePage;
visiblePage=function(id){return id==='pg-h'?(allowed('canEditStaff')||allowed('canApproveHires')):id==='pg-f'?(allowed('canViewFinance')&&allowed('canViewSal')):oldVisible(id);};
var oldSet=setPage;
setPage=function(id){oldSet(id);if(id==='pg-h'||id==='pg-f'){var suffix=id.slice(3);['nt-','bb-'].forEach(function(p){el(p+suffix).classList.add('active');});}};
var oldShow=showPage;
showPage=function(id){oldShow(id);if(!visiblePage(id))return;if(id==='pg-h')renderHires();if(id==='pg-f')loadFinance();};
var oldPerms=applyPerms;
applyPerms=function(){oldPerms();['h','f'].forEach(function(x){['nt-','bb-'].forEach(function(p){el(p+x).style.display=visiblePage('pg-'+x)?'':'none';});});el('bell-btn').style.display=allowed('canViewNotifications')?'':'none';};
var oldSync=syncData;
syncData=function(){
  oldSync();var epoch=DATA_EPOCH;
  allowedIds().forEach(function(id){
    if(allowed('canEditStaff')||allowed('canApproveHires')){
      watch(DB.ref('hr_spark/hire_requests/'+id),function(s){HIRES[id]=s.val()||{};renderHires();},DATA_LISTENERS,epoch);
      
    }
    if(CAN_SAL)watch(DB.ref('hr_spark/hire_request_salaries/'+id),function(s){HIRE_SALARIES[id]=s.val()||{};renderHires();renderNode(id);},DATA_LISTENERS,epoch);
    if(allowed('canViewNotifications'))watch(DB.ref('hr_spark/notifications/'+id).orderByChild('createdAt').limitToLast(100),function(s){NOTIFICATIONS[id]=s.val()||{};renderNotifications();},DATA_LISTENERS,epoch);
  });
  if(allowed('canViewNotifications'))watch(DB.ref('hr_spark/notification_reads/'+CURRENT_UID),function(s){READ_MARKERS=s.val()||{};renderNotifications();},DATA_LISTENERS,epoch);
  if(el('pg-f').classList.contains('active')&&visiblePage('pg-f'))loadFinance();
};
function deptTitle(id){return (ALL_CFG.find(function(d){return d.id===id;})||{}).title||id;}
function iq(v){return v==null?'يحتاج مراجعة':Number(v).toLocaleString('ar-IQ')+' د.ع';}
function fillEmployees(id,dept,selected){
  el(id).innerHTML='<option value="">— اختر الموظف —</option>'+(deptAllowed(dept)?(LOCAL[dept]||[]):[]).map(function(e){return '<option value="'+esc(e.key)+'">'+esc(e.name)+(e.status==='terminated'?' (منتهية الخدمات)':'')+'</option>';}).join('');if(selected)el(id).value=selected;
}
function renderHires(){
  var records=[];if(visiblePage('pg-h'))allowedIds().forEach(function(id){Object.entries(HIRES[id]||{}).forEach(function(p){records.push({...p[1],key:p[0],dept:id});});});
  records.sort(function(a,b){return (a.status==='pending'?0:1)-(b.status==='pending'?0:1)||(b.createdAt||0)-(a.createdAt||0);});
  var list=el('hires-list');list.replaceChildren();if(!records.length){list.innerHTML='<div class="ee">لا توجد طلبات تعيين</div>';return;}
  var labels={pending:'بانتظار الموافقة',approved:'تم الاعتماد',rejected:'مرفوض'};
  records.forEach(function(r){var card=document.createElement('div');card.className='fx-card';
    card.innerHTML='<h4>'+esc(r.name)+'</h4><div>'+esc(deptTitle(r.dept))+' — '+esc(r.role)+'</div><div class="fx-note">بدء الخدمة: '+esc(r.hireDate)+'<br>مقدم الطلب: '+esc(r.submittedName)+'<br>الحالة: '+esc(labels[r.status]||r.status)+(r.reviewedName?'<br>صاحب القرار: '+esc(r.reviewedName):'')+(r.reviewReason?'<br>سبب الرفض: '+esc(r.reviewReason):'')+'</div>'+(CAN_SAL?'<div>الراتب المقترح: '+iq((HIRE_SALARIES[r.dept]||{})[r.key])+'</div>':'');
    if(r.status==='pending'&&allowed('canApproveHires')){var bar=document.createElement('div');bar.className='fx-actions';[['اعتماد','hireApprove'],['رفض','hireReject']].forEach(function(pair){var b=document.createElement('button');b.className=pair[1]==='hireApprove'?'btp':'btg';b.textContent=pair[0];b.onclick=function(){reviewHire(r.dept,r.key,pair[1]);};bar.appendChild(b);});card.appendChild(bar);}list.appendChild(card);
  });
}
function reviewHire(dept,key,op){
  if(!allowed('canApproveHires')||!deptAllowed(dept))return;
  var data={op:op,dept:dept,key:key};if(op==='hireReject'){data.reason=prompt('سبب رفض التعيين:');if(!data.reason)return;}else if(!confirm('اعتماد الطلب وإضافة الموظف إلى العاملين؟'))return;
  return saveAction('hire:'+key,function(){return call('hrMutate',data);});
}
function notificationItems(){var items=[];if(allowed('canViewNotifications'))allowedIds().forEach(function(id){Object.entries(NOTIFICATIONS[id]||{}).forEach(function(p){items.push({...p[1],key:p[0],dept:id});});});return items.sort(function(a,b){return b.createdAt-a.createdAt;});}
function renderNotifications(){
  var items=notificationItems(),unread=items.filter(function(r){return !READ_MARKERS[r.key];}).length;el('bell-count').textContent=unread>99?'99+':String(unread);el('bell-btn').setAttribute('aria-label','مركز الإشعارات — '+unread+' غير مقروء');
  var list=el('notifications-list');list.replaceChildren();if(!items.length){list.innerHTML='<div class="ee">لا توجد إشعارات</div>';return;}
  var labels={hire_requested:'طلب تعيين جديد',hire_approved:'تم اعتماد تعيين موظف',hire_rejected:'رُفض طلب تعيين',staff_terminated:'إنهاء خدمات موظف'};
  items.forEach(function(r){var card=document.createElement('div');card.className='fx-card'+(!READ_MARKERS[r.key]?' fx-unread':'');card.innerHTML='<h4>'+esc(labels[r.type]||'إشعار')+'</h4><div>'+esc(r.name)+'</div><div class="fx-note">'+esc(deptTitle(r.dept))+' — '+esc(r.actor)+'<br>'+esc(new Date(r.createdAt).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'}))+'</div>';
    if(!READ_MARKERS[r.key]){var b=document.createElement('button');b.className='btg';b.textContent='تحديد كمقروء';b.onclick=function(){markNotifications([r]);};card.appendChild(b);}list.appendChild(card);});
}
function openNotifications(){if(!allowed('canViewNotifications'))return;renderNotifications();el('notifications-modal').classList.add('show');}
function markNotifications(items){if(!allowed('canViewNotifications'))return;items=(items||notificationItems()).filter(function(r){return !READ_MARKERS[r.key];}).slice(0,500);if(!items.length)return;return saveAction('notifications',function(){return call('hrNotifications',{items:items.map(function(r){return {dept:r.dept,key:r.key};})});});}
delEmp=function(dept,key){
  if(!allowed('canTerminateStaff')||!deptAllowed(dept))return;var e=(LOCAL[dept]||[]).find(function(e){return e.key===key;});if(!e||e.status==='terminated')return;
  el('term-dept').value=dept;el('term-key').value=key;el('term-name').textContent=e.name;el('term-date').value=today();el('term-date').max=today();el('term-reason').value='';el('terminate-modal').classList.add('show');
};
function saveTermination(){var data={op:'staffTerminate',dept:el('term-dept').value,key:el('term-key').value,date:el('term-date').value,reason:el('term-reason').value};if(!allowed('canTerminateStaff')||!deptAllowed(data.dept))return;return saveAction('terminate:'+data.key,function(){return call('hrMutate',data);},function(){el('terminate-modal').classList.remove('show');});}
async function loadFinance(){
  if(!visiblePage('pg-f'))return;var month=el('finance-month').value||today().slice(0,7);el('finance-month').value=month;
  var seq=++FINANCE_SEQ,session=SESSION,epoch=DATA_EPOCH;FINANCE=null;FINANCE_TARGET=null;el('finance-modal').classList.remove('show');el('finance-detail').replaceChildren();el('finance-body').textContent='جاري تحميل التقرير...';
  try{var data=await call('hrFinance',{month:month});if(seq!==FINANCE_SEQ||session!==SESSION||epoch!==DATA_EPOCH||!visiblePage('pg-f')||el('finance-month').value!==month)return;FINANCE=data;renderFinance();}
  catch(e){if(seq===FINANCE_SEQ&&session===SESSION)el('finance-body').textContent=errorMessage(e);}
}
function renderFinance(){
  var body=el('finance-body');if(!FINANCE||!visiblePage('pg-f'))return;
  var oldDept=el('finance-dept').value,oldEmp=el('finance-employee').value;
  el('finance-dept').innerHTML='<option value="">جميع الأقسام المسموحة</option>'+allowedIds().map(function(id){return '<option value="'+esc(id)+'">'+esc(deptTitle(id))+'</option>';}).join('');el('finance-dept').value=oldDept;
  var dept=el('finance-dept').value,rows=FINANCE.rows.filter(function(r){return !dept||r.dept===dept;});
  el('finance-employee').innerHTML='<option value="">جميع الموظفين</option>'+rows.map(function(r){return '<option value="'+esc(r.dept+'/'+r.employeeKey)+'">'+esc(r.name)+'</option>';}).join('');el('finance-employee').value=oldEmp;
  var emp=el('finance-employee').value;if(emp)rows=rows.filter(function(r){return r.dept+'/'+r.employeeKey===emp;});
  var sums=rows.reduce(function(s,r){s.base+=r.baseAmount||0;s.ded+=r.deductions;if(r.netAmount==null)s.review++;else s.net+=r.netAmount;return s;},{base:0,ded:0,net:0,review:0});
  body.innerHTML='<div class="fx-card"><h4>شهر '+esc(FINANCE.month)+'</h4><div class="fx-grid"><div>الرواتب المعروفة<br><strong>'+iq(sums.base)+'</strong></div><div>الخصومات اليدوية<br><strong>'+iq(sums.ded)+'</strong></div><div>صافي السجلات الجاهزة<br><strong>'+iq(sums.net)+'</strong></div><div>تحتاج مراجعة<br><strong>'+sums.review+' موظف</strong></div></div><p class="fx-note">وقت إعداد التقرير: '+esc(new Date(FINANCE.generatedAt).toLocaleString('ar-IQ',{timeZone:'Asia/Baghdad'}))+'؛ استخدم تحديث التقرير لجلب أحدث البيانات.</p></div>';
  if(!rows.length)body.insertAdjacentHTML('beforeend','<div class="ee">لا توجد سجلات لهذا الاختيار</div>');
  rows.forEach(function(r){var card=document.createElement('div');card.className='fx-card';card.innerHTML='<h4>'+esc(r.name)+'</h4><div class="fx-note">'+esc(deptTitle(r.dept))+' — '+esc(r.role)+'</div><div>راتب الشهر: '+iq(r.baseAmount)+'<br>خصم العقوبات: '+iq(r.penaltyAmount)+'<br>خصومات أخرى يدوية: '+iq(r.manualAmount)+'<br><span class="fx-money">صافي المستحق: '+iq(r.netAmount)+'</span></div><div class="fx-note">البصمة: '+r.fingerprint.length+' حالة / '+r.delayMinutes+' دقيقة'+(r.unknownDelayDurations?'؛ '+r.unknownDelayDurations+' مدة قديمة غير رقمية':'')+'</div>'+(r.issues.length?'<div class="fx-warning">'+r.issues.map(esc).join('<br>')+'</div>':'');var b=document.createElement('button');b.className='btp';b.textContent='التفاصيل والعقوبات والبصمة';b.onclick=function(){openFinanceDetail(r.dept,r.employeeKey);};card.appendChild(b);body.appendChild(card);});
  var review=FINANCE.reviewPenalties.filter(function(r){return (!dept||r.dept===dept)&&(!emp||r.dept+'/'+r.employeeKey===emp);});
  var unlinked=FINANCE.unlinked.filter(function(r){return !dept||r.dept===dept;});
  if(review.length||unlinked.length){var box=document.createElement('div');box.className='fx-card';box.innerHTML='<h4>سجلات قديمة تحتاج ربطًا أو اعتماد مبلغ</h4><p class="fx-note">لا يُحوَّل وصف الخصم القديم إلى مبلغ تلقائيًا. اربط السجل بالموظف الصحيح وحدد المبلغ يدويًا.</p>';body.appendChild(box);
    var seen=new Set();review.concat(unlinked).forEach(function(r){var kind=r.kind||'violation',id=kind+'/'+r.dept+'/'+r.key;if(seen.has(id))return;seen.add(id);var item=document.createElement('div');item.className='fx-card';item.innerHTML='<div>'+esc(r.name)+' — '+esc(deptTitle(r.dept))+'<br>'+esc(r.date)+' — '+esc(r.reason||r.mins||'')+' '+esc(r.deduct||'')+'</div>';
      if(allowed('canManageFinance')){var select=document.createElement('select');select.className='fs2';select.id='link-'+kind+'-'+r.dept+'-'+(r.monthKey||'')+'-'+r.key;item.appendChild(select);fillEmployees(select.id,r.dept,r.employeeKey);var amount=document.createElement('input');amount.className='fi fx-input';amount.type='number';amount.min='0';amount.step='1';amount.placeholder='مبلغ الخصم بالدينار';if(kind==='violation')item.appendChild(amount);
        var b=document.createElement('button');b.className='btp';b.textContent=kind==='violation'?'اعتماد الربط والمبلغ':'ربط سجل البصمة';b.onclick=function(){var data=kind==='violation'?{op:'vioFinanceLink',dept:r.dept,key:r.key,employeeKey:select.value,amount:amount.value,month:FINANCE.month}:{op:'delayLink',dept:r.dept,key:r.key,employeeKey:select.value,month:r.monthKey};return saveAction('link:'+id,function(){return call('hrMutate',data);},loadFinance);};item.appendChild(b);}box.appendChild(item);});
  }
}
function openFinanceDetail(dept,key){
  if(!FINANCE||!visiblePage('pg-f'))return;var r=FINANCE.rows.find(function(r){return r.dept===dept&&r.employeeKey===key;});if(!r)return;FINANCE_TARGET={dept:dept,key:key,month:FINANCE.month};
  el('finance-title').textContent=r.name+' — '+FINANCE.month;var box=el('finance-detail');box.innerHTML='<div class="fx-card">الراتب: '+iq(r.baseAmount)+'<br>العقوبات: '+iq(r.penaltyAmount)+'<br>الخصومات اليدوية الأخرى: '+iq(r.manualAmount)+'<br><strong>الصافي: '+iq(r.netAmount)+'</strong></div>';
  var lists=[['العقوبات',r.penalties,function(v){return esc(v.date)+' — '+esc(v.reason)+'<br>مبلغ الخصم: '+iq(v.deductionConfirmed?v.deductionAmount:null);}],['تقارير البصمة (لا تخصم تلقائيًا)',r.fingerprint,function(v){return esc(v.date)+' — '+esc(v.mins)+'<br>'+esc(v.note);}],['الخصومات اليدوية',r.adjustments,function(v){return esc(v.reason)+' — '+iq(v.amount);}]];
  lists.forEach(function(group){var section=document.createElement('div');section.className='fx-card';section.innerHTML='<h4>'+group[0]+'</h4>';if(!group[1].length)section.insertAdjacentHTML('beforeend','<div class="fx-note">لا توجد سجلات في هذا الشهر</div>');group[1].forEach(function(v){var item=document.createElement('div');item.className='fx-card';item.innerHTML=group[2](v);if(group[0]==='الخصومات اليدوية'&&allowed('canManageFinance')){var b=document.createElement('button');b.className='btg';b.textContent='إلغاء الخصم';b.onclick=function(){if(!confirm('إلغاء هذا الخصم؟'))return;return saveAction('cancel:'+v.recordKey,function(){return call('hrMutate',{op:'adjustmentCancel',dept:dept,key:v.recordKey});},loadFinance);};item.appendChild(b);}section.appendChild(item);});box.appendChild(section);});
  if(allowed('canManageFinance'))box.insertAdjacentHTML('beforeend','<div class="fx-card"><h4>الراتب والخصم اليدوي</h4><label class="fl">المبلغ بالدينار العراقي</label><input class="fi" id="finance-amount" type="number" min="0" step="1"><label class="fl">سبب الخصم / ملاحظة الراتب</label><textarea class="ft" id="finance-reason" maxlength="500"></textarea><label class="fl">نوع الخصم اليدوي</label><select class="fs2" id="finance-category"><option value="other">أخرى</option><option value="attendance">بصمة (مبلغ يحدده المسؤول يدويًا)</option></select><div class="fx-actions"><button class="btp" onclick="saveFinanceChange(\'adjustmentAdd\')">إضافة خصم يدوي</button><button class="btg" onclick="saveFinanceChange(\'monthlySalarySet\')">تحديد راتب هذا الشهر فقط</button><button class="btg" onclick="saveFinanceChange(\'salarySet\')">تعديل الراتب من هذا الشهر</button></div><p class="fx-note">يُطلب تحديد راتب الشهر يدويًا عند بدء أو انتهاء الخدمة خلاله؛ لا احتساب نسبي تلقائي.</p></div>');
  el('finance-modal').classList.add('show');
}
function saveFinanceChange(op){
  if(!allowed('canManageFinance')||!FINANCE_TARGET)return;var t=FINANCE_TARGET,data={op:op,dept:t.dept,employeeKey:t.key,month:t.month,amount:el('finance-amount').value,reason:el('finance-reason').value,category:el('finance-category').value};
  if(op==='salarySet'&&!confirm('تغيير الراتب اعتبارًا من '+t.month+'؟'))return;
  return saveAction('finance:'+t.dept+'/'+t.key,function(){return call('hrMutate',data);},loadFinance);
}
function printFinance(){if(FINANCE&&visiblePage('pg-f'))window.print();}
document.addEventListener('DOMContentLoaded',function(){
  el('vio-dept').onchange=function(){fillEmployees('vio-emp',this.value);};
  el('finance-month').onchange=loadFinance;
  el('vio-date').onchange=function(){el('vio-payroll').value=this.value.slice(0,7);};
  el('new-user-role').onchange=function(){if(this.value==='finance'){el('new-user-sal').value='true';el('new-user-label').value='💰 المدير المالي';if(!el('new-user-name').value)el('new-user-name').value='finance';}};
});

var baseOpenEdit=openEdit;openEdit=function(sec,key,name,role,shift,sal){if((SALARIES[sec]||{})[key]==null)sal=(HIRE_SALARIES[sec]||{})[key]??sal;baseOpenEdit(sec,key,name,role,shift,sal);};
