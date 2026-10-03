'use strict';
var ROLE=null,CAN_SAL=false,CURRENT_USER=null,CURRENT_UID=null,PROFILE=null,USER_PERMS={};
var DB=null,AUTH=null,FUNCS=null,LOCAL={},SALARIES={},VIOS={},MONTHS={},DOC_DATA={};
var VFILTER='all',DOC_CURRENT_DEPT=null,SEARCH_QUERY='',USERS={},PERM_DATA={};
var AUTH_LISTENERS=[],DATA_LISTENERS=[],DELAY_WATCHES={},SESSION=0,DATA_EPOCH=0,SESSION_READY=false;
var ALL_D=DMED.concat(DNEW,DADM),ALL_CFG=TOP_CFG.concat(ALL_D),ALL_IDS=ALL_CFG.map(function(d){return d.id;});
var ALL_DEPT_NAMES=ALL_CFG.map(function(d){return d.title;});
var DOC_DAYS=['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];
var BUSY=new Set();
var PERM_FLAGS=[
  ['canViewVio','عرض المخالفات'],['canEditVio','إضافة وإلغاء العقوبات'],
  ['canViewDelay','عرض تأخير البصمة'],['canEditDelay','إضافة وتعديل وإلغاء مبلغ التأخير'],
  ['canViewReports','عرض وطباعة وتصدير التقارير'],['canEditStaff','تقديم طلب تعيين وتعديل الموظفين'],
  ['canViewSal','عرض الرواتب'],['canManageUsers','إدارة حسابات المشاهدة'],
  ['canViewDoctors','عرض جدول الاستشاريين'],['canEditDoctors','تعديل جدول الاستشاريين'],
  ['canApproveHires','اعتماد أو رفض طلبات التعيين'],['canTerminateStaff','تقديم طلب إنهاء خدمات'],['canApproveTerminations','الموافقة أو الرفض على إنهاء الخدمات'],
  ['canViewNotifications','عرض الإشعارات'],['canViewFinance','عرض المالية (يتطلب عرض الرواتب)'],['canManageFinance','إدارة الرواتب والخصومات اليدوية']
];
function el(id){return document.getElementById(id);}
function englishDigits(v){return HR_CORE.F.digits(v).replace(/٬/g,',').replace(/٫/g,'.');}
function accountName(u){return u.fullName||u.username;}
function accountBadge(u){return englishDigits(u.fullName||u.label||u.username);}
function displayEsc(v){return esc(englishDigits(v));}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function developer(){return !!PROFILE&&PROFILE.role==='developer';}
function allowed(flag){return SESSION_READY&&(developer()||USER_PERMS[flag]===true);}
function deptAllowed(id){return SESSION_READY&&ALL_IDS.indexOf(id)!==-1&&(developer()||USER_PERMS.allDepts===true||(USER_PERMS.allowedDepts||{})[id]===true);}
function allowedIds(){return ALL_IDS.filter(deptAllowed);}
function isBoard(id){return HR_CORE.P.isBoard(id);}
function employeeDeptIds(){return allowedIds().filter(function(id){return !isBoard(id);});}
function getUserPerms(){return USER_PERMS;}
function docCanEdit(){return allowed('canViewDoctors')&&allowed('canEditDoctors');}
function canManage(){return allowed('canManageUsers');}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function errorMessage(e){
  var code=e&&e.code||'';
  if(/invalid-login-credentials|wrong-password|user-not-found|invalid-credential/.test(code))return 'رمز المستخدم أو كلمة المرور غير صحيحة';
  if(/weak-password|password-does-not-meet-requirements/.test(code))return 'كلمة المرور لا توافق سياسة Firebase. الحد الافتراضي 6 أحرف؛ راجع Password policy في إعدادات Authentication.';
  if(/email-already-in-use/.test(code))return 'رمز المستخدم مسجل بالفعل.';
  if(/too-many-requests/.test(code))return 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.';
  if(/network-request-failed|unavailable/.test(code))return 'تعذّر الاتصال. تحقق من الإنترنت ثم حاول مجدداً.';
  if(/user-disabled/.test(code))return 'الحساب معطّل. تواصل مع مسؤول النظام.';
  if(/operation-not-allowed/.test(code))return 'تسجيل الدخول غير مفعّل بعد. يجب إكمال إعداد النظام.';
  if(/permission-denied|PERMISSION_DENIED/.test(code))return 'لا تسمح صلاحيات حسابك بهذه العملية، أو انتهت الجلسة.';
  if(/functions\//.test(code)&&e.message)return e.message;
  return (e&&e.userMessage)||'تعذّر إكمال العملية. حاول مجدداً.';
}
function loginError(message){el('l-err').textContent=englishDigits(message);el('l-err').style.display='block';}
function status(message,error){var b=el('sync-status');b.textContent=englishDigits(message);b.style.color=error?'var(--ac)':'var(--t2)';}
function watch(ref,callback,list,epoch){
  var session=SESSION,disposed=false;
  var cb=function(snap){if(!disposed&&session===SESSION&&(epoch==null||epoch===DATA_EPOCH))callback(snap);};
  var onError=function(e){if(!disposed&&session===SESSION)status(errorMessage(e),true);};
  ref.on('value',cb,onError);
  var stop=function(){if(disposed)return;disposed=true;ref.off('value',cb);var i=list.indexOf(stop);if(i!==-1)list.splice(i,1);};
  list.push(stop);return stop;
}
function stopList(list){list.splice(0).forEach(function(stop){stop();});}
function wipeData(){
  DATA_EPOCH++;stopList(DATA_LISTENERS);DELAY_WATCHES={};
  LOCAL={};SALARIES={};VIOS={};MONTHS={};DOC_DATA={};USERS={};PERM_DATA={};['new-account-access','edit-account-access'].forEach(function(id){el(id).replaceChildren();});
}
function resetSession(){
  SESSION++;SESSION_READY=false;stopList(AUTH_LISTENERS);wipeData();
  PROFILE=null;ROLE=null;CAN_SAL=false;CURRENT_USER=null;CURRENT_UID=null;USER_PERMS={};
  SEARCH_QUERY='';VFILTER='all';DOC_CURRENT_DEPT=null;
  document.querySelectorAll('.ov,.eov').forEach(function(m){m.classList.remove('show');});
  ['top-wrap','d-med','d-new','d-adm','vio-list','months-list','rep-body','doc-table-body','perm-list','users-list-display'].forEach(function(id){el(id).replaceChildren();});
  el('edit-user-sel').innerHTML='<option value="">— اختر المستخدم —</option>';
  ['l-user','l-pass','s-inp','e-name','e-role','e-shift','e-sal','new-user-name','new-user-fullname','new-user-pass','new-user-label','edit-user-fullname','edit-user-code','edit-user-pass','edit-user-label'].forEach(function(id){el(id).value='';});
  el('edit-user-fields').style.display='none';el('app').style.display='none';el('login-screen').style.display='flex';
  el('doc-dept-view').style.display='block';el('doc-schedule-view').style.display='none';
  document.querySelectorAll('.fc').forEach(function(c,i){c.classList.toggle('active',i===0);});
  setPage('pg-s');status('');
}
async function validProfile(user,profile){
  if(!profile||!profile.enabled)return false;
  var token=await user.getIdTokenResult();
  return Number(token.claims.auth_time||0)*1000>=Number(profile.sessionAfter||0);
}
async function startSession(user){
  resetSession();var session=SESSION;
  if(!user)return;
  el('login-btn').disabled=true;el('btn-t').textContent='جاري تحميل الحساب...';
  try{
    var profile=(await DB.ref('user_profiles/'+user.uid).once('value')).val();
    if(!await validProfile(user,profile))throw {userMessage:'الحساب غير مفعّل أو الجلسة منتهية. سجل الدخول مجدداً.'};
    var results=await Promise.all([DB.ref('user_perms/'+user.uid).once('value'),DB.ref('hr_spark_meta/ready').once('value')]);
    if(session!==SESSION)return;
    if(results[1].val()!==true)throw {userMessage:'لم يكتمل إعداد النسخة الجديدة ونقل البيانات بعد.'};
    PROFILE=profile;CURRENT_USER=profile.username;CURRENT_UID=user.uid;ROLE=profile.role==='viewer'?'viewer':'admin';
    USER_PERMS=results[0].val()||{};SESSION_READY=true;CAN_SAL=allowed('canViewSal');
    el('role-bdg').textContent=accountBadge(profile);el('role-bdg').className='hbdg '+(ROLE==='admin'?'hbdg-a':'hbdg-v');
    el('l-pass').value='';el('l-err').style.display='none';el('login-screen').style.display='none';el('app').style.display='block';
    buildUI();syncData();
    watch(DB.ref('user_profiles/'+user.uid),function(snap){
      var next=snap.val();
      validProfile(user,next).then(function(valid){
        if(session!==SESSION)return;
        if(!valid){endExpiredSession();return;}
        var changed=JSON.stringify(PROFILE)!==JSON.stringify(next);PROFILE=next;CURRENT_USER=next.username;ROLE=next.role==='viewer'?'viewer':'admin';
        el('role-bdg').textContent=accountBadge(next);
        if(changed){applyPerms();syncData();}
      }).catch(function(){if(session===SESSION)endExpiredSession();});
    },AUTH_LISTENERS);
    watch(DB.ref('user_perms/'+user.uid),function(snap){
      var next=snap.val()||{};
      if(JSON.stringify(next)===JSON.stringify(USER_PERMS))return;
      USER_PERMS=next;CAN_SAL=allowed('canViewSal');
      document.querySelectorAll('.ov,.eov').forEach(function(m){m.classList.remove('show');});
      USERS={};PERM_DATA={};applyPerms();syncData();
      if(el('pg-p').classList.contains('active'))refreshUsers();
    },AUTH_LISTENERS);
  }catch(e){if(session===SESSION){await AUTH.signOut();loginError(errorMessage(e));}}
  finally{if(session===SESSION||!SESSION_READY){el('login-btn').disabled=false;el('btn-t').textContent='دخول ←';}}
}
async function endExpiredSession(){resetSession();await AUTH.signOut();loginError('انتهت الجلسة أو تغيّر الحساب. سجل الدخول مجدداً.');}
async function doLogin(){
  if(el('login-btn').disabled)return;
  var name=el('l-user').value.trim().toLowerCase(),pass=el('l-pass').value;
  if(!name||!pass){loginError('يرجى إدخال رمز المستخدم وكلمة المرور');return;}
  if(!/^[a-z][a-z0-9_-]{2,31}$/.test(name)){loginError('تحقق من رمز المستخدم');return;}
  el('l-err').style.display='none';el('login-btn').disabled=true;el('btn-t').textContent='جاري الدخول...';
  try{await AUTH.signInWithEmailAndPassword(name+'@users.aldora.invalid',pass);}
  catch(e){el('l-pass').value='';loginError(errorMessage(e));el('login-btn').disabled=false;el('btn-t').textContent='دخول ←';}
}
async function doLogout(){
  if(!confirm('هل تريد تسجيل الخروج؟'))return;
  resetSession();
  try{await AUTH.signOut();}catch(e){loginError('تعذّر إكمال الخروج. أعد المحاولة.');}
}
async function call(name,data){
  if(!SESSION_READY)throw {userMessage:'سجل الدخول أولاً'};
  var session=SESSION,result=await FUNCS.httpsCallable(name)(data);
  if(session!==SESSION)throw {userMessage:'تغيّرت الجلسة أثناء العملية'};
  return result.data;
}
async function saveAction(tag,work,done){
  if(BUSY.has(tag))return;
  BUSY.add(tag);var session=SESSION;
  var buttons=Array.from(document.querySelectorAll('.btp,.btdg,.perm-save-btn,.doc-save-btn'));
  buttons.forEach(function(b){b.disabled=true;});status('جاري الحفظ...');
  try{await work();if(session===SESSION){status('تم الحفظ');if(done)done();}}
  catch(e){if(session===SESSION){status(errorMessage(e),true);alert(errorMessage(e));}}
  finally{BUSY.delete(tag);if(!BUSY.size)buttons.forEach(function(b){b.disabled=false;});}
}
function visiblePage(id){return id==='pg-s'||(id==='pg-v'&&allowed('canViewVio'))||(id==='pg-d'&&allowed('canViewDelay'))||(id==='pg-r'&&allowed('canViewReports'))||(id==='pg-doc'&&allowed('canViewDoctors'))||(id==='pg-p'&&canManage());}
function setPage(id){
  document.querySelectorAll('.page').forEach(function(p){p.classList.toggle('active',p.id===id);});
  var suffix={'pg-s':'s','pg-v':'v','pg-d':'d','pg-r':'r','pg-doc':'doc','pg-p':'p'}[id];
  document.querySelectorAll('.nt,.bb').forEach(function(b){b.classList.toggle('active',b.id==='nt-'+suffix||b.id==='bb-'+suffix);});
}
function showPage(id){
  if(!visiblePage(id))return;
  setPage(id);if(id==='pg-r')buildReport();if(id==='pg-p')refreshUsers();
}
function applyPerms(){
  CAN_SAL=allowed('canViewSal');
  [['v','canViewVio'],['d','canViewDelay'],['r','canViewReports'],['doc','canViewDoctors'],['p','canManageUsers']].forEach(function(pair){
    ['nt-','bb-'].forEach(function(pre){el(pre+pair[0]).style.display=allowed(pair[1])?'':'none';});
  });
  el('vbar').style.display=allowed('canEditStaff')?'none':'flex';
  el('btn-newvio').style.display=allowed('canEditVio')?'':'none';
  el('btn-newmonth').style.display=allowed('canEditDelay')?'':'none';
  el('sal-grp').style.display=CAN_SAL?'block':'none';
  document.querySelectorAll('.btna').forEach(function(b){b.style.display=allowed('canEditStaff')?'':'none';});
  document.querySelectorAll('.sal-inp').forEach(function(i){i.style.display=CAN_SAL&&allowed('canEditStaff')&&!isBoard(i.closest('.node').id)?'':'none';if(!CAN_SAL)i.value='';});
  if(!CAN_SAL)el('e-sal').value='';
  ['new-user-role','new-user-sal','edit-user-role','edit-user-sal'].forEach(function(id){el(id).disabled=!developer();});
  el('perm-list').style.display=developer()?'':'none';
  el('perm-description').textContent=developer()?'يمكنك إدارة الحسابات والتحكم بصلاحياتها.':'يمكنك إضافة وتعديل حسابات المشاهدة؛ تغيير الأدوار والصلاحيات متاح للمطور.';
  var active=document.querySelector('.page.active');if(active&&!visiblePage(active.id))setPage('pg-s');
  fillDeptSelects();ALL_IDS.forEach(renderNode);
  if(DOC_CURRENT_DEPT)renderDocTable(DOC_CURRENT_DEPT);
}
function fillDeptSelects(){
  ['vio-dept','adddept-sel'].forEach(function(id){
    var old=el(id).value;el(id).innerHTML='<option value="">— اختر القسم —</option>'+ALL_CFG.filter(function(d){return deptAllowed(d.id)&&!isBoard(d.id);}).map(function(d){return '<option value="'+d.id+'">'+displayEsc(d.title)+'</option>';}).join('');
    if(deptAllowed(old))el(id).value=old;
  });
}
function buildUI(){
  [[TOP_CFG,'top-wrap'],[DMED,'d-med'],[DNEW,'d-new'],[DADM,'d-adm']].forEach(function(pair){el(pair[1]).replaceChildren();pair[0].forEach(function(cfg){buildNode(cfg,el(pair[1]),pair[1]==='top-wrap');});});
  applyPerms();
}
function buildNode(cfg,container,hasNP){
  var node=document.createElement('div');node.className='node'+(cfg.cls?' '+cfg.cls:'');node.id=cfg.id;node.style.borderColor=cfg.tc+'44';
  node.innerHTML='<div class="nh"><div class="ni" style="background:'+cfg.color+'">'+cfg.icon+'</div><div class="nfo"><div class="nt2">'+displayEsc(cfg.title)+'</div><div class="ns" id="ns_'+cfg.id+'">جاري التحميل...</div>'+(hasNP?'<div class="np" id="np_'+cfg.id+'"></div>':'')+'</div><div class="nct" id="nc_'+cfg.id+'">0</div><div class="chv">›</div></div><div class="emps"><div class="etb"><span>الأعضاء</span><button class="btna">＋ إضافة</button></div><div class="el" id="el_'+cfg.id+'"></div><div class="af" id="af_'+cfg.id+'"><input class="fi" id="fn_'+cfg.id+'" placeholder="الاسم الكامل" maxlength="150"><input class="fi" id="fr_'+cfg.id+'" placeholder="المسمى الوظيفي" maxlength="150"><input class="fi" id="ft_'+cfg.id+'" placeholder="⏰ أوقات الدوام" maxlength="150"><input class="fi sal-inp" id="fs_'+cfg.id+'" placeholder="💰 الراتب الشهري" maxlength="100"><label class="fl">تاريخ بدء الخدمة</label><input class="fi" type="date" lang="en" id="fh_'+cfg.id+'"><div class="btr"><button class="btp">إرسال طلب تعيين</button><button class="btg">إلغاء</button></div></div></div>';
  node.querySelector('.nh').addEventListener('click',function(){node.classList.toggle('open');});
  node.querySelector('.btna').addEventListener('click',function(){if(!allowed('canEditStaff')||!deptAllowed(cfg.id))return;node.classList.add('open');el('af_'+cfg.id).classList.add('show');el('fh_'+cfg.id).value=today();el('fn_'+cfg.id).focus();});
  node.querySelector('.btp').addEventListener('click',function(){addEmp(cfg.id);});
  node.querySelector('.btg').addEventListener('click',function(){hideForm(cfg.id);});if(isBoard(cfg.id)){['ft_','fs_'].forEach(function(prefix){node.querySelector('#'+prefix+cfg.id).style.display='none';});node.querySelector('.af .btp').textContent='إرسال طلب إضافة عضو';}container.appendChild(node);
}
function syncData(){
  wipeData();var epoch=DATA_EPOCH,ids=allowedIds();
  ALL_IDS.forEach(function(id){LOCAL[id]=[];renderNode(id);});renderVios();renderMonths();updateStats();
  if(DOC_CURRENT_DEPT)renderDocTable(DOC_CURRENT_DEPT);
  status('جاري مزامنة البيانات...');
  watch(DB.ref('.info/connected'),function(snap){status(snap.val()?'متصل — البيانات تتحدث تلقائياً':'الاتصال منقطع؛ البيانات الظاهرة قد لا تكون محدثة',!snap.val());},DATA_LISTENERS,epoch);
  ids.forEach(function(id){
    watch(DB.ref('hr_spark/staff/'+id),function(snap){
      LOCAL[id]=Object.entries(snap.val()||{}).map(function(pair){return {...pair[1],key:pair[0],name:pair[1].name||'',role:pair[1].role||'',shift:pair[1].shift||''};});
      renderNode(id);updateStats();if(el('pg-r').classList.contains('active'))buildReport();
    },DATA_LISTENERS,epoch);
    if(CAN_SAL&&!isBoard(id))watch(DB.ref('hr_spark/salaries/'+id),function(snap){SALARIES[id]=snap.val()||{};renderNode(id);},DATA_LISTENERS,epoch);
    if(allowed('canViewVio'))watch(DB.ref('hr_spark/violations/'+id),function(snap){
      Object.keys(VIOS).forEach(function(key){if(VIOS[key].deptId===id)delete VIOS[key];});
      Object.entries(snap.val()||{}).forEach(function(pair){if(pair[1].status!=='cancelled')VIOS[id+'/'+pair[0]]={...pair[1],deptId:id,key:pair[0]};});
      renderVios();updateStats();if(el('pg-r').classList.contains('active'))buildReport();
    },DATA_LISTENERS,epoch);
  });
  if(allowed('canViewDelay'))watch(DB.ref('hr_spark/months'),function(snap){
    var months=snap.val()||{};
    Object.keys(DELAY_WATCHES).forEach(function(mk){if(!Object.hasOwn(months,mk)){DELAY_WATCHES[mk].forEach(function(stop){stop();});delete DELAY_WATCHES[mk];delete MONTHS[mk];}});
    Object.entries(months).forEach(function(pair){
      var mk=pair[0];MONTHS[mk]={...pair[1],depts:(MONTHS[mk]||{}).depts||{}};
      if(!DELAY_WATCHES[mk]){
        DELAY_WATCHES[mk]=[];
        ids.forEach(function(id){var stop=watch(DB.ref('hr_spark/delays/'+mk+'/'+id),function(ds){if(!MONTHS[mk])return;if(ds.exists())MONTHS[mk].depts[id]=ds.val();else delete MONTHS[mk].depts[id];renderMonths();},DATA_LISTENERS,epoch);DELAY_WATCHES[mk].push(stop);});
      }
    });renderMonths();
  },DATA_LISTENERS,epoch);
  if(allowed('canViewDoctors'))watch(DB.ref('hr_spark/doc_schedule'),function(snap){
    DOC_DATA=snap.val()||{};
    // Keep unsaved input intact if a remote update arrives.
    if(DOC_CURRENT_DEPT&&!el('doc-table-body').dataset.dirty)renderDocTable(DOC_CURRENT_DEPT);
    else if(DOC_CURRENT_DEPT)status('تغيّر جدول الاستشاريين. لديك تعديلات لم تحفظ؛ الحفظ يستبدل جدول الاختصاص.',true);
  },DATA_LISTENERS,epoch);
}
function matchNode(id){
  if(!deptAllowed(id))return false;
  var q=SEARCH_QUERY.trim();if(!q)return true;
  var cfg=ALL_CFG.find(function(d){return d.id===id;});
  return cfg.title.includes(q)||(LOCAL[id]||[]).some(function(e){return (e.name+' '+e.role).includes(q);});
}
function renderNode(id){
  var node=el(id);if(!node)return;node.style.display=matchNode(id)?'':'none';
  var list=el('el_'+id);list.replaceChildren();
  if(!deptAllowed(id)){if(el('np_'+id))el('np_'+id).replaceChildren();el('ns_'+id).textContent='';el('nc_'+id).textContent='0';return;}
  var emps=(LOCAL[id]||[]).filter(function(e){return STAFF_FILTER==='all'||(STAFF_FILTER==='terminated'?e.status==='terminated':e.status!=='terminated');});el('nc_'+id).textContent=emps.length;
  el('ns_'+id).textContent=isBoard(id)?'':(emps.length?emps.length+' موظف':'لا يوجد موظفون');el('nc_'+id).style.display=isBoard(id)?'none':'';
  if(el('np_'+id)){el('np_'+id).innerHTML=emps.map(function(e){return '<span class="nc2">● '+displayEsc(e.name)+(e.role?' — '+displayEsc(e.role):'')+'</span>';}).join('');}
  if(!emps.length){list.innerHTML='<div class="ee">'+(isBoard(id)?'لا توجد أسماء مسجلة':'لا يوجد موظفون في هذا القسم')+'</div>';return;}
  emps.forEach(function(e){
    var div=document.createElement('div');div.className='ei';
    var salary=CAN_SAL&&!isBoard(id)?'<span class="esal">💰 '+displayEsc(Object.hasOwn(SALARIES,id)?((SALARIES[id]||{})[e.key]??(HIRE_SALARIES[id]||{})[e.key]??'غير محدد'):'جاري التحميل...')+'</span>':'';
    div.innerHTML='<div class="eav">'+displayEsc(e.name.trim().charAt(0)||'؟')+'</div><div class="einfo"><div class="en">'+displayEsc(e.name)+'</div><div class="er">'+displayEsc(e.role||(isBoard(id)?'':'موظف'))+(!isBoard(id)&&e.status==='terminated'?' — منتهية الخدمات '+displayEsc(e.terminationDate):'')+'</div><div style="display:flex;gap:4px;flex-wrap:wrap">'+salary+(isBoard(id)?'':'<span class="eshift">⏰ '+displayEsc(e.shift||'غير محدد')+'</span>')+'</div></div><div class="eac">'+(e.status!=='terminated'&&allowed('canEditStaff')?'<button class="bte">تعديل</button>':'')+(!isBoard(id)&&e.status!=='terminated'&&allowed('canTerminateStaff')?'<button class="btd">طلب إنهاء الخدمات</button>':'')+'</div>';
    if(div.querySelector('.bte')){div.querySelector('.bte').onclick=function(){openEdit(id,e.key,e.name,e.role,e.shift,(SALARIES[id]||{})[e.key]||'');};}if(div.querySelector('.btd')){var termButton=div.querySelector('.btd');termButton.onclick=function(){delEmp(id,e.key);};if(typeof TERM_PENDING!=='undefined'&&(TERM_PENDING[id]||{})[e.key]){termButton.textContent='طلب إنهاء معلق';termButton.disabled=true;}};
    list.appendChild(div);
  });
}
function updateStats(){
  el('tot-emp').textContent=employeeDeptIds().reduce(function(n,id){return n+(LOCAL[id]||[]).filter(function(e){return e.status!=='terminated';}).length;},0);
  el('tot-dept').textContent=allowedIds().length;el('tot-vio').textContent=allowed('canViewVio')?Object.keys(VIOS).length:'—';
}
function doSearch(q){SEARCH_QUERY=String(q||'');ALL_IDS.forEach(function(id){var node=el(id);if(node)node.style.display=matchNode(id)?'':'none';});}
function hideForm(id){el('af_'+id).classList.remove('show');['fn_','fr_','ft_','fs_'].forEach(function(p){el(p+id).value='';});}
function addEmp(id){
  if(!allowed('canEditStaff')||!deptAllowed(id))return;
  var name=el('fn_'+id).value.trim();if(!name){alert('أدخل اسم الموظف');return;}
  var data={op:'hireSubmit',dept:id,hireDate:el('fh_'+id).value,name:name,role:el('fr_'+id).value,shift:el('ft_'+id).value};if(CAN_SAL&&!isBoard(id))data.salary=el('fs_'+id).value;if(isBoard(id))data.shift='';
  return saveAction('staff:'+id,function(){return call('hrMutate',data);},function(){hideForm(id);alert('تم إرسال طلب التعيين؛ ينتظر موافقة المسؤول.');});
}
function delEmp(id,key){if(!allowed('canEditStaff')||!deptAllowed(id)||!confirm('حذف الموظف؟'))return;return saveAction('staff:'+id+'/'+key,function(){return call('hrMutate',{op:'staffDelete',dept:id,key:key});});}
function openEdit(sec,key,name,role,shift,sal){
  if(!allowed('canEditStaff')||!deptAllowed(sec))return;
  if(CAN_SAL&&!isBoard(sec)&&!Object.hasOwn(SALARIES,sec)){alert('انتظر تحميل بيانات الرواتب ثم حاول مجدداً.');return;}
  ['sec','key','name','role','shift','sal'].forEach(function(k,i){el('e-'+k).value=[sec,key,englishDigits(name),englishDigits(role),englishDigits(shift),CAN_SAL?englishDigits(sal):''][i]||'';});el('e-shift').closest('.fg').style.display=isBoard(sec)?'none':'';el('sal-grp').style.display=CAN_SAL&&!isBoard(sec)?'':'none';el('e-salary-month').closest('.fg').style.display=CAN_SAL&&!isBoard(sec)?'':'none';el('e-salary-month').value=today().slice(0,7);el('edit-modal').classList.add('show');el('e-name').focus();
}
function saveEdit(){
  var id=el('e-sec').value;if(!allowed('canEditStaff')||!deptAllowed(id))return;
  var name=el('e-name').value.trim();if(!name){alert('أدخل اسم الموظف');return;}
  var data={op:'staffEdit',dept:id,key:el('e-key').value,name:name,role:el('e-role').value,shift:el('e-shift').value,salaryMonth:el('e-salary-month').value};if(CAN_SAL&&!isBoard(id)&&el('e-sal').value.trim()!=='')data.salary=el('e-sal').value;
  return saveAction('edit',function(){return call('hrMutate',data);},function(){el('edit-modal').classList.remove('show');});
}
function fvio(type,button){VFILTER=type;document.querySelectorAll('.fc').forEach(function(c){c.classList.toggle('active',c===button);});renderVios();}
function renderVios(){
  var list=el('vio-list');list.replaceChildren();
  var counters={warning:0,deduct:0,suspend:0,praise:0};
  var records=allowed('canViewVio')?Object.values(VIOS).filter(function(v){return deptAllowed(v.deptId)&&!isBoard(v.deptId)&&v.status!=='cancelled'&&(!el('vio-report-month').value||String(v.date||'').slice(0,7)===el('vio-report-month').value);}):[];
  records.forEach(function(v){if(Object.hasOwn(counters,v.type))counters[v.type]++;});
  [['cw','warning'],['cd','deduct'],['cs','suspend'],['cp','praise']].forEach(function(p){el(p[0]).textContent=counters[p[1]];});
  if(VFILTER!=='all')records=records.filter(function(v){return v.type===VFILTER;});
  records.sort(function(a,b){return (b.ts||0)-(a.ts||0);});el('vio-empty').style.display=records.length?'none':'block';
  var labels={warning:'⚠️ إنذار',deduct:'💸 خصم',suspend:'🚫 إيقاف',praise:'🏅 تقدير'},classes={warning:'bw',deduct:'bdc',suspend:'bss',praise:'bpr'};
  records.forEach(function(v){
    var card=document.createElement('div');card.className='vcard';
    var extra=v.type==='deduct'&&v.deduct?'<br><strong>مقدار الخصم:</strong> '+displayEsc(v.deduct):v.type==='suspend'&&v.suspend?'<br><strong>مدة الإيقاف:</strong> '+displayEsc(v.suspend):'';
    card.innerHTML='<div class="vtop"><div class="vbdg '+(classes[v.type]||'')+'">'+displayEsc(labels[v.type]||v.type)+'</div><div class="vm"><div class="vn2">'+displayEsc(v.empName)+'</div><div class="vdp">'+displayEsc(v.dept)+'</div></div><div class="vdt">'+displayEsc(v.date)+'</div></div><div class="vbdy">'+displayEsc(v.reason)+extra+'</div>'+(allowed('canEditVio')?'<div class="vft"><button class="btdv">حذف</button></div>':'');
    if(allowed('canEditVio'))card.querySelector('.btdv').onclick=function(){delVio(v.deptId,v.key);};list.appendChild(card);
  });
}
function openVioModal(){
  if(!allowed('canViewVio')||!allowed('canEditVio'))return;
  el('vio-date').value=today();el('vio-payroll').value=today().slice(0,7);['vio-emp','vio-reason','vio-deduct','vio-suspend'].forEach(function(id){el(id).value='';});fillDeptSelects();fillEmployees('vio-emp',el('vio-dept').value);toggleVioX();el('vio-modal').classList.add('show');
}
function toggleVioX(){el('gd').style.display=el('vio-type').value!=='praise'?'block':'none';el('vio-deduct').value=el('vio-type').value==='deduct'?'':'0';el('gs').style.display=el('vio-type').value==='suspend'?'block':'none';}
function saveVio(){
  var id=el('vio-dept').value;if(!allowed('canEditVio')||!deptAllowed(id))return;
  var data={op:'vioAdd',dept:id,employeeKey:el('vio-emp').value,type:el('vio-type').value,date:el('vio-date').value,reason:el('vio-reason').value,deductionAmount:el('vio-deduct').value,payrollMonth:el('vio-payroll').value,suspend:el('vio-suspend').value};
  return saveAction('vio',function(){return call('hrMutate',data);},function(){el('vio-modal').classList.remove('show');});
}
function delVio(dept,key){if(!allowed('canEditVio')||!deptAllowed(dept)||!confirm('حذف العقوبة؟'))return;return saveAction('vio:'+key,function(){return call('hrMutate',{op:'vioDelete',dept:dept,key:key});});}
function renderMonths(){
  var list=el('months-list');
  var openMonths=new Set(Array.from(list.querySelectorAll('.month-card.open')).map(function(c){return c.dataset.month;}));
  var openDepts=new Set(Array.from(list.querySelectorAll('.dept-card.open')).map(function(c){return c.dataset.path;}));
  list.replaceChildren();var keys=allowed('canViewDelay')?Object.keys(MONTHS):[];keys.sort(function(a,b){return (MONTHS[b].ts||0)-(MONTHS[a].ts||0);});el('months-empty').style.display=keys.length?'none':'block';
  keys.forEach(function(mk){
    var m=MONTHS[mk],depts=Object.keys(m.depts||{}).filter(function(id){return deptAllowed(id)&&!isBoard(id);}),total=depts.reduce(function(n,id){return n+Object.values(m.depts[id].employees||{}).filter(function(e){return e.status!=='cancelled';}).length;},0);
    var card=document.createElement('div');card.className='month-card'+(openMonths.has(mk)?' open':'');card.dataset.month=mk;
    var head=document.createElement('div');head.className='month-head';head.innerHTML='<div class="month-icon">📅</div><div class="month-info"><div class="month-title">'+displayEsc(m.name)+'</div><div class="month-meta">'+depts.length+' قسم — '+total+' حالة تأخير</div></div><div class="chv">›</div>';head.onclick=function(){card.classList.toggle('open');};
    var body=document.createElement('div');body.className='month-body';var exports=document.createElement('div');exports.className='fx-actions';[['طباعة التقرير','print'],['تصدير التقرير','export']].forEach(function(pair){var b=document.createElement('button');b.className='btg';b.textContent=pair[0];b.onclick=function(){monthlyDelayReport(mk,pair[1]);};exports.appendChild(b);});body.appendChild(exports);
    if(allowed('canEditDelay')){
      var actions=document.createElement('div');actions.className='month-actions';var add=document.createElement('button');add.className='btp';add.textContent='＋ إضافة قسم';add.onclick=function(){openAddDeptModal(mk);};actions.appendChild(add);
      if(developer()||USER_PERMS.allDepts){var del=document.createElement('button');del.className='btg';del.textContent='🗑 حذف الشهر';del.onclick=function(){delMonth(mk);};actions.appendChild(del);}body.appendChild(actions);
    }
    if(!depts.length){var empty=document.createElement('div');empty.className='ee';empty.textContent='لا توجد أقسام متاحة في هذا الشهر';body.appendChild(empty);}
    depts.forEach(function(id){
      var d=m.depts[id],emps=Object.entries(d.employees||{}).filter(function(p){return p[1].status!=='cancelled';});var cfg=ALL_CFG.find(function(c){return c.id===id;});
      var dc=document.createElement('div');dc.className='dept-card'+(openDepts.has(mk+'/'+id)?' open':'');dc.dataset.path=mk+'/'+id;
      var dh=document.createElement('div');dh.className='dept-head';dh.innerHTML='<div class="dept-icon-sm" style="background:'+cfg.color+'">'+cfg.icon+'</div><div class="dept-name-sm">'+displayEsc(cfg.title)+'</div><span class="dept-count-badge">'+emps.length+'</span><div class="chv">›</div>';dh.onclick=function(){dc.classList.toggle('open');};
      var db=document.createElement('div');db.className='dept-body';var bar=document.createElement('div');bar.className='dept-emp-bar';bar.innerHTML='<span>المتأخرون</span>';
      if(allowed('canEditDelay')){
        var delD=document.createElement('button');delD.className='btd';delD.textContent='حذف القسم';delD.onclick=function(){delDept(mk,id);};
        var addE=document.createElement('button');addE.className='btna';addE.textContent='＋ إضافة موظف';addE.onclick=function(){openDelayEmpModal(mk,id);};bar.append(delD,addE);
      }db.appendChild(bar);
      if(!emps.length){var no=document.createElement('div');no.className='ee';no.textContent='لا توجد حالات تأخير';db.appendChild(no);}
      emps.forEach(function(pair){var key=pair[0],e=pair[1],row=document.createElement('div');row.className='delay-item';row.innerHTML='<div class="delay-av">'+displayEsc(String(e.name||'').trim().charAt(0)||'؟')+'</div><div class="delay-info"><div class="delay-name">'+displayEsc(e.name)+'</div><div class="delay-sub">💰 '+displayEsc(e.deductionConfirmed===true?iq(e.deductionAmount):'لم يحدد مبلغ لهذا السجل القديم')+(e.note?' | '+displayEsc(e.note):'')+'</div></div><div class="delay-date">'+displayEsc(e.date)+'</div>';
        if(allowed('canEditDelay')){var editE=document.createElement('button');editE.className='btg';editE.textContent='تعديل المبلغ';editE.onclick=function(){openDelayEmpModal(mk,id,key);};row.appendChild(editE);var delE=document.createElement('button');delE.className='btd';delE.textContent='إلغاء';delE.onclick=function(){delDelayEmp(mk,id,key);};row.appendChild(delE);}db.appendChild(row);
      });dc.append(dh,db);body.appendChild(dc);
    });card.append(head,body);list.appendChild(card);
  });
}
function saveMonth(){if(!allowed('canEditDelay'))return;return saveAction('month',function(){return call('hrMutate',{op:'monthAdd',name:el('m-name').value});},function(){el('m-name').value='';el('month-modal').classList.remove('show');});}
function delMonth(mk){if(!allowed('canEditDelay')||!(developer()||USER_PERMS.allDepts)||!confirm('حذف هذا الشهر وجميع سجلاته؟'))return;return saveAction('month:'+mk,function(){return call('hrMutate',{op:'monthDelete',month:mk});});}
function openAddDeptModal(mk){if(!allowed('canEditDelay'))return;el('adddept-mk').value=mk;fillDeptSelects();el('adddept-sel').value='';el('adddept-modal').classList.add('show');}
function saveAddDept(){var mk=el('adddept-mk').value,id=el('adddept-sel').value;if(!allowed('canEditDelay')||!deptAllowed(id)){alert('اختر قسماً مسموحاً');return;}return saveAction('delay-dept',function(){return call('hrMutate',{op:'delayDeptAdd',month:mk,dept:id});},function(){el('adddept-modal').classList.remove('show');});}
function delDept(mk,id){if(!allowed('canEditDelay')||!deptAllowed(id)||!confirm('حذف القسم وجميع سجلات التأخير فيه؟'))return;return saveAction('delay-dept:'+mk+'/'+id,function(){return call('hrMutate',{op:'delayDeptDelete',month:mk,dept:id});});}
function openDelayEmpModal(mk,id,key){
  if(!allowed('canEditDelay')||!deptAllowed(id)||isBoard(id))return;var record=key&&MONTHS[mk]?.depts[id]?.employees[key];if(key&&(!record||record.status==='cancelled'))return;
  el('delay-mk').value=mk;el('delay-dk').value=id;el('d-key').value=key||'';el('delay-title').textContent=key?'تعديل مبلغ التأخير':'إضافة مبلغ تأخير';el('d-date').value=record?record.date:today();el('d-date').readOnly=!!record;el('d-amount').value=record&&record.deductionConfirmed===true?record.deductionAmount:'';el('d-note').value=record?englishDigits(record.note||''):'';fillEmployees('d-name',id,record&&record.employeeKey);el('delay-modal').classList.add('show');el('d-name').focus();
}
function saveDelay(){var key=el('d-key').value,data={op:key?'delayAmountSet':'delayAdd',month:el('delay-mk').value,dept:el('delay-dk').value,employeeKey:el('d-name').value,amount:el('d-amount').value,date:el('d-date').value,note:el('d-note').value};if(key)data.key=key;if(!allowed('canEditDelay')||!deptAllowed(data.dept))return;return saveAction('delay',function(){return call('hrMutate',data);},function(){el('delay-modal').classList.remove('show');status('تم حفظ مبلغ التأخير؛ يُخصم من راتب شهر '+data.date.slice(0,7)+'.');});}
function delDelayEmp(mk,id,key){if(!allowed('canEditDelay')||!deptAllowed(id)||!confirm('إلغاء سجل التأخير وإزالة خصمه من راتب الشهر؟'))return;return saveAction('delay:'+key,function(){return call('hrMutate',{op:'delayDelete',month:mk,dept:id,key:key});});}
function fillStaffReportDepartments(){
  var select=el('staff-report-dept'),old=select.value,ids=allowed('canViewReports')?employeeDeptIds():[];
  select.innerHTML='<option value="">جميع الأقسام المسموحة</option>'+ids.map(function(id){return '<option value="'+esc(id)+'">'+displayEsc(deptTitle(id))+'</option>';}).join('');if(ids.includes(old))select.value=old;
}
function selectedStaffReportDeptIds(){var id=el('staff-report-dept').value,ids=employeeDeptIds();return id?ids.filter(function(d){return d===id;}):ids;}
function buildReport(){
  fillStaffReportDepartments();if(!allowed('canViewReports')){el('rep-body').replaceChildren();return;}
  var tot=0,rows='',selected=el('staff-report-dept').value;selectedStaffReportDeptIds().forEach(function(id){var cfg=ALL_CFG.find(function(d){return d.id===id;}),count=(LOCAL[id]||[]).filter(function(e){return e.status!=='terminated';}).length;tot+=count;if(!count)return;var vc=Object.values(VIOS).filter(function(v){return v.deptId===id;}).length;
    rows+='<div class="rrow"><span class="rn">'+displayEsc(cfg.title)+'</span><div class="rpills"><span class="rpill rpe">'+count+' موظف</span>'+(allowed('canViewVio')&&vc?'<span class="rpill rpv">'+vc+' عقوبة</span>':'')+'</div></div>';
  });el('rep-body').innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:2px solid var(--bd)"><span style="font-weight:900">'+(selected?'إجمالي الموظفين في '+displayEsc(deptTitle(selected)):'إجمالي الموظفين في الأقسام المسموحة')+'</span><span style="font-size:24px;font-weight:900;color:var(--pr)">'+tot+'</span></div>'+(rows||'<div class="ee">لا يوجد موظفون في النطاق المختار</div>');
}
async function refreshUsers(){
  if(!canManage())return;var session=SESSION;status('جاري تحميل الحسابات...');
  try{var result=await call('hrUsers',{action:'list'});if(session!==SESSION||!canManage())return;USERS={};PERM_DATA={};result.users.forEach(function(u){USERS[u.username]=u;PERM_DATA[u.username]=u.perms||{};});renderUsersListDisplay();buildPermsPage();if(!el('new-account-access').children.length)accountRoleChanged('new');status('تم تحميل الحسابات');}
  catch(e){if(session===SESSION)status(errorMessage(e),true);}
}
function renderUsersListDisplay(){
  var select=el('edit-user-sel'),old=select.value;select.innerHTML='<option value="">— اختر المستخدم —</option>';el('users-list-display').replaceChildren();
  Object.keys(USERS).sort().forEach(function(name){var u=USERS[name],option=document.createElement('option');option.value=name;option.textContent=englishDigits(accountName(u))+' — '+name+' ('+accountLabel(u.role)+')';select.appendChild(option);var row=document.createElement('div');row.className='perm-toggle-row';var desc=document.createElement('div');desc.innerHTML='<div class="perm-toggle-label">'+displayEsc(accountName(u))+'</div><div class="perm-toggle-sub">رمز المستخدم: '+esc(name)+' — '+displayEsc(u.label)+' — '+(u.enabled?'مفعّل':'معطّل')+'</div>';row.appendChild(desc);el('users-list-display').appendChild(row);});
  if(USERS[old])select.value=old;else el('edit-user-fields').style.display='none';
}
function onEditUserChange(){var u=USERS[el('edit-user-sel').value];el('edit-user-fields').style.display=u?'block':'none';if(!u)return;el('edit-user-fullname').value=englishDigits(u.fullName||'');el('edit-user-code').value=u.username;el('edit-user-pass').value='';el('edit-user-role').value=u.role==='developer'?'admin':u.role;el('edit-user-sal').value=u.perms.canViewSal?'true':'false';el('edit-user-label').value=englishDigits(u.label||'');el('edit-user-enabled').value=u.enabled?'true':'false';el('edit-user-role').disabled=!developer()||u.role==='developer';el('edit-user-enabled').disabled=u.role==='developer';el('edit-user-sal').disabled=!developer()||u.role==='developer';renderAccountAccess(el('edit-account-access'),u.perms||{},u.role,developer()&&u.role!=='developer');}
function addNewUser(){if(!canManage())return;var fullName=el('new-user-fullname').value.trim();if(!fullName||fullName.length>150){alert('أدخل اسم الموظف أو الإداري، بحد أقصى 150 حرفًا');return;}var code;try{code=HR_CORE.P.username(el('new-user-name').value);}catch(e){status(errorMessage(e),true);alert(errorMessage(e));return;}var data={action:'create',fullName:fullName,username:code,password:el('new-user-pass').value,role:el('new-user-role').value,perms:accessValues(el('new-account-access')),label:el('new-user-label').value};return saveAction('new-user',function(){return call('hrUsers',data);},function(){['new-user-name','new-user-fullname','new-user-pass','new-user-label'].forEach(function(id){el(id).value='';});renderAccountAccess(el('new-account-access'),{},el('new-user-role').value,true);refreshUsers();alert('تم إنشاء الحساب وحفظه دائماً');});}
function saveEditUser(){var u=USERS[el('edit-user-sel').value];if(!canManage()||!u)return;var data={action:'update',uid:u.uid,fullName:el('edit-user-fullname').value.trim(),password:el('edit-user-pass').value,role:el('edit-user-role').value,salary:el('edit-user-sal').value==='true',label:el('edit-user-label').value,enabled:el('edit-user-enabled').value==='true'};if(developer()&&u.role!=='developer')data.perms=accessValues(el('edit-account-access'));return saveAction('edit-user',function(){return call('hrUsers',data);},function(){el('edit-user-pass').value='';el('edit-user-fields').style.display='none';refreshUsers();alert('تم حفظ تعديلات الحساب');});}
var ACCOUNT_GROUPS=[['العقوبات',['canViewVio','canEditVio']],['التأخير',['canViewDelay','canEditDelay']],['التقارير',['canViewReports']],['الاستشاريون',['canViewDoctors','canEditDoctors']],['التعيينات وإنهاء الخدمات',['canEditStaff','canApproveHires','canTerminateStaff','canApproveTerminations','canViewNotifications']],['المالية',['canViewSal','canViewFinance','canManageFinance']]];
function accountLabel(role){return HR_CORE.P.ROLE_LABELS[role]||role;}
function accessValues(box){var p={allDepts:!!box.querySelector('[data-all]:checked'),allowedDepts:{}};box.querySelectorAll('[data-flag]').forEach(function(i){p[i.dataset.flag]=i.checked;});box.querySelectorAll('[data-dept]:checked').forEach(function(i){p.allowedDepts[i.dataset.dept]=true;});return p;}
function permissionDependencies(box,input){var deps={canEditVio:['canViewVio'],canEditDelay:['canViewDelay'],canEditDoctors:['canViewDoctors'],canViewFinance:['canViewSal'],canManageFinance:['canViewFinance','canViewSal']};if(input.checked)(deps[input.dataset.flag]||[]).forEach(function(f){box.querySelector('[data-flag="'+f+'"]').checked=true;});else Object.keys(deps).forEach(function(f){if(deps[f].includes(input.dataset.flag))box.querySelector('[data-flag="'+f+'"]').checked=false;});}
function renderAccountAccess(box,p,role,editable){
 box.replaceChildren();var title=document.createElement('h4');title.textContent='صلاحيات القوائم والإجراءات';box.appendChild(title);var note=document.createElement('p');note.className='fx-note';note.textContent='اختر الإجراءات المسموحة. نوع الحساب لا يمنح صلاحيات إضافية. «كامل الإجراءات» يفعّل المجموعة المحددة.';box.appendChild(note);
 ACCOUNT_GROUPS.concat([['إدارة الحسابات',['canManageUsers']]]).forEach(function(group){var section=document.createElement('div');section.className='perm-section';var head=document.createElement('div');head.className='fx-actions';var label=document.createElement('strong');label.textContent=group[0];head.appendChild(label);var shortcut=document.createElement('button');shortcut.type='button';shortcut.className='btg';shortcut.textContent='كامل الإجراءات';shortcut.disabled=!editable||(!developer()&&group[1].some(function(f){return !allowed(f);}));shortcut.onclick=function(){var turnOn=group[1].some(function(f){return !box.querySelector('[data-flag="'+f+'"]').checked;});group[1].forEach(function(f){var i=box.querySelector('[data-flag="'+f+'"]');i.checked=turnOn;permissionDependencies(box,i);});};head.appendChild(shortcut);section.appendChild(head);
 group[1].forEach(function(f){var def=PERM_FLAGS.find(function(d){return d[0]===f;}),row=document.createElement('label');row.className='perm-toggle-row';row.textContent=def[1];var sw=document.createElement('span');sw.className='toggle-switch';var input=document.createElement('input');input.type='checkbox';input.dataset.flag=f;input.checked=p[f]===true;input.disabled=!editable||(!developer()&&!allowed(f));input.onchange=function(){permissionDependencies(box,input);};var slider=document.createElement('span');slider.className='toggle-slider';sw.append(input,slider);row.appendChild(sw);section.appendChild(row);});box.appendChild(section);});
 var title=document.createElement('h4');title.textContent=role==='department_head'?'الأقسام المسؤول عنها (يمكن اختيار أكثر من قسم)':'الأقسام المسموحة';box.appendChild(title);var all=document.createElement('label');all.className='perm-toggle-row';all.textContent='جميع الأقسام';var ai=document.createElement('input');ai.type='checkbox';ai.dataset.all='true';ai.checked=role!=='department_head'&&p.allDepts===true;ai.disabled=!editable||role==='department_head'||(!developer()&&!USER_PERMS.allDepts);all.appendChild(ai);box.appendChild(all);if(role==='department_head')all.style.display='none';
 var grid=document.createElement('div');grid.className='perm-dept-grid';grid.style.display=ai.checked?'none':'grid';ai.onchange=function(){grid.style.display=ai.checked?'none':'grid';};ALL_CFG.filter(function(cfg){return developer()||deptAllowed(cfg.id);}).forEach(function(cfg){var label=document.createElement('label');label.className='perm-dept-item';var input=document.createElement('input');input.type='checkbox';input.dataset.dept=cfg.id;input.checked=(p.allowedDepts||{})[cfg.id]===true;input.disabled=!editable;var text=document.createElement('span');text.className='perm-dept-name';text.textContent=cfg.title;label.append(input,text);grid.appendChild(label);});box.appendChild(grid);
}
function accountRoleChanged(prefix){var box=el(prefix+'-account-access'),p=accessValues(box),u=prefix==='edit'&&USERS[el('edit-user-sel').value];renderAccountAccess(box,p,el(prefix+'-user-role').value,canManage()&&(!u||developer()&&u.role!=='developer'));}
function buildPermsPage(){
  var list=el('perm-list');list.replaceChildren();if(!developer())return;
  Object.keys(USERS).sort().filter(function(name){return USERS[name].role!=='developer';}).forEach(function(name){
    var u=USERS[name],p=u.perms||{},card=document.createElement('div');card.className='perm-card';card.dataset.username=name;
    var head=document.createElement('div');head.className='perm-card-head';head.innerHTML='<div class="perm-user-name">'+displayEsc(accountName(u))+' <small dir="ltr">('+esc(name)+')</small></div><div class="perm-user-role">'+displayEsc(u.label)+'</div>';card.appendChild(head);
    var access=document.createElement('div');renderAccountAccess(access,p,u.role,true);card.appendChild(access);
    var button=document.createElement('button');button.className='perm-save-btn';button.textContent='💾 حفظ صلاحيات '+englishDigits(accountName(u));button.onclick=function(){saveUserPerms(name,card);};card.appendChild(button);list.appendChild(card);
  });
}
function saveUserPerms(name,card){
  if(!developer()||!USERS[name])return;
  var p={allDepts:card.querySelector('[data-all]').checked,allowedDepts:{}};
  card.querySelectorAll('[data-flag]').forEach(function(input){p[input.dataset.flag]=input.checked;});
  card.querySelectorAll('[data-dept]:checked').forEach(function(input){p.allowedDepts[input.dataset.dept]=true;});
  return saveAction('perms:'+name,function(){return call('hrUsers',{action:'permissions',uid:USERS[name].uid,perms:p});},function(){USERS[name].perms=p;alert('تم حفظ الصلاحيات');});
}
function openDocDept(dept){
  if(!allowed('canViewDoctors'))return;DOC_CURRENT_DEPT=dept;el('doc-dept-view').style.display='none';el('doc-schedule-view').style.display='block';el('doc-dept-title').textContent='🗓️ '+dept;delete el('doc-table-body').dataset.dirty;renderDocTable(dept);
}
function closeDocDept(){if(el('doc-table-body').dataset.dirty&&!confirm('لديك تغييرات لم تُحفظ. هل تريد تركها؟'))return;DOC_CURRENT_DEPT=null;delete el('doc-table-body').dataset.dirty;el('doc-table-body').replaceChildren();el('doc-dept-view').style.display='block';el('doc-schedule-view').style.display='none';}
function renderDocTable(dept){
  var tbody=el('doc-table-body');tbody.replaceChildren();delete tbody.dataset.dirty;
  el('doc-save').style.display=docCanEdit()?'block':'none';el('doc-clear').style.display=docCanEdit()?'block':'none';
  if(!allowed('canViewDoctors'))return;var saved=DOC_DATA[dept.replace(/\s+/g,'_')]||{};
  DOC_DAYS.forEach(function(day){var tr=document.createElement('tr');var label=document.createElement('td');label.className='doc-day-label';label.textContent=day;tr.appendChild(label);
    ['morning','evening'].forEach(function(slot){var td=document.createElement('td'),value=(saved[day]||{})[slot]||'';if(docCanEdit()){var input=document.createElement('input');input.className='doc-input';input.id='doc_'+day+'_'+slot;input.value=englishDigits(value);input.maxLength=150;input.placeholder=slot==='morning'?'اسم الطبيب الصباحي':'اسم الطبيب المسائي';input.oninput=function(){tbody.dataset.dirty='true';};td.appendChild(input);}else td.textContent=englishDigits(value||'—');tr.appendChild(td);});tbody.appendChild(tr);
  });
}
function saveDocSchedule(){
  if(!docCanEdit()||!DOC_CURRENT_DEPT)return;var dept=DOC_CURRENT_DEPT,data={};DOC_DAYS.forEach(function(day){data[day]={morning:el('doc_'+day+'_morning').value,evening:el('doc_'+day+'_evening').value};});
  return saveAction('docs',function(){return call('hrMutate',{op:'docSave',dept:dept,schedule:data});},function(){DOC_DATA[dept.replace(/\s+/g,'_')]=data;if(DOC_CURRENT_DEPT===dept){delete el('doc-table-body').dataset.dirty;renderDocTable(dept);}alert('تم حفظ الجدول');});
}
function clearDocSchedule(){if(!docCanEdit()||!DOC_CURRENT_DEPT||!confirm('حذف جميع بيانات جدول '+DOC_CURRENT_DEPT+'؟'))return;var dept=DOC_CURRENT_DEPT;return saveAction('docs',function(){return call('hrMutate',{op:'docClear',dept:dept});},function(){DOC_DATA[dept.replace(/\s+/g,'_')]={};if(DOC_CURRENT_DEPT===dept)renderDocTable(dept);});}
document.addEventListener('input',function(event){var input=event.target;if(!input.matches('input[inputmode="numeric"],input[type="number"],.sal-inp,#e-sal,#finance-amount'))return;var value=englishDigits(input.value);if(value!==input.value){var pos=input.selectionStart;input.value=value;if(pos!=null)input.setSelectionRange(pos,pos);}});
document.addEventListener('DOMContentLoaded',async function(){
  el('staff-report-dept').onchange=buildReport;
  el('eye-btn').onclick=function(){var input=el('l-pass');input.type=input.type==='password'?'text':'password';this.textContent=input.type==='password'?'👁️':'🙈';};
  el('login-btn').onclick=doLogin;el('btn-out').onclick=doLogout;
  el('l-pass').onkeydown=function(e){if(e.key==='Enter')doLogin();};el('l-user').onkeydown=function(e){if(e.key==='Enter')el('l-pass').focus();};
  ['l-user','l-pass'].forEach(function(id){el(id).oninput=function(){el('l-err').style.display='none';};});
  el('btn-newvio').onclick=openVioModal;el('save-vio').onclick=saveVio;el('vio-type').onchange=toggleVioX;
  el('btn-newmonth').onclick=function(){if(allowed('canEditDelay'))el('month-modal').classList.add('show');};el('save-month').onclick=saveMonth;el('save-adddept').onclick=saveAddDept;el('save-delay').onclick=saveDelay;el('save-edit').onclick=saveEdit;
  [['vio','vio'],['month','month'],['adddept','adddept'],['delay','delay']].forEach(function(pair){['close-','cancel-'].forEach(function(pre){el(pre+pair[0]).onclick=function(){el(pair[1]+'-modal').classList.remove('show');};});});
  el('cancel-edit').onclick=function(){el('edit-modal').classList.remove('show');};
  el('login-btn').disabled=true;
  try{
    if(typeof firebase==='undefined'||!firebase.auth)throw {userMessage:'تعذّر تحميل خدمة تسجيل الدخول. تحقق من الاتصال وأعد تحميل الصفحة.'};
    if(!firebase.apps.length)firebase.initializeApp(FB);
    DB=firebase.database();AUTH=firebase.auth();FUNCS={httpsCallable:function(name){return async function(data){return {data:await SPARK.call(name,data)};};}};
    await AUTH.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    AUTH.onAuthStateChanged(startSession,function(e){loginError(errorMessage(e));});
    el('login-btn').disabled=false;
  }catch(e){loginError(errorMessage(e));el('btn-t').textContent='تعذّر تحميل النظام';}
});
