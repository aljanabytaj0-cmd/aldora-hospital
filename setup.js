'use strict';
(function(){
 const el=id=>document.getElementById(id);let download=null,revision=0;
 function clear(){revision++;if(download){URL.revokeObjectURL(download);download=null;}el('result').hidden=true;el('download-file').removeAttribute('href');el('feedback').textContent='';}
 el('data-file').addEventListener('change',clear);el('dev-uid').addEventListener('input',clear);
 el('setup-form').addEventListener('submit',async event=>{
  event.preventDefault();clear();const attempt=revision,file=el('data-file').files[0],uid=el('dev-uid').value;
  if(!file){el('feedback').textContent='اختر ملف البيانات أولاً.';return;}
  el('prepare-btn').disabled=true;el('feedback').className='';el('feedback').textContent='جاري تجهيز الملف…';
  try{
   const parsed=JSON.parse(await file.text());if(attempt!==revision)return;
   const original=parsed===null?{}:parsed,prepared=HR_CORE.SETUP.build(original,uid);
   download=URL.createObjectURL(new Blob([JSON.stringify(prepared.data,null,2)+'\n'],{type:'application/json'}));
   el('download-file').href=download;el('counts').textContent='الموظفون: '+prepared.summary.staff+' — العقوبات: '+prepared.summary.violations+' — الأشهر: '+prepared.summary.months;
   el('source').textContent=prepared.sourceName==='hr_spark'?'نسخة Spark موجودة؛ احتُفظ ببياناتها الحالية.':prepared.sourceName==='hr_v4'?'نُقلت نسخة hr_v4 مع الاحتفاظ بالأصل.':'نُقلت بيانات النسخة الأصلية مع الاحتفاظ بها.';
   el('notes').textContent=prepared.notes.length?'سجلات تحتاج مراجعة بعد التشغيل:\n'+prepared.notes.join('\n'):'';
   el('result').hidden=false;el('feedback').textContent='تم التجهيز على جهازك. نزّل الملف ثم اتبع خطوات الاستيراد أدناه.';
  }catch(e){if(attempt!==revision)return;el('feedback').className='error';el('feedback').textContent=e instanceof SyntaxError?'ملف JSON غير صالح. أعد تصديره من Firebase.':e.message;}
  finally{el('prepare-btn').disabled=false;}
 });
 window.addEventListener('beforeunload',()=>{if(download)URL.revokeObjectURL(download);});
})();
