// VTVL 360 — Quy tắc validation đọc độc lập, không tự sửa file.
export const DEFAULT_PERIOD = '01/10/2025 – 30/09/2026';
const normal = (s) => String(s ?? '').trim();
const canon = (s) => normal(s).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D');
const looksSheet = (name, token) => canon(name).includes(canon(token));
export function sheetOf(wb, token) {
  const entries = Object.entries(wb.sheets || {});
  return entries.find(([name]) => looksSheet(name, token))?.[1] ?? null;
}
export function getValue(sheet, address) {
  return normal(sheet?.cells?.[address]?.value);
}
export function occupiedRows(sheet) {
  if (!sheet) return [];
  const ids = new Set();
  for (const ref of Object.keys(sheet.cells || {})) {
    const m = /^([A-Z]+)([0-9]+)$/.exec(ref);
    if (m && Number(m[2]) >= 3 && normal(sheet.cells[ref]?.value) !== '') ids.add(Number(m[2]));
  }
  return [...ids].sort((a,b)=>a-b);
}
const issue = (issues,rule,severity,sheet,cell,message,root=true) => issues.push({rule,severity,sheet,cell,message,root});
const columns = ['A','B','C','D','E','F','G','H','I','J','K','L'];
const refs = (sheet,col) => new Set(occupiedRows(sheet).map(r=>getValue(sheet,col+r)).filter(Boolean));
const integers = (x) => x !== '' && Number.isFinite(Number(x));
export function validateBusiness(wb, opts={}) {
  const period = opts.period || DEFAULT_PERIOD;
  const issues=[];
  const refsByName = {};
  for (const [key,label] of Object.entries({a1:'A1_NhiemVu',a2:'A2_CongViec',b1:'B1_KhoiLuong',b2:'B2_CT_TacDong',c1:'C1_VTVL',c2:'C2_NangLuc',c3:'C3_NhuCau',d1:'D1_NhanLuc',d2:'D2_PhuongAn',forecast:'DU_BAO_5_NAM'})) {
    const value=sheetOf(wb,label);
    refsByName[key] = {label,sheet:value};
  }
  const s = Object.fromEntries(Object.entries(refsByName).map(([k,v])=>[k,v.sheet]));
  const present=Object.values(s).filter(Boolean).length;
  if (present < 10) issue(issues,'SHEET_COVERAGE','warning','Bộ biểu','', 'Đang đọc '+present+'/10 biểu dữ liệu; những biểu thiếu sẽ không được kiểm tra chéo. Với file B1 độc lập, đây không phải lỗi file.',false);
  if (!(wb.entries || []).includes('xl/sharedStrings.xml')) issue(issues,'SHARED_STRINGS','warning','OOXML','xl/sharedStrings.xml','Không có sharedStrings.xml. Nếu mẫu gốc có phần này, phần mềm import có thể từ chối; cần so sánh mẫu.',true);
  const known = {a1:refs(s.a1,'A'),a2:refs(s.a2,'A'),b1:refs(s.b1,'A'),c1:refs(s.c1,'A')};
  for(const key of ['a1','a2','c1','d1']){
    const sh=s[key]; if(!sh)continue;
    const seen=new Set();
    for(const row of occupiedRows(sh)) {
      const v=getValue(sh,'A'+row);
      if(!v) continue;
      if(seen.has(v)) issue(issues,'DUPLICATE_ID','error',sh.name,'A'+row,'Trùng mã '+v+' trong cùng biểu.');
      seen.add(v);
    }
  }
  const periodChecks=[['a1','E'],['b1','K'],['b2','K']];
  for(const [k,col] of periodChecks){
    const sh=s[k]; if(!sh)continue;
    for(const row of occupiedRows(sh)){
      const value=getValue(sh,col+row); if(value!==period) issue(issues,'PERIOD','error',sh.name,col+row,'Kỳ phải chính xác "'+period+'"; hiện là "'+(value||'(trống)')+'". Sai kỳ có thể khiến phần mềm loại dòng và gây lỗi dây chuyền A2/C3/D2/Dự báo.');
    }
  }
  const relationships=[
    ['a2','B','a1','A2_A1'],
    ['a2','C','c1','A2_C1'],
    ['b1','A','a2','B1_A2'],
    ['b2','A','b1','B2_B1'],
    ['c2','A','c1','C2_C1'],
    ['c3','A','c1','C3_C1'],
    ['d1','B','c1','D1_C1'],
    ['d2','A','c1','D2_C1'],
    ['forecast','A','c1','FORECAST_C1']
  ];
  for(const [k,col,to,rule] of relationships) {
    if(!s[k]||!s[to])continue;
    for(const row of occupiedRows(s[k])) {
      const val=getValue(s[k],col+row);
      if(val && !known[to]?.has(val) && !refs(s[to],'A').has(val)) issue(issues,rule,'error',s[k].name,col+row,'Mã '+val+' không tìm thấy trong '+s[to].name+'. Kiểm tra mã nguồn trước khi sửa biểu khác.',false);
      if(!val) issue(issues,rule,'error',s[k].name,col+row,'Thiếu mã tham chiếu '+s[to].name+'.',false);
    }
  }
  if(s.a1&&s.a2){
    const used=refs(s.a2,'B');
    for(const row of occupiedRows(s.a1)){
      const v=getValue(s.a1,'A'+row);
      if(v&&!used.has(v))issue(issues,'A1_WITHOUT_A2','warning',s.a1.name,'A'+row,'Nhiệm vụ chưa có công việc A2.',false);
    }
  }
  if(s.a2&&s.b1){
    const count = new Map();
    for(const row of occupiedRows(s.b1)){
      const key=getValue(s.b1,'A'+row);
      if(key) count.set(key,(count.get(key)||0)+1);
    }
    for(const row of occupiedRows(s.a2)){
      const key=getValue(s.a2,'A'+row),n=count.get(key)||0;
      if(key&&n!==1)issue(issues,'A2_B1_ONE_TO_ONE','error',s.a2.name,'A'+row,'Mỗi công việc A2 phải tương ứng đúng một dòng B1; đang có '+n+'.',false);
    }
  }
  if(s.b1){
    for(const row of occupiedRows(s.b1)){
      const C=getValue(s.b1,'C'+row),D=getValue(s.b1,'D'+row),J=getValue(s.b1,'J'+row),I=getValue(s.b1,'I'+row),L=getValue(s.b1,'L'+row);
      if(!integers(C)||Number(C)<=0) issue(issues,'B1_QUANTITY','error',s.b1.name,'C'+row,'Số sản phẩm C phải là số dương.');
      if(!integers(D)||Number(D)<=0) issue(issues,'B1_MINUTES','error',s.b1.name,'D'+row,'Phút/sản phẩm D phải là số dương.');
      if(!J) issue(issues,'B1_STATUS','error',s.b1.name,'J'+row,'Trạng thái J không được trống.');
      if(L) issue(issues,'B1_PRODUCT_CODE','warning',s.b1.name,'L'+row,'Mã sản phẩm "'+L+'" cần đối chiếu danh mục phần mềm import. Mã nội bộ không hợp lệ từng gây lỗi nạp; không được tự xóa nếu chưa có căn cứ.');
      if(!I && Object.keys(s.b1.cells || {}).some(ref=>ref.endsWith(String(row)) && canon(getValue(s.b1,ref)).includes('CO DINH MUC')))issue(issues,'B1_TIME_SOURCE','warning',s.b1.name,'I'+row,'Dòng có định mức nhưng chưa có nguồn thời gian cột I.');
    }
  }
  for(const key of ['d2','forecast']){
    if(!s[key])continue;
    const found = new Set();
    for(const row of occupiedRows(s[key])){
      const yr=getValue(s[key],'B'+row),id=getValue(s[key],'A'+row);
      if(!yr) continue;
      if(!/^(2027|2028|2029|2030|2031)$/.test(yr)) issue(issues,'FORECAST_YEAR','error',s[key].name,'B'+row,'Năm dự báo cần thuộc 2027–2031, thực tế "'+yr+'".');
      const combo=id+'|'+yr;
      if(found.has(combo))issue(issues,'FORECAST_DUPLICATE','error',s[key].name,'A'+row,'Trùng cặp mã VTVL/năm '+combo+'.');
      found.add(combo);
    }
    if(s.c1){
      const expected=known.c1.size*5;
      if(occupiedRows(s[key]).length!==expected)issue(issues,'FORECAST_COVERAGE','warning',s[key].name,'','Số dòng '+occupiedRows(s[key]).length+' chưa khớp '+known.c1.size+' vị trí × 5 năm = '+expected+'.',false);
    }
  }
  if(s.c1){
    for(const key of ['c2','c3']){
      if(!s[key])continue;
      const count=refs(s[key],'A');
      for(const id of known.c1)if(!count.has(id))issue(issues,'MISSING_VTVL','error',s[key].name,'','Thiếu mã '+id+' từ danh mục C1.',false);
    }
  }
  const errors=issues.filter(i=>i.severity==='error').length;
  const warnings=issues.filter(i=>i.severity==='warning').length;
  return {status:errors?'fail':'review',errors,warnings,checkedSheets:present,issues,
    note:'Đây là bộ kiểm tra mô phỏng dựa trên lỗi đã ghi nhận, KHÔNG phải chứng nhận file được phần mềm chính thức chấp nhận.'};
}
const sort = x=>[...(x||[])].sort();
const equal = (a,b)=>JSON.stringify(sort(a))===JSON.stringify(sort(b));
export function compareStructure(base,file){
  const issues=[];
  const e0=sort(base.entries),e1=sort(file.entries);
  if(!equal(e0,e1)){
    issue(issues,'ZIP_ENTRIES','error','OOXML','','Danh sách thành phần ZIP không trùng mẫu gốc. Thiếu: '+e0.filter(x=>!e1.includes(x)).slice(0,12).join(', ')+'; thêm: '+e1.filter(x=>!e0.includes(x)).slice(0,12).join(', '));
  }
  const bnames=Object.keys(base.sheets||{}),fnames=Object.keys(file.sheets||{});
  if(JSON.stringify(bnames)!==JSON.stringify(fnames))issue(issues,'SHEET_NAMES','error','Workbook','','Tên/thứ tự sheet bị thay đổi so với mẫu.');
  for(const name of bnames){
    const a=base.sheets[name],b=file.sheets[name];
    if(!b)continue;
    const ar=Object.keys(a.cells||{}),br=Object.keys(b.cells||{});
    if(!equal(ar,br))issue(issues,'CELL_LAYOUT','error',name,'','Danh sách địa chỉ ô khác mẫu. Có thể đã thêm/xóa ô, hàng hoặc cột.');
    const af=Object.entries(a.cells||{}).filter(([,v])=>v.formula!==null&&v.formula!==undefined).map(([r,v])=>r+'='+v.formula);
    const bf=Object.entries(b.cells||{}).filter(([,v])=>v.formula!==null&&v.formula!==undefined).map(([r,v])=>r+'='+v.formula);
    if(!equal(af,bf))issue(issues,'FORMULAS_CHANGED','error',name,'','Công thức hoặc vị trí công thức khác mẫu gốc.');
    if(!equal(a.merges,b.merges))issue(issues,'MERGED_CELLS','error',name,'','Vùng ô gộp khác mẫu gốc.');
    if(!equal(a.validations,b.validations))issue(issues,'EXCEL_VALIDATIONS','error',name,'','Quy tắc Data Validation trong Excel khác mẫu gốc.');
  }
  for(const path of ['xl/styles.xml','xl/workbook.xml','xl/_rels/workbook.xml.rels','[Content_Types].xml']){
    if(base.parts?.[path]!==undefined && file.parts?.[path]!==undefined && base.parts[path]!==file.parts[path]) issue(issues,'FIXED_PART_CHANGED','warning','OOXML',path,'Thành phần cố định khác mẫu; kiểm tra thủ công để xác định thay đổi có hợp lệ hay không.',false);
  }
  const errors=issues.filter(x=>x.severity==='error').length,warnings=issues.filter(x=>x.severity==='warning').length;
  return {status:errors?'fail':'review',errors,warnings,issues,note:'So sánh cấu trúc chưa thay thế thử import lên phần mềm chính thức.'};
}
