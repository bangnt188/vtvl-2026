/* Tạo tệp đơn vị — lõi tách tệp theo quy tắc T1–T7 (SPEC_PILOT mục T), R1–R7 (bản 1.5) và K1 (bản 1.5.1), cùng hành vi với
   pilot/scripts/split_unit.py (so từng phần XML bằng compare_parts.py: phải giống hệt).
   Chỉ sửa chuỗi trong XML của gói xlsx (JSZip); không ghi lại bằng thư viện bảng tính, để giữ nguyên định dạng,
   danh sách chọn x14, công thức, trang ẩn và fullCalcOnLoad. Phần không đổi giữ nguyên dữ liệu nén.
   Chạy được trong trình duyệt (window.VTVLSplit) và trong Node (module.exports). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VTVLSplit = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KY = '01/10/2025–30/9/2026';
  var MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  var SHEET_B1 = '3. B1_KhoiLuong', SHEET_K = '13. K_KiemTra', SHEET_T = '14. T_TienDo', SHEET_S = '15. S_NhatKy';
  var PHIEU_NAME = ['Huong_dan', 'B2'];
  var LOG_FIXED = {
    B: 'Toàn bộ',
    D: 'Tách tệp cho đơn vị',
    E: 'Mẫu chung (XXX hoặc THCSTHPT)'
  };
  // T5 cột G "Nguồn" theo loại mẫu: không ghi tên người, không ghi ngày cố định
  var LOG_SOURCE = {
    dang: 'Phụ lục 1 kèm HD 13-HD/BTCTU, bảng 3a (mã xã, phường)',
    truong: 'Mã tạm của trường, đổi khi Sở Giáo dục và Đào tạo hoặc Sở Nội vụ cấp mã chính thức',
    ubnd: 'Phụ lục 1 kèm HD 13-HD/BTCTU, bảng 3a (mã xã, phường)',
    dvsn: 'Mã tạm của đơn vị sự nghiệp, đổi khi Sở Nội vụ cấp mã chính thức'
  };
  // T5 cột E: ghi rõ khối, loại (bản 1.5) để nhận lại tệp khi tạo lại phiếu
  var LOG_OLD = { dang: LOG_FIXED.E, truong: LOG_FIXED.E, ubnd: 'Mẫu chung khối chính quyền xã (XXX)', dvsn: 'Mẫu chung đơn vị sự nghiệp loại {loai} (XXX)' };
  var TEMPLATE_FILE_RE = /^[^\s_]+_K2526_v\d+_\d{8}\.xlsx$/;
  // T1 (điều chỉnh 31/10/2026): chuỗi có chỗ trống "<mã" (vd "<mã trường>") là ghi chú hướng dẫn, giữ nguyên cả chuỗi
  var PLACEHOLDER = '<mã';
  var XA_RE = /^(X(0[1-9]|[1-6]\d|7[0-2])|P(0[1-9]|[12]\d|3[01]))$/;
  var DVSN_LOAI = ['MN', 'TH', 'THCS', 'DVTH', 'TYT', 'BQLDA'];
  // R2–R6 (giống split_unit.py): "chữ" viết rõ (\w của JavaScript chỉ có ASCII); chỉ "XXX" viết hoa mới tính
  var WORD = '0-9A-Za-z_À-ÖØ-öø-ɏḀ-ỿ';
  var PLACE_WORDS = 'xã|Xã|XÃ|phường|Phường|PHƯỜNG|đặc khu|Đặc khu|Đặc Khu|ĐẶC KHU';
  var NAME_SRC = '(?<![' + WORD + '])(?:(' + PLACE_WORDS + ') )?XXX(?![' + WORD + '-])';
  var NAME_TEST = new RegExp(NAME_SRC);
  var R6_RE = /[Tt]iền tố(?: mẫu)?(?: xã)?:? XXX|TIỀN TỐ(?: MẪU)?(?: XÃ)?:? XXX|XXX là (?:tiền tố|mã mẫu)|[Tt]hay XXX bằng|THAY XXX BẰNG|[Qq]uy tắc riêng XXX|QUY TẮC RIÊNG XXX|[Mm]ã XXX dùng|MÃ XXX DÙNG/;
  var R6_EXACT = ['Mẫu XXX', 'mẫu XXX', 'MẪU XXX'];
  var MAX_ROW = 1048576;
  var R3_CELLS = [['12. CHIA_VUNG_CAP_XA', 'D4'], [SHEET_K, 'B13'], ['QUY_TAC_MA', 'C4']];
  var R4_TEXT = 'Mẫu chung';
  // K1 (bản 1.5.1): ô đúng "XXX" có nhãn mã ở ô bên trái là ô mã (UBND v9: JUDGE_HD07!B10 cạnh "Tiền tố")
  var K1_LABELS = ['Tiền tố', 'Mã đơn vị', 'Mã xã', 'Mã xã, phường', 'Mã xã/phường', 'Mã cơ quan', 'Mã đơn vị sự nghiệp'];
  var K1_TRIM = /^[ \t\r\n]+|[ \t\r\n:]+$/g;
  var R4_COLS = {}; R4_COLS[SHEET_T] = ['B', 4]; R4_COLS[SHEET_S] = ['C', 3];
  var DATA_SHEET_RE = /^(?:\d+\.\s*)?(?:A1_|A2_|B1_|B2_CT|B2_ThayDoi|C1_|C2_|C3_|D1_|D2_|DM_SAN_PHAM$|CHIA_VUNG_CAP_XA$)/;

  function xaOk(code) { return XA_RE.test(code); }
  var KIND = {
    dang: {
      label: 'Khối Đảng, MTTQ cấp xã',
      codeOk: xaOk,
      steps: function (code) { return [['ma', 'XXX-', code + '-']]; },
      fileName: function (code, d) { return code + '_K2526_v1_' + d + '.xlsx'; }
    },
    ubnd: {
      label: 'Khối chính quyền cấp xã',
      codeOk: xaOk,
      steps: function (code) { return [['ma', 'XXX-', code + '-']]; },
      fileName: function (code, d) { return code + '_K2526_v1_' + d + '.xlsx'; }
    },
    dvsn: {
      label: 'Đơn vị sự nghiệp thuộc UBND xã',
      codeOk: function (code) { var m = /^([XP]\d{2})-([A-Z0-9]{2,10})$/.exec(code); return !!m && xaOk(m[1]); },
      steps: function (code, dv) {
        var p = code.split('-'), xa = p[0], unit = p.slice(1).join('-');
        return [['nv', 'XXX-SN-A1-' + dv + '-', xa + '-SN-A1-' + unit + '-'], ['vt', 'XXX-' + dv + '-', xa + '-' + unit + '-'],
          ['sp', 'XXX-SP-', xa + '-SP-'], ['ma', 'XXX-', xa + '-']];
      },
      fileName: function (code, d) { return code + '_K2526_v1_' + d + '.xlsx'; }
    },
    truong: {
      label: 'Trường THCS–THPT thuộc Sở',
      codeOk: function (code) { return /^[A-Z0-9]{2,10}$/.test(code); },
      steps: function (code) { return [['ma', 'SGDDT-THCSTHPT-', 'SGDDT-' + code + '-']]; },
      // T6: F01 của engine nhận "SGDDT-<mã>_K2526_v1_<ddmmyyyy>.xlsx" (mã cơ quan [^_]+ có thể chứa gạch nối)
      fileName: function (code, d) { return f01Ok('SGDDT-' + code + '_K2526_v1_' + d + '.xlsx') ? 'SGDDT-' + code + '_K2526_v1_' + d + '.xlsx' : code + '_K2526_v1_' + d + '.xlsx'; }
    }
  };
  // bản sao parseFileName + F01 của engine Rà soát 9 biểu 1.1
  function f01Ok(name) {
    var m = /^([^_]+)_K2526_v(\d+)_(\d{2})(\d{2})(\d{4})\.xlsx$/i.exec(name);
    if (!m) return false;
    var d = +m[3], mo = +m[4], y = +m[5];
    if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 2026 || y > 2027) return false;
    return !/^(XXX|PXX|X00|P00)$/i.test(m[1]);
  }

  // ---------- chuỗi, XML ----------
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function unesc(s) {
    return String(s).replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, function (m, e) {
      if (e === 'lt') return '<'; if (e === 'gt') return '>'; if (e === 'amp') return '&';
      if (e === 'quot') return '"'; if (e === 'apos') return "'";
      return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    });
  }
  var T_RE = /(<t(?:\s[^>]*)?>)([\s\S]*?)(<\/t>)/g;
  var CELL_RE = /<c(?=[\s>\/])([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  var ROW_RE = /<row(?=[\s>\/])([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;
  var ATTR_RE = {};
  function attr(attrs, name) {
    var re = ATTR_RE[name] || (ATTR_RE[name] = new RegExp('(?:^|\\s)' + name + '="([^"]*)"'));
    var m = re.exec(attrs || ''); return m ? m[1] : null;
  }
  function stripT(attrs) { return attrs.replace(/\s+t="[^"]*"/g, ''); }
  function colOf(ref) { return /^[A-Z]+/.exec(ref)[0]; }
  function rowOf(ref) { return +/\d+/.exec(ref)[0]; }
  function colIdx(c) { var n = 0; for (var i = 0; i < c.length; i++) n = n * 26 + c.charCodeAt(i) - 64; return n; }
  // số viết vào ô như Python split_unit.set_number: str(int(x)) khi tròn, ngược lại repr(float(x))
  function pyNum(x) {
    if (Number.isInteger(x)) return BigInt(x).toString();
    var a = Math.abs(x);
    if (a !== 0 && a < 1e-4) {
      var e = x.toExponential().split('e'), exp = +e[1];
      return e[0] + 'e' + (exp < 0 ? '-' : '+') + String(Math.abs(exp)).padStart(2, '0');
    }
    return String(x);
  }
  function inlineCell(attrsNoT, text) { return '<c' + attrsNoT + ' t="inlineStr"><is><t xml:space="preserve">' + esc(text) + '</t></is></c>'; }
  function tTexts(inner) {
    inner = inner.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
    var out = '', m; T_RE.lastIndex = 0;
    while ((m = T_RE.exec(inner))) out += unesc(m[2]);
    return out;
  }
  function siTexts(xml) {
    var out = [], re = /<si>([\s\S]*?)<\/si>|<si\/>/g, m;
    while ((m = re.exec(xml))) out.push(tTexts(m[1] || ''));
    return out;
  }
  function cellValue(attrs, inner, sst) {
    // giá trị như lưu trong ô (null = không có giá trị)
    if (!inner) return null;
    var t = attr(attrs, 't') || 'n', m;
    if (t === 's') { m = /<v>([\s\S]*?)<\/v>/.exec(inner); return m ? (sst[+m[1]] == null ? null : sst[+m[1]]) : null; }
    if (t === 'inlineStr') { m = /<is>([\s\S]*?)<\/is>/.exec(inner); return m ? tTexts(m[1]) : ''; }
    m = /<v>([\s\S]*?)<\/v>/.exec(inner);
    return m ? unesc(m[1]) : null;
  }
  function dataSpan(x) {
    var s0 = x.indexOf('<sheetData'), s1 = x.indexOf('</sheetData>');
    if (s0 < 0) throw new Error('Trang không có sheetData');
    return s1 < 0 ? [s0, s0] : [s0, s1];
  }
  function eachMatch(re, x, s0, s1, fn) {
    var sub = x.slice(s0, s1), m; re.lastIndex = 0;
    while ((m = re.exec(sub))) fn(m, s0 + m.index, s0 + m.index + m[0].length);
  }
  function countOf(s, f) { return s.indexOf(f) < 0 ? 0 : s.split(f).length - 1; }
  function bump(o, k, n) { o[k] = (o[k] || 0) + (n == null ? 1 : n); }

  // ---------- T1: R1 mã, rồi tên (R2, R5, R6); dòng lịch sử giữ nguyên ----------
  function Plan(kind, code, dv, place) {
    this.kind = kind; this.code = code; this.dv = dv || null;
    this.steps = KIND[kind].steps(code, dv);
    this.names = kind !== 'truong';
    if (this.names) {
      if (!place || !place.full || !place.typ || place.full.indexOf(place.typ + ' ') !== 0) throw new Error('Chưa có tên xã, phường của đơn vị (Phụ lục 1).');
      this.typ = place.typ.toLowerCase(); this.name = place.full.slice(place.typ.length + 1);
    }
  }
  Plan.prototype.tokenLeft = function (s) { for (var i = 0; i < this.steps.length; i++) if (s.indexOf(this.steps[i][1]) >= 0) return true; return false; };
  function codesText(s, P, cnt, part) {
    P.steps.forEach(function (st) { var n = countOf(s, st[1]); if (n) { bump(cnt, st[0] + '|' + part, n); s = s.split(st[1]).join(st[2]); } });
    return s;
  }
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function namesText(s, P, cnt) {
    return s.replace(new RegExp(NAME_SRC, 'g'), function (m, w, off) {
      if (w) {
        bump(cnt, 'R2');
        if (w === w.toUpperCase()) return P.typ.toUpperCase() + ' ' + esc(P.name.toUpperCase());
        var t = (w.charAt(0) !== w.charAt(0).toLowerCase() || off === 0) ? cap1(P.typ) : P.typ;
        return t + ' ' + esc(P.name);
      }
      bump(cnt, 'ten');
      return (off === 0 ? cap1(P.typ) : P.typ) + ' ' + esc(P.name);
    });
  }
  function isR6(text) { return R6_EXACT.indexOf(text) >= 0 || R6_RE.test(text); }
  function renamable(text) { return text !== 'XXX' && text.indexOf(PLACEHOLDER) < 0 && NAME_TEST.test(text) && !isR6(text); }
  function notPlain(text) { return new Error('Chuỗi có XXX cần đổi tên nhưng nhiều đoạn định dạng hoặc không ở dạng NFC, cần xem tay: ' + text.slice(0, 100)); }
  function hasWork(s, P) { return P.tokenLeft(s) || (P.names && s.indexOf('XXX') >= 0); }
  function t1Runs(body, P, cnt, part) {
    var nw = body;
    if (P.tokenLeft(nw)) nw = nw.replace(T_RE, function (tm, a, txt, b) { return a + codesText(txt, P, cnt, part) + b; });
    if (P.names && nw.indexOf('XXX') >= 0) {
      var now = tTexts(nw);
      if (renamable(now)) {
        if ((nw.match(T_RE) || []).length !== 1 || now.normalize('NFC') !== now) throw notPlain(now);
        nw = nw.replace(T_RE, function (tm, a, txt, b) { return a + namesText(txt, P, cnt) + b; });
      }
    }
    return nw;
  }
  function t1Value(v, P, cnt) {
    var nw = P.tokenLeft(v) ? codesText(v, P, cnt, 'str') : v;
    if (P.names && nw.indexOf('XXX') >= 0) {
      var now = unesc(nw);
      if (renamable(now)) { if (now.normalize('NFC') !== now) throw notPlain(now); nw = namesText(nw, P, cnt); }
    }
    return nw;
  }
  function inSpan(span, ref) { return !!span && rowOf(ref) >= span[0] && rowOf(ref) <= span[1]; }
  // chuỗi dùng chung mà ô ở dòng lịch sử dùng: { chỉ số: [ô] }
  function histUsers(x, sheet, span, hist) {
    var sp = dataSpan(x);
    eachMatch(CELL_RE, x, sp[0], sp[1], function (m) {
      if (attr(m[1], 't') !== 's' || !m[2]) return;
      var v = /<v>(\d+)<\/v>/.exec(m[2]), ref = attr(m[1], 'r');
      if (v && inSpan(span, ref)) (hist[+v[1]] = hist[+v[1]] || []).push(sheet + '!' + ref);
    });
  }
  function t1Sst(x, P, cnt, hist) {
    var out = [], last = 0, re = /<si>([\s\S]*?)<\/si>|<si\/>/g, m, i = -1, res = { changed: 0, n: 0, kept: 0, histChanged: {} };
    while ((m = re.exec(x))) {
      i++;
      var inner = m[1];
      if (!inner || !hasWork(inner, P)) continue;
      var text = tTexts(inner);
      if (text.indexOf(PLACEHOLDER) >= 0) { res.kept++; continue; }
      var c = {}, nw = t1Runs(inner, P, c, 'sst');
      if (nw === inner) continue;
      if (hist[i]) { res.histChanged[i] = text; continue; }
      Object.keys(c).forEach(function (k) { bump(cnt, k, c[k]); res.n += c[k]; });
      res.changed++;
      var s1 = m.index + 4;
      out.push(x.slice(last, s1), nw); last = s1 + inner.length;
    }
    out.push(x.slice(last));
    res.xml = out.join('');
    return res;
  }
  function t1Sheet(x, P, cnt, span) {
    var res = { xml: x, changed: 0, n: 0, kept: 0 };
    if (!hasWork(x, P)) return res;
    var sp = dataSpan(x), out = [], last = 0;
    eachMatch(CELL_RE, x, sp[0], sp[1], function (m, s) {
      var a = m[1], inner = m[2], t = attr(a, 't');
      if (!inner || (t !== 'inlineStr' && t !== 'str') || !hasWork(inner, P)) return;
      var ref = attr(a, 'r'), mm = (t === 'inlineStr' ? /<is>([\s\S]*?)<\/is>/ : /<v>([\s\S]*?)<\/v>/).exec(inner);
      if (!mm) return;
      var text = t === 'inlineStr' ? tTexts(mm[1]) : unesc(mm[1]);
      if (!hasWork(text, P)) return;
      if (text.indexOf(PLACEHOLDER) >= 0) { res.kept++; return; }
      if (inSpan(span, ref)) return;
      var c = {}, body = t === 'inlineStr' ? t1Runs(mm[1], P, c, 'inlineStr') : t1Value(mm[1], P, c);
      if (body === mm[1]) return;
      Object.keys(c).forEach(function (k) { bump(cnt, k, c[k]); res.n += c[k]; });
      res.changed++;
      var i0 = s + 2 + a.length + 1, s1 = i0 + mm.index + (t === 'inlineStr' ? 4 : 3); // "<c" + attrs + ">", rồi "<is>" / "<v>"
      out.push(x.slice(last, s1), body); last = s1 + mm[1].length;
    });
    if (!res.changed) return res;
    out.push(x.slice(last));
    res.xml = out.join('');
    return res;
  }
  // mã tạm còn trong ô chữ sau T1 (ngoài ghi chú "<mã" và dòng lịch sử)
  function tokensLeftSheet(x, P, sst, span, found) {
    var sp = dataSpan(x), n = 0;
    eachMatch(CELL_RE, x, sp[0], sp[1], function (m) {
      var t = attr(m[1], 't');
      if (!m[2] || (t !== 'inlineStr' && t !== 'str') || inSpan(span, attr(m[1], 'r'))) return;
      var v = cellValue(m[1], m[2], sst) || '';
      if (v.indexOf(PLACEHOLDER) < 0) P.steps.forEach(function (st) { var c = countOf(v, st[1]); n += c; if (c && found) found[st[1]] = 1; });
    });
    return n;
  }
  function idxCol(n) { var out = ''; while (n) { var r = (n - 1) % 26; out = String.fromCharCode(65 + r) + out; n = Math.floor((n - 1) / 26); } return out; }
  function isR3(name, ref) { return R3_CELLS.some(function (c) { return c[0] === name && c[1] === ref; }); }
  // K1: ô đúng "XXX" (ngoài dòng lịch sử, ô R3 và dòng 3 của 14. T_TienDo) có nhãn mã ở ô bên trái: [[ô, nhãn]] theo thứ tự trên trang
  function k1Cells(x, sst, span, name) {
    var sp = dataSpan(x), vals = {}, order = [], out = [];
    eachMatch(CELL_RE, x, sp[0], sp[1], function (m) { var ref = attr(m[1], 'r'); vals[ref] = cellValue(m[1], m[2], sst); order.push(ref); });
    order.forEach(function (ref) {
      if (vals[ref] !== 'XXX' || inSpan(span, ref) || isR3(name, ref) || (name === SHEET_T && rowOf(ref) === 3)) return;
      var c = colIdx(colOf(ref)), left = c > 1 ? vals[idxCol(c - 1) + rowOf(ref)] : null;
      if (typeof left === 'string') { var lab = left.replace(K1_TRIM, ''); if (K1_LABELS.indexOf(lab) >= 0) out.push([ref, lab]); }
    });
    return out;
  }
  // "XXX" còn lại trên một trang, theo loại; ô chỉ có "XXX"; số chỗ trong phạm vi R7
  function residueSheet(name, x, sst, span, t5Row, acc) {
    var sp = dataSpan(x), d = {}, data = 0;
    eachMatch(CELL_RE, x, sp[0], sp[1], function (m) {
      var v = cellValue(m[1], m[2], sst);
      if (typeof v !== 'string' || v.indexOf('XXX') < 0) return;
      var ref = attr(m[1], 'r'), n = countOf(v, 'XXX');
      if (v.indexOf(PLACEHOLDER) >= 0) bump(d, 'ghi_chu_<mã', n);
      else if (inSpan(span, ref)) bump(d, 'R4_lich_su', n);
      else if (name === SHEET_S && rowOf(ref) === t5Row) bump(d, 'T5_dong_moi', n);
      else {
        for (var p = v.indexOf('XXX'); p >= 0; p = v.indexOf('XXX', p + 3)) {
          if (v.charAt(p + 3) === '_') bump(d, 'R5_ten_tep');
          else if (v === 'XXX') { bump(d, 'o_chi_XXX'); acc.exact.push(name + '!' + ref); }
          else if (isR6(v)) bump(d, 'R6');
          else bump(d, 'khac');
        }
      }
      if (DATA_SHEET_RE.test(name) || (name === SHEET_T && rowOf(ref) === 3)) data += n;
    });
    if (Object.keys(d).length) acc.per[name] = d;
    if (data) acc.data[name] = data;
  }

  // ---------- sửa ô trên một trang (một lượt) ----------
  function SheetEdit(x, sst) {
    var self = this;
    this.x = x; this.sst = sst; this.cells = {}; this.rows = {}; this.newCells = {}; this.order = []; this.sRemoved = 0;
    var sp = dataSpan(x);
    eachMatch(CELL_RE, x, sp[0], sp[1], function (m, s, e) { self.cells[attr(m[1], 'r')] = { s: s, e: e, a: m[1], inner: m[2] }; });
    eachMatch(ROW_RE, x, sp[0], sp[1], function (m, s, e) { self.rows[+attr(m[1], 'r')] = { s: s, e: e, a: m[1], inner: m[2] }; });
  }
  SheetEdit.prototype.value = function (ref) { var c = this.cells[ref]; return c ? cellValue(c.a, c.inner, this.sst) : null; };
  SheetEdit.prototype.hasFormula = function (ref) { var c = this.cells[ref]; return !!(c && c.inner && /<f[\s>\/]/.test(c.inner)); };
  SheetEdit.prototype.styleOf = function (ref) { var c = this.cells[ref]; return c ? attr(c.a, 's') : null; };
  SheetEdit.prototype.lastDataRow = function () {
    var last = 0, self = this;
    Object.keys(this.cells).forEach(function (ref) { var v = self.value(ref); if (v != null && v !== '') last = Math.max(last, rowOf(ref)); });
    return last;
  };
  // force = true: ghi đè cả ô công thức (bản 1.4.2: Huong_dan!B4 của phiếu vị trí), như split_unit.SheetEdit.set_text(force=True)
  SheetEdit.prototype.setText = function (ref, text, styleFrom, force) {
    if (this.newCells[ref] != null) throw new Error('Sửa trùng ô ' + ref);
    if (!force && this.hasFormula(ref)) throw new Error('Ô ' + ref + ' đang có công thức');
    var c = this.cells[ref], attrs;
    if (styleFrom != null) attrs = ' r="' + ref + '" s="' + styleFrom + '"';
    else if (c) attrs = stripT(c.a);
    else attrs = ' r="' + ref + '"';
    if (c && attr(c.a, 't') === 's') this.sRemoved++;
    this.newCells[ref] = inlineCell(attrs, text); this.order.push(ref);
  };
  SheetEdit.prototype.setNumber = function (ref, num, style) { // style (Tạo tệp 1.6.0, ô cam điền sẵn): chỉ r và s
    if (this.newCells[ref] != null) throw new Error('Sửa trùng ô ' + ref);
    if (this.hasFormula(ref)) throw new Error('Ô ' + ref + ' đang có công thức');
    if (typeof num !== 'number' || !isFinite(num)) throw new Error('Giá trị số không hợp lệ ở ô ' + ref);
    var c = this.cells[ref], attrs = style != null ? ' r="' + ref + '" s="' + style + '"' : c ? stripT(c.a) : ' r="' + ref + '"';
    if (c && attr(c.a, 't') === 's') this.sRemoved++;
    this.newCells[ref] = '<c' + attrs + '><v>' + pyNum(num) + '</v></c>'; this.order.push(ref);
  };
  SheetEdit.prototype.apply = function () {
    var self = this, edits = [], inserts = {};
    this.order.forEach(function (ref) {
      var c = self.cells[ref], xml = self.newCells[ref];
      if (c) edits.push([c.s, c.e, xml]);
      else (inserts[rowOf(ref)] = inserts[rowOf(ref)] || []).push([colIdx(colOf(ref)), ref, xml]);
    });
    Object.keys(inserts).forEach(function (k) {
      var r = +k, lst = inserts[k].sort(function (p, q) { return p[0] - q[0] || (p[1] < q[1] ? -1 : p[1] > q[1] ? 1 : 0); });
      var row = self.rows[r];
      if (row) {
        var body = row.inner || '', cells = [], m; CELL_RE.lastIndex = 0;
        while ((m = CELL_RE.exec(body))) cells.push([colIdx(colOf(attr(m[1], 'r'))), m[0]]);
        var merged = cells.concat(lst.map(function (t) { return [t[0], t[2]]; }));
        merged = merged.map(function (t, i) { return [t[0], i, t[1]]; }).sort(function (p, q) { return p[0] - q[0] || p[1] - q[1]; });
        edits.push([row.s, row.e, '<row' + row.a + '>' + merged.map(function (t) { return t[2]; }).join('') + '</row>']);
      } else {
        var prev = null;
        Object.keys(self.rows).forEach(function (rk) { rk = +rk; if (rk < r && (prev == null || rk > prev)) prev = rk; });
        if (prev == null) throw new Error('Không đặt được dòng mới ' + r);
        var pr = self.rows[prev], ra = pr.a.replace(/(\sr=")\d+(")/, '$1' + r + '$2');
        edits.push([pr.e, pr.e, '<row' + ra + '>' + lst.map(function (t) { return t[2]; }).join('') + '</row>']);
      }
    });
    edits.sort(function (p, q) { return p[0] - q[0] || p[1] - q[1]; });
    var out = [], last = 0;
    edits.forEach(function (ed) {
      if (ed[0] < last) throw new Error('Sửa chồng lấn');
      out.push(self.x.slice(last, ed[0]), ed[2]); last = ed[1];
    });
    out.push(this.x.slice(last));
    return out.join('');
  };

  // ---------- các quy tắc trên trang ----------
  function t2(ed) { // B1, dòng ≥ 3: A có giá trị, K chưa có → kỳ
    var rows = {}, n = 0;
    Object.keys(ed.cells).forEach(function (ref) { if (colOf(ref) === 'A' && rowOf(ref) >= 3) rows[rowOf(ref)] = 1; });
    Object.keys(rows).map(Number).sort(function (a, b) { return a - b; }).forEach(function (r) {
      var a = ed.value('A' + r); if (a == null || String(a) === '') return;
      var k = ed.value('K' + r);
      if ((k == null || String(k) === '') && !ed.hasFormula('K' + r)) { ed.setText('K' + r, KY); n++; }
    });
    return n;
  }
  function t4(ed, fname) {
    var hits = Object.keys(ed.cells).filter(function (ref) { var v = ed.value(ref); return typeof v === 'string' && TEMPLATE_FILE_RE.test(v) && !ed.hasFormula(ref); });
    hits.forEach(function (ref) { ed.setText(ref, fname); });
    return hits;
  }
  function t5(ed, code, name, date, kind, dv) {
    var L = ed.lastDataRow(), n = L + 1;
    var vals = [['A', KY], ['B', LOG_FIXED.B], ['C', code], ['D', LOG_FIXED.D], ['E', LOG_OLD[kind].replace('{loai}', dv || '')], ['F', name], ['G', LOG_SOURCE[kind]],
      ['I', date.slice(0, 2) + '/' + date.slice(2, 4) + '/' + date.slice(4)], ['J', code + '-v1']];
    vals.forEach(function (cv) { var st = ed.styleOf(cv[0] + L) || ed.styleOf('A' + L); ed.setText(cv[0] + n, cv[1], st); });
    return { row: n, lastDataRow: L, rowExisted: !!ed.rows[n] };
  }

  // ---------- gói xlsx ----------
  function sheetMap(wbXml, relsXml) {
    var rid = {}, m, re = /<Relationship\b[^>]*>/g;
    while ((m = re.exec(relsXml))) { var id = attr(m[0], 'Id'), tg = attr(m[0], 'Target'); if (id) rid[id] = tg; }
    var out = [], sre = /<sheet\b[^>]*\/>/g;
    while ((m = sre.exec(wbXml))) {
      var t = rid[attr(m[0], 'r:id')]; if (!t) continue;
      out.push({ name: unesc(attr(m[0], 'name')), part: t.charAt(0) === '/' ? t.replace(/^\/+/, '') : 'xl/' + t });
    }
    return out;
  }
  // 1.5.3: mã nhập trùng mã mẫu thì phép thay không đổi gì (THCSTHPT) hoặc mã ra vẫn còn mã mẫu (XXX trong mã đơn vị): chặn trước khi tách.
  // Giống code_clash của split_unit.py; trang dùng hàm này để báo ngay dưới ô nhập.
  var MA_MAU_TRUONG = ['THCSTHPT', 'SGDDT'];
  function codeClash(kind, code, dv) {
    code = String(code || '').trim().toUpperCase();
    if (kind === 'truong' && MA_MAU_TRUONG.indexOf(code) >= 0)
      return code + ' là mã mẫu dùng chung, không phải mã trường. Nhập mã trường do Sở cấp; chưa có thì đặt mã tạm, ví dụ HHN, và ghi “(mã tạm HHN)” sau tên trường.';
    if (kind === 'dvsn') {
      var unit = code.indexOf('-') >= 0 ? code.slice(code.indexOf('-') + 1) : code, L = String(dv || '').toUpperCase();
      var ex = (DVSN_LOAI.indexOf(L) >= 0 ? L : 'TH') + '01';
      if (unit.indexOf('XXX') >= 0)
        return (unit === 'XXX' ? 'XXX là mã mẫu dùng chung, không phải mã đơn vị.' : 'Mã đơn vị không được chứa XXX (mã mẫu dùng chung).') +
          ' Nhập mã đơn vị do Sở Nội vụ cấp; chưa có thì đặt mã tạm, ví dụ ' + ex + ', và ghi “(mã tạm ' + ex + ')” sau tên đơn vị.';
    }
    return '';
  }
  // 1.5.3: còn mã mẫu sau khi thay — lời dễ hiểu, mã mẫu theo thứ tự các bước thay, bỏ gạch nối cuối (giống left_msg của split_unit.py)
  function leftMsg(n, P, found) {
    var toks = P.steps.map(function (st) { return st[1]; }).filter(function (t) { return found[t]; }).map(function (t) { return t.replace(/-$/, ''); });
    return 'sau khi thay vẫn còn ' + n + ' chỗ mã mẫu (' + toks.join(', ') + '). Thường do mã nhập trùng mã mẫu — nhập mã riêng của đơn vị rồi bấm Tạo tệp lại.';
  }
  function validate(opts, needDate) {
    var k = KIND[opts.kind];
    if (!k) throw new Error('Loại mẫu không hợp lệ.');
    var code = String(opts.code || '').trim().toUpperCase();
    var dv = opts.kind === 'dvsn' ? String(opts.dv || '').toUpperCase() : null;
    if (opts.kind === 'dvsn' && DVSN_LOAI.indexOf(dv) < 0) throw new Error('Chưa chọn loại đơn vị sự nghiệp.');
    if (!k.codeOk(code)) {
      throw new Error(opts.kind === 'truong' ? 'Mã trường gồm 2–10 ký tự A–Z, 0–9.' : opts.kind === 'dvsn'
        ? 'Mã đơn vị sự nghiệp gồm mã xã, phường và mã đơn vị 2–10 ký tự A–Z, 0–9, ví dụ X52-TH01.' : 'Mã xã, phường phải là X01–X72 hoặc P01–P31.');
    }
    var clash = codeClash(opts.kind, code, dv);
    if (clash) throw new Error(clash);
    var name = String(opts.name || '').replace(/\s+/g, ' ').trim();
    if (!name) throw new Error('Chưa có tên đơn vị.');
    var d = String(opts.date || '');
    if (needDate) {
      var m = /^(\d{2})(\d{2})(\d{4})$/.exec(d), dt = m && new Date(+m[3], +m[2] - 1, +m[1]);
      if (!m || dt.getDate() !== +m[1] || dt.getMonth() !== +m[2] - 1) throw new Error('Ngày phải có dạng ddmmyyyy và là ngày có thật.');
    }
    return { k: k, code: code, dv: dv, name: name.normalize ? name.normalize('NFC') : name, date: d };
  }
  function fileNameFor(kind, code, date) { return KIND[kind].fileName(code, date); }
  function deaccent(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); }
  // Tên ngắn cho tên phiếu: phần trước "(" hoặc " – ", bỏ chữ "Trường" ở đầu và chữ "và"
  function shortName(name) {
    var s = String(name).split(/\s*\(|\s+[–—-]\s+/)[0].trim();
    s = s.replace(/^Trường\s+/i, '').replace(/\s+và\s+/gi, ' ');
    s = deaccent(s).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return s.slice(0, 60).replace(/_+$/, '') || 'Don_vi';
  }
  function formFileName(code, name) { return 'Phieu_thu_so_lieu_' + code + '_' + shortName(name) + '.xlsx'; }
  async function readText(zip, path) { var f = zip.file(path); return f ? f.async('string') : null; }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  /* Áp quy tắc lên một gói xlsx đã nạp bằng JSZip (sửa tại chỗ).
     opts: { kind:'dang'|'ubnd'|'dvsn'|'truong', dv?:'TH'… (dvsn), code (dvsn: 'X52-TH01'), name, date:'ddmmyyyy',
             place?: {full:'Xã Mỹ Tú', typ:'Xã'} (bắt buộc trừ truong), table?: bảng số chỗ thay của loại ĐVSN (dvsn, tách tệp),
             form?:bool, onProgress?(text, frac) }
     form=true: phiếu thu số liệu — chỉ T1 và tên đơn vị ở 'Huong_dan'!B2. Lỗi thì ném Error (không ghi gì ra ngoài). */
  async function applyRules(zip, opts) {
    var v = validate(opts, !opts.form), k = v.k, P = new Plan(opts.kind, v.code, v.dv, opts.place);
    var prog = opts.onProgress || function () {};
    var enc = new TextEncoder();
    var wb = await readText(zip, 'xl/workbook.xml'), rels = await readText(zip, 'xl/_rels/workbook.xml.rels');
    if (!wb || !rels) throw new Error('Tệp mẫu không phải bảng tính Excel hợp lệ.');
    var sheets = sheetMap(wb, rels), byName = {};
    sheets.forEach(function (s) { byName[s.name] = s; });
    var report = { kind: opts.kind, dv: v.dv, code: v.code, name: v.name, date: v.date, form: !!opts.form, t1: { total: 0, parts: [], kept: 0, counts: {} },
      r3: [], k1: [], r4: [], t2: 0, t3: null, t3b: null, t4: [], t5: null, sstCount: null, xxx: null, notes: [] };
    var changed = [], puts = {};
    function put(path, xml) { puts[path] = xml; }
    var cnt = report.t1.counts;
    // dòng lịch sử của mẫu có XXX (R4): '15. S_NhatKy' dòng 3..L, '14. T_TienDo' dòng ≥ 4
    var sst0 = await readText(zip, 'xl/sharedStrings.xml'), sstX = sst0, sst0T = sst0 != null ? siTexts(sst0) : [], sst = [];
    var spans = {}, hist = {};
    if (P.names) {
      if (byName[SHEET_S]) {
        var xs = await readText(zip, byName[SHEET_S].part);
        if (xs != null) { spans[SHEET_S] = [R4_COLS[SHEET_S][1], new SheetEdit(xs, sst0T).lastDataRow()]; histUsers(xs, SHEET_S, spans[SHEET_S], hist); }
      }
      if (byName[SHEET_T]) {
        var xt = await readText(zip, byName[SHEET_T].part);
        spans[SHEET_T] = [R4_COLS[SHEET_T][1], MAX_ROW];
        if (xt != null) histUsers(xt, SHEET_T, spans[SHEET_T], hist);
      }
    }
    // T1 — chuỗi dùng chung
    var histChanged = {};
    if (sst0 != null) {
      prog('Đang thay mã trong bảng chuỗi dùng chung…', 0.02);
      var r1 = t1Sst(sst0, P, cnt, hist);
      sstX = r1.xml; histChanged = r1.histChanged; report.t1.kept += r1.kept;
      if (r1.changed) report.t1.parts.push({ part: 'xl/sharedStrings.xml', sheet: 'Chuỗi dùng chung', n: r1.n, strings: r1.changed });
      sst = siTexts(sstX);
      var leftS = 0, foundS = {};
      sst.forEach(function (t, i) { if (t.indexOf(PLACEHOLDER) < 0 && !hist[i]) P.steps.forEach(function (st) { var c = countOf(t, st[1]); if (c) { leftS += c; foundS[st[1]] = 1; } }); });
      if (leftS) throw new Error(leftMsg(leftS, P, foundS));
    }
    var hcKeys = Object.keys(histChanged).map(Number);
    // T1 — mọi trang (chuỗi trực tiếp, kết quả công thức lưu sẵn); trang còn sửa ô thì giữ lại, trang khác ghi ngay
    var keep = {};
    if (opts.form) keep[PHIEU_NAME[0]] = 1;
    else [SHEET_B1, SHEET_K, SHEET_T, SHEET_S].concat(R3_CELLS.map(function (c) { return c[0]; })).forEach(function (n) { keep[n] = 1; });
    var cache = {}, acc = { per: {}, exact: [], data: {} }, k1Map = {};
    for (var i = 0; i < sheets.length; i++) {
      var s = sheets[i];
      prog('Đang thay mã: trang ' + (i + 1) + '/' + sheets.length + ' (' + s.name + ')…', 0.05 + 0.75 * i / sheets.length);
      await tick();
      var x = await readText(zip, s.part);
      if (x == null) continue;
      if (hcKeys.length) {
        var spx = dataSpan(x);
        eachMatch(CELL_RE, x, spx[0], spx[1], function (m) {
          if (attr(m[1], 't') !== 's' || !m[2] || inSpan(spans[s.name], attr(m[1], 'r'))) return;
          var vv = /<v>(\d+)<\/v>/.exec(m[2]);
          if (vv && histChanged[+vv[1]] != null) throw new Error('Chuỗi dùng chung “' + histChanged[+vv[1]].slice(0, 80) + '” có ở dòng lịch sử (' + hist[+vv[1]].slice(0, 3).join(', ') + ') và ở ô khác: không tách được.');
        });
      }
      var r = t1Sheet(x, P, cnt, spans[s.name]);
      if (r.changed) report.t1.parts.push({ part: s.part, sheet: s.name, n: r.n, cells: r.changed });
      report.t1.kept += r.kept;
      var found = {}, left = tokensLeftSheet(r.xml, P, sst, spans[s.name], found);
      if (left) throw new Error(leftMsg(left, P, found));
      var k1 = opts.form ? [] : k1Cells(r.xml, sst, spans[s.name], s.name);
      if (k1.length) k1Map[s.name] = k1;
      if (keep[s.name] || k1.length) cache[s.name] = { xml: r.xml, dirty: r.changed > 0 };
      else {
        residueSheet(s.name, r.xml, sst, spans[s.name], null, acc);
        if (r.changed) put(s.part, r.xml);
      }
    }
    Object.keys(cnt).forEach(function (kk) { report.t1.total += cnt[kk]; });
    if (opts.kind === 'dvsn' && !opts.form) {
      var tbl = opts.table;
      if (!tbl || !tbl.mau_thay) throw new Error('Thiếu bảng số chỗ thay của mẫu đơn vị sự nghiệp ' + v.dv + '.');
      var got = {}, want = {};
      P.steps.forEach(function (st) {
        Object.keys(cnt).forEach(function (kk) { var p = kk.split('|'); if (p[0] === st[0]) (got[st[1]] = got[st[1]] || {})[p[1]] = cnt[kk]; });
      });
      tbl.mau_thay.forEach(function (pt) { want[pt.tim] = pt.theo_phan; });
      var canon = function (o) { return JSON.stringify(Object.keys(o).sort().map(function (kk) { return [kk, Object.keys(o[kk]).sort().map(function (q) { return [q, o[kk][q]]; })]; })); };
      report.dvsnCounts = { want: want, got: got };
      if (canon(got) !== canon(want)) throw new Error('Số chỗ thay khác bảng đã rà soát của mẫu ' + v.dv + ': ' + JSON.stringify(got) + ' ≠ ' + JSON.stringify(want));
    }
    var sRemoved = 0;
    function edit(sheet, fn) {
      if (!cache[sheet]) return null;
      var ed = new SheetEdit(cache[sheet].xml, sst), res = fn(ed);
      if (ed.order.length) { cache[sheet].xml = ed.apply(); cache[sheet].dirty = true; sRemoved += ed.sRemoved; }
      return res;
    }
    var t5Row = null;
    if (opts.form) {
      edit(PHIEU_NAME[0], function (ed) { ed.setText(PHIEU_NAME[1], v.name); });
    } else {
      var fname = k.fileName(v.code, v.date);
      report.fileName = fname;
      prog('Đang điền mã, kỳ, tên đơn vị, nhật ký…', 0.82);
      R3_CELLS.forEach(function (rc) {
        edit(rc[0], function (ed) { if (ed.value(rc[1]) === 'XXX') { ed.setText(rc[1], v.code); report.r3.push(rc[0] + '!' + rc[1]); } });
      });
      sheets.forEach(function (sh) {
        var hits = k1Map[sh.name];
        if (hits) edit(sh.name, function (ed) { hits.forEach(function (h) { ed.setText(h[0], v.code); report.k1.push(sh.name + '!' + h[0] + ' (nhãn “' + h[1] + '”)'); }); });
      });
      [SHEET_T, SHEET_S].forEach(function (sheet) {
        if (!spans[sheet]) return;
        var col = R4_COLS[sheet][0], sp4 = spans[sheet];
        edit(sheet, function (ed) {
          Object.keys(ed.cells).filter(function (ref) { return colOf(ref) === col && inSpan(sp4, ref); })
            .sort(function (a, b) { return rowOf(a) - rowOf(b); })
            .forEach(function (ref) { if (ed.value(ref) === 'XXX') { ed.setText(ref, R4_TEXT); report.r4.push(sheet + '!' + ref); } });
        });
      });
      report.t2 = edit(SHEET_B1, t2) || 0;
      edit(SHEET_T, function (ed) {
        ed.setText('A3', v.name); report.t3 = SHEET_T + '!A3';
        var b3 = ed.value('B3');
        if (!(typeof b3 === 'string' && b3.indexOf('K2526') === 0)) { ed.setText('B3', 'K2526'); report.t3b = b3; }
      });
      report.t4 = (edit(SHEET_K, function (ed) { return t4(ed, fname); }) || []).map(function (ref) { return SHEET_K + '!' + ref; });
      if (!report.t4.length) report.notes.push('T4: trang kiểm tra không có ô ghi tên tệp mẫu; không đổi.');
      var r5 = edit(SHEET_S, function (ed) { return t5(ed, v.code, v.name, v.date, opts.kind, v.dv); });
      if (r5) { report.t5 = { sheet: SHEET_S, row: r5.row, lastDataRow: r5.lastDataRow, rowExisted: r5.rowExisted }; t5Row = r5.row; }
    }
    // kiểm tra kết quả: R7 (mẫu có XXX), đơn vị sự nghiệp không còn XXX
    Object.keys(cache).forEach(function (nm) { residueSheet(nm, cache[nm].xml, sst, spans[nm], t5Row, acc); });
    var byS = {}; Object.keys(acc.per).forEach(function (nm) { var d = acc.per[nm]; byS[nm] = Object.keys(d).reduce(function (a, q) { return a + d[q]; }, 0); });
    report.xxx = { bySheet: byS, detail: acc.per, exact: acc.exact, dataScope: acc.data };
    if (P.names && !opts.form && Object.keys(acc.data).length) throw new Error('R7: còn XXX trong biểu dữ liệu: ' + JSON.stringify(acc.data));
    if (opts.kind === 'dvsn' && !opts.form) {
      var rest = {};
      Object.keys(acc.per).forEach(function (nm) { Object.keys(acc.per[nm]).forEach(function (q) { if (q !== 'T5_dong_moi') bump(rest, nm, acc.per[nm][q]); }); });
      if (Object.keys(rest).length) throw new Error('Đơn vị sự nghiệp: còn XXX sau khi thay: ' + JSON.stringify(rest));
    }
    // ô t="s" thành chuỗi trực tiếp: giảm count của <sst> (uniqueCount và danh sách <si> giữ nguyên)
    if (sRemoved && sstX != null) {
      sstX = sstX.replace(/(<sst\b[^>]*?\scount=")(\d+)(")/, function (m, a, n, b) { report.sstCount = [+n, +n - sRemoved]; return a + (+n - sRemoved) + b; });
    }
    if (sstX != null && sstX !== sst0) put('xl/sharedStrings.xml', sstX);
    Object.keys(cache).forEach(function (nm) { if (cache[nm].dirty) put(byName[nm].part, cache[nm].xml); });
    // chỉ ghi vào gói khi mọi kiểm tra đã qua
    Object.keys(puts).forEach(function (path) {
      var f = zip.file(path);
      zip.file(path, enc.encode(puts[path]), { binary: true, createFolders: false, date: f ? f.date : undefined, unixPermissions: f ? f.unixPermissions : undefined, dosPermissions: f ? f.dosPermissions : undefined });
      changed.push(path);
    });
    report.changedParts = changed.slice().sort();
    return report;
  }

  /* Tạo tệp: nạp mẫu, áp quy tắc, nén lại DEFLATE. type: 'blob' | 'uint8array' | 'nodebuffer' */
  async function build(JSZip, data, opts, type) {
    var prog = opts.onProgress || function () {};
    prog('Đang mở tệp mẫu…', 0.01);
    var zip = await JSZip.loadAsync(data);
    var report = await applyRules(zip, opts);
    prog('Đang nén tệp…', 0.86);
    var out = await zip.generateAsync({ type: type || 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: MIME },
      function (meta) { prog('Đang nén tệp…', 0.86 + 0.14 * (meta.percent / 100)); });
    return { data: out, report: report };
  }

  return { KY: KY, MIME: MIME, KIND: KIND, DVSN_LOAI: DVSN_LOAI, build: build, applyRules: applyRules, fileNameFor: fileNameFor, formFileName: formFileName,
    shortName: shortName, deaccent: deaccent, validate: validate, codeClash: codeClash, f01Ok: f01Ok, xaOk: xaOk,
    _t: { t1Sst: t1Sst, t1Sheet: t1Sheet, SheetEdit: SheetEdit, siTexts: siTexts, esc: esc, namesText: namesText, renamable: renamable, Plan: Plan },
    internals: { SheetEdit: SheetEdit, siTexts: siTexts, tTexts: tTexts, sheetMap: sheetMap, unesc: unesc, esc: esc, attr: attr,
      colOf: colOf, rowOf: rowOf, colIdx: colIdx, f01Ok: f01Ok, pyNum: pyNum, dataSpan: dataSpan, CELL_RE: CELL_RE, ROW_RE: ROW_RE, cellValue: cellValue, KY: KY, LOG_FIXED: LOG_FIXED, MIME: MIME } };
}));
