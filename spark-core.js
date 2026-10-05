'use strict';
// Generated from the same tested calculation and workflow modules.
(function(global){const modules={};function define(name,fn){const module={exports:{}};fn(module,module.exports,n=>modules[n]);modules[name]=module.exports;}
modules["./departments.json"]=[
  {
    "id": "top_chairman",
    "icon": "👩‍💼",
    "title": "رئيس مجلس الإدارة",
    "cls": "nto",
    "color": "#EEF3FF",
    "tc": "#1B4FD8"
  },
  {
    "id": "top_deputy",
    "icon": "🤝",
    "title": "معاون رئيس مجلس الإدارة",
    "cls": "nde",
    "color": "#F0EAFF",
    "tc": "#6C3FC5"
  },
  {
    "id": "top_tech",
    "icon": "🩺",
    "title": "المدير الفني",
    "cls": "ntc",
    "color": "#E6F7F0",
    "tc": "#0A9258"
  },
  {
    "id": "top_admin",
    "icon": "📋",
    "title": "المدير الإداري",
    "cls": "nad",
    "color": "#FFF4E0",
    "tc": "#D4800A"
  },
  {
    "id": "dept_nursing",
    "icon": "👩‍⚕️",
    "title": "صالة الولادة",
    "color": "#EEF3FF",
    "tc": "#1B4FD8"
  },
  {
    "id": "dept_icu",
    "icon": "💉",
    "title": "قسم العناية المركزة",
    "color": "#FFEDEF",
    "tc": "#E63946"
  },
  {
    "id": "dept_emergency",
    "icon": "🚨",
    "title": "قسم الطوارئ",
    "color": "#FFEDEF",
    "tc": "#C0392B"
  },
  {
    "id": "dept_surgery",
    "icon": "🔪",
    "title": "قسم العمليات",
    "color": "#EEF3FF",
    "tc": "#1340B0"
  },
  {
    "id": "dept_anesthesia",
    "icon": "😴",
    "title": "قسم التخدير",
    "color": "#F0EAFF",
    "tc": "#6C3FC5"
  },
  {
    "id": "dept_doctors",
    "icon": "👨‍⚕️",
    "title": "الأطباء المقيمون",
    "color": "#EEF3FF",
    "tc": "#0369A1"
  },
  {
    "id": "dept_radiology",
    "icon": "🩻",
    "title": "قسم الأشعة",
    "color": "#F0EAFF",
    "tc": "#7C3AED"
  },
  {
    "id": "dept_lab",
    "icon": "🔬",
    "title": "قسم المختبر",
    "color": "#E6F7F0",
    "tc": "#0A9258"
  },
  {
    "id": "dept_pharmacy",
    "icon": "💊",
    "title": "قسم الصيدلية",
    "color": "#E6F7F0",
    "tc": "#0A9258"
  },
  {
    "id": "dept_nicu",
    "icon": "🍼",
    "title": "قسم الخدج",
    "color": "#FFF4E0",
    "tc": "#D4800A"
  },
  {
    "id": "dept_floornursing",
    "icon": "🏥",
    "title": "تمريض الطابق",
    "color": "#EEF3FF",
    "tc": "#1B4FD8"
  },
  {
    "id": "dept_physio",
    "icon": "🦴",
    "title": "قسم العلاج الطبيعي",
    "color": "#F0EAFF",
    "tc": "#6C3FC5"
  },
  {
    "id": "dept_dental",
    "icon": "🦷",
    "title": "قسم الأسنان",
    "color": "#FFEDEF",
    "tc": "#E63946"
  },
  {
    "id": "dept_accounts",
    "icon": "💰",
    "title": "قسم الحسابات",
    "color": "#FFF4E0",
    "tc": "#D4800A"
  },
  {
    "id": "dept_it",
    "icon": "💻",
    "title": "قسم IT",
    "color": "#EEF3FF",
    "tc": "#1B4FD8"
  },
  {
    "id": "dept_maintenance",
    "icon": "🔧",
    "title": "قسم الصيانة",
    "color": "#FFEDEF",
    "tc": "#C0392B"
  },
  {
    "id": "dept_reception",
    "icon": "🗂️",
    "title": "قسم الاستعلامات",
    "color": "#E6F7F0",
    "tc": "#0A9258"
  },
  {
    "id": "dept_security",
    "icon": "🛡️",
    "title": "قسم الأمنية",
    "color": "#E6F7F0",
    "tc": "#166534"
  },
  {
    "id": "dept_cafeteria",
    "icon": "🍽️",
    "title": "الكافتيريا",
    "color": "#FFF4E0",
    "tc": "#D4800A"
  },
  {
    "id": "dept_services",
    "icon": "🧹",
    "title": "موظفو الخدمات",
    "color": "#F0EAFF",
    "tc": "#6C3FC5"
  }
];
define("./policy",function(module,exports,require){
'use strict';
const departments = require('./departments.json');
const DEPT_IDS = departments.map(d => d.id);
const TITLE_IDS = Object.fromEntries(departments.map(d => [d.title, d.id]));
TITLE_IDS['قسم التمريض'] = 'dept_nursing';
const DOCTORS = ['مسالك','مفاصل وكسور','نسائية','أطفال','أنف أذن حنجرة','ايكو وقلبية','باطنية','جملة عصبية','جراحة عامة'];
const DAYS = ['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];
const ROLES = ['viewer','admin','finance','department_head','chairman','deputy_chairman'];
const ROLE_LABELS = {viewer:'مشاهدة فقط',admin:'إداري',finance:'مدير مالي',department_head:'مسؤول قسم',chairman:'رئيس مجلس الإدارة',deputy_chairman:'معاون رئيس مجلس الإدارة',developer:'المطور'};
function accountRole(value) { if (!ROLES.includes(value)) throw Object.assign(new Error('نوع الحساب غير صحيح'),{userMessage:'نوع الحساب غير صحيح'}); return value; }
function accountPerms(role, input) {
  const p=normalizePerms(input);
  if (role==='department_head' && (p.allDepts || !Object.keys(p.allowedDepts).length)) throw Object.assign(new Error('اختر قسمًا واحدًا أو أكثر لمسؤول القسم؛ لا تستخدم جميع الأقسام.'),{userMessage:'اختر قسمًا واحدًا أو أكثر لمسؤول القسم؛ لا تستخدم جميع الأقسام.'});
  return p;
}
const BOARD_IDS = ['top_chairman','top_deputy'];
function isBoard(id) { return BOARD_IDS.includes(id); }
const FLAGS = ['canViewVio','canViewDelay','canViewReports','canEditStaff','canViewSal','canManageUsers','canViewDoctors','canEditVio','canApproveVio','canEditDelay','canEditDoctors','canApproveHires','canTerminateStaff','canApproveTerminations','canViewNotifications','canViewFinance','canManageFinance'];
function username(value) {
  const name = String(value || '').trim().toLowerCase();
  if (!/^[a-z][a-z0-9_-]{2,31}$/.test(name)) throw Object.assign(new Error('رمز المستخدم يجب أن يكون 3–32 حرفًا إنجليزيًا أو رقمًا أو _ أو -، ويبدأ بحرف، دون مسافات.'),{userMessage:'رمز المستخدم يجب أن يكون 3–32 حرفًا إنجليزيًا أو رقمًا أو _ أو -، ويبدأ بحرف، دون مسافات.'});
  return name;
}
function email(name) { return username(name) + '@users.aldora.invalid'; }
function defaults(role, name = '') {
  const full = role === 'admin' || role === 'developer';
  const p = Object.fromEntries(FLAGS.map(f => [f, full]));
  p.canManageUsers = role === 'developer';
  p.allDepts = full;
  p.allowedDepts = {};
  p.canViewNotifications = true;
  if (role === 'finance') {
    for (const f of ['canViewFinance','canManageFinance','canViewSal','canViewVio','canViewDelay','canViewReports']) p[f] = true;
    p.allDepts = true;
  }
  if (!full && name === 'dora1') { p.canViewDoctors = true; p.canEditDoctors = true; }
  return p;
}
function normalizePerms(input = {}) {
  const p = Object.fromEntries(FLAGS.map(f => [f, input[f] === true]));
  p.allDepts = input.allDepts === true;
  p.allowedDepts = {};
  if (!p.allDepts) {
    for (const id of DEPT_IDS) if (input.allowedDepts && input.allowedDepts[id] === true) p.allowedDepts[id] = true;
  }
  // Editing a category requires viewing it too.
  p.canEditVio = p.canEditVio && p.canViewVio;
  p.canEditDelay = p.canEditDelay && p.canViewDelay;
  p.canEditDoctors = p.canEditDoctors && p.canViewDoctors;
  p.canViewFinance = p.canViewFinance && p.canViewSal;
  p.canManageFinance = p.canManageFinance && p.canViewFinance;
  return p;
}
function canDept(p, id) { return DEPT_IDS.includes(id) && (p.allDepts === true || p.allowedDepts?.[id] === true); }
function canManage(profile, perms) { return profile.role === 'developer' || perms.canManageUsers === true; }
function canManageTarget(actorProfile, actorPerms, targetProfile, targetPerms) {
  if (actorProfile.role === 'developer') return true;
  if (!canManage(actorProfile,actorPerms) || targetProfile.role !== 'viewer') return false;
  // Resetting a more privileged user's password would let a manager impersonate
  // that user. Managers can manage only viewers within their own access scope.
  if (FLAGS.some(f => targetPerms[f] === true && actorPerms[f] !== true)) return false;
  if (targetPerms.allDepts && !actorPerms.allDepts) return false;
  return DEPT_IDS.every(id => !canDept(targetPerms,id) || canDept(actorPerms,id));
}
function migrateLegacy(old) {
  const output = { staff:{}, salaries:{}, violations:{}, months:{}, delays:{}, doc_schedule:old.doc_schedule || {} };
  const warnings = [];
  for (const [id, employees] of Object.entries(old.hospital || {})) {
    if (!DEPT_IDS.includes(id)) { warnings.push('قسم غير معروف في hospital: ' + id); continue; }
    output.staff[id] = {}; output.salaries[id] = {};
    for (const [key, e] of Object.entries(employees || {})) {
      output.staff[id][key] = {name:String(e.name || ''),role:String(e.role || ''),shift:String(e.shift || '')};
      output.salaries[id][key] = String(e.salary ?? '');
    }
  }
  for (const [key, v] of Object.entries(old.violations || {})) {
    const id = TITLE_IDS[v.dept];
    if (!id) { warnings.push('قسم غير معروف للعقوبة: ' + key + ' / ' + v.dept); continue; }
    (output.violations[id] ||= {})[key] = v;
  }
  for (const [mk, m] of Object.entries(old.delay_months || {})) {
    output.months[mk] = {name:String(m.name || ''),ts:m.ts || 0};
    output.delays[mk] = {};
    for (const [dk, d] of Object.entries(m.depts || {})) {
      const id = TITLE_IDS[d.name];
      if (!id) { warnings.push('قسم غير معروف للتأخير: ' + mk + '/' + dk); continue; }
      const dest = output.delays[mk][id] ||= {name:departments.find(x => x.id === id).title,ts:d.ts || 0,employees:{}};
      for (const [ek, e] of Object.entries(d.employees || {})) {
        // Keep duplicate employee keys from duplicate department entries.
        const targetKey = Object.hasOwn(dest.employees, ek) ? dk + '_' + ek : ek;
        dest.employees[targetKey] = e;
      }
    }
  }
  return {output,warnings};
}
function legacyPerms(saved, role, name) {
  const p = defaults(role,name);
  if (!saved) return p;
  for (const f of FLAGS) if (typeof saved[f] === 'boolean') p[f] = saved[f];
  if (typeof saved.allDepts === 'boolean') p.allDepts = saved.allDepts;
  p.allowedDepts = {};
  for (const title of Array.isArray(saved.allowedDepts) ? saved.allowedDepts : []) {
    if (TITLE_IDS[title]) p.allowedDepts[TITLE_IDS[title]] = true;
  }
  return normalizePerms(p);
}
module.exports = {departments,DEPT_IDS,TITLE_IDS,DOCTORS,DAYS,ROLES,ROLE_LABELS,accountRole,accountPerms,BOARD_IDS,isBoard,FLAGS,username,email,defaults,normalizePerms,canDept,canManage,canManageTarget,migrateLegacy,legacyPerms};

});
define("./finance",function(module,exports,require){
'use strict';
const P = require('./policy');
function digits(v) { return String(v??'').replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))); }
function money(v) {
  if (typeof v==='number') return Number.isSafeInteger(v)&&v>=0&&v<=1e12?v:null;
  const s=digits(v).trim().replace(/\s*(د\.?\s*ع\.?|دينار(?: عراقي)?|IQD)\s*$/i,'').trim();
  if (!/^(\d+|\d{1,3}(?:[,٬]\d{3})+)$/.test(s)) return null;
  const n=Number(s.replace(/[,٬]/g,''));return Number.isSafeInteger(n)&&n<=1e12?n:null;
}
function month(v) { return typeof v==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(v)&&v>='2000-01'&&v<='2100-12'; }
function normName(v) { return String(v||'').trim().replace(/\s+/g,' '); }
function resolveEmployee(hr,dept,record) {
  const employees=hr.staff?.[dept]||{};
  if (record.employeeKey&&employees[record.employeeKey]) return record.employeeKey;
  const target=normName(record.empName||record.name),matches=Object.entries(employees).filter(([,e])=>normName(e.name)===target);
  return matches.length===1?matches[0][0]:null;
}
function baseline(hr,dept,key,m) {
  const history=hr.salary_history?.[dept]?.[key]||{};
  const keys=Object.keys(history).filter(x=>x<=m).sort();
  if(keys.length)return money(history[keys.at(-1)]);
  if(Object.keys(history).length)return null;
  const value=hr.salaries?.[dept]?.[key];
  if(value!==undefined&&value!==null)return money(value);
  return money(hr.hire_request_salaries?.[dept]?.[hr.staff?.[dept]?.[key]?.requestKey||key]);
}
function report(hr,perms,m) {
  if(!month(m))throw new Error('الشهر غير صالح');
  const start=m+'-01',lastDay=new Date(Date.UTC(Number(m.slice(0,4)),Number(m.slice(5,7)),0)).getUTCDate(),end=m+'-'+String(lastDay).padStart(2,'0');
  const rows=[],unlinked=[],reviewPenalties=[];
  for(const dept of P.DEPT_IDS.filter(id=>P.canDept(perms,id))){
    if(P.isBoard(dept))continue;
    const vios=Object.entries(hr.violations?.[dept]||{}).filter(([,v])=>v.status!=='cancelled'&&(v.payrollMonth||String(v.date||'').slice(0,7))===m);
    const delays=[];
    for(const [mk,depts] of Object.entries(hr.delays||{}))for(const [k,r]of Object.entries(depts[dept]?.employees||{}))if(r.status!=='cancelled'&&(r.payrollMonth||String(r.date||'').slice(0,7))===m)delays.push({...r,recordKey:k,monthKey:mk});
    for(const [key,v]of vios){const employeeKey=resolveEmployee(hr,dept,v);if(!employeeKey)unlinked.push({kind:'violation',dept,key,name:v.empName||'',type:v.type,reason:v.reason,date:v.date,deduct:v.deduct||''});
      if(v.type!=='praise'&&v.deductionConfirmed!==true&&(v.type==='deduct'||v.deductionAmount>0))reviewPenalties.push({dept,key,employeeKey,name:v.empName||'',type:v.type,date:v.date,reason:v.reason,deduct:v.deduct||''});}
    for(const r of delays)if(!resolveEmployee(hr,dept,r))unlinked.push({kind:'delay',dept,key:r.recordKey,monthKey:r.monthKey,name:r.name||'',date:r.date,mins:r.mins,deductionAmount:r.deductionAmount,deductionConfirmed:r.deductionConfirmed});
    for(const [key,e]of Object.entries(hr.staff?.[dept]||{})){
      if(e.hireDate&&e.hireDate>end)continue;if(e.terminationDate&&e.terminationDate<start)continue;
      const penalties=vios.filter(([,v])=>resolveEmployee(hr,dept,v)===key).map(([vk,v])=>({...v,recordKey:vk}));
      const fingerprint=delays.filter(r=>resolveEmployee(hr,dept,r)===key);
      const adjustments=Object.entries(hr.adjustments?.[dept]||{}).filter(([,v])=>v.employeeKey===key&&v.month===m&&v.status!=='cancelled').map(([ak,v])=>({...v,recordKey:ak}));
      const salary=baseline(hr,dept,key,m),override=hr.monthly_salary?.[dept]?.[key]?.[m];
      const base=override?money(override.amount):salary;
      const partial=(!override)&&((e.hireDate&&e.hireDate>start&&e.hireDate<=end)||(e.terminationDate&&e.terminationDate>=start&&e.terminationDate<end));
      const penaltyAmount=penalties.reduce((n,v)=>n+(v.deductionConfirmed===true?money(v.deductionAmount)||0:0),0);
      const fingerprintAmount=fingerprint.reduce((n,v)=>n+(v.deductionConfirmed===true?money(v.deductionAmount)||0:0),0);
      const manualAmount=adjustments.reduce((n,v)=>n+(money(v.amount)||0),0),deductions=penaltyAmount+fingerprintAmount+manualAmount;
      const pendingPenalty=penalties.some(v=>v.type!=='praise'&&v.deductionConfirmed!==true&&(v.type==='deduct'||v.deductionAmount>0));
      const issues=[];if(base===null)issues.push('الراتب غير محدد رقمياً');if(partial)issues.push('حدد راتب هذا الشهر بسبب بدء أو انتهاء الخدمة خلال الشهر');if(pendingPenalty)issues.push('خصم قديم يحتاج اعتماد المبلغ');if(base!==null&&deductions>base)issues.push('الخصومات تتجاوز راتب الشهر');
      rows.push({dept,employeeKey:key,name:e.name,role:e.role||'',status:e.status||'active',hireDate:e.hireDate||'',terminationDate:e.terminationDate||'',salary,baseAmount:base,penaltyAmount,fingerprintAmount,manualAmount,deductions,netAmount:issues.length?null:base-deductions,issues,penalties,adjustments,fingerprint,delayMinutes:fingerprint.reduce((n,r)=>n+(Number.isInteger(r.minutes)?r.minutes:0),0),unknownDelayDurations:fingerprint.filter(r=>!Number.isInteger(r.minutes)).length,monthlySalarySet:!!override});
    }
  }
  const totals=rows.reduce((s,r)=>{s.baseAmount+=r.baseAmount||0;s.penaltyAmount+=r.penaltyAmount;s.fingerprintAmount+=r.fingerprintAmount;s.manualAmount+=r.manualAmount;s.deductions+=r.deductions;if(r.netAmount!==null)s.netAmount+=r.netAmount;else s.needsReview++;return s;},{baseAmount:0,penaltyAmount:0,fingerprintAmount:0,manualAmount:0,deductions:0,netAmount:0,needsReview:0});
  return {month:m,rows,totals,unlinked,reviewPenalties,generatedAt:Date.now()};
}
function upgrade(hr){
  const next=structuredClone(hr);const notes=[];next.salary_history||={};
  for(const dept of P.DEPT_IDS)for(const [key,e]of Object.entries(next.staff?.[dept]||{})){
    e.status||='active';const amount=money(next.salaries?.[dept]?.[key]);
    if(amount!==null&&!(next.salary_history[dept]?.[key])){(next.salary_history[dept]||={})[key]={'0000-00':amount};}
    if(amount===null)notes.push('راتب يحتاج مراجعة: '+dept+'/'+key+' / '+e.name);
  }
  for(const dept of P.DEPT_IDS)for(const [key,v]of Object.entries(next.violations?.[dept]||{})){
    const employeeKey=resolveEmployee(next,dept,v);if(employeeKey)v.employeeKey=employeeKey;
    if(v.deductionConfirmed!==true&&v.type==='deduct')v.requiresFinanceReview=true;
    if(!employeeKey)notes.push('عقوبة غير مرتبطة: '+dept+'/'+key);
  }
  for(const [mk,depts]of Object.entries(next.delays||{}))for(const dept of P.DEPT_IDS)for(const [key,r]of Object.entries(depts[dept]?.employees||{})){
    const employeeKey=resolveEmployee(next,dept,r);if(employeeKey)r.employeeKey=employeeKey;
    const value=digits(r.mins).trim(),match=value.match(/^(\d+)\s*(?:دقيقة|دقائق)?$/);if(match&&Number(match[1])<=1440)r.minutes=Number(match[1]);
    if(!employeeKey)notes.push('بصمة غير مرتبطة: '+mk+'/'+dept+'/'+key);
  }
  return {output:next,notes};
}
module.exports={digits,money,month,normName,resolveEmployee,baseline,report,upgrade};

});
define("./workflow",function(module,exports,require){
'use strict';
const P=require('./policy'),F=require('./finance');
class DomainError extends Error { constructor(code,message){super(message);this.code=code;this.hrDomain=true;} }
function fail(code,message){throw new DomainError(code,message);}
function str(v,label,max=150,required=false){v=typeof v==='string'?v.trim():'';if((required&&!v)||v.length>max)fail('invalid-argument','تحقق من '+label);return v;}
function key(v){if(typeof v!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(v))fail('invalid-argument','معرّف غير صالح');return v;}
function validDate(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail('invalid-argument','تاريخ غير صالح');return v;}
function month(v){if(!F.month(v))fail('invalid-argument','حدد الشهر بصيغة YYYY-MM');return v;}
function amount(v,positive=false){const n=F.money(v);if(n===null||(positive&&n===0))fail('invalid-argument','أدخل مبلغاً صحيحاً بالدينار العراقي'+(positive?' أكبر من صفر':''));return n;}
function flag(a,f){if(a.perms[f]!==true)fail('permission-denied','ليس لديك صلاحية لهذه العملية');}
function dept(a,id){if(!P.canDept(a.perms,id))fail('permission-denied','ليس لديك صلاحية لهذا القسم');return P.departments.find(d=>d.id===id);}
function put(root,parts,value){let at=root;parts.slice(0,-1).forEach(k=>at=at[k]||={});if(value===null)delete at[parts.at(-1)];else at[parts.at(-1)]=value;}
function employee(hr,id,k){k=key(k);const e=hr.staff?.[id]?.[k];if(!e)fail('not-found','الموظف غير موجود أو طلب تعيينه لم يُعتمد');return e;}
function active(e){if(e.status==='terminated')fail('failed-precondition','خدمات الموظف منتهية');}
function employed(e,date){if((e.hireDate&&date<e.hireDate)||(e.terminationDate&&date>e.terminationDate))fail('invalid-argument','التاريخ خارج فترة خدمة الموظف');}
function payrollEmployment(e,m){
  const last=new Date(Date.UTC(Number(m.slice(0,4)),Number(m.slice(5,7)),0)).getUTCDate(),end=m+'-'+String(last).padStart(2,'0');
  if((e.hireDate&&e.hireDate>end)||(e.terminationDate&&e.terminationDate<m+'-01'))fail('invalid-argument','شهر الخصم خارج فترة خدمة الموظف');
}
function salary(hr,id,k,value,m){
  const previous=F.money(hr.salaries?.[id]?.[k]);
  if(!(hr.salary_history?.[id]?.[k])&&previous!==null)put(hr,['salary_history',id,k,'0000-00'],previous);
  put(hr,['salary_history',id,k,m],value);
  const history=hr.salary_history[id][k],latest=Object.keys(history).sort().at(-1);
  put(hr,['salaries',id,k],history[latest]);
}
function apply(hr,a,d,now,id){
  const op=d.op,currentDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now)),currentMonth=currentDate.slice(0,7);
  const actorName=a.profile.fullName||a.profile.username;
  const event=(department,type,name,extra={},eventKey=id)=>put(hr,['notifications',department,eventKey],{type,name,actor:a.profile.username,actorName,createdAt:now,...extra});
  const targetDept=()=>dept(a,d.dept);
  const staffDept=()=>{const c=targetDept();if(P.isBoard(d.dept))fail('failed-precondition','هذا منصب إداري خارج الموظفين والمالية وإنهاء الخدمات');return c;};
  const result={ok:true};
  if(op==='staffAdd'||op==='hireSubmit'){
    flag(a,'canEditStaff');targetDept();const hireDate=validDate(d.hireDate||currentDate);
    const record={name:str(d.name,'الاسم',150,true),role:str(d.role,'المسمى الوظيفي'),shift:str(d.shift,'الدوام'),hireDate,status:'pending',submittedBy:a.uid,submittedName:actorName,createdAt:now};
    put(hr,['hire_requests',d.dept,id],record);
    if(P.isBoard(d.dept))record.shift='';
    if(!P.isBoard(d.dept)&&Object.hasOwn(d,'salary')&&String(d.salary).trim()!==''){flag(a,'canViewSal');put(hr,['hire_request_salaries',d.dept,id],amount(d.salary));}
    event(d.dept,'hire_requested',record.name,{requestKey:id});return {...result,key:id,status:'pending'};
  }
  if(op==='hireApprove'||op==='hireReject'){
    flag(a,'canApproveHires');targetDept();const k=key(d.key),r=hr.hire_requests?.[d.dept]?.[k];
    if(!r)fail('not-found','طلب التعيين غير موجود');if(r.status!=='pending')fail('failed-precondition','تم اتخاذ قرار على هذا الطلب بالفعل');
    r.reviewedBy=a.uid;r.reviewedName=actorName;r.reviewedAt=now;
    if(op==='hireReject'){r.status='rejected';r.reviewReason=str(d.reason,'سبب الرفض',500,true);event(d.dept,'hire_rejected',r.name,{requestKey:k});}
    else{
      if(hr.staff?.[d.dept]?.[k])fail('already-exists','الموظف موجود بالفعل');
      let base=hr.hire_request_salaries?.[d.dept]?.[k];
      if(Object.hasOwn(d,'salary')){flag(a,'canViewSal');base=amount(d.salary);}
      r.status='approved';r.employeeKey=k;
      put(hr,['staff',d.dept,k],{name:r.name,role:r.role,shift:r.shift,hireDate:r.hireDate,status:'active',approvedBy:a.uid,approvedAt:now,requestKey:k});
      if(!P.isBoard(d.dept)&&base!==undefined&&base!==null)salary(hr,d.dept,k,base,r.hireDate.slice(0,7));
      event(d.dept,'hire_approved',r.name,{requestKey:k,employeeKey:k});
    }put(hr,['notification_resolutions',d.dept,k],{kind:'hire',status:r.status,resolvedBy:a.uid,resolvedAt:now});return {...result,key:k,status:r.status};
  }
  if(op==='staffEdit'){
    flag(a,'canEditStaff');targetDept();const k=key(d.key),e=employee(hr,d.dept,k);active(e);
    Object.assign(e,{name:str(d.name,'الاسم',150,true),role:str(d.role,'المسمى الوظيفي')});
    if(!P.isBoard(d.dept))e.shift=str(d.shift,'الدوام');
    if(!P.isBoard(d.dept)&&Object.hasOwn(d,'salary')){flag(a,'canViewSal');salary(hr,d.dept,k,amount(d.salary),month(d.salaryMonth||currentMonth));}
  }else if(['staffDelete','staffTerminate','terminationSubmit'].includes(op)){
    flag(a,'canTerminateStaff');staffDept();const k=key(d.key),e=employee(hr,d.dept,k);active(e);const end=validDate(d.date||currentDate);
    if(end>currentDate||(e.hireDate&&end<e.hireDate))fail('invalid-argument','تاريخ إنهاء الخدمات غير صالح');
    if(hr.termination_pending?.[d.dept]?.[k])fail('already-exists','يوجد طلب إنهاء خدمات معلق لهذا الموظف');
    put(hr,['termination_requests',d.dept,id],{employeeKey:k,name:e.name,date:end,reason:str(d.reason,'سبب إنهاء الخدمات',500,true),status:'pending',submittedBy:a.uid,submittedName:actorName,createdAt:now});
    put(hr,['termination_pending',d.dept,k],id);
    event(d.dept,'termination_requested',e.name,{employeeKey:k,requestKey:id,date:end});
    return {...result,key:id,status:'pending'};
  }else if(op==='terminationApprove'||op==='terminationReject'){
    flag(a,'canApproveTerminations');staffDept();const k=key(d.key),r=hr.termination_requests?.[d.dept]?.[k];
    if(!r)fail('not-found','طلب إنهاء الخدمات غير موجود');
    if(r.status!=='pending'||hr.termination_pending?.[d.dept]?.[r.employeeKey]!==k)fail('failed-precondition','تم اتخاذ قرار على الطلب بالفعل');
    const e=employee(hr,d.dept,r.employeeKey);active(e);
    Object.assign(r,{reviewedBy:a.uid,reviewedName:actorName,reviewedAt:now});
    if(op==='terminationReject'){r.status='rejected';r.reviewReason=str(d.reason,'سبب الرفض',500,true);event(d.dept,'termination_rejected',r.name,{employeeKey:r.employeeKey,requestKey:k});}
    else{validDate(r.date);if(r.date>currentDate||(e.hireDate&&r.date<e.hireDate))fail('invalid-argument','تاريخ إنهاء الخدمات غير صالح');r.status='approved';Object.assign(e,{status:'terminated',terminationDate:r.date,terminationReason:r.reason,terminatedBy:a.uid,terminatedAt:now,terminationRequestKey:k});event(d.dept,'staff_terminated',e.name,{employeeKey:r.employeeKey,requestKey:k,date:r.date});}
    put(hr,['termination_pending',d.dept,r.employeeKey],null);
    put(hr,['notification_resolutions',d.dept,k],{kind:'termination',status:r.status,resolvedBy:a.uid,resolvedAt:now});
    return {...result,key:k,status:r.status};
  }else if(op==='salarySet'||op==='monthlySalarySet'){
    flag(a,'canManageFinance');flag(a,'canViewSal');staffDept();const k=key(d.employeeKey);employee(hr,d.dept,k);const m=month(d.month),n=amount(d.amount);
    if(op==='salarySet')salary(hr,d.dept,k,n,m);
    else put(hr,['monthly_salary',d.dept,k,m],{amount:n,reason:str(d.reason,'الملاحظة',500),updatedBy:a.uid,updatedAt:now});
  }else if(op==='vioAdd'){
    flag(a,'canViewVio');flag(a,'canEditVio');const config=staffDept();const date=validDate(d.date);
    const employeeKey=d.employeeKey||F.resolveEmployee(hr,d.dept,{empName:d.empName});const e=employee(hr,d.dept,employeeKey);employed(e,date);
    if(!['warning','deduct','suspend','praise'].includes(d.type))fail('invalid-argument','نوع العقوبة غير صالح');
    let n=0;if(d.type!=='praise'&&String(d.deductionAmount??d.deduct??'').trim()!=='')n=amount(d.deductionAmount??d.deduct,d.type==='deduct');
    if(d.type==='deduct'&&n<=0)fail('invalid-argument','أدخل مبلغ الخصم بالدينار');
    const payrollMonth=month(d.payrollMonth||date.slice(0,7));payrollEmployment(e,payrollMonth);
    const rec={employeeKey,empName:e.name,dept:config.title,type:d.type,date,reason:str(d.reason,'سبب العقوبة',d.type==='suspend'?500:2000,true),ts:now,payrollMonth,deductionAmount:n,deductionConfirmed:true,createdBy:a.uid};
    if(d.type==='suspend'){active(e);if(hr.termination_pending?.[d.dept]?.[employeeKey])fail('already-exists','يوجد طلب إنهاء خدمات معلق لهذا الموظف');}
    if(n)rec.deduct=String(n)+' د.ع';
    Object.assign(rec,{status:'pending',submittedBy:a.uid,submittedName:actorName,createdAt:now});
    put(hr,['violation_requests',d.dept,id],rec);
    event(d.dept,'violation_requested',e.name,{requestKey:id,employeeKey,violationType:d.type});
    return {...result,key:id,status:'pending'};
  }else if(op==='vioApprove'||op==='vioReject'){
    flag(a,'canApproveVio');staffDept();const k=key(d.key),r=hr.violation_requests?.[d.dept]?.[k];
    if(!r)fail('not-found','طلب العقوبة غير موجود');if(r.status!=='pending')fail('failed-precondition','تم اتخاذ قرار على هذا الطلب بالفعل');
    const e=employee(hr,d.dept,r.employeeKey);
    if(op==='vioApprove'){
      employed(e,validDate(r.date));payrollEmployment(e,month(r.payrollMonth));
      if(r.type==='suspend'){active(e);if(r.date>currentDate)fail('invalid-argument','تاريخ إنهاء الخدمات لا يمكن أن يكون مستقبلياً');if(hr.termination_pending?.[d.dept]?.[r.employeeKey])fail('already-exists','يوجد طلب إنهاء خدمات معلق لهذا الموظف');}
    }
    Object.assign(r,{reviewedBy:a.uid,reviewedName:actorName,reviewedAt:now,status:op==='vioApprove'?'approved':'rejected'});
    if(op==='vioReject')r.reviewReason=str(d.reason,'سبب الرفض',500,true);
    else{
      const v={employeeKey:r.employeeKey,empName:e.name,dept:r.dept,type:r.type,date:r.date,reason:r.reason,ts:now,payrollMonth:r.payrollMonth,deductionAmount:r.deductionAmount,deductionConfirmed:true,createdBy:a.uid,requestKey:k,approvedBy:a.uid,approvedAt:now};
      if(r.deduct)v.deduct=r.deduct;put(hr,['violations',d.dept,k],v);
      if(r.type==='suspend'){
        const tk=key(id+'-termination');r.terminationRequestKey=tk;
        put(hr,['termination_requests',d.dept,tk],{employeeKey:r.employeeKey,name:e.name,date:r.date,reason:r.reason.slice(0,500),status:'pending',submittedBy:a.uid,submittedName:actorName,createdAt:now,sourceViolation:k});
        put(hr,['termination_pending',d.dept,r.employeeKey],tk);
        event(d.dept,'termination_requested',e.name,{employeeKey:r.employeeKey,requestKey:tk,date:r.date},tk);
      }
    }
    event(d.dept,op==='vioApprove'?'violation_approved':'violation_rejected',e.name,{requestKey:k,employeeKey:r.employeeKey,violationType:r.type});
    put(hr,['notification_resolutions',d.dept,k],{kind:'violation',status:r.status,resolvedBy:a.uid,resolvedAt:now});
    return {...result,key:k,status:r.status};
  }else if(op==='vioDelete'){
    flag(a,'canViewVio');flag(a,'canEditVio');targetDept();const v=hr.violations?.[d.dept]?.[key(d.key)];if(!v)fail('not-found','العقوبة غير موجودة');
    v.status='cancelled';v.cancelledBy=a.uid;v.cancelledAt=now;
  }else if(op==='vioFinanceLink'){
    flag(a,'canManageFinance');staffDept();const v=hr.violations?.[d.dept]?.[key(d.key)];if(!v||v.status==='cancelled')fail('not-found','العقوبة غير موجودة');
    const employeeKey=key(d.employeeKey),e=employee(hr,d.dept,employeeKey);employed(e,validDate(v.date));
    const n=v.type==='praise'?0:amount(d.amount,v.type==='deduct');payrollEmployment(e,month(d.month));
    Object.assign(v,{employeeKey,empName:e.name,payrollMonth:month(d.month),deductionAmount:n,deductionConfirmed:true,requiresFinanceReview:false,financialUpdatedBy:a.uid,financialUpdatedAt:now,deduct:n?String(n)+' د.ع':''});
  }else if(op==='adjustmentAdd'||op==='adjustmentCancel'){
    flag(a,'canManageFinance');staffDept();
    if(op==='adjustmentCancel'){const r=hr.adjustments?.[d.dept]?.[key(d.key)];if(!r)fail('not-found','الخصم غير موجود');r.status='cancelled';r.cancelledBy=a.uid;r.cancelledAt=now;}
    else{const k=key(d.employeeKey),e=employee(hr,d.dept,k);payrollEmployment(e,month(d.month));put(hr,['adjustments',d.dept,id],{employeeKey:k,month:month(d.month),amount:amount(d.amount,true),reason:str(d.reason,'سبب الخصم',500,true),category:d.category==='attendance'?'attendance':'other',status:'active',createdBy:a.uid,createdAt:now});result.key=id;}
  }else if(op==='monthAdd'||op==='monthDelete'){
    flag(a,'canViewDelay');flag(a,'canEditDelay');
    if(op==='monthAdd'){put(hr,['months',id],{name:d.period?month(d.period).slice(5)+' / '+d.period.slice(0,4):str(d.name,'الشهر',100,true),...(d.period?{period:month(d.period)}:{}),ts:now});result.key=id;}
    else{if(!a.perms.allDepts)fail('permission-denied','حذف شهر كامل يتطلب صلاحية جميع الأقسام');const m=key(d.month);put(hr,['months',m],null);put(hr,['delays',m],null);}
  }else if(['delayDeptAdd','delayDeptDelete','delayAdd','delayDelete','delayLink','delayAmountSet'].includes(op)){
    if(op==='delayLink')flag(a,'canManageFinance');else{flag(a,'canViewDelay');flag(a,'canEditDelay');}const config=['delayDeptDelete','delayDelete'].includes(op)?targetDept():staffDept(),m=key(d.month);
    if(!hr.months?.[m])fail('not-found','الشهر غير موجود');
    const section=hr.delays?.[m]?.[d.dept];
    if(op==='delayDeptAdd'){if(section)fail('already-exists','القسم موجود بالفعل');put(hr,['delays',m,d.dept],{name:config.title,ts:now});}
    else if(op==='delayDeptDelete')put(hr,['delays',m,d.dept],null);
    else{
      if(!section)fail('not-found','القسم غير موجود في الشهر');
      if(op==='delayDelete'){const r=section.employees?.[key(d.key)];if(!r||r.status==='cancelled')fail('not-found','السجل غير موجود');Object.assign(r,{status:'cancelled',cancelledBy:a.uid,cancelledAt:now});}
      else if(op==='delayLink'){const r=section.employees?.[key(d.key)];if(!r||r.status==='cancelled')fail('not-found','السجل غير موجود');const k=key(d.employeeKey),e=employee(hr,d.dept,k);employed(e,validDate(r.date));r.employeeKey=k;r.name=e.name;}
      else if(op==='delayAmountSet'){const r=section.employees?.[key(d.key)];if(!r||r.status==='cancelled')fail('not-found','السجل غير موجود');const k=key(d.employeeKey),e=employee(hr,d.dept,k);employed(e,validDate(r.date));Object.assign(r,{employeeKey:k,name:e.name,deductionAmount:amount(d.amount,true),deductionConfirmed:true,payrollMonth:r.date.slice(0,7),note:str(d.note,'الملاحظات',500),financialUpdatedBy:a.uid,financialUpdatedAt:now});}
      else{const k=key(d.employeeKey),e=employee(hr,d.dept,k),date=validDate(d.date);employed(e,date);put(section,['employees',id],{employeeKey:k,name:e.name,deductionAmount:amount(d.amount,true),deductionConfirmed:true,payrollMonth:date.slice(0,7),date,note:str(d.note,'الملاحظات',500),ts:now,createdBy:a.uid});result.key=id;}
    }
  }else if(op==='docSave'||op==='docClear'){
    flag(a,'canViewDoctors');flag(a,'canEditDoctors');if(!P.DOCTORS.includes(d.dept))fail('invalid-argument','الاختصاص غير صالح');const data={};for(const day of P.DAYS)data[day]={morning:op==='docClear'?'':str(d.schedule?.[day]?.morning,'الطبيب'),evening:op==='docClear'?'':str(d.schedule?.[day]?.evening,'الطبيب')};put(hr,['doc_schedule',d.dept.replace(/\s+/g,'_')],data);
  }else fail('invalid-argument','عملية غير معروفة');
  return result;
}
module.exports={apply,DomainError,fail,key};

});
modules["../functions/policy"]=modules["./policy"];modules["../functions/finance"]=modules["./finance"];
define("./migration.cjs",function(module,exports,require){
'use strict';
const P=require('../functions/policy'),F=require('../functions/finance');
function prepare(original){
 if(original.hr_spark_meta?.ready||original.hr_spark)throw new Error('نسخة Spark موجودة بالفعل؛ أوقفت النقل حتى لا تُستبدل البيانات.');
 let source,warnings=[],sourceName;
 if(original.hr_v4){if(!original.hr_v4_meta?.ready)throw new Error('نقل v4 غير مكتمل؛ راجع البيانات قبل المتابعة.');source=original.hr_v4;sourceName='hr_v4';}
 else{const legacy=P.migrateLegacy(original);source=legacy.output;warnings=legacy.warnings;sourceName='legacy';}
 for(const field of ['staff','salaries','salary_history','monthly_salary','hire_requests','hire_request_salaries','violations','adjustments','notifications'])for(const dept of Object.keys(source[field]||{}))if(!P.DEPT_IDS.includes(dept))warnings.push('قسم غير معروف: '+field+'/'+dept);
 for(const [month,depts]of Object.entries(source.delays||{}))for(const dept of Object.keys(depts))if(!P.DEPT_IDS.includes(dept))warnings.push('قسم غير معروف: delays/'+month+'/'+dept);
 if(warnings.length)throw new Error(warnings.join('\n'));
 const {output,notes}=F.upgrade(source),permissions={};
 for(const [uid,profile]of Object.entries(original.user_profiles||{})){
  const old=original.user_perms?.[uid]||{},perms={...old};
  if(profile.role==='finance'){const defaults=P.defaults('finance');for(const f of P.FLAGS)if(typeof perms[f]!=='boolean')perms[f]=defaults[f];}
  for(const f of ['canApproveHires','canTerminateStaff'])if(typeof perms[f]!=='boolean')perms[f]=profile.role==='admin'&&old.canEditStaff===true;
  if(typeof perms.canViewNotifications!=='boolean')perms.canViewNotifications=true;
  permissions[uid]=profile.role==='developer'?P.defaults('developer'):P.normalizePerms(perms);
 }
 return {output,notes,permissions,sourceName};
}
module.exports={prepare};

});
define("./console-setup.cjs",function(module,exports,require){
'use strict';
const P=require('../functions/policy'),M=require('./migration.cjs');
function build(original,uid,now=Date.now()){
 if(!original||typeof original!=='object'||Array.isArray(original))throw new Error('اختر ملف JSON المُصدَّر من جذر Realtime Database.');
 if(original.private_key||original.type==='service_account')throw new Error('هذا مفتاح إداري؛ المطلوب ملف بيانات Realtime Database فقط.');
 uid=String(uid||'').trim();if(!/^[A-Za-z0-9_-]{1,128}$/.test(uid))throw new Error('انسخ UID الحساب من Authentication → Users.');
 const known=['hospital','violations','delay_months','doc_schedule','user_profiles','user_perms','username_index','hr_v4','hr_v4_meta','hr_spark','hr_spark_meta'];
 if(Object.keys(original).length&&!known.some(k=>Object.hasOwn(original,k)))throw new Error('الملف لا يبدو تصديرًا من جذر قاعدة المشروع. اختر جذر القاعدة عند Export JSON.');
 const existing=original.user_profiles?.[uid];
 if(existing&&(existing.username!=='dev'||existing.role!=='developer'))throw new Error('هذا UID مرتبط بحساب آخر في البيانات؛ اختر UID حساب dev.');
 if(original.username_index?.dev&&original.username_index.dev!==uid)throw new Error('المطور موجود بالفعل؛ استخدم UID حسابه الحالي بدل إنشاء حساب جديد.');
 if(Object.entries(original.user_profiles||{}).some(([id,p])=>p.role==='developer'&&id!==uid))throw new Error('يوجد حساب مطور آخر؛ استخدم UID حساب المطور الموجود.');
 const result=structuredClone(original);let notes=[],sourceName;
 if(original.hr_spark_meta?.ready===true){sourceName='hr_spark';}
 else{
  const prepared=M.prepare(original);result.hr_spark=prepared.output;notes=prepared.notes;sourceName=prepared.sourceName;
  result.hr_spark_meta={ready:true,version:6,source:sourceName,migratedAt:now};
  result.user_perms||={};for(const [id,p]of Object.entries(prepared.permissions))result.user_perms[id]=p;
 }
 result.user_profiles||={};result.user_perms||={};result.username_index||={};
 result.user_profiles[uid]=existing?{...existing}:{username:'dev',role:'developer',label:'المطور',enabled:true,sessionAfter:0,createdAt:now};
 result.user_perms[uid]=P.defaults('developer');result.username_index.dev=uid;
 const hr=result.hr_spark||{},count=key=>Object.values(hr[key]||{}).reduce((n,depts)=>n+Object.keys(depts||{}).length,0);
 return {data:result,notes,sourceName,summary:{staff:count('staff'),violations:count('violations'),months:Object.keys(hr.months||{}).length}};
}
module.exports={build};

});
global.HR_CORE={P:modules["./policy"],F:modules["./finance"],W:modules["./workflow"],SETUP:modules["./console-setup.cjs"]};})(window);
