import {parseXlsx} from './xlsx-browser.mjs';
import {validateBusiness,compareStructure,DEFAULT_PERIOD} from './validation-rules.mjs';

const $=id=>document.getElementById(id);
const file=$('vtvl-import'), reference=$('vtvl-template'),period=$('vtvl-period');
const result=$('vtvl-result'), run=$('vtvl-check'),save=$('vtvl-save');
let report=null;

const el=(tag,cls,text)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined)node.textContent=text;
  return node;
};
function render(data){
  result.replaceChildren();
  result.append(el('h3','vtvl-result-title',data.headline));
  result.append(el('p','vtvl-subtitle',data.description));
  const counts=el('div','vtvl-counts');
  for(const [n,t] of [[data.errors,'Lỗi chặn'],[data.warnings,'Cần kiểm tra'],[data.checkedSheets,'Biểu đã đọc']]){
    const x=el('div','vtvl-count'),label=el('small',null,t),val=el('strong',null,String(n));
    x.append(val,label);counts.append(x);
  }
  result.append(counts);
  if(data.issues.length){
    const list=el('div','vtvl-issues');
    for(const i of data.issues.slice(0,90)){
      const line=el('div','vtvl-issue '+(i.severity==='error'?'vtvl-error':'vtvl-warn'));
      const a=el('strong',null,(i.severity==='error'?'LỖI':'RÀ SOÁT')+' · '+i.rule);
      const b=el('small',null,(i.sheet||'')+(i.cell?' / '+i.cell:''));
      const p=el('p',null,i.message);
      line.append(a,b,p);list.append(line);
    }
    result.append(list);
    if(data.issues.length>90)result.append(el('p','vtvl-subtitle','Chỉ hiển thị 90/'+data.issues.length+' mục. Tải JSON để xem đầy đủ.'));
  }
  result.append(el('p','vtvl-disclaimer','Kiểm tra mô phỏng từ các lỗi đã ghi nhận. Không xác nhận phần mềm chính thức chấp nhận file; không tự sửa hay lưu tệp Excel.'));
}
const decodeErr=(error)=>error instanceof Error?error.message:String(error);
run.addEventListener('click',async()=>{
  report=null;save.disabled=true;
  if(!file.files?.length){result.textContent='Hãy chọn file Bộ biểu cần kiểm tra.';return}
  const submitted=file.files[0],base=reference.files?.[0]||null;
  result.textContent='Đang kiểm tra cục bộ tại trình duyệt...';
  run.disabled=true;
  try{
    const workbook=await parseXlsx(submitted);
    const semantic=validateBusiness(workbook,{period:period.value.trim()||DEFAULT_PERIOD});
    let structural=null;
    if(base)structural=compareStructure(await parseXlsx(base),workbook);
    const unverified=base?[]:[{
      rule:'NO_TEMPLATE',severity:'warning',sheet:'Mẫu gốc',cell:'',
      message:'Chưa có tệp mẫu Bộ biểu VTVL v2 để so sánh thành phần ZIP, công thức, sheet, vùng gộp và Data Validation.',root:true
    }];
    const issues=[...semantic.issues,...(structural?.issues||[]),...unverified];
    const errors=issues.filter(x=>x.severity==='error').length,
          warnings=issues.filter(x=>x.severity==='warning').length;
    const headline=errors?'Phát hiện lỗi cần sửa':warnings?'Đã kiểm tra — còn điểm cần xác minh':'Không phát hiện sai lệch trong phạm vi kiểm tra';
    const description=(base?'Đã so sánh với mẫu gốc '+base.name+'. ':'Chưa so sánh mẫu gốc. ')+
      'Đã đọc '+semantic.checkedSheets+' biểu; báo cáo được tạo tại máy này.';
    report={kind:'vtvl-v2-preflight',version:1,time:new Date().toISOString(),file:submitted.name,reference:base?.name||null,period:period.value.trim()||DEFAULT_PERIOD,
      status:errors?'fail':'review',errors,warnings,checkedSheets:semantic.checkedSheets,issues,
      limitations:['Không kiểm thử nạp phần mềm chính thức','Không đối chiếu danh mục mã nội bộ của máy chủ','Không tự sửa XLSX','Chưa thay thế kiểm chứng nguồn nhân sự / số liệu / quyết định']};
    render({headline,description,errors,warnings,checkedSheets:semantic.checkedSheets,issues});
    save.disabled=false;
  }catch(e){
    result.replaceChildren(el('p','vtvl-disclaimer','Không thể kiểm tra: '+decodeErr(e)));
  }finally{run.disabled=false}
});
[file,reference,period].forEach(x=>x.addEventListener('change',()=>{report=null;save.disabled=true}));
save.addEventListener('click',()=>{
  if(!report)return;
  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='bao-cao-validation-vtvl-v2.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),800);
});
