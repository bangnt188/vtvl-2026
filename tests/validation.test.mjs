import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBusiness,compareStructure,DEFAULT_PERIOD} from '../public/validation-rules.mjs';
const cell=(value,formula=null)=>({value:String(value),formula});
const tab=(name,cells={})=>({name,cells,merges:[],validations:[]});
function workbook(sheets,entries=['xl/workbook.xml','xl/sharedStrings.xml']){return {sheets,entries,parts:{}}}
test('bắt đúng hai lỗi gốc đã xảy ra: K2526 và B1!L',()=>{
  const w=workbook({
    '1. A1_NhiemVu':tab('1. A1_NhiemVu',{A3:cell('NV-1'),E3:cell('K2526')}),
    '3. B1_KhoiLuong':tab('3. B1_KhoiLuong',{A3:cell('CV-1'),C3:cell(2),D3:cell(35),I3:cell('Phiếu đo'),J3:cell('Kiểm đếm, ước lượng thực tế'),K3:cell('K2526'),L3:cell('SP-NOIBO')}),
    '4. B2_CT_TacDong':tab('4. B2_CT_TacDong',{A3:cell('CV-1'),K3:cell('K2526')})
  });
  const r=validateBusiness(w);
  assert.equal(r.issues.filter(i=>i.rule==='PERIOD').length,3);
  assert.equal(r.issues.filter(i=>i.rule==='B1_PRODUCT_CODE').length,1);
  assert.equal(r.status,'fail');
});
test('kỳ chính xác và dữ liệu B1 hợp lệ không tạo lỗi kỳ/khối lượng',()=>{
  const w=workbook({
    '1. A1_NhiemVu':tab('1. A1_NhiemVu',{A3:cell('NV-1'),E3:cell(DEFAULT_PERIOD)}),
    '2. A2_CongViec':tab('2. A2_CongViec',{A3:cell('CV-1'),B3:cell('NV-1'),C3:cell('VT-1')}),
    '3. B1_KhoiLuong':tab('3. B1_KhoiLuong',{A3:cell('CV-1'),C3:cell(5),D3:cell(45),J3:cell('Đã kiểm đếm'),K3:cell(DEFAULT_PERIOD)}),
    '6. C1_VTVL':tab('6. C1_VTVL',{A3:cell('VT-1')})
  });
  const r=validateBusiness(w);
  assert.equal(r.issues.filter(i=>i.severity==='error').length,0);
  assert.ok(r.issues.some(i=>i.rule==='SHEET_COVERAGE'));
});
test('tham chiếu B1 không có trong A2 được phát hiện',()=>{
  const w=workbook({
    '2. A2_CongViec':tab('2. A2_CongViec',{A3:cell('CV-OK')}),
    '3. B1_KhoiLuong':tab('3. B1_KhoiLuong',{A3:cell('CV-BAD'),C3:cell(1),D3:cell(20),J3:cell('Đạt'),K3:cell(DEFAULT_PERIOD)})
  });
  const r=validateBusiness(w);
  assert.ok(r.issues.some(i=>i.rule==='B1_A2'&&i.cell==='A3'));
  assert.ok(r.issues.some(i=>i.rule==='A2_B1_ONE_TO_ONE'));
});
test('phát hiện công thức bị sửa và sheet mới',()=>{
  const b=workbook({'1. A1_NhiemVu':tab('1. A1_NhiemVu',{A3:cell('', 'X+1'),B3:cell('')})},['xl/workbook.xml','xl/sharedStrings.xml']);
  const v=workbook({'1. A1_NhiemVu':tab('1. A1_NhiemVu',{A3:cell('', 'X+2'),B3:cell('')}),'SHEET_THEM':tab('SHEET_THEM')},['xl/workbook.xml']);
  const x=compareStructure(b,v);
  assert.ok(x.issues.some(i=>i.rule==='ZIP_ENTRIES'));
  assert.ok(x.issues.some(i=>i.rule==='SHEET_NAMES'));
  assert.ok(x.issues.some(i=>i.rule==='FORMULAS_CHANGED'));
});
test('năm dự báo ngoài 2027-2031 bị báo lỗi',()=>{
  const w=workbook({
    '6. C1_VTVL':tab('6. C1_VTVL',{A3:cell('VT-1')}),
    'DU_BAO_5_NAM':tab('DU_BAO_5_NAM',{A3:cell('VT-1'),B3:cell(2032)})
  });
  const r=validateBusiness(w);
  assert.ok(r.issues.some(i=>i.rule==='FORECAST_YEAR'));
});
