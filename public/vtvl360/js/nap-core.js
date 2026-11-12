/* Tạo tệp đơn vị — lõi "Nạp phiếu" bản 1.4.2 (phiếu điền sẵn: SPEC_GOIY_DIEN_SAN E6; gợi ý: SPEC_GOIY G4; gộp: bản 1.3; phiếu một người/vị trí không nạp D1): nạp MỘT hoặc NHIỀU phiếu (phiếu đầy đủ của bước 3, phiếu một người của
   trang "Bấm giờ công việc") vào tệp đơn vị, gộp theo SPEC_MERGE_BAMGIO phần A. Cùng quy tắc và cùng byte trong mọi phần
   XML đã đổi với pilot/scripts/nap_phieu.py. Cột nhận theo TIÊU ĐỀ; KHÔNG tin giá trị công thức lưu sẵn: phút/SP tính lại
   từ giờ bắt đầu, giờ kết thúc, số sản phẩm. Ghi tệp đơn vị bằng sửa chuỗi XML (JSZip), không ghi lại bằng thư viện
   bảng tính. Chạy được trong trình duyệt (window.VTVLNap) và trong Node (module.exports). */
(function (root, factory) {
  var S = root && root.VTVLSplit ? root.VTVLSplit : (typeof require === 'function' ? require('./split-core.js') : null);
  var api = factory(S);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VTVLNap = api;
}(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';
  var I = S.internals, KY = I.KY;
  var TT_KIEM_DEM = 'Kiểm đếm, ước lượng thực tế', I_MANUAL = 'Ước lượng của người thực hiện', D1_STATUS = 'Chưa kiểm chứng';
  var LOG_FIELD = 'Nạp phiếu thu số liệu', LOG_SPLIT = I.LOG_FIXED.D;
  var SHEET_B1 = '3. B1_KhoiLuong', SHEET_D1 = '9. D1_NhanLuc', SHEET_S = '15. S_NhatKy';
  var FORM_KINDS = { day_du: 'Phiếu đầy đủ', mot_nguoi: 'Phiếu một người' };
  var READ_SHEETS = ['Huong_dan', 'Thong_tin_don_vi', 'Phieu_B1', 'Do_thoi_gian', 'Phieu_D1', 'Thong_tin_tep'];
  var NEED_SHEETS = ['Phieu_B1', 'Do_thoi_gian'], HEADER_SCAN = 20;
  // [khóa tiêu đề, tiêu đề như phiếu đầy đủ, bắt buộc] — cùng thứ tự với nap_phieu.COLS
  var COL_SHEETS = ['Phieu_B1', 'Do_thoi_gian', 'Phieu_D1'];
  var COLS = {
    Phieu_B1: [['mã vtvl', 'Mã VTVL', false], ['mã công việc', 'Mã công việc', true],
      ['số sản phẩm trong kỳ', 'Số sản phẩm trong kỳ (nhập)', true], ['nguồn số liệu', 'Nguồn số liệu (nhập)', false],
      ['phút/sp nhập tay nếu không đo', 'Phút/SP nhập tay nếu không đo', false], ['người xác nhận', 'Người xác nhận', false],
      ['gợi ý phút/sp', 'Gợi ý phút/SP', false], ['căn cứ gợi ý', 'Căn cứ gợi ý', false], ['gợi ý số sp/năm', 'Gợi ý số SP/năm', false],
      ['gợi ý phút/sp ban đầu', 'Gợi ý phút/SP ban đầu', false], ['gợi ý số sp ban đầu', 'Gợi ý số SP ban đầu', false],
      ['gợi ý nguồn ban đầu', 'Gợi ý nguồn ban đầu', false]],
    Do_thoi_gian: [['mã công việc', 'Mã công việc', true], ['ngày', 'Ngày', false], ['giờ bắt đầu', 'Giờ bắt đầu (hh:mm)', true],
      ['giờ kết thúc', 'Giờ kết thúc (hh:mm)', true], ['số sản phẩm làm được', 'Số sản phẩm làm được', true],
      ['người đo', 'Người đo (chức danh, không cần họ tên)', false]],
    Phieu_D1: [['mã nguồn lực', 'Mã nguồn lực', true], ['mã vtvl', 'Mã VTVL', true], ['loại nhân lực', 'Loại nhân lực', false],
      ['giờ/năm dành cho vị trí', 'Giờ/năm dành cho vị trí', false], ['giờ/năm việc khác', 'Giờ/năm việc khác', false],
      ['nơi tính biên chế', 'Nơi tính biên chế', false], ['nguồn', 'Nguồn (quyết định, hợp đồng)', false]]
  };
  var B1_FIELDS = [['số sản phẩm trong kỳ', 'Số sản phẩm trong kỳ'], ['nguồn số liệu', 'Nguồn số liệu'],
    ['phút/sp nhập tay nếu không đo', 'Phút/SP nhập tay'], ['người xác nhận', 'Người xác nhận']];
  // giá trị ban đầu của ô nhập: cột "… ban đầu" của phiếu 1.4.2, không có thì cột gợi ý của phiếu 1.4 (= nap_phieu.SUG_OF)
  var SUG_OF = { 'số sản phẩm trong kỳ': ['gợi ý số sp ban đầu', 'gợi ý số sp/năm'],
    'phút/sp nhập tay nếu không đo': ['gợi ý phút/sp ban đầu', 'gợi ý phút/sp'], 'nguồn số liệu': ['gợi ý nguồn ban đầu'] };
  var SUG_KEYS = ['gợi ý phút/sp', 'căn cứ gợi ý', 'gợi ý số sp/năm', 'gợi ý phút/sp ban đầu', 'gợi ý số sp ban đầu', 'gợi ý nguồn ban đầu'];
  var SUG_SEP = ' — Số SP/năm: ', H_CHU_KY = 'Chu kỳ ghi trong tên sản phẩm; cần đối chiếu sổ sách';
  var SLDV_RE = / Số SP điền sẵn: (.+) = (\d+)\.$/;   // Tạo tệp 1.6.0 (= nap_phieu.SLDV_RE)
  var D1_FIELDS = [['B', 'mã vtvl'], ['C', 'loại nhân lực'], ['E', 'giờ/năm dành cho vị trí'], ['F', 'giờ/năm việc khác'],
    ['G', 'nơi tính biên chế'], ['H', 'nguồn']];
  var D1_LABEL = { B: 'Mã VTVL', C: 'Loại nhân lực', E: 'Giờ/năm dành cho vị trí', F: 'Giờ/năm việc khác', G: 'Nơi tính biên chế', H: 'Nguồn' };
  var INFO_KEYS = { 'mã đơn vị': 'unit', 'mã vtvl': 'vtvl', 'người đo': 'who', 'thời điểm xuất': 'time', 'nguồn': 'source' };
  // khoảng trắng: đúng tập str.isspace() của Python cộng U+FEFF (nap_phieu.WS_CHARS)
  var WS_RUN = new RegExp('[\\t\\n\\x0b\\x0c\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]+', 'g');
  var PY_SPACE = '[\\t\\n\\x0b\\x0c\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]';
  var PY_STRIP = new RegExp('^' + PY_SPACE + '+|' + PY_SPACE + '+$', 'g');
  var DANG_CODE = /^(?:X(?:0[1-9]|[1-6][0-9]|7[0-2])|P(?:0[1-9]|[12][0-9]|3[01]))$/;
  var DVSN_CODE = /^(?:X(?:0[1-9]|[1-6][0-9]|7[0-2])|P(?:0[1-9]|[12][0-9]|3[01]))-[A-Z0-9]{2,10}$/; // bản 1.5: X52-TH01
  var CODE_LIKE = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+$/, HKEY_TAIL = / *\([^()]*\) *$/;
  var DATE_DMY = /^([0-9]{1,2})[/.-]([0-9]{1,2})[/.-]([0-9]{4})$/, DATE_YMD = /^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})$/;
  var ISO_DT = /^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:[T ]([0-9]{2}):([0-9]{2})(?::([0-9]{2})(?:\.([0-9]+))?)?)?(?:Z|[+-][0-9]{2}:?[0-9]{2})?$/;
  var EPOCH_MS = Date.UTC(1899, 11, 30);
  var pyNum = I.pyNum;
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function FormError(msg) { var e = new Error(msg); e.formError = true; return e; }

  // ---------- giá trị ----------
  function norm(v) {
    if (typeof v === 'string') { v = v.normalize('NFC').replace(WS_RUN, ' ').replace(/^ +| +$/g, ''); return v || null; }
    return v;
  }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function pyStrip(s) { return s.replace(PY_STRIP, ''); }
  function pyFloat(s) {
    // float() của Python cho chuỗi trong ô: số thập phân (có thể có dấu _ giữa chữ số), inf, nan
    var t = pyStrip(String(s));
    if (/^[+-]?(?:[0-9](?:_?[0-9])*(?:\.(?:[0-9](?:_?[0-9])*)?)?|\.[0-9](?:_?[0-9])*)(?:[eE][+-]?[0-9](?:_?[0-9])*)?$/.test(t)) return Number(t.replace(/_/g, ''));
    if (/^[+-]?(?:inf|infinity)$/i.test(t)) return t.charAt(0) === '-' ? -Infinity : Infinity;
    if (/^[+-]?nan$/i.test(t)) return NaN;
    return null;
  }
  function show(v) {
    if (v == null) return '(trống)';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (isNum(v)) return pyNum(v);
    if (typeof v === 'number') return v !== v ? 'nan' : (v > 0 ? 'inf' : '-inf');
    return String(v);
  }
  function valKey(v) {
    if (v == null) return null;
    if (typeof v === 'boolean') return 'b:' + (v ? '1' : '0');
    if (typeof v === 'number') return 'n:' + show(v);
    return 's:' + v;
  }
  function excelRound(x, d) {
    var f = Math.pow(10, d), r = Math.floor(Math.abs(x) * f + 0.5 + 1e-9) / f;
    return (x < 0 || Object.is(x, -0)) ? -r : r;
  }
  function serialOf(y, m, d) {
    if (y < 1000) return null;
    var t = Date.UTC(y, m - 1, d), dt = new Date(t);
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return Math.round((t - EPOCH_MS) / 86400000);
  }
  function isoSerial(s) {
    var m = ISO_DT.exec(s);
    if (!m) return null;
    var d = serialOf(+m[1], +m[2], +m[3]), hh = +(m[4] || 0), mi = +(m[5] || 0), ss = +(m[6] || 0);
    if (d == null || hh > 23 || mi > 59 || ss > 59) return null;
    var frac = m[7] ? Number('0.' + m[7]) : 0;
    return d + (hh * 3600 + mi * 60 + ss + frac) / 86400;
  }
  function dayFraction(v) {
    if (isNum(v)) return v >= 1 ? v - Math.floor(v) : v;
    if (typeof v === 'string') {
      var m = /^([0-9]{1,2})[:hH.]([0-9]{2})$/.exec(v);
      if (m && +m[1] < 24 && +m[2] < 60) return (+m[1] * 60 + +m[2]) / 1440;
    }
    return null;
  }
  function rowMinutes(start, end, cnt) {
    if (start == null || end == null || cnt == null) return null;
    var s = dayFraction(start), e = dayFraction(end);
    if (s == null || e == null || !isNum(cnt) || cnt === 0) return null;
    return excelRound((e - s) * 1440 / cnt, 1);
  }
  // trung bình: cộng theo thứ tự tăng dần rồi chia — cùng kết quả dù thứ tự dòng, thứ tự tệp thế nào
  function mean(xs) { var a = xs.slice().sort(function (p, q) { return p - q; }), t = 0; for (var i = 0; i < a.length; i++) t += a[i]; return t / a.length; }
  function dateKey(v) {
    if (isNum(v)) return 'd:' + pyNum(Math.floor(v));
    if (typeof v === 'string') {
      var m = DATE_DMY.exec(v), s = null;
      if (m) s = serialOf(+m[3], +m[2], +m[1]);
      else { m = DATE_YMD.exec(v); if (m) s = serialOf(+m[1], +m[2], +m[3]); }
      if (s != null) return 'd:' + s;
    }
    return valKey(v);
  }
  function timeKey(v) { var f = dayFraction(v); return f != null ? 't:' + pyNum(Math.floor(f * 86400 + 0.5)) : valKey(v); }
  function cpCmp(a, b) {
    var A = Array.from(a), B = Array.from(b), n = Math.min(A.length, B.length);
    for (var i = 0; i < n; i++) { var x = A[i].codePointAt(0), y = B[i].codePointAt(0); if (x !== y) return x < y ? -1 : 1; }
    return A.length === B.length ? 0 : (A.length < B.length ? -1 : 1);
  }
  function cpSort(xs) { return xs.slice().sort(cpCmp); }
  var RE_ALPHA = /^\p{L}$/u, RE_UP = /^\p{Uppercase}$/u, RE_LOW = /^\p{Lowercase}$/u, RE_MARK = /^\p{M}$/u;
  var RE_DIGIT = /[\p{Nd}²³¹⁰⁴-⁹₀-₉①-⑨⑴-⑼⒈-⒐⓵-⓽❶-❾➀-➈➊-➒]/u;
  function looksLikeName(s) {
    var toks = s.split(' ');
    if (toks.length < 2 || toks.length > 5) return false;
    for (var i = 0; i < toks.length; i++) {
      var ch = Array.from(toks[i]);
      if (!ch.length || !(RE_ALPHA.test(ch[0]) && RE_UP.test(ch[0]))) return false;
      for (var j = 1; j < ch.length; j++) if (!(RE_ALPHA.test(ch[j]) && (RE_LOW.test(ch[j]) || RE_MARK.test(ch[j])))) return false;
    }
    return !RE_DIGIT.test(s);
  }
  function looksLikeId(s) { return /^[0-9]{9,12}$/.test(s.replace(WS_RUN, '')); }
  function hkey(v) { return typeof v === 'string' ? v.replace(HKEY_TAIL, '').toLowerCase().replace(/^ +| +$/g, '') : null; }
  function idxCol(n) { var s = ''; while (n) { var r = (n - 1) % 26; n = (n - 1 - r) / 26; s = String.fromCharCode(65 + r) + s; } return s; }
  // căn cứ của phút giữ nguyên gợi ý, ghi vào cột I: câu đầu (phần phút) và mức đang điền (= nap_phieu.compact_basis)
  function compactBasis(b) {
    b = typeof b === 'string' ? b.split(SUG_SEP)[0] : '';
    var i = b.indexOf('. Đơn giản ');
    if (i >= 0) {
      var rest = b.slice(i), m = /Đang điền: ([^.]+)\./.exec(rest);
      b = b.slice(0, i);
      if (m && b.indexOf(', mức ') < 0) b += ', mức ' + m[1];
    }
    return b;
  }
  function codePrefix(code) {
    var parts = code.split('-');
    if (code.indexOf('SGDDT-') === 0 && parts.length > 2) return 'SGDDT-' + parts[1] + '-';
    return parts.length > 1 ? parts[0] + '-' : null;
  }

  // ---------- phiếu: đọc từ XML ----------
  function parseValue(attrs, inner, sst) {
    if (!inner) return [null, null];
    var t = I.attr(attrs, 't') || 'n';
    var fm = /<f(?:\s[^>]*)?>([\s\S]*?)<\/f>|<f(?:\s[^>]*)?\/>/.exec(inner);
    var f = fm ? I.unesc(fm[1] || '') : null;
    if (t === 'inlineStr') { var im = /<is>([\s\S]*?)<\/is>/.exec(inner); return [norm(im ? I.tTexts(im[1]) : null), f]; }
    var vm = /<v>([\s\S]*?)<\/v>/.exec(inner), raw = vm ? I.unesc(vm[1]) : '';
    if (raw === '') return [null, f];
    if (t === 's') { var k = /^[0-9]+$/.test(raw) ? parseInt(raw, 10) : -1; return [norm(k >= 0 && k < sst.length ? sst[k] : null), f]; }
    if (t === 'str' || t === 'e') return [norm(raw), f];
    if (t === 'b') return [raw.trim() === '1', f];
    var x = t === 'd' ? isoSerial(pyStrip(raw)) : pyFloat(raw);
    return x === null ? [norm(raw), f] : [x, f];
  }
  async function txt(zip, path) { var e = zip.file(path); return e ? e.async('string') : null; }
  function cellsOf(x, fn) {
    var sp = I.dataSpan(x), sub = x.slice(sp[0], sp[1]), m, re = I.CELL_RE; re.lastIndex = 0;
    while ((m = re.exec(sub))) fn(m[1], m[2]);
  }
  function fget(form, s, ref) { return form.cells[s].get(ref) || [null, null]; }
  function fv(form, s, ref) { return fget(form, s, ref)[0]; }
  function fval(form, s, key, r) { var c = form.cols[s][key]; return c ? fv(form, s, c + r) : null; }
  function frows(form, s) { var out = []; for (var r = form.hdr[s] + 1; r <= form.maxRow[s]; r++) out.push(r); return out; }
  function findHeader(form, sheet, spec) {
    var byrow = new Map();
    form.cells[sheet].forEach(function (vf, ref) {
      var r = I.rowOf(ref);
      if (r > HEADER_SCAN || typeof vf[0] !== 'string') return;
      var k = hkey(vf[0]), c = I.colIdx(I.colOf(ref));
      if (!byrow.has(r)) byrow.set(r, new Map());
      var d = byrow.get(r);
      if (!d.has(k) || c < d.get(k)) d.set(k, c);
    });
    var req = spec.filter(function (x) { return x[2]; }).map(function (x) { return x[0]; });
    var best = -1, missing = spec.filter(function (x) { return x[2]; }).map(function (x) { return x[1]; });
    var rows = Array.from(byrow.keys()).sort(function (a, b) { return a - b; });
    for (var i = 0; i < rows.length; i++) {
      var got = byrow.get(rows[i]);
      if (req.every(function (k) { return got.has(k); })) {
        var cols = {};
        spec.forEach(function (x) { if (got.has(x[0])) cols[x[0]] = idxCol(got.get(x[0])); });
        return { row: rows[i], cols: cols };
      }
      var n = req.filter(function (k) { return got.has(k); }).length;
      if (n > best) { best = n; missing = spec.filter(function (x) { return x[2] && !got.has(x[0]); }).map(function (x) { return x[1]; }); }
    }
    throw FormError('trang ' + sheet + ' không có dòng tiêu đề đủ cột (thiếu ' + missing.map(function (m) { return '“' + m + '”'; }).join(', ') + ')');
  }
  function readInfo(form) {
    var pos = {};
    form.cells.Thong_tin_tep.forEach(function (vf, ref) {
      var hk = hkey(vf[0]), k = hk != null && has(INFO_KEYS, hk) ? INFO_KEYS[hk] : null;
      if (!k) return;
      var r = I.rowOf(ref), c = I.colIdx(I.colOf(ref));
      if (!has(pos, k) || r < pos[k][0] || (r === pos[k][0] && c < pos[k][1])) pos[k] = [r, c];
    });
    var perRow = {}, across = false, out = {};
    Object.keys(pos).forEach(function (k) { var r = pos[k][0]; perRow[r] = (perRow[r] || 0) + 1; if (perRow[r] >= 2) across = true; });
    Object.keys(pos).forEach(function (k) {
      var r = pos[k][0], c = pos[k][1];
      var v = fv(form, 'Thong_tin_tep', across ? idxCol(c) + (r + 1) : idxCol(c + 1) + r);
      if (v != null) out[k] = v;
    });
    return out;
  }
  async function readForm(JSZip, data, name, index) {
    var zip, wb, rels, sstXml;
    try {
      zip = await JSZip.loadAsync(data);
      wb = await txt(zip, 'xl/workbook.xml'); rels = await txt(zip, 'xl/_rels/workbook.xml.rels');
      sstXml = await txt(zip, 'xl/sharedStrings.xml');
    } catch (e) { wb = null; }
    if (!wb || !rels) throw FormError('không mở được: tệp không phải .xlsx hoặc bị hỏng');
    var part = {};
    I.sheetMap(wb, rels).forEach(function (s) { part[s.name] = s.part; });
    var miss = NEED_SHEETS.filter(function (s) { return !has(part, s); });
    if (miss.length) throw FormError('không phải phiếu thu số liệu: thiếu trang ' + miss.join(', '));
    var sst = sstXml != null ? I.siTexts(sstXml) : [];
    var form = { name: name, index: index || 0, kind: has(part, 'Thong_tin_tep') ? 'mot_nguoi' : 'day_du', cells: {}, maxRow: {}, hdr: {}, cols: {}, notes: [], info: {} };
    for (var j = 0; j < READ_SHEETS.length; j++) {
      var s = READ_SHEETS[j];
      if (!has(part, s)) continue;
      var map = new Map(), mr = 0, x;
      try {
        x = await txt(zip, part[s]);
        if (x == null) throw new Error('missing');
        cellsOf(x, function (a, inner) {
          var ref = I.attr(a, 'r');
          if (!ref || !/^[A-Z]{1,3}[0-9]+$/.test(ref)) return;
          map.set(ref, parseValue(a, inner, sst)); mr = Math.max(mr, I.rowOf(ref));
        });
      } catch (e) { throw FormError('không đọc được trang ' + s); }
      form.cells[s] = map; form.maxRow[s] = mr;
    }
    COL_SHEETS.forEach(function (s) {
      if (!form.cells[s]) return;
      var any = false;
      form.cells[s].forEach(function (vf) { if (typeof vf[0] === 'string') any = true; });
      if (!any) return;
      try { var h = findHeader(form, s, COLS[s]); form.hdr[s] = h.row; form.cols[s] = h.cols; }
      catch (e) { if (!e.formError || NEED_SHEETS.indexOf(s) >= 0) throw e; form.notes.push({ sheet: s, msg: e.message }); }
    });
    if (form.cells.Thong_tin_tep) form.info = readInfo(form);
    return form;
  }
  function unitCodeOf(form, fallback) {
    if (form.cells.Huong_dan) { var b4 = fget(form, 'Huong_dan', 'B4'); if (b4[1] == null && typeof b4[0] === 'string') return b4[0]; }
    if (!form.cells.Thong_tin_don_vi) return fallback;
    var first = fv(form, 'Thong_tin_don_vi', 'A4'); first = typeof first === 'string' ? first : '';
    if (fallback && first.indexOf(fallback + '-') === 0) return fallback; // bản 1.5: X52-TH01-LDQL-01 của đơn vị X52-TH01
    var parts = first.split('-');
    return first.indexOf('SGDDT-') === 0 && parts.length > 2 ? parts[1] : parts[0];
  }
  function foreignCodes(form, prefix) {
    var bad = [];
    [['Phieu_B1', 'mã công việc'], ['Phieu_B1', 'mã vtvl'], ['Do_thoi_gian', 'mã công việc'], ['Phieu_D1', 'mã vtvl']].forEach(function (sk) {
      if (!form.cols[sk[0]] || !form.cols[sk[0]][sk[1]]) return;
      frows(form, sk[0]).forEach(function (r) {
        var v = fval(form, sk[0], sk[1], r);
        if (typeof v === 'string' && CODE_LIKE.test(v) && v.indexOf(prefix) !== 0) bad.push([v, sk[0], r]);
      });
    });
    var v = form.info.vtvl;
    if (typeof v === 'string' && CODE_LIKE.test(v) && v.indexOf(prefix) !== 0) bad.push([v, 'Thong_tin_tep', null]);
    return bad;
  }
  // bản 1.5: mã công việc của phiếu (theo dòng) khi KHÔNG mã nào có ở B1 của tệp đơn vị (phiếu của khối, đơn vị khác), ngược lại []
  function unknownJobs(form, unit) {
    var codes = [];
    if (form.cols.Phieu_B1 && form.cols.Phieu_B1['mã công việc']) {
      frows(form, 'Phieu_B1').forEach(function (r) { var v = fval(form, 'Phieu_B1', 'mã công việc', r); if (typeof v === 'string' && pyStrip(v)) codes.push(pyStrip(v)); });
    }
    return codes.length && !codes.some(function (c) { return unit.b1Rows.has(c); }) ? codes : [];
  }
  function rejectReason(bad, prefix) {
    var b = bad[0], where = b[1] + (b[2] != null ? ' dòng ' + b[2] : ''), more = bad.length > 1 ? ', cùng ' + (bad.length - 1) + ' mã khác' : '';
    return 'tệp của đơn vị khác: mã “' + b[0] + '” (' + where + more + ') không bắt đầu bằng “' + prefix + '” của tệp đơn vị';
  }

  // ---------- gộp các phiếu ----------
  function analyse(forms, ma) {
    var multi = forms.length > 1, warns = [], errs = [];
    function where(f, sheet, r) { return multi ? f.name + ' › ' + sheet + '!' + r : sheet + '!' + r; }
    function label(f, sheet, r) { return multi ? f.name + ', ' + sheet + ' dòng ' + r : sheet + ' dòng ' + r; }
    function warn(kind, w, msg) { warns.push({ kind: kind, where: w, msg: msg }); }
    function err(kind, w, msg) { errs.push({ kind: kind, where: w, msg: msg }); }
    var stats = {};
    forms.forEach(function (f) { stats[f.name + '#' + f.index] = { b1: 0, do: 0, d1: 0 }; });
    forms.forEach(function (f) {
      f.notes.forEach(function (nt) { warn('sheet_no_header', (multi ? f.name + ' › ' : '') + nt.sheet, (multi ? f.name + ': ' : '') + nt.msg + ' — bỏ qua trang này'); });
    });
    // ---- Do_thoi_gian
    var meas = new Map(), seen = new Set(), nRows = 0, nDup = 0;
    forms.forEach(function (f) {
      var st = stats[f.name + '#' + f.index];
      if (!f.cols.Do_thoi_gian) return;
      frows(f, 'Do_thoi_gian').forEach(function (r) {
        function g(k) { return fval(f, 'Do_thoi_gian', k, r); }
        var code = g('mã công việc'), day = g('ngày'), start = g('giờ bắt đầu'), end = g('giờ kết thúc'), cnt = g('số sản phẩm làm được'), who = g('người đo');
        if (who == null && typeof f.info.who === 'string') who = f.info.who;
        if (typeof code !== 'string') {
          if (start != null || end != null || cnt != null) warn('do_no_code', where(f, 'Do_thoi_gian', r), label(f, 'Do_thoi_gian', r) + ': có số đo nhưng chưa chọn mã công việc — bỏ qua');
          return;
        }
        st.do++;
        if (!meas.has(code)) meas.set(code, { minutes: [], who: [], rows: 0 });
        var m = meas.get(code);
        if (typeof who === 'string' && m.who.indexOf(who) < 0) m.who.push(who);
        var key = [code, dateKey(day), timeKey(start), timeKey(end), valKey(cnt)].map(String).join('\x1f');
        if (seen.has(key)) {
          nDup++;
          warn('do_duplicate', where(f, 'Do_thoi_gian', r), label(f, 'Do_thoi_gian', r) + ' (' + code + '): trùng hệt một lần đo đã có (cùng ngày, giờ bắt đầu, giờ kết thúc, số sản phẩm) — chỉ tính một lần');
          return;
        }
        seen.add(key); nRows++; m.rows++;
        var minutes = rowMinutes(start, end, cnt);
        if (minutes == null) warn('do_incomplete', where(f, 'Do_thoi_gian', r), label(f, 'Do_thoi_gian', r) + ' (' + code + '): chưa đủ giờ bắt đầu, giờ kết thúc, số sản phẩm — không tính');
        else {
          if (minutes <= 0) warn('do_nonpositive', where(f, 'Do_thoi_gian', r), label(f, 'Do_thoi_gian', r) + ' (' + code + '): Phút/SP = ' + pyNum(minutes) + ' không dương — vẫn tính như công thức của phiếu');
          m.minutes.push(minutes);
        }
      });
    });
    // ---- Phieu_B1
    var order = [], byCode = new Map();
    forms.forEach(function (f) {
      var st = stats[f.name + '#' + f.index], firstRow = new Map();
      if (!f.cols.Phieu_B1) return;
      frows(f, 'Phieu_B1').forEach(function (r) {
        var code = fval(f, 'Phieu_B1', 'mã công việc', r);
        if (typeof code !== 'string') return;
        var vals = {}, any = false, sug = {};
        B1_FIELDS.forEach(function (kd) { vals[kd[0]] = fval(f, 'Phieu_B1', kd[0], r); if (vals[kd[0]] != null) any = true; });
        SUG_KEYS.forEach(function (k) { sug[k] = fval(f, 'Phieu_B1', k, r); });
        if (any) st.b1++;
        if (firstRow.has(code)) warn('b1_duplicate', where(f, 'Phieu_B1', r), label(f, 'Phieu_B1', r) + ' (' + code + '): trùng mã công việc với dòng ' + firstRow.get(code) + ' — gộp giá trị của hai dòng');
        else firstRow.set(code, r);
        if (!byCode.has(code)) { byCode.set(code, []); order.push(code); }
        byCode.get(code).push({ f: f, r: r, vals: vals, sug: sug });
      });
      if (!firstRow.size) { // 1.5.2 B: phiếu của vị trí không có dòng khối lượng
        var vt = f.info.vtvl;
        warn('form_no_b1_rows', (multi ? f.name + ' › ' : '') + 'Phieu_B1', (multi ? f.name + ': ' : '') + 'phiếu' + (typeof vt === 'string' && vt ? ' của vị trí ' + vt : '') +
          ' không có dòng khối lượng (vị trí tính chung với vị trí khác hoặc chưa có công việc) — không có gì để nạp từ phiếu này');
      }
    });
    function isSug(x, k) {
      var sv = null;
      (SUG_OF[k] || []).some(function (c) { if (x.sug[c] != null) { sv = x.sug[c]; return true; } return false; });
      if (k === 'nguồn số liệu') return typeof x.vals[k] === 'string' && typeof sv === 'string' && x.vals[k] === sv;
      return isNum(x.vals[k]) && isNum(sv) && valKey(x.vals[k]) === valKey(sv);
    }
    var jobs = [], confirmers = [], skipped = [], conflictsB1 = [];
    order.forEach(function (code) {
      var srcs = byCode.get(code), merged = {}, flags = {}, fields = [];
      B1_FIELDS.forEach(function (kd) {
        var k = kd[0], vs = srcs.filter(function (x) { return x.vals[k] != null; }).map(function (x) { return { x: x, sg: isSug(x, k) }; });
        var own = [], kept = [];
        vs.forEach(function (t) { var lst = t.sg ? kept : own, key = valKey(t.x.vals[k]); if (lst.indexOf(key) < 0) lst.push(key); });
        if (own.length > 1 || (!own.length && kept.length > 1)) {
          fields.push({ field: kd[1], values: vs.map(function (t) { return { file: t.x.f.name, row: t.x.r, value: show(t.x.vals[k]) + (t.sg ? ' (giữ nguyên gợi ý)' : '') }; }) });
        }
        var pick = vs.filter(function (t) { return !t.sg; }); if (!pick.length) pick = vs;
        merged[k] = pick.length ? pick[0].x : null;
        flags[k] = !!(pick.length && pick[0].sg);
      });
      if (fields.length) {
        conflictsB1.push({ code: code, fields: fields });
        var detail = fields.map(function (x) { return x.field + ': ' + x.values.map(function (y) { return y.file + ' dòng ' + y.row + ' “' + y.value + '”'; }).join(', '); }).join('; ');
        err('b1_conflict', where(srcs[0].f, 'Phieu_B1', srcs[0].r), code + ': các phiếu ghi khác nhau — ' + detail + '. Chưa nạp công việc này; sửa phiếu cho thống nhất rồi nạp lại');
        return;
      }
      function mv(k) { return merged[k] ? merged[k].vals[k] : null; }
      var spx = merged['số sản phẩm trong kỳ'], sp = mv('số sản phẩm trong kỳ'), src = mv('nguồn số liệu'), manual = mv('phút/sp nhập tay nếu không đo'), conf = mv('người xác nhận');
      var f0 = spx ? spx.f : srcs[0].f, r0 = spx ? spx.r : srcs[0].r;
      var spSug = flags['số sản phẩm trong kỳ'], minSug = flags['phút/sp nhập tay nếu không đo'], srcSug = flags['nguồn số liệu'], mx = merged['phút/sp nhập tay nếu không đo'];
      var basis = compactBasis((mx && mx.sug['căn cứ gợi ý']) || '');
      var sldv = null, msl = spSug && spx ? SLDV_RE.exec(spx.sug['căn cứ gợi ý'] || '') : null;   // 1.6.0
      if (msl && typeof sp === 'number' && sp === +msl[2]) sldv = msl[1];
      if (!isNum(sp)) {
        if (sp != null) warn('b1_sp_not_number', where(f0, 'Phieu_B1', r0), label(f0, 'Phieu_B1', r0) + ' (' + code + '): Số sản phẩm “' + show(sp) + '” không phải số — bỏ qua');
        else {
          var own = [['phút/SP nhập tay', manual != null && !minSug], ['nguồn số liệu', src != null && !srcSug], ['người xác nhận', conf != null], ['lần đo', meas.has(code)]]
            .filter(function (t) { return t[1]; }).map(function (t) { return t[0]; });
          if (own.length) {  // 1.4.2: dòng chỉ có gợi ý chưa sửa là dòng chưa điền
            skipped.push(code);
            warn('b1_no_sp', where(f0, 'Phieu_B1', r0), label(f0, 'Phieu_B1', r0) + ' (' + code + '): có ' + own.join(', ') + ' nhưng chưa có Số sản phẩm — chưa nạp dòng này');
          }
        }
        return;
      }
      var m = meas.get(code), dVal = null, dFrom = null, iText = null;
      if (m && m.minutes.length) {
        dVal = mean(m.minutes); dFrom = 'đo';
        var who = cpSort(m.who);
        iText = 'Phiếu đo thời gian: ' + m.minutes.length + ' lần' + (who.length ? ', ' + who.join('; ') : '');
      } else if (isNum(manual)) { dVal = manual; dFrom = 'nhập tay'; iText = minSug ? 'Mức tham khảo: ' + (basis || 'gợi ý trong phiếu') + '; chưa đo thực tế' : I_MANUAL; }
      var keptMin = dFrom === 'nhập tay' && minSug;
      if (sldv && dVal == null && conf == null && !(typeof src === 'string' && !srcSug) && (spx.sug['căn cứ gợi ý'] || '').indexOf('Vị trí tính theo') !== 0) {
        skipped.push(code);   // 1.6.0 (= nap_phieu.py): số SP điền sẵn mà việc PP2 chưa có phút/SP — chưa nạp
        warn('b1_sldv_no_minutes', where(f0, 'Phieu_B1', r0), label(f0, 'Phieu_B1', r0) + ' (' + code + '): số SP ' + pyNum(sp) + ' điền sẵn từ số liệu đơn vị ' +
          'chưa nạp vì việc tính theo PP2 chưa có phút/SP — đo thời gian hoặc nhập phút/SP rồi nạp lại');
        return;
      }
      var w = where(f0, 'Phieu_B1', r0);
      if (!Number.isInteger(sp)) warn('b1_sp_not_integer', w, code + ': Số sản phẩm ' + pyNum(sp) + ' không phải số nguyên');
      if (spSug) warn('b1_sp_suggestion', w, code + ': Số sản phẩm ' + pyNum(sp) + ' giữ nguyên ' + (sldv ? 'số điền sẵn từ số liệu đơn vị' : 'gợi ý chu kỳ') + ' — cần đối chiếu sổ sách');
      else if (typeof src !== 'string') warn('b1_no_source', w, code + ': chưa ghi Nguồn số liệu');
      if (keptMin) warn('b1_min_suggestion', w, code + ': Phút/SP ' + pyNum(dVal) + ' giữ nguyên mức tham khảo — chưa đo thực tế, nên đo bổ sung');
      if (dVal == null) warn('b1_no_minutes', w, code + ': chưa có Phút/SP (không đo, không nhập tay) — chỉ ghi số sản phẩm');
      else if (!keptMin && dVal >= 1440 && dVal % 480 === 0) warn('b1_deadline_like', w, code + ': Phút/SP = ' + pyNum(dVal) + ' (≥ 1440, chia hết cho 480): có thể là thời hạn giải quyết, không phải thời gian làm một sản phẩm');
      if (typeof conf === 'string' && confirmers.indexOf(conf) < 0) confirmers.push(conf);
      var hVal = typeof src === 'string' && !(srcSug && spSug) ? src : (spSug ? (sldv ? 'Số liệu đơn vị: ' + sldv + '; cần đối chiếu sổ sách' : H_CHU_KY) : null);
      jobs.push({ form: f0.name, formRow: r0, code: code, C: sp, D: dVal, D_from: dFrom, H: hVal, I: iText,
        nMeas: m ? m.minutes.length : 0, sugMin: keptMin, sugSp: spSug, sugSrc: srcSug });
    });
    // ---- Phieu_D1
    var cand = [], refused = [];
    forms.forEach(function (f, fi) {
      if (!f.cols.Phieu_D1) return;
      if (f.kind === 'mot_nguoi') {
        var nD1 = frows(f, 'Phieu_D1').filter(function (r) { return typeof fval(f, 'Phieu_D1', 'mã vtvl', r) === 'string'; }).length;
        if (nD1) warn('d1_ignored', f.name, f.name + ': trang Phieu_D1 có ' + nD1 + ' dòng nhưng phiếu một người, phiếu vị trí không nạp D1 ' +
          '(D1 do đầu mối điền ở phiếu đầy đủ của đơn vị) — bỏ qua');
        return;
      }
      var st = stats[f.name + '#' + f.index];
      frows(f, 'Phieu_D1').forEach(function (r) {
        var vt = fval(f, 'Phieu_D1', 'mã vtvl', r);
        if (typeof vt !== 'string') return;
        st.d1++;
        var af = fget(f, 'Phieu_D1', f.cols.Phieu_D1['mã nguồn lực'] + r), a = af[0];
        if (af[1] != null) { var mm = /&"(\.[0-9]+)"\s*$/.exec(af[1]); if (mm) a = unitCodeOf(f, ma) + mm[1]; }
        if (isNum(a)) a = pyNum(a);
        var g2 = fval(f, 'Phieu_D1', 'nơi tính biên chế', r), h2 = fval(f, 'Phieu_D1', 'nguồn', r);
        if (typeof a === 'string' && (looksLikeName(a) || looksLikeId(a))) {
          refused.push(where(f, 'Phieu_D1', r));
          err('d1_name_or_id', where(f, 'Phieu_D1', r), label(f, 'Phieu_D1', r) + ': Mã nguồn lực có dạng họ tên hoặc số định danh — không nạp dòng này');
          return;
        }
        if ([g2, h2].some(function (t) { return typeof t === 'string' && looksLikeId(t); })) {
          refused.push(where(f, 'Phieu_D1', r));
          err('d1_id', where(f, 'Phieu_D1', r), label(f, 'Phieu_D1', r) + ': có dãy 9–12 chữ số giống số định danh — không nạp dòng này');
          return;
        }
        if (typeof a !== 'string') { a = null; warn('d1_no_code', where(f, 'Phieu_D1', r), label(f, 'Phieu_D1', r) + ': thiếu Mã nguồn lực — vẫn nạp, công cụ rà soát sẽ không đọc dòng này'); }
        var row = { form: f.name, formRow: r, A: a };
        D1_FIELDS.forEach(function (ck) { row[ck[0]] = fval(f, 'Phieu_D1', ck[1], r); });
        ['E', 'F'].forEach(function (k) {
          if (row[k] != null && !isNum(row[k])) { warn('d1_not_number', where(f, 'Phieu_D1', r), label(f, 'Phieu_D1', r) + ': cột ' + k + ' “' + show(row[k]) + '” không phải số — để trống'); row[k] = null; }
        });
        cand.push({ r: r, fi: fi, f: f, row: row });
      });
    });
    cand.sort(function (p, q) { return (p.r - q.r) || (p.fi - q.fi); });
    var groups = new Map(), glist = [];
    cand.forEach(function (x) {
      var ck = D1_FIELDS.map(function (c) { return String(valKey(x.row[c[0]])); }).join('\x1f');
      var gk = x.row.A != null ? 'a\x1f' + x.row.A : 'c\x1f' + ck;
      if (!groups.has(gk)) { groups.set(gk, { rows: [], keys: [] }); glist.push(gk); }
      var g = groups.get(gk);
      g.rows.push(x);
      if (g.keys.indexOf(ck) < 0) g.keys.push(ck);
    });
    var d1 = [], conflictsD1 = [];
    glist.forEach(function (gk) {
      var g = groups.get(gk);
      if (g.keys.length > 1) {
        var a = g.rows[0].row.A;
        var diff = D1_FIELDS.map(function (c) { return c[0]; }).filter(function (c) {
          var s = new Set(g.rows.map(function (x) { return String(valKey(x.row[c])); })); return s.size > 1;
        });
        var vals = g.rows.map(function (x) { return { file: x.f.name, row: x.r, value: diff.map(function (c) { return D1_LABEL[c] + ' “' + show(x.row[c]) + '”'; }).join('; ') }; });
        conflictsD1.push({ code: a, fields: diff.map(function (c) { return D1_LABEL[c]; }), values: vals });
        err('d1_conflict', where(g.rows[0].f, 'Phieu_D1', g.rows[0].r), 'Mã nguồn lực ' + a + ': các phiếu ghi khác nhau — ' +
          vals.map(function (x) { return x.file + ' dòng ' + x.row + ': ' + x.value; }).join(', ') + '. Chưa nạp dòng này; sửa phiếu cho thống nhất rồi nạp lại');
        return;
      }
      d1.push(g.rows[0].row);
    });
    return { meas: meas, jobs: jobs, confirmers: cpSort(confirmers), skipped: skipped, d1: d1, refused: refused, warnings: warns, errors: errs,
      conflicts: { b1: conflictsB1, d1: conflictsD1 }, measurements: { rows: nRows, duplicates: nDup, jobs: meas.size }, stats: stats, measuredJobs: meas.size };
  }

  // ---------- tệp đơn vị ----------
  function outFileName(ma, n, ngay) {
    if (DANG_CODE.test(ma || '') || DVSN_CODE.test(ma || '')) return ma + '_K2526_v' + n + '_' + ngay + '.xlsx';
    var first = 'SGDDT-' + ma + '_K2526_v' + n + '_' + ngay + '.xlsx';
    return I.f01Ok(first) ? first : ma + '_K2526_v' + n + '_' + ngay + '.xlsx';
  }
  async function readUnit(JSZip, unitData, unitName) {
    var zip;
    try { zip = await JSZip.loadAsync(unitData); } catch (e) { throw new Error('Không đọc được tệp đơn vị: tệp không phải .xlsx hoặc bị hỏng.'); }
    var wb = await txt(zip, 'xl/workbook.xml'), rels = await txt(zip, 'xl/_rels/workbook.xml.rels');
    if (!wb || !rels) throw new Error('Không đọc được tệp đơn vị: tệp không phải .xlsx hợp lệ.');
    var part = {};
    I.sheetMap(wb, rels).forEach(function (s) { part[s.name] = s.part; });
    [SHEET_B1, SHEET_D1, SHEET_S].forEach(function (s) { if (!part[s]) throw new Error('Tệp đơn vị thiếu trang “' + s + '”: hãy chọn tệp VTVL của đơn vị (tạo ở bước 3).'); });
    var sst0 = await txt(zip, 'xl/sharedStrings.xml'), sst = sst0 != null ? I.siTexts(sst0) : [];
    var u = { zip: zip, name: unitName || '', part: part, sst0: sst0, sst: sst, xml: {}, eds: {} };
    u.xml[part[SHEET_B1]] = await txt(zip, part[SHEET_B1]);
    u.xml[part[SHEET_S]] = await txt(zip, part[SHEET_S]);
    var ed = new I.SheetEdit(u.xml[part[SHEET_B1]], sst);
    u.eds[SHEET_B1] = ed;
    u.b1Rows = new Map();
    Object.keys(ed.cells).forEach(function (ref) {
      if (I.colOf(ref) === 'A' && I.rowOf(ref) >= 3) {
        var v = ed.value(ref);
        if (typeof v === 'string' && pyStrip(v)) { var k = pyStrip(v), r = I.rowOf(ref); if (!u.b1Rows.has(k) || r < u.b1Rows.get(k)) u.b1Rows.set(k, r); }
      }
    });
    var es = new I.SheetEdit(u.xml[part[SHEET_S]], sst), L = es.lastDataRow();
    u.ma = null; u.logVer = null;
    for (var r = L; r > 2; r--) { var d = es.value('D' + r); if (d === LOG_SPLIT || d === LOG_FIELD) { u.ma = es.value('C' + r); u.logVer = es.value('J' + r); break; } }
    u.maFromName = !u.ma;
    if (!u.ma) { var mm = /^(?:SGDDT-)?([^_]+)_K2526_/.exec(u.name); u.ma = mm ? mm[1] : ''; }
    var mf = /_K2526_v([0-9]+)_/.exec(u.name), mv = /^.+-v([0-9]+)$/.exec(u.logVer || '');
    u.version = mf ? parseInt(mf[1], 10) : (mv ? parseInt(mv[1], 10) : 1);
    u.prefix = null;
    var codes = Array.from(u.b1Rows.entries()).sort(function (p, q) { return p[1] - q[1]; });
    for (var i = 0; i < codes.length && !u.prefix; i++) u.prefix = codePrefix(codes[i][0]);
    if (!u.prefix) u.prefix = (DANG_CODE.test(u.ma) || DVSN_CODE.test(u.ma)) ? u.ma + '-' : 'SGDDT-' + u.ma + '-';
    return u;
  }
  /* Đọc và kiểm từng phiếu: { forms (thứ tự chuẩn: phiếu đầy đủ trước, rồi theo tên tệp), files, errors } */
  async function loadForms(JSZip, list, unit, onEach) {
    var forms = [], files = [], errs = [];
    for (var i = 0; i < list.length; i++) {
      var it = list[i], f;
      if (onEach) onEach(i, it.name);
      try {
        f = await readForm(JSZip, it.data, it.name, i);
        var bad = foreignCodes(f, unit.prefix);
        if (bad.length) throw FormError(rejectReason(bad, unit.prefix));
        var other = unknownJobs(f, unit);
        if (other.length) throw FormError('phiếu của khối hoặc đơn vị khác: không mã công việc nào của phiếu (ví dụ “' + other[0] + '”, ' + other.length + ' mã) có ở biểu B1 của tệp đơn vị');
      } catch (e) {
        if (!e || !e.formError) throw e;
        files.push({ name: it.name, index: i, accepted: false, reason: e.message });
        errs.push({ kind: 'file_rejected', where: it.name, msg: it.name + ': ' + e.message + ' — không nạp tệp này' });
        continue;
      }
      forms.push(f);
      var info = {};
      Object.keys(f.info).forEach(function (k) { info[k] = show(f.info[k]); });
      files.push({ name: it.name, index: i, accepted: true, kind: f.kind, info: info });
    }
    forms.sort(function (p, q) { return ((p.kind === 'day_du' ? 0 : 1) - (q.kind === 'day_du' ? 0 : 1)) || cpCmp(p.name, q.name) || (p.index - q.index); });
    return { forms: forms, files: files, errors: errs };
  }
  /* Tạo tệp 1.7.0: nếu trang có ô nằm ngoài <dimension ref="…"> thì nới vùng đến ô xa nhất (bộ nạp ghi thêm dòng D1, nhật ký; mẫu UBND
     có D1 A1:K3), để công cụ đọc theo dimension thấy đủ dòng. Không vượt thì giữ nguyên. Bản Python: nap_phieu.py widen_dimension. */
  function colNum(s) { var n = 0; for (var i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64); return n; }
  function colLetters(n) { var o = ''; while (n) { var r = (n - 1) % 26; o = String.fromCharCode(65 + r) + o; n = Math.floor((n - 1) / 26); } return o; }
  function widenDim(xml) {
    var m = /<dimension ref="([A-Z]+)([0-9]+)(?::([A-Z]+)([0-9]+))?"/.exec(xml);
    if (!m) return xml;
    var c1 = m[1], r1 = +m[2], c2 = m[3] || c1, r2 = m[3] ? +m[4] : r1, maxC = colNum(c2), maxR = r2, re = /<c\b[^>]*?\sr="([A-Z]+)([0-9]+)"/g, x;
    while ((x = re.exec(xml))) { maxC = Math.max(maxC, colNum(x[1])); maxR = Math.max(maxR, +x[2]); }
    if (maxC === colNum(c2) && maxR === r2) return xml;
    var start = m.index + m[0].indexOf('"') + 1, end = m.index + m[0].length - 1;
    return xml.slice(0, start) + c1 + r1 + ':' + colLetters(maxC) + maxR + xml.slice(end);
  }
  async function applyToUnit(unit, formNames, a, ngay, onProgress) {
    var prog = onProgress || function () {};
    if (!/^\d{8}$/.test(String(ngay || ''))) throw new Error('Ngày phải có dạng ddmmyyyy.');
    var zip = unit.zip, part = unit.part, sst = unit.sst, sst0 = unit.sst0;
    var cur = {}, orig = {}, st = { sRemoved: 0, overwritten: 0, cells: 0 };
    var warns = a.warnings.slice(), errs = a.errors.slice(), jobs = a.jobs.map(function (j) { return Object.assign({}, j); });
    async function edit(sheet, fn) {
      var p = part[sheet];
      if (cur[p] == null) { orig[p] = unit.xml[p] != null ? unit.xml[p] : await txt(zip, p); cur[p] = orig[p]; }
      var ed = cur[p] === orig[p] && unit.eds[sheet] ? unit.eds[sheet] : new I.SheetEdit(cur[p], sst);
      unit.eds[sheet] = null;
      fn(ed);
      if (ed.order.length) { cur[p] = widenDim(ed.apply()); st.sRemoved += ed.sRemoved; st.cells += ed.order.length; }   // 1.7.0: nới <dimension>
      return ed;
    }
    function putText(ed, ref, v) {
      var old = ed.value(ref);
      if (old === v) return;
      if (old != null && old !== '') st.overwritten++;
      ed.setText(ref, v);
    }
    function putNum(ed, ref, v) {
      var old = ed.value(ref);
      if (old != null && old !== '') {
        var o = pyFloat(old);
        if (o !== null && o === v) return;
        st.overwritten++;
      }
      ed.setNumber(ref, v);
    }
    prog('Đang ghi biểu B1…', 0.3);
    var missing = [];
    await edit(SHEET_B1, function (ed) {
      jobs.forEach(function (j) {
        var r = unit.b1Rows.get(j.code);
        if (r == null) { missing.push(j.code); return; }
        j.b1Row = r;
        putNum(ed, 'C' + r, j.C);
        if (j.D != null) putNum(ed, 'D' + r, j.D);
        if (j.H) putText(ed, 'H' + r, j.H);
        if (j.I) putText(ed, 'I' + r, j.I);
        putText(ed, 'J' + r, TT_KIEM_DEM);
        putText(ed, 'K' + r, KY);
      });
    });
    missing.forEach(function (code) { errs.push({ kind: 'b1_code_missing', where: code, msg: 'Mã công việc ' + code + ' của phiếu không có ở biểu B1 của tệp đơn vị — không nạp dòng này' }); });
    var d1Existing = [];
    if (a.d1.length) {
      prog('Đang ghi biểu D1…', 0.5);
      await edit(SHEET_D1, function (ed) {
        Object.keys(ed.cells).forEach(function (ref) {
          var c = I.colOf(ref);
          if (I.rowOf(ref) >= 3 && (c === 'A' || c === 'B')) { var v = ed.value(ref); if (v != null && v !== '') d1Existing.push(ref); }
        });
        a.d1.forEach(function (row, i) {
          var r = 3 + i;
          'ABCGH'.split('').forEach(function (c) { if (typeof row[c] === 'string') putText(ed, c + r, row[c]); });
          'EF'.split('').forEach(function (c) { if (isNum(row[c])) putNum(ed, c + r, row[c]); });
          putText(ed, 'I' + r, D1_STATUS);
        });
      });
      if (d1Existing.length) warns.push({ kind: 'd1_existing', where: SHEET_D1, msg: 'Biểu D1 của tệp đơn vị đã có dữ liệu ở ' + d1Existing.length + ' ô (ví dụ ' + d1Existing.slice(0, 3).join(', ') + '); phiếu được ghi từ dòng 3' });
    }
    if (unit.maFromName) warns.push({ kind: 'log_no_split_row', where: SHEET_S, msg: 'Nhật ký không có dòng \'Tách tệp cho đơn vị\'; mã đơn vị lấy từ tên tệp' });
    prog('Đang ghi nhật ký…', 0.6);
    var log = {}, gMin = 0, gSp = 0;
    await edit(SHEET_S, function (ed) {
      var L = ed.lastDataRow(), n = L + 1, ma = unit.ma, ver = unit.version + 1;
      var written = jobs.filter(function (j) { return j.b1Row; });
      var nDo = written.filter(function (j) { return j.D_from === 'đo'; }).length, nTay = written.filter(function (j) { return j.D_from === 'nhập tay'; }).length;
      var nb = a.conflicts.b1.length, nd = a.conflicts.d1.length;
      var cf = [nb ? nb + ' công việc B1' : '', nd ? nd + ' dòng D1' : ''].filter(Boolean);
      gMin = written.filter(function (j) { return j.sugMin; }).length; gSp = written.filter(function (j) { return j.sugSp; }).length;
      var vals = [
        ['A', KY], ['B', [SHEET_B1].concat(a.d1.length ? [SHEET_D1] : []).join(', ')], ['C', ma], ['D', LOG_FIELD],
        ['E', st.overwritten ? st.overwritten + ' ô đã có giá trị, đã ghi đè' : 'Trống'],
        ['F', written.length + ' công việc B1 (phút/SP: ' + nDo + ' từ phiếu đo, ' + nTay + ' nhập tay, ' + (written.length - nDo - nTay) + ' chưa có); ' + a.d1.length + ' dòng D1' +
          (cf.length ? '; chưa nạp vì xung đột: ' + cf.join(', ') : '') +
          (gMin || gSp ? '; giữ nguyên gợi ý: ' + gMin + ' phút/SP (chưa đo), ' + gSp + ' số SP' : '')],
        ['G', formNames.length === 1 ? 'Phiếu thu số liệu: ' + formNames[0] : 'Phiếu thu số liệu (' + formNames.length + ' tệp): ' + formNames.join('; ')],
        ['H', a.confirmers.length ? a.confirmers.join('; ') : null],
        ['I', ngay.slice(0, 2) + '/' + ngay.slice(2, 4) + '/' + ngay.slice(4)], ['J', ma + '-v' + ver]
      ];
      vals.forEach(function (cv) { if (cv[1]) { var sty = ed.styleOf(cv[0] + L) || ed.styleOf('A' + L); ed.setText(cv[0] + n, cv[1], sty); } });
      log = { row: n, ma: ma, version: ver, J: ma + '-v' + ver };
    });
    var sstX = sst0;
    if (st.sRemoved && sstX != null) sstX = sstX.replace(/(<sst\b[^>]*?\scount=")(\d+)(")/, function (m, p1, n, p3) { return p1 + (+n - st.sRemoved) + p3; });
    var enc = new TextEncoder(), changed = [];
    function put(path, xml) {
      var f = zip.file(path);
      zip.file(path, enc.encode(xml), { binary: true, createFolders: false, date: f ? f.date : undefined, unixPermissions: f ? f.unixPermissions : undefined, dosPermissions: f ? f.dosPermissions : undefined });
      changed.push(path);
    }
    if (sstX != null && sstX !== sst0) put('xl/sharedStrings.xml', sstX);
    Object.keys(cur).forEach(function (p) { if (cur[p] !== orig[p]) put(p, cur[p]); });
    var outName = outFileName(log.ma, log.version, ngay);
    return {
      zip: zip, outName: outName,
      report: {
        outName: outName, version: log.J, logRow: log.row, jobs: jobs, written: jobs.filter(function (j) { return j.b1Row; }).length,
        measured: jobs.filter(function (j) { return j.b1Row && j.D_from === 'đo'; }).length,
        manual: jobs.filter(function (j) { return j.b1Row && j.D_from === 'nhập tay'; }).length,
        d1: a.d1.length, refused: a.refused.slice(), overwritten: st.overwritten, cells: st.cells, missing: missing,
        warnings: warns, errors: errs, changedParts: changed.slice().sort(), skipped: a.skipped.slice(),
        conflicts: a.conflicts, measurements: a.measurements, forms: formNames.slice(), prefix: unit.prefix, unitVersion: unit.version,
        keptSuggestions: { phut: gMin, so_sp: gSp }, b1Stats: b1Stats(jobs)
      }
    };
  }

  // số liệu xem trước ở bước 4 (E6) trên các việc đã ghi vào B1 (= nap_phieu.b1_stats)
  function b1Stats(jobs) {
    var w = jobs.filter(function (j) { return j.b1Row; });
    return { co_so_sp: w.length, giu_phut_goi_y: w.filter(function (j) { return j.sugMin; }).length,
      sua_phut: w.filter(function (j) { return j.D_from === 'nhập tay' && !j.sugMin; }).length,
      co_do: w.filter(function (j) { return j.D_from === 'đo'; }).length, chua_co_phut: w.filter(function (j) { return j.D_from == null; }).length };
  }
  /* build(JSZip, tệp đơn vị, tên, [{name, data}, …], ngày, type, onProgress) — hoặc dạng cũ bản 1.2:
     build(JSZip, tệp đơn vị, tên, dữ liệu phiếu, tên phiếu, ngày, type, onProgress). type: 'blob' | 'uint8array' | 'nodebuffer' */
  async function build(JSZip, unitData, unitName, forms, ngay, type, onProgress) {
    if (!Array.isArray(forms)) { var a8 = arguments; forms = [{ data: a8[3], name: a8[4] }]; ngay = a8[5]; type = a8[6]; onProgress = a8[7]; }
    var prog = onProgress || function () {};
    if (!forms.length) throw new Error('Chưa chọn phiếu nào.');
    prog('Đang mở tệp đơn vị…', 0.02);
    var unit = await readUnit(JSZip, unitData, unitName);
    var ld = await loadForms(JSZip, forms, unit, function (i, name) { prog('Đang đọc phiếu ' + (i + 1) + '/' + forms.length + '…', 0.05 + 0.2 * i / forms.length); });
    var files = ld.files;
    if (!ld.forms.length) {
      var e = new Error(ld.errors.map(function (x) { return x.msg; }).join(' · '));
      e.files = files; e.allRejected = true;
      throw e;
    }
    var a = analyse(ld.forms, unit.ma);
    a.errors = ld.errors.concat(a.errors);
    var names = ld.forms.map(function (f) { return f.name; });
    var res = await applyToUnit(unit, names, a, ngay, prog);
    files.forEach(function (fl) { if (fl.accepted) fl.counts = a.stats[fl.name + '#' + fl.index]; });
    res.report.files = files;
    prog('Đang nén tệp…', 0.7);
    var data = await res.zip.generateAsync({ type: type || 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: I.MIME },
      function (meta) { prog('Đang nén tệp…', 0.7 + 0.3 * meta.percent / 100); });
    return { data: data, report: res.report };
  }

  return { build: build, readForm: readForm, readUnit: readUnit, loadForms: loadForms, analyse: analyse, applyToUnit: applyToUnit,
    outFileName: outFileName, FORM_KINDS: FORM_KINDS,
    _t: { norm: norm, rowMinutes: rowMinutes, excelRound: excelRound, looksLikeName: looksLikeName, looksLikeId: looksLikeId, pyFloat: pyFloat,
      mean: mean, dateKey: dateKey, timeKey: timeKey, valKey: valKey, hkey: hkey, cpSort: cpSort, isoSerial: isoSerial, idxCol: idxCol,
      isNum: isNum, pyStrip: pyStrip, WS_RUN: WS_RUN, compactBasis: compactBasis } };
}));
