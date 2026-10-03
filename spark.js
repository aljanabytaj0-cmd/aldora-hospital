'use strict';
// Spark adapter: all authority comes from the deployed Database Rules.
var SPARK=(function(){
  const ROOT='hr_spark',P=HR_CORE.P,F=HR_CORE.F,W=HR_CORE.W;
  const clone=v=>JSON.parse(JSON.stringify(v));
  const marker=()=>firebase.database.ServerValue.TIMESTAMP;
  async function read(path){return (await DB.ref(path).once('value')).val();}
  function requireSession(){if(!SESSION_READY||!CURRENT_UID)throw {userMessage:'سجل الدخول أولاً'};}
  function actor(){return {uid:CURRENT_UID,profile:PROFILE,perms:developer()?P.defaults('developer'):P.normalizePerms(USER_PERMS)};}
  function canonical(v){if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
  async function hash(v){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(v))));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
  function diff(old,next,path='',out={}){
    if(JSON.stringify(old)===JSON.stringify(next))return out;
    if(next===undefined){out[path]=null;return out;}
    if(!next||typeof next!=='object'||Array.isArray(next)||Object.hasOwn(next,'.sv')){out[path]=next;return out;}
    if(!old||typeof old!=='object'||Array.isArray(old))old={};
    for(const k of new Set([...Object.keys(old),...Object.keys(next)]))diff(old[k],next[k],path?path+'/'+k:k,out);return out;
  }
  async function mutate(input){
    requireSession();const session=SESSION,a=actor(),d={...input},id=W.key(d.mutationId||crypto.randomUUID());delete d.mutationId;
    const fingerprint=await hash(d),receiptPath=ROOT+'/mutation_receipts/'+a.uid+'/'+id;
    const previous=await read(receiptPath);
    if(previous){if(previous.fingerprint!==fingerprint)throw {userMessage:'معرف المحاولة مستخدم لبيانات مختلفة'};return previous.result;}
    const hr={};const jobs=[];
    async function get(parts,path){const value=await read(path);if(value!==null){let at=hr;parts.slice(0,-1).forEach(k=>at=at[k]||={});at[parts.at(-1)]=value;}}
    const op=d.op,isDept=P.DEPT_IDS.includes(d.dept);
    if(isDept){jobs.push(get(['staff',d.dept],ROOT+'/staff/'+d.dept));
      if(a.perms.canViewSal&&['staffEdit','salarySet'].includes(op)){jobs.push(get(['salaries',d.dept],ROOT+'/salaries/'+d.dept),get(['salary_history',d.dept],ROOT+'/salary_history/'+d.dept),get(['hire_request_salaries',d.dept],ROOT+'/hire_request_salaries/'+d.dept));}
      if(['hireApprove','hireReject'].includes(op))jobs.push(get(['hire_requests',d.dept],ROOT+'/hire_requests/'+d.dept));
      if(['vioDelete','vioFinanceLink'].includes(op))jobs.push(get(['violations',d.dept],ROOT+'/violations/'+d.dept));
      if(op==='adjustmentCancel')jobs.push(get(['adjustments',d.dept],ROOT+'/adjustments/'+d.dept));
    }
    if(op==='monthDelete'||op.startsWith('delay')){jobs.push(get(['months',d.month],ROOT+'/months/'+d.month));if(op==='monthDelete')jobs.push(get(['delays',d.month],ROOT+'/delays/'+d.month));else jobs.push(get(['delays',d.month,d.dept],ROOT+'/delays/'+d.month+'/'+d.dept));}
    if(op==='docSave'||op==='docClear'){const doc=d.dept.replace(/\s+/g,'_');jobs.push(get(['doc_schedule',doc],ROOT+'/doc_schedule/'+doc));}
    await Promise.all(jobs);
    if(session!==SESSION)throw {userMessage:'تغيّرت الجلسة'};
    // A proposal remains private; approval does not need salary access or a copy.
    // Approved proposals provide the initial base until a salary is explicitly set.
    if(['staffEdit','salarySet'].includes(op))for(const [key,e]of Object.entries(hr.staff?.[d.dept]||{}))if(e.requestKey&&hr.salaries?.[d.dept]?.[key]==null&&hr.hire_request_salaries?.[d.dept]?.[key]!=null){(hr.salaries||={})[d.dept]||={};hr.salaries[d.dept][key]=hr.hire_request_salaries[d.dept][key];}
    const before=clone(hr),result=W.apply(hr,a,d,Date.now(),id);
    const recordMaps=['staff','hire_requests','violations','adjustments','monthly_salary'];
    function stamp(record,old={}){record.updatedBy=a.uid;record.updatedAt=marker();record.mutationId=id;for(const k of ['ts','createdAt','reviewedAt','approvedAt','terminatedAt','cancelledAt','financialUpdatedAt'])if(typeof record[k]==='number'&&record[k]!==old[k])record[k]=marker();}
    for(const root of recordMaps)for(const [dept,items]of Object.entries(hr[root]||{}))for(const [key,record]of Object.entries(items)){
      if(root==='monthly_salary'){for(const [month,value]of Object.entries(record))if(JSON.stringify(value)!==JSON.stringify(before[root]?.[dept]?.[key]?.[month]))stamp(value,before[root]?.[dept]?.[key]?.[month]);}
      else if(JSON.stringify(record)!==JSON.stringify(before[root]?.[dept]?.[key]))stamp(record,before[root]?.[dept]?.[key]);
    }
    for(const [key,r]of Object.entries(hr.months||{}))if(JSON.stringify(r)!==JSON.stringify(before.months?.[key]))stamp(r,before.months?.[key]);
    for(const [month,depts]of Object.entries(hr.delays||{}))for(const [dept,r]of Object.entries(depts)){
      if(!before.delays?.[month]?.[dept]){r.createdBy=a.uid;r.createdAt=marker();}
      for(const [key,e]of Object.entries(r.employees||{}))if(JSON.stringify(e)!==JSON.stringify(before.delays?.[month]?.[dept]?.employees?.[key]))stamp(e,before.delays?.[month]?.[dept]?.employees?.[key]);
    }
    for(const dept of Object.keys(hr.notifications||{}))for(const event of Object.values(hr.notifications[dept])){event.actorUid=a.uid;event.createdAt=marker();}
    const changes=diff(before,hr);const updates={};for(const [path,value]of Object.entries(changes))updates[ROOT+'/'+path]=value;
    updates[receiptPath]={fingerprint,result,op,createdAt:marker()};
    try{await DB.ref().update(updates);}catch(e){const saved=await read(receiptPath);if(saved&&saved.fingerprint===fingerprint)return saved.result;throw e;}
    return result;
  }
  async function report(data){
    requireSession();if(!allowed('canViewFinance')||!allowed('canViewSal'))throw {userMessage:'ليس لديك صلاحية المالية'};
    if(!F.month(data.month))throw {userMessage:'حدد الشهر'};const hr={};const a=actor(),ids=P.DEPT_IDS.filter(id=>P.canDept(a.perms,id));
    await Promise.all(ids.flatMap(dept=>['staff','salaries','hire_request_salaries','salary_history','monthly_salary','adjustments','violations'].map(async root=>{const value=await read(ROOT+'/'+root+'/'+dept);if(value!==null)(hr[root]||={})[dept]=value;})));
    const months=await read(ROOT+'/months')||{};
    await Promise.all(Object.keys(months).flatMap(m=>ids.map(async dept=>{const value=await read(ROOT+'/delays/'+m+'/'+dept);if(value!==null)((hr.delays||={})[m]||={})[dept]=value;})));
    return F.report(hr,a.perms,data.month);
  }
  async function notifications(data){requireSession();if(!allowed('canViewNotifications'))throw {userMessage:'ليس لديك صلاحية الإشعارات'};if(!Array.isArray(data.items)||data.items.length>500)throw {userMessage:'قائمة غير صالحة'};const updates={};for(const i of data.items){if(!deptAllowed(i.dept))throw {userMessage:'القسم غير مسموح'};updates[ROOT+'/notification_reads/'+CURRENT_UID+'/'+W.key(i.key)]={dept:i.dept,readAt:marker()};}if(data.items.length)await DB.ref().update(updates);return {ok:true};}
  async function users(d){
    requireSession();const a=actor();if(!P.canManage(a.profile,a.perms))throw {userMessage:'ليس لديك صلاحية إدارة الحسابات'};
    if(d.action==='list'){const [profiles,perms]=await Promise.all([read('user_profiles'),read('user_perms')]);return {users:Object.entries(profiles||{}).filter(([uid,p])=>P.canManageTarget(a.profile,a.perms,p,P.normalizePerms(perms?.[uid]||{}))).map(([uid,p])=>({uid,...p,perms:P.normalizePerms(perms?.[uid]||{})}))};}
    if(d.action==='create'){
      const name=P.username(d.username),role=['admin','finance'].includes(d.role)?d.role:'viewer';if(name==='dev')throw {userMessage:'حساب المطور يُنشأ بأداة الإعداد'};
      if(!developer()&&(role!=='viewer'||d.salary===true))throw {userMessage:'إنشاء الحسابات المرتفعة متاح للمطور فقط'};
      if(typeof d.password!=='string'||d.password.length<12||d.password.length>128)throw {userMessage:'كلمة المرور يجب أن تكون 12–128 حرفًا'};
      const app=firebase.initializeApp(FB,'hr-create-'+crypto.randomUUID()),secondary=app.auth();let user=null,saved=false;
      try{user=(await secondary.createUserWithEmailAndPassword(P.email(name),d.password)).user;const perms=P.defaults(role);perms.canViewSal=role==='finance'||(developer()&&d.salary===true);if(!developer())for(const f of P.FLAGS)perms[f]=perms[f]&&a.perms[f];
        await DB.ref().update({['user_profiles/'+user.uid]:{username:name,role,label:String(d.label||'').trim().slice(0,150)||(role==='finance'?'💰 المدير المالي':name),enabled:true,sessionAfter:0,createdAt:marker()},['user_perms/'+user.uid]:P.normalizePerms(perms),['username_index/'+name]:user.uid});saved=true;return {uid:user.uid};
      }finally{if(user&&!saved)try{await user.delete();}catch(e){/* orphan has no profile and no data access */}await secondary.signOut();await app.delete();}
    }
    const uid=W.key(d.uid),profile=await read('user_profiles/'+uid),perms=P.normalizePerms(await read('user_perms/'+uid)||{});if(!profile||!P.canManageTarget(a.profile,a.perms,profile,perms))throw {userMessage:'لا يمكنك إدارة هذا الحساب'};
    if(d.action==='permissions'){if(!developer()||profile.role==='developer')throw {userMessage:'تعديل الصلاحيات متاح للمطور فقط'};await DB.ref('user_perms/'+uid).set(P.normalizePerms(d.perms));return {ok:true};}
    if(d.action!=='update')throw {userMessage:'عملية غير معروفة'};
    if(d.password)throw {userMessage:'تغيير كلمة مرور حساب آخر يتم من Firebase Console أو أداة الإعداد المحلية في النسخة المجانية'};
    const role=profile.role==='developer'?'developer':(['admin','finance'].includes(d.role)?d.role:'viewer');if(!developer()&&(role!==profile.role||(d.salary===true)!==perms.canViewSal))throw {userMessage:'تغيير الدور والرواتب متاح للمطور فقط'};
    if(profile.role==='developer'&&d.enabled===false)throw {userMessage:'لا يمكن تعطيل المطور من هذه الصفحة'};
    const next={...profile,role,label:String(d.label||profile.label||'').trim().slice(0,150),enabled:d.enabled!==false,updatedAt:marker()};if(!next.enabled||role!==profile.role)next.sessionAfter=marker();
    let nextPerms=role==='finance'&&profile.role!==role?P.defaults('finance'):{...perms};if(developer()&&role!=='developer')nextPerms.canViewSal=role==='finance'||d.salary===true;
    const updates={['user_profiles/'+uid]:next};if(developer()&&role!=='developer')updates['user_perms/'+uid]=P.normalizePerms(nextPerms);await DB.ref().update(updates);return {ok:true};
  }
  async function call(name,data){try{if(name==='hrMutate')return await mutate(data);if(name==='hrFinance')return await report(data);if(name==='hrNotifications')return await notifications(data);if(name==='hrUsers')return await users(data);throw {userMessage:'عملية غير معروفة'};}catch(e){if(e.hrDomain)throw {code:'functions/'+e.code,message:e.message};throw e;}}
  return {call,diff};
})();
