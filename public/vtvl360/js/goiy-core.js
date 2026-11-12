/* Tạo tệp đơn vị — lõi "Gợi ý sẵn cho từng vị trí" (SPEC_GOIY G1–G3, bản 1.4.1; phiếu điền sẵn SPEC_GOIY_DIEN_SAN, bản 1.4.2).
   Cùng quy tắc và cùng byte trong mọi phần XML đã đổi với pilot/scripts/goi_y.py (so bằng compare_parts.py). Dữ liệu lấy từ
   TỆP ĐƠN VỊ (trang tìm theo tên, cột tìm theo tiêu đề) và bảng pl3_map.json dùng chung (nhúng vào trang). Chỉ sửa chuỗi XML (JSZip).
   Trình duyệt: window.VTVLGoiY (cần VTVLSplit, VTVLNap, window.PL3_MAP, window.TG_DVSN); Node: module.exports (đọc ../../scripts/pl3_map.json
   và ../../scripts/tg_dvsn.json, hoặc tệp ở biến môi trường VTVL_TG_JSON khi thử).
   Bản 1.5.2: A. "Bảng thời gian ĐVSN (dự kiến)" làm nguồn gợi ý cho trường, ĐVSN MN/TH/THCS; B. phiếu cho vị trí ở C1 không có dòng (= goi_y.py). */
(function (root, factory) {
  var S = root && root.VTVLSplit ? root.VTVLSplit : (typeof require === 'function' ? require('./split-core.js') : null);
  var N = root && root.VTVLNap ? root.VTVLNap : (typeof require === 'function' ? require('./nap-core.js') : null);
  var MAP = root && root.PL3_MAP ? root.PL3_MAP : null, TG = root && root.TG_DVSN ? root.TG_DVSN : null;
  var SLDV = root && root.SO_LIEU_DV ? root.SO_LIEU_DV : null;   // 1.6.0: số liệu đơn vị -> số SP điền sẵn
  if ((!MAP || !TG || !SLDV) && typeof require === 'function') {
    var fs = require('fs'), path = require('path');
    if (!MAP) MAP = JSON.parse(fs.readFileSync(path.join(__dirname, '../../scripts/pl3_map.json'), 'utf8'));
    if (!TG) TG = JSON.parse(fs.readFileSync(process.env.VTVL_TG_JSON || path.join(__dirname, '../../scripts/tg_dvsn.json'), 'utf8'));
    if (!SLDV) SLDV = JSON.parse(fs.readFileSync(path.join(__dirname, '../../scripts/so_lieu_don_vi.json'), 'utf8'));
  }
  var api = factory(S, N, MAP, TG, SLDV);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VTVLGoiY = api;
}(typeof self !== 'undefined' ? self : this, function (S, N, MAP, TG, SLDV) {
  'use strict';
  var I = S.internals, T = N._t, pyNum = I.pyNum;
  var PL3 = {}; MAP.pl3.forEach(function (r) { PL3[r.muc] = r; });
  var LEVELS = [['dg', 'Đơn giản'], ['tt', 'Thông thường'], ['pt', 'Phức tạp']];
  var SEP_COUNT = ' — Số SP/năm: ', NO_REF = 'Không có mức tham khảo; đo thực tế';
  var NGUON_VI_TRI = 'Phiếu vị trí 1.4.2';
  var HD_TT = ['Thông tin đơn vị', 'Trang Thong_tin_don_vi do đầu mối điền ở phiếu đầy đủ của đơn vị; phiếu vị trí không có trang này.'];
  var HD_D1 = ['Nhân lực D1', 'Trang D1 do đầu mối điền ở phiếu đầy đủ của đơn vị.'];
  var NOTE_B1 = 'Ô màu cam: điền sẵn theo gợi ý – sửa theo thực tế, sửa xong ô tự đổi màu. Số sản phẩm phải đếm thật từ sổ sách. ' +
    'Dòng giữ nguyên phút gợi ý sẽ ghi là \'mức tham khảo, chưa đo thực tế\'.';
  var CC_SHEET = 'Can_cu_goi_y', CC_FIRST = 9, CC_COLS = 'ABCDEFGHIJ';
  // 1.5.2 A: Bảng thời gian ĐVSN (dự kiến)
  var TG_ITEM = {}; TG.muc.forEach(function (it) { TG_ITEM[it.ma] = it; });
  var TG_NAME = 'Bảng thời gian ĐVSN (dự kiến)';
  var TG_NOTE = 'Bảng thời gian ĐVSN (dự kiến, bản 01/11/2026): mức do đơn vị thống nhất để tham khảo, chưa phải mức được cơ quan có ' +
    'thẩm quyền xác nhận; phần mục II của bảng trùng PL3 HD13 nên dùng PL3.';
  var TG_CC_HT = '62';
  // 1.5.2 B: vị trí không có dòng ở Phieu_B1
  var CHUNG_RE = /[Tt]ính chung khối lượng với\s+([A-Z0-9]+(?:-[A-Z0-9]+)+)/;
  var NOTE_NO_A2 = 'Vị trí chưa có công việc ở Biểu A2: bổ sung công việc ở A2 của tệp đơn vị rồi tạo lại phiếu.';
  var NOTE_PP = { PP1: 'số người theo định mức', PP3: 'số người ước lượng kèm giải trình', 'PP1+PP3': 'số người theo định mức hoặc ước lượng kèm giải trình' };
  var NW = '[\\p{L}\\p{N}_]';  // = \w của Python (chữ, số, gạch dưới)

  // ---------- chữ ----------
  function low(s) { return String(s || '').normalize('NFC').replace(T.WS_RUN, ' ').replace(/^ +| +$/g, '').toLowerCase(); }
  // so khớp theo ranh giới từ: tách âm tiết, ghép từ theo tu_ghep (dài nhất trước, từ trái sang phải) — như goi_y.seg
  var TOK_RE = /[\p{L}\p{N}_]+|[^\p{L}\p{N}_\s]/gu, WORD_RE = /^[\p{L}\p{N}_]+$/u;
  var LEX = new Set(MAP.tu_ghep || []), MAXW = 1;
  LEX.forEach(function (w) { MAXW = Math.max(MAXW, w.split(' ').length); });
  function toks(t) { return t.match(TOK_RE) || []; }
  function seg(t) {
    var tk = toks(t), starts = new Set(), ends = new Set(), i = 0, n = tk.length;
    while (i < n) {
      var L = 1;
      if (WORD_RE.test(tk[i])) {
        for (var k = Math.min(MAXW, n - i); k > 1; k--) {
          var ok = true;
          for (var j = i; j < i + k; j++) if (!WORD_RE.test(tk[j])) { ok = false; break; }
          if (ok && LEX.has(tk.slice(i, i + k).join(' '))) { L = k; break; }
        }
      }
      starts.add(i); ends.add(i + L - 1); i += L;
    }
    return { tk: tk, starts: starts, ends: ends };
  }
  function hasKw(sg, kt) {
    var m = kt.length;
    outer: for (var i = 0; i + m <= sg.tk.length; i++) {
      for (var j = 0; j < m; j++) if (sg.tk[i + j] !== kt[j]) continue outer;
      if (sg.starts.has(i) && sg.ends.has(i + m - 1)) return true;
    }
    return false;
  }
  function kwToks(kw) { return toks(low(kw)); }
  var RULES = MAP.quy_tac.map(function (r) { return { r: r, kws: r.tu_khoa.map(function (k) { return [k, kwToks(k)]; }) }; });
  var COUNT_SRC = '(?<!' + NW + ')(?:' + MAP.chu_ky.map(function (c) { return '(' + c.mau + ')'; }).join('|') + ')(?!' + NW + ')';
  var WORD_THANG = new RegExp('(?<!' + NW + ')tháng(?!' + NW + ')', 'u'), WORD_QUY = new RegExp('(?<!' + NW + ')quý(?!' + NW + ')', 'u');
  var PL3_ITEMS_RE = /PL3 mục ((?:[0-9]+)(?:\s*,\s*[0-9]+)*)/, PL3_LEVEL_RE = /PL3 mục ([0-9]+)\s*-\s*mức (đơn giản|thông thường|phức tạp)/i;
  var DVT_RE = /ĐVT:\s*([^;]+)/;
  function actionPart(jobName) { var t = low(jobName), i = t.indexOf('đối với nhiệm vụ'); return i >= 0 ? t.slice(0, i).replace(/^ +| +$/g, '') : t; }
  function numOrNone(v) {
    if (typeof v === 'string') { var t = T.pyStrip(v); if (/^[0-9]+(?:\.[0-9]+)?$/.test(t)) return Number(t); }
    return null;
  }
  function deaccent(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); }
  function vtvlShort(name) {
    var s = String(name || '').split('(')[0].replace(T.WS_RUN, ' ');
    s = s.replace(/^\s+|\s+$/g, '');
    s = deaccent(s).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (s.length > 40) { var cut = s.slice(0, 41); s = cut.indexOf('_') >= 0 ? cut.slice(0, cut.lastIndexOf('_')) : s.slice(0, 40); }
    return s.replace(/_+$/, '') || 'Vi_tri';
  }
  function levelMinutes(n) { var it = PL3[n]; return LEVELS.map(function (lv) { return it[lv[0]] * 60; }); }
  function levelsText(n) { var m = levelMinutes(n); return 'Đơn giản ' + pyNum(m[0]) + ' · Thông thường ' + pyNum(m[1]) + ' · Phức tạp ' + pyNum(m[2]) + ' phút'; }
  function strip(s) { return s.replace(/^ +| +$/g, ''); }
  // ---------- bảng thời gian ĐVSN (= goi_y.tg_*) ----------
  function tgItem(kind, product) {
    if (TG.ap_dung.indexOf(kind) < 0) return null;
    var n = low(product), k = TG.khop_san_pham, code = k[kind + '|' + n] || k['*|' + n];
    return code ? (TG_ITEM[code] || null) : null;
  }
  function tgValued(it) { return LEVELS.some(function (lv) { return it[lv[0]] != null; }); }
  function tgLevel(it) {
    if (it.tt != null) return ['tt', 'Thông thường'];
    var given = LEVELS.filter(function (lv) { return it[lv[0]] != null; });
    return given.length === 1 ? given[0] : [null, null];
  }
  function tgLevelsText(it) { return LEVELS.map(function (lv) { return lv[1] + ' ' + (it[lv[0]] == null ? '–' : pyNum(it[lv[0]])); }).join(' · ') + ' phút'; }
  function tgHead(it) { return TG_NAME + ' mục ' + it.ma + ' – ' + it.ten + ' (ĐVT: ' + (it.dvt || 'chưa ghi') + ')'; }

  // ---------- tệp đơn vị ----------
  async function txt(zip, p) { var f = zip.file(p); return f ? f.async('string') : null; }
  async function unitData(zip) {
    var wb = await txt(zip, 'xl/workbook.xml'), rels = await txt(zip, 'xl/_rels/workbook.xml.rels');
    var sheets = I.sheetMap(wb, rels), sstX = await txt(zip, 'xl/sharedStrings.xml'), sst = sstX != null ? I.siTexts(sstX) : [];
    async function sheet(re) { for (var i = 0; i < sheets.length; i++) if (re.test(sheets[i].name)) return txt(zip, sheets[i].part); return null; }
    // tiêu đề = dòng đầu (1–10) có đủ mọi khóa của keys; khóa của opt lấy ở dòng đó nếu có (= goi_y.UnitData.table)
    function table(x, keys, opt) {
      opt = opt || [];
      if (x == null) return { cols: null, rows: new Map() };
      var cells = [];
      var sp = I.dataSpan(x), sub = x.slice(sp[0], sp[1]), m, re = I.CELL_RE; re.lastIndex = 0;
      while ((m = re.exec(sub))) {
        var ref = I.attr(m[1], 'r'); if (!ref) continue;
        var v = I.cellValue(m[1], m[2], sst); if (v != null) v = T.norm(v);
        if (v != null) cells.push([ref, v]);
      }
      var byrow = new Map();
      cells.forEach(function (rv) {
        var r = I.rowOf(rv[0]); if (r > 10) return;
        var k = T.hkey(rv[1]); if (keys.indexOf(k) < 0 && opt.indexOf(k) < 0) return;
        var c = I.colIdx(I.colOf(rv[0]));
        if (!byrow.has(r)) byrow.set(r, new Map());
        var d = byrow.get(r); if (!d.has(k) || c < d.get(k)) d.set(k, c);
      });
      var hr = null, rs = Array.from(byrow.keys()).sort(function (a, b) { return a - b; });
      for (var i = 0; i < rs.length && hr == null; i++) if (keys.every(function (k) { return byrow.get(rs[i]).has(k); })) hr = rs[i];
      if (hr == null) return { cols: null, rows: new Map() };
      var cols = {}; keys.concat(opt).forEach(function (k) { if (byrow.get(hr).has(k)) cols[k] = T.idxCol(byrow.get(hr).get(k)); });
      var rows = new Map();
      cells.forEach(function (rv) { var r = I.rowOf(rv[0]); if (r > hr) { if (!rows.has(r)) rows.set(r, {}); rows.get(r)[I.colOf(rv[0])] = rv[1]; } });
      return { cols: cols, rows: rows };
    }
    function sortedRows(t) { return Array.from(t.rows.keys()).sort(function (a, b) { return a - b; }).map(function (r) { return t.rows.get(r); }); }
    function get(row, t, k) { return t.cols[k] && row[t.cols[k]] != null ? row[t.cols[k]] : null; }
    var ud = { methods: new Map(), spOfJob: new Map(), dm: new Map(), c3Note: new Map(), c1: [], kind: null };
    var t = table(await sheet(/C3_NhuCau/), ['mã vtvl', 'phương pháp'], ['nguồn/giải trình']);
    if (t.cols) sortedRows(t).forEach(function (row) {
      var vt = get(row, t, 'mã vtvl');
      if (vt && !ud.methods.has(vt)) { ud.methods.set(vt, get(row, t, 'phương pháp')); ud.c3Note.set(vt, get(row, t, 'nguồn/giải trình')); }
    });
    t = table(await sheet(/C1_VTVL/), ['mã vtvl', 'tên vtvl'], ['loại nhân lực', 'giờ chuẩn pp2']);   // 1.5.2 B: danh sách VTVL theo thứ tự C1
    ud.c1Info = new Map(); ud.sl = null;   // 1.6.0: (Loại nhân lực, Giờ chuẩn PP2) cho dòng D1 điền sẵn
    if (t.cols) sortedRows(t).forEach(function (row) {
      var vt = get(row, t, 'mã vtvl');
      if (vt && !ud.c1.some(function (x) { return x[0] === vt; })) {
        ud.c1.push([vt, get(row, t, 'tên vtvl') || '']);
        ud.c1Info.set(vt, ['loại nhân lực', 'giờ chuẩn pp2'].map(function (k) { return t.cols[k] ? get(row, t, k) : null; }));
      }
    });
    // loại đơn vị (1.5.2 A): mã VTVL SGDDT- = trường; không thì cột E của dòng 'Tách tệp cho đơn vị' cuối cùng ở S_NhatKy
    var logX = await sheet(/S_NhatKy/), logE = null;
    if (logX != null) {
      var byrow = new Map(), lsp = I.dataSpan(logX), lsub = logX.slice(lsp[0], lsp[1]), lm, lre = new RegExp(I.CELL_RE.source, 'g');
      while ((lm = lre.exec(lsub))) {
        var lref = I.attr(lm[1], 'r'); if (!lref) continue;
        var lc = I.colOf(lref); if (lc !== 'D' && lc !== 'E') continue;
        var lv = I.cellValue(lm[1], lm[2], sst), lr = I.rowOf(lref);
        if (!byrow.has(lr)) byrow.set(lr, {});
        byrow.get(lr)[lc] = typeof lv === 'string' ? T.norm(lv) : lv;
      }
      var hits = Array.from(byrow.keys()).filter(function (r) { return byrow.get(r).D === 'Tách tệp cho đơn vị'; });
      if (hits.length) logE = byrow.get(Math.max.apply(null, hits)).E;
      if (logE === undefined) logE = null;
    }
    var md = typeof logE === 'string' ? /đơn vị sự nghiệp loại ([A-Z]+)/.exec(logE) : null;
    var vts = Array.from(ud.methods.keys()).concat(ud.c1.map(function (x) { return x[0]; }));
    ud.kind = vts.some(function (v) { return v.indexOf('SGDDT-') === 0; }) ? 'truong' : md ? 'dvsn:' + md[1]
      : (typeof logE === 'string' && logE.indexOf('khối chính quyền') >= 0) ? 'ubnd' : 'dang';
    t = table(await sheet(/B1_KhoiLuong/), ['mã công việc', 'mã sp trong danh mục']);
    if (t.cols) sortedRows(t).forEach(function (row) { var j = get(row, t, 'mã công việc'); if (j && !ud.spOfJob.has(j)) ud.spOfJob.set(j, get(row, t, 'mã sp trong danh mục')); });
    var keys = ['mã sản phẩm chuẩn', 'phút/sp chuẩn', 'văn bản/nguồn xác nhận', 'trạng thái'], opt = ['tên/loại sản phẩm', 'phạm vi áp dụng/ghi chú'];
    t = table(await sheet(/DM_SAN_PHAM/), keys, opt);
    if (t.cols) sortedRows(t).forEach(function (row) {
      var code = get(row, t, 'mã sản phẩm chuẩn');
      if (code && !ud.dm.has(code)) { var d = {}; keys.concat(opt).forEach(function (k) { d[k] = get(row, t, k); }); ud.dm.set(code, d); }
    });
    return ud;
  }

  // ---------- G1 / G2 ----------
  function pl3Items(text, minutes) {
    var m = PL3_ITEMS_RE.exec(text || '');
    if (!m || minutes == null) return '';
    var out = [];
    m[1].split(/\s*,\s*/).map(Number).forEach(function (n) {
      var it = PL3[n]; if (!it) return;
      LEVELS.forEach(function (lv) { if (it[lv[0]] * 60 === minutes) out.push(n + ' (' + lv[1] + ')'); });
    });
    return out.join('; ');
  }
  // [mục, mức] khi cột F của DM_SAN_PHAM nêu đúng một mục PL3 và phút bằng một mức của mục đó (= goi_y.dm_single)
  function dmSingle(text, minutes) {
    var m = PL3_ITEMS_RE.exec(text || '');
    if (!m) return null;
    var items = m[1].split(/\s*,\s*/).map(Number);
    if (items.length !== 1 || !PL3[items[0]]) return null;
    var n = items[0], lv = PL3_LEVEL_RE.exec(text);
    var hits = LEVELS.filter(function (l) { return PL3[n][l[0]] * 60 === minutes; }).map(function (l) { return l[1]; });
    if (lv && +lv[1] === n) {
      var stated = LEVELS.filter(function (l) { return l[1].toLowerCase() === lv[2].toLowerCase(); })[0][1];
      return hits.indexOf(stated) >= 0 ? [n, stated] : null;
    }
    return hits.length === 1 ? [n, hits[0]] : null;
  }
  function dmSegment(text) {
    var parts = String(text || '').split(';').map(strip);
    for (var i = 0; i < parts.length; i++) if (parts[i].indexOf('PL3') >= 0) return parts[i];
    return parts.length ? parts[0] : '';
  }
  function matchRule(product, jobName, dvt) {
    var sp = seg(low(product)), cv = seg(actionPart(jobName)), d = low(dvt);
    for (var i = 0; i < RULES.length; i++) {
      var R = RULES[i], j;
      if (R.r.dvt && R.r.dvt.map(low).indexOf(d) < 0) continue;
      if ((R.r.tru_khi_sp || []).some(function (x) { return hasKw(sp, kwToks(x)); })) continue;
      if (R.r.neu_cong_viec && !R.r.neu_cong_viec.some(function (x) { return hasKw(cv, kwToks(x)); })) continue;
      for (j = 0; j < R.kws.length; j++) if (hasKw(sp, R.kws[j][1])) return { rule: R.r, kw: R.kws[j][0], where: 'sản phẩm' };
      if (R.r.pham_vi === 'sp_cv') for (j = 0; j < R.kws.length; j++) if (hasKw(cv, R.kws[j][1])) return { rule: R.r, kw: R.kws[j][0], where: 'công việc' };
    }
    return null;
  }
  function countSuggestion(product) {
    var t = low(product), pres = MAP.chu_ky_bo_qua_tien_to || [], skip = null;
    // pl3_map 1.3: tên sản phẩm ghép từ tên nhiệm vụ của mẫu (tiền tố trong chu_ky_bo_qua_tien_to): không gợi ý số SP
    for (var q = 0; q < pres.length && skip == null; q++) if (t.indexOf(low(pres[q])) === 0) skip = pres[q];
    if (WORD_THANG.test(t) && WORD_QUY.test(t)) return [null, 'để trống: nêu cả tháng và quý'];
    var re = new RegExp(COUNT_SRC, 'gu'), kinds = [], first = null, m;
    while ((m = re.exec(t))) {
      var i = 0; while (m[i + 1] === undefined) i++;
      if (kinds.indexOf(i) < 0) kinds.push(i);
      if (first == null) first = m[0];
    }
    if (!kinds.length) return [null, ''];
    if (skip != null) return [null, 'để trống: tên sản phẩm bắt đầu bằng “' + skip + '” (cụm “' + first + '”)'];
    if (kinds.length > 1) return [null, 'để trống: nhiều chu kỳ (' + kinds.map(function (i) { return MAP.chu_ky[i].mau; }).join(', ') + ')'];
    return [MAP.chu_ky[kinds[0]].so, first];
  }
  /* Gợi ý của một dòng phiếu. ref = căn cứ (cho trang Can_cu_goi_y): ['method', PP|''] | ['pl3', n, mức] | ['dm1', mã, trạng thái, n, mức]
     | ['dm', mã, trạng thái, đoạn F, phút] | ['none'] | ['nopl3', lý do] (quy tắc "muc": null: không gợi ý phút)
     | ['nomin', câu] (1.6.1: số SP từ số liệu đơn vị đếm theo từng học sinh, trẻ: không điền sẵn phút) */
  function suggest(ud, job, vtvl, product, jobName, dvt) {
    var s = { min: null, basis: '', muc: '', kw: '', count: null, countPhrase: '', method: ud.methods.has(vtvl) ? ud.methods.get(vtvl) : null, sp: '', ref: null,
      tg: '', tgSt: '' };
    var c = countSuggestion(product); s.count = c[0]; s.countPhrase = c[1];
    var sv = slCountFor(ud, vtvl, product);   // 1.6.0: số liệu đơn vị đứng trước chu kỳ
    if (sv) { s.count = sv[0]; s.countPhrase = 'số liệu đơn vị'; s.sldv = sv[1]; }
    var tgi = tgItem(ud.kind, product);   // 1.5.2 A
    if (tgi) { s.tg = tgi.ma; s.tgSt = tgValued(tgi) ? 'tham khảo' : 'chưa có mức'; }
    var method = s.method;
    if (!method || String(method).toUpperCase().indexOf('PP2') < 0) {
      s.basis = method ? 'Vị trí tính theo ' + method + ' (Biểu C3); phút/SP chỉ cần cho PP2' : 'Vị trí chưa có phương pháp ở Biểu C3; phút/SP chỉ cần cho PP2';
      s.ref = ['method', method || ''];
    } else {
      var code = ud.spOfJob.get(job) || '';
      s.sp = code;
      var dm = ud.dm.get(code), e = dm ? numOrNone(dm['phút/sp chuẩn']) : null;
      if (e != null) {
        var f = dm['văn bản/nguồn xác nhận'] || '', g = dm['trạng thái'] || '';
        var suffix = (!g || /chờ xác nhận|dự thảo/i.test(g)) ? ' (dự thảo, chờ xác nhận)' : ' (' + g + ')';
        var one = dmSingle(f, e);
        s.min = e; s.muc = pl3Items(f, e);
        if (one) {
          s.basis = code + suffix + ' = PL3 mục ' + one[0] + ', mức ' + one[1] + '. ' + levelsText(one[0]) + '.';
          s.ref = ['dm1', code, suffix, one[0], one[1]];
        } else {
          var sg = dmSegment(f);
          s.basis = code + ': ' + (sg || 'DM_SAN_PHAM') + suffix;
          s.ref = ['dm', code, suffix, sg, e];
        }
      } else if (tgi && tgLevel(tgi)[0]) { // 1.5.2 A: mục bảng thời gian ĐVSN có mức
        var tl = tgLevel(tgi);
        s.min = tgi[tl[0]];
        s.basis = tgHead(tgi) + '. ' + tgLevelsText(tgi) + '. Đang điền: ' + tl[1] + '. Mức do đơn vị thống nhất, chưa được cơ quan có thẩm quyền xác nhận.';
        s.ref = ['tg', tgi.ma, tl[1]]; s.tgSt = tl[1];
      } else {
        var mr = matchRule(product, jobName, dvt);
        if (mr && mr.rule.muc == null) { // pl3_map 1.3: PL3 không có mức tương ứng -> không gợi ý phút
          s.basis = 'Không có mức tham khảo trong PL3 HD13 (' + mr.rule.ly_do + '); đo thực tế';
          s.muc = 'không gợi ý'; s.kw = mr.kw + ' (' + mr.where + ')';
          s.ref = ['nopl3', mr.rule.ly_do];
        } else if (mr) {
          var n = mr.rule.muc, it = PL3[n];
          s.min = it.tt * 60;
          s.basis = 'PL3 HD13 mục ' + n + ' – ' + it.ten + ' (ĐVT: ' + it.dvt + '). ' + levelsText(n) + '. Đang điền: Thông thường.';
          s.muc = n + ' (Thông thường)'; s.kw = mr.kw + ' (' + mr.where + ')';
          s.ref = ['pl3', n, 'Thông thường'];
        } else { s.basis = NO_REF; s.ref = ['none']; }
      }
    }
    if (s.sldv && s.min != null && (s.ref[0] === 'pl3' || s.ref[0] === 'tg')) {
      // 1.6.1: số SP đếm theo từng học sinh, trẻ mà mức tham khảo (PL3, bảng thời gian) tính cho đơn vị khác -> không điền sẵn phút
      var why = slNoMinutes(ud.kind, product), unitRef = s.ref[0] === 'pl3' ? PL3[s.ref[1]].dvt : tgi.dvt;
      if (why && !slPerPersonUnit(unitRef)) {
        if (s.ref[0] === 'tg') s.tgSt = 'tham khảo';
        s.min = null; s.muc = 'không gợi ý'; s.ref = ['nomin', why];
        s.basis = 'Không điền sẵn phút/SP: ' + why;
      }
    }
    if (s.count != null && !s.sldv) s.basis += SEP_COUNT + 'chu kỳ ghi trong tên sản phẩm (“' + s.countPhrase + '”)';
    if (tgi && s.ref[0] === 'method' && tgValued(tgi)) // 1.5.2 A: dòng không có PP2, mục bảng có mức
      s.basis += (/\.$/.test(s.basis) ? '' : '.') + ' Tham khảo ' + tgHead(tgi) + ': ' + tgLevelsText(tgi) + '.';
    if (s.sldv) s.basis = slBasisTail(s.basis, s.sldv, s.count);   // 1.6.0: bộ nạp nhận ra dòng số liệu đơn vị nhờ đuôi này
    return s;
  }

  // ---------- phiếu ----------
  var B1_KEYS = ['mã vtvl', 'tên vtvl', 'mã công việc', 'tên công việc', 'sản phẩm', 'đvt', 'số sản phẩm trong kỳ', 'nguồn số liệu',
    'phút/sp nhập tay nếu không đo', 'căn cứ gợi ý', 'gợi ý phút/sp ban đầu', 'gợi ý số sp ban đầu', 'gợi ý nguồn ban đầu'];
  function formColumns(ed) {
    var byrow = new Map();
    Object.keys(ed.cells).forEach(function (ref) {
      var r = I.rowOf(ref); if (r > 20) return;
      var v = ed.value(ref), k = typeof v === 'string' ? T.hkey(T.norm(v)) : null;
      if (k == null || B1_KEYS.indexOf(k) < 0) return;
      if (!byrow.has(r)) byrow.set(r, new Map());
      var d = byrow.get(r), c = I.colIdx(I.colOf(ref)); if (!d.has(k) || c < d.get(k)) d.set(k, c);
    });
    var rs = Array.from(byrow.keys()).sort(function (a, b) { return a - b; });
    for (var i = 0; i < rs.length; i++) {
      var d = byrow.get(rs[i]);
      if (B1_KEYS.every(function (k) { return d.has(k); })) { var cols = {}; B1_KEYS.forEach(function (k) { cols[k] = T.idxCol(d.get(k)); }); return { hr: rs[i], cols: cols }; }
    }
    throw new Error('Phieu_B1 của phiếu thiếu cột gợi ý (cần mẫu phiếu bản 1.4.2).');
  }
  function dataRows(ed, hr, cols) {
    var set = new Set(); Object.keys(ed.cells).forEach(function (ref) { var r = I.rowOf(ref); if (r > hr) set.add(r); });
    return Array.from(set).sort(function (a, b) { return a - b; }).map(function (r) {
      var job = ed.value(cols['mã công việc'] + r);
      if (typeof job !== 'string' || !T.pyStrip(job)) return null;
      var g = {}; B1_KEYS.forEach(function (k) { var v = ed.value(cols[k] + r); g[k] = typeof v === 'string' ? T.norm(v) : v; });
      return [r, g];
    }).filter(Boolean);
  }
  async function partsOf(zip) {
    var wb = await txt(zip, 'xl/workbook.xml'), rels = await txt(zip, 'xl/_rels/workbook.xml.rels'), part = {};
    I.sheetMap(wb, rels).forEach(function (s) { part[s.name] = s.part; });
    return part;
  }
  function sstCount(x, removed) { return x.replace(/(<sst\b[^>]*?\scount=")(\d+)(")/, function (m, a, n, b) { return a + (+n - removed) + b; }); }
  function putXml(zip, path, xml) {
    var f = zip.file(path);
    zip.file(path, new TextEncoder().encode(xml), { binary: true, createFolders: false, date: f ? f.date : undefined, unixPermissions: f ? f.unixPermissions : undefined, dosPermissions: f ? f.dosPermissions : undefined });
  }
  // dòng của trang Can_cu_goi_y (10 giá trị mỗi dòng), nhóm theo vị trí theo thứ tự trong phiếu (= goi_y.cc_rows)
  function ccRows(ud, recs) {
    var out = [], order = [], groups = new Map();
    recs.forEach(function (rs) {
      var v = rs[0], s = rs[1], vt = v['mã vtvl'];
      if (!groups.has(vt)) { groups.set(vt, { name: v['tên vtvl'] || '', keys: [], jobs: new Map(), tg: new Map() }); order.push(vt); }
      var g = groups.get(vt), keys = [s.ref].concat(s.sldv ? [['sldv', s.sldv, s.count]] : s.count != null ? [['count', s.countPhrase, s.count]] : []);
      keys.forEach(function (k) {
        if (k[0] === 'tg') return; // dòng bảng thời gian ĐVSN ghi riêng ở cuối nhóm
        var id = JSON.stringify(k);
        if (!g.jobs.has(id)) { g.keys.push(k); g.jobs.set(id, []); }
        g.jobs.get(id).push(v['mã công việc']);
      });
      if (s.tg) {
        if (!g.tg.has(s.tg)) g.tg.set(s.tg, { jobs: [], st: s.tgSt });
        var tt = g.tg.get(s.tg); tt.jobs.push(v['mã công việc']);
        if (s.ref[0] === 'tg') tt.st = s.tgSt;
      }
    });
    var nul = function (n) { var a = []; for (var i = 0; i < n; i++) a.push(null); return a; };
    order.forEach(function (vt) {
      var g = groups.get(vt), refs = g.keys.filter(function (k) { return k[0] !== 'count' && k[0] !== 'sldv'; });
      if (refs.length && refs[0][0] === 'method') {
        var pp = refs[0][1];
        out.push([vt, g.name, pp ? 'Vị trí tính theo ' + pp + '; không cần phút/SP' : 'Vị trí chưa có phương pháp ở Biểu C3; không có gợi ý phút/SP'].concat(nul(7)));
      }
      g.keys.forEach(function (k) {
        var codes = g.jobs.get(JSON.stringify(k)).join(', '), it;
        if (k[0] === 'method') return;
        if (k[0] === 'pl3') { it = PL3[k[1]]; out.push([vt, g.name, 'PL3 mục ' + k[1], it.ten, it.dvt].concat(levelMinutes(k[1]), [k[2], codes])); }
        else if (k[0] === 'dm1') { it = PL3[k[3]]; out.push([vt, g.name, k[1] + k[2] + ' = PL3 mục ' + k[3], it.ten, it.dvt].concat(levelMinutes(k[3]), [k[4], codes])); }
        else if (k[0] === 'dm') {
          var d = ud.dm.get(k[1]) || {}, m = DVT_RE.exec(d['phạm vi áp dụng/ghi chú'] || '');
          out.push([vt, g.name, k[1] + k[2], d['tên/loại sản phẩm'] || '', m ? strip(m[1]) : '', null, null, null, pyNum(k[4]) + ' phút' + (k[3] ? ' (' + k[3] + ')' : ''), codes]);
        } else if (k[0] === 'none') out.push([vt, g.name, 'Không có mức tham khảo', 'Đo thực tế 3–5 lần; chưa có mục PL3 hay mã sản phẩm phù hợp'].concat(nul(5), [codes]));
        else if (k[0] === 'nopl3') out.push([vt, g.name, 'Không có mức tham khảo', 'Đo thực tế 3–5 lần; ' + k[1]].concat(nul(5), [codes]));
        else if (k[0] === 'nomin') out.push([vt, g.name, 'Không điền sẵn phút/SP', k[1]].concat(nul(5), [codes]));   // 1.6.1
        else if (k[0] === 'sldv') out.push([vt, g.name, 'Số liệu đơn vị (bước 2)', k[1]].concat(nul(4), [pyNum(k[2]) + ' sản phẩm/năm', codes]));   // 1.6.0
        else if (k[0] === 'count') out.push([vt, g.name, 'Chu kỳ ghi trong tên sản phẩm', '“' + k[1] + '”'].concat(nul(4), [pyNum(k[2]) + ' sản phẩm/năm', codes]));
      });
      g.tg.forEach(function (t, ma) { // 1.5.2 A
        var it = TG_ITEM[ma];
        out.push([vt, g.name, 'Bảng TG ĐVSN mục ' + ma, it.ten + (it.phan_ra ? ' — Phân rã: ' + it.phan_ra : ''), it.dvt || '']
          .concat(LEVELS.map(function (lv) { return it[lv[0]]; }), [t.st, t.jobs.join(', ')]));
      });
    });
    ud.c1.forEach(function (x) { // 1.5.2 B: vị trí ở C1 không có dòng ở Phieu_B1
      var vt = x[0];
      if (groups.has(vt)) return;
      var pp = ud.methods.has(vt) ? ud.methods.get(vt) : null;
      out.push([vt, x[1], pp ? 'Vị trí tính theo ' + pp + '; không cần phút/SP' : 'Vị trí chưa có phương pháp ở Biểu C3; không có gợi ý phút/SP', noRowNote(ud, vt)].concat(nul(6)));
    });
    return out;
  }
  function noRowNote(ud, vt) { // (= goi_y.no_row_note): 1. tính chung khối lượng; 2. C3 không có PP2 (PP1, PP3, PP1+PP3); 3. có PP2 hoặc trống
    var m = CHUNG_RE.exec(ud.c3Note.get(vt) || '');
    if (!m) {
      var pp = ud.methods.has(vt) ? ud.methods.get(vt) : null, up = typeof pp === 'string' ? pp.toUpperCase() : '';
      if (up && up.indexOf('PP2') < 0 && (up.indexOf('PP1') >= 0 || up.indexOf('PP3') >= 0)) {
        var key = up.indexOf('PP1') >= 0 && up.indexOf('PP3') >= 0 ? 'PP1+PP3' : up.indexOf('PP1') >= 0 ? 'PP1' : 'PP3';
        return 'Vị trí tính theo ' + pp + ' (Biểu C3) nên không cần ghi khối lượng ở B1; ' + NOTE_PP[key] + ' ghi ở Biểu C3. ' +
          'Phiếu này để người giữ vị trí nắm thông tin và xác nhận.';
      }
      return NOTE_NO_A2;
    }
    var main = m[1], hit = ud.c1.filter(function (x) { return x[0] === main; })[0], name = hit ? hit[1] : '';
    return 'Vị trí này tính chung khối lượng với ' + main + (name ? ' – ' + name : '') + ': khối lượng ghi ở phiếu của ' + main + '. ' +
      'Phiếu này để người giữ vị trí nắm thông tin và xác nhận.';
  }
  function ccCell(ref, st, v) {
    var sa = st != null ? ' s="' + st + '"' : '';
    if (v == null || v === '') return '<c r="' + ref + '"' + sa + '/>';
    if (typeof v === 'string') return '<c r="' + ref + '"' + sa + ' t="inlineStr"><is><t xml:space="preserve">' + I.esc(v) + '</t></is></c>';
    return '<c r="' + ref + '"' + sa + '><v>' + pyNum(v) + '</v></c>';
  }
  // Can_cu_goi_y: dòng thứ hai của A2 (TG_NOTE), dòng 2 cao hơn (1.5.2 A, = goi_y.cc_note)
  function ccNote(x) {
    var y = x.replace(/(<c r="A2"[^>]*><is><t)(?: xml:space="preserve")?>([\s\S]*?)(<\/t><\/is><\/c>)/, function (q, a, t, b) { return a + ' xml:space="preserve">' + t + '\n' + I.esc(TG_NOTE) + b; });
    if (y === x) throw new Error('Can_cu_goi_y: không thấy ô A2');
    return y.replace(/(<row r="2"[^>]*?\sht=")[0-9.]+(")/, function (q, a, b) { return a + TG_CC_HT + b; });
  }
  // trang Can_cu_goi_y: dòng mẫu (dòng 9) thay bằng các dòng (giữ kiểu ô của dòng mẫu) (= goi_y.cc_sheet)
  function ccSheet(x, rows) {
    var re = new RegExp(I.ROW_RE.source, 'g'), rm, m;
    while ((m = re.exec(x))) if (I.attr(m[1], 'r') === String(CC_FIRST)) { rm = m; break; }
    if (!rm) throw new Error('Trang Can_cu_goi_y của mẫu phiếu thiếu dòng mẫu.');
    var styles = {}, cre = new RegExp(I.CELL_RE.source, 'g'), cm;
    while ((cm = cre.exec(rm[2] || ''))) styles[I.colOf(I.attr(cm[1], 'r'))] = I.attr(cm[1], 's');
    var body = rows.map(function (vals, i) {
      var r = CC_FIRST + i;
      return '<row r="' + r + '">' + vals.map(function (v, c) { var col = CC_COLS.charAt(c); return ccCell(col + r, styles[col], v); }).join('') + '</row>';
    }).join('');
    var end = x.indexOf('</sheetData>'), rmEnd = rm.index + rm[0].length;
    if (rmEnd > end || x.slice(rmEnd, end).trim()) throw new Error('Can_cu_goi_y: dòng mẫu phải là dòng cuối.');
    var last = CC_FIRST + rows.length - 1;
    var y = x.slice(0, rm.index) + body + x.slice(end);
    y = y.replace(/<dimension ref="A1:[A-Z]+\d+"\/>/, '<dimension ref="A1:J' + last + '"/>');
    y = y.replace(/<autoFilter ref="A(\d+):[A-Z]+\d+"\/>/, function (q, a) { return '<autoFilter ref="A' + a + ':J' + last + '"/>'; });
    return { xml: y, last: last };
  }
  function wbCcLast(wb, last) {
    return wb.replace(/(<definedName name="_xlnm\._FilterDatabase" localSheetId="\d+" hidden="1">'Can_cu_goi_y'!\$A\$\d+:\$J\$)\d+(<\/definedName>)/, function (q, a, b) { return a + last + b; });
  }
  /* Điền sẵn gợi ý vào Phieu_B1 của phiếu và dựng trang Can_cu_goi_y (JSZip, sửa tại chỗ) theo dữ liệu tệp đơn vị ud. */

  // ---------- 1.6.0 số liệu đơn vị (= so_lieu.py và goi_y.sl_sheets; không có số liệu thì không gọi gì ở đây) ----------
  var SL_LOAI_NL = ['Cán bộ', 'Công chức', 'Viên chức', 'Hợp đồng lao động', 'Khác'], SL_GIO = 1904, SL_TAG = ' Số SP điền sẵn: ';
  var SL_D1_NOTE = 'Dòng điền sẵn theo số người nhập ở bước 2: sửa theo thực tế; người kiêm nhiệm thêm dòng cùng mã nguồn lực; không ghi họ tên.';
  var SL_CC_HEAD = 'Số liệu đơn vị đã dùng (đầu mối nhập ở bước 2 để điền sẵn; mọi số điền sẵn đều sửa được): ';
  var SL_FILL = '<fill><patternFill patternType="solid"><fgColor rgb="00FCE4D6"/><bgColor rgb="00FCE4D6"/></patternFill></fill>', SL_D1_ROWS = 60;
  var SL_HD = ['bảo vệ', 'phục vụ', 'cấp dưỡng', 'lái xe', 'tạp vụ'], SL_CB = ['bí thư', 'phó bí thư', 'chủ tịch', 'phó chủ tịch', 'chủ nhiệm', 'phó chủ nhiệm', 'trưởng ban'];
  var SL_QT = [['số lớp thcs', 'lop_thcs'], ['số lớp thpt', 'lop_thpt'], ['số học sinh thcs', 'hs_thcs'], ['số học sinh thpt', 'hs_thpt'],
    ['số phó hiệu trưởng hiện có', '@LDQL-02'], ['có học sinh khuyết tật học hòa nhập không?', '@hs_kt']];
  var SL_RULES = new Map();
  SLDV.quy_tac.forEach(function (r) { var k = r.loai + '|' + low(r.san_pham); if (SL_RULES.has(k)) throw new Error('so_lieu_don_vi.json: trùng quy tắc ' + k); SL_RULES.set(k, r); });
  function slFields(kind) { return SLDV.truong_so_lieu[kind || ''] || []; }
  function slPerPersonUnit(dvt) {   // 1.6.1: ĐVT của mức tham khảo tính theo từng học sinh, trẻ
    var t = low(dvt);
    return t.indexOf('học sinh') >= 0 || t.indexOf('trẻ') >= 0;
  }
  function slNoMinutes(kind, product) {   // 1.6.1: câu "khong_dien_phut" của quy tắc, hoặc null
    var r = SL_RULES.get(kind + '|' + low(product));
    return r && r.khong_dien_phut ? r.khong_dien_phut : null;
  }
  function slCheck(d) {
    if (!d || typeof d !== 'object') throw new Error('Số liệu đơn vị phải là một đối tượng.');
    ['so_lieu', 'nguoi'].forEach(function (key) {
      var o = d[key] || {};
      Object.keys(o).forEach(function (k) { var v = o[k]; if (v != null && !(typeof v === 'number' && Number.isInteger(v) && v >= 0)) throw new Error('Số liệu đơn vị: ' + key + '.' + k + ' phải là số nguyên ≥ 0 hoặc để trống.'); });
    });
    return d;
  }
  function slHasData(d) {
    var any = function (o) { return Object.keys(o || {}).some(function (k) { return o[k] != null; }); };
    return !!d && (any(d.so_lieu) || any(d.nguoi));
  }
  function slPrepare(kind, d) {
    var given = d.so_lieu || {}, vals = {}, dflt = [], nguoi = new Map();
    slFields(kind).forEach(function (f) {
      var v = given[f.ma] == null ? null : given[f.ma];
      if (v == null && typeof f.mac_dinh === 'number') { v = f.mac_dinh; dflt.push(f.ma); }
      vals[f.ma] = v;
    });
    slFields(kind).forEach(function (f) { if (vals[f.ma] == null && f.mac_dinh === '5 × số tuần' && vals.tuan != null) { vals[f.ma] = 5 * vals.tuan; dflt.push(f.ma); } });
    Object.keys(d.nguoi || {}).forEach(function (k) { if (d.nguoi[k] != null) nguoi.set(k, d.nguoi[k]); });
    return { vals: vals, dflt: dflt, nguoi: nguoi };
  }
  function slEval(f, vals, nvt) {
    if (typeof f === 'number') return f;
    if (f === 'nguoi_vt') return nvt == null ? null : nvt;
    if (typeof f === 'string') return vals[f] == null ? null : vals[f];
    var op = Object.keys(f)[0], xs = f[op].map(function (a) { return slEval(a, vals, nvt); });
    if (xs.some(function (x) { return x == null; })) return null;
    if (op === 'cong') return xs.reduce(function (a, b) { return a + b; }, 0);
    if (op === 'nhan') return xs.reduce(function (a, b) { return a * b; }, 1);
    return xs[1] === 0 ? null : Math.ceil(xs[0] / xs[1]);
  }
  function slTeacherRank(name) { var t = low(name); return t.indexOf('giáo viên') === 0 && (t + ' ').indexOf(' hạng ') >= 0; }
  function slCountFor(ud, vtvl, product) {
    if (!ud.sl) return null;
    var r = SL_RULES.get(ud.kind + '|' + low(product));
    if (!r) return null;
    if (ud.kind === 'truong') { var hit = ud.c1.filter(function (x) { return x[0] === vtvl; })[0]; if (slTeacherRank(hit ? hit[1] : '')) return null; }
    var n = slEval(r.cong_thuc, ud.sl.vals, ud.sl.nguoi.has(vtvl) ? ud.sl.nguoi.get(vtvl) : null);
    return n == null || n < 0 ? null : [n, r.can_cu];
  }
  function slBasisTail(basis, canCu, n) { return basis + (/\.$/.test(basis) ? '' : '.') + SL_TAG + canCu + ' = ' + n + '.'; }
  function slCcText(kind, sl, c1) {
    var parts = slFields(kind).filter(function (f) { return sl.vals[f.ma] != null; })
      .map(function (f) { return f.nhan + ': ' + sl.vals[f.ma] + (sl.dflt.indexOf(f.ma) >= 0 ? ' (mặc định)' : ''); });
    var people = c1.filter(function (x) { return sl.nguoi.has(x[0]); }).map(function (x) { return x[0] + ': ' + sl.nguoi.get(x[0]); });
    var out = SL_CC_HEAD + (parts.length ? parts.join('; ') + '.' : '');
    if (people.length) out += (parts.length ? ' ' : '') + 'Số người hiện có theo vị trí: ' + people.join('; ') + '.';
    return out;
  }
  function slHt(v) { return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100); }
  function slCcNote(x, text) {
    var y = x.replace(/(<c r="A2"[^>]*><is><t)(?: xml:space="preserve")?>([\s\S]*?)(<\/t><\/is><\/c>)/, function (q, a, t, b) { return a + ' xml:space="preserve">' + t + '\n' + I.esc(text) + b; });
    if (y === x) throw new Error('Can_cu_goi_y: không thấy ô A2');
    var extra = 15 * (Math.floor(text.length / 150) + 1);
    return y.replace(/(<row r="2"[^>]*?\sht=")([0-9.]+)(")/, function (q, a, h, b) { return a + slHt(parseFloat(h) + extra) + b; });
  }
  function slLoaiNl(kind, name, c1Loai) {
    if (SL_LOAI_NL.indexOf(c1Loai) >= 0) return c1Loai;
    var t = low(name), starts = function (w) { return t.indexOf(w) === 0; };
    if (SL_HD.some(starts)) return 'Hợp đồng lao động';
    if (kind === 'dang' || kind === 'ubnd') return SL_CB.some(starts) ? 'Cán bộ' : 'Công chức';
    return 'Viên chức';
  }
  function slGio(v) {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string' && /^\d+(?:[.,]\d+)?$/.test(v.trim())) return parseFloat(v.trim().replace(',', '.'));
    return SL_GIO;
  }
  function slPersons(c1, sl) {
    var out = [];
    c1.forEach(function (x) { var n = sl.nguoi.has(x[0]) ? sl.nguoi.get(x[0]) : 0; for (var i = 0; i < n; i++) out.push(x); });
    return out;
  }
  function slD1Extend(x, wb, total) {
    var last = 3 + total;
    if (total <= SL_D1_ROWS) return { x: x, wb: wb };
    var m = /<row r="63"[^>]*>[\s\S]*?<\/row>/.exec(x);
    if (!m || x.slice(m.index + m[0].length).indexOf('</sheetData>') !== 0) throw new Error('Phieu_D1: hàng 63 phải là hàng cuối');
    var tpl = m[0], rows = '';
    for (var k = 64; k <= last; k++) {
      var y = tpl.replace(/<row r="63"/, '<row r="' + k + '"').replace(/(<c r="[A-Z]+)63"/g, function (q, a) { return a + k + '"'; });
      rows += y.split('&amp;".60"').join('&amp;".' + String(k - 3).padStart(2, '0') + '"');
    }
    var end = m.index + m[0].length;
    x = x.slice(0, end) + rows + x.slice(end);
    [['<dimension ref="A1:G63"/>', '<dimension ref="A1:G' + last + '"/>'], ['<autoFilter ref="A3:G63"/>', '<autoFilter ref="A3:G' + last + '"/>'],
      ['sqref="B4:B63"', 'sqref="B4:B' + last + '"'], ['sqref="C4:C63"', 'sqref="C4:C' + last + '"'], ['sqref="D4:E63"', 'sqref="D4:E' + last + '"']].forEach(function (ab) {
      if (x.split(ab[0]).length !== 2) throw new Error('Phieu_D1: ' + ab[0]);
      x = x.split(ab[0]).join(ab[1]);
    });
    var a = "'Phieu_D1'!$A$3:$G$63</definedName>";
    if (wb.split(a).length !== 2) throw new Error('workbook: _FilterDatabase của Phieu_D1');
    return { x: x, wb: wb.split(a).join("'Phieu_D1'!$A$3:$G$" + last + '</definedName>') };
  }
  function SlOrange(styles) {
    this.x = styles;
    this.fill = +/<fills count="(\d+)">/.exec(styles)[1];
    var m = /<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/.exec(styles);
    this.n0 = +m[1]; this.xfs = m[2].match(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g) || [];
    if (this.xfs.length !== this.n0) throw new Error('styles.xml: số cellXfs');
    this.add = []; this.map = new Map();
  }
  SlOrange.prototype.of = function (s) {
    var key = String(s);
    if (!this.map.has(key)) {
      var f = this.fill, y = this.xfs[+(s || 0)].replace(/fillId="\d+"/, 'fillId="' + f + '"');
      if (y.indexOf('applyFill=') < 0) y = y.replace('fillId="' + f + '"', 'fillId="' + f + '" applyFill="1"');
      this.map.set(key, String(this.n0 + this.add.length)); this.add.push(y);
    }
    return this.map.get(key);
  };
  SlOrange.prototype.xml = function () {
    var self = this;
    if (!this.add.length) return this.x;
    var y = this.x.replace(/<fills count="\d+">([\s\S]*?)<\/fills>/, function (q, a) { return '<fills count="' + (self.fill + 1) + '">' + a + SL_FILL + '</fills>'; });
    return y.replace(/<cellXfs count="\d+">([\s\S]*?)<\/cellXfs>/, function (q, a) { return '<cellXfs count="' + (self.n0 + self.add.length) + '">' + a + self.add.join('') + '</cellXfs>'; });
  };
  async function slSheets(zip, part, sst, ud, wbx) { // = goi_y.sl_sheets
    var sl = ud.sl, orange = new SlOrange(await txt(zip, 'xl/styles.xml')), out = {}, removed = 0;
    var ed = new I.SheetEdit(await txt(zip, part.Thong_tin_don_vi), sst), at = new Map();
    Object.keys(ed.cells).forEach(function (ref) {
      var v = ed.value(ref), c = I.colOf(ref);
      if (typeof v === 'string' && I.rowOf(ref) >= 4 && (c === 'A' || c === 'B')) { var k = c + '|' + (c === 'B' ? low(v) : v); if (!at.has(k)) at.set(k, I.rowOf(ref)); }
    });
    ud.c1.forEach(function (x) {
      var r = at.get('A|' + x[0]), n = sl.nguoi.has(x[0]) ? sl.nguoi.get(x[0]) : null;
      if (r == null || n == null) return;
      ed.setText('C' + r, n > 0 ? 'Có' : 'Không', orange.of(ed.styleOf('C' + r)));
      ed.setNumber('D' + r, n, orange.of(ed.styleOf('D' + r)));
    });
    if (ud.kind === 'truong') SL_QT.forEach(function (qk) {
      var r = at.get('B|' + qk[0]), v;
      if (r == null) return;
      if (qk[1] === '@LDQL-02') { var hit = ud.c1.filter(function (x) { return /-LDQL-02$/.test(x[0]); })[0]; v = hit && sl.nguoi.has(hit[0]) ? sl.nguoi.get(hit[0]) : null; }
      else if (qk[1] === '@hs_kt') v = sl.vals.hs_kt == null ? null : (sl.vals.hs_kt > 0 ? 'Có' : 'Không');
      else v = sl.vals[qk[1]] == null ? null : sl.vals[qk[1]];
      if (typeof v === 'string') ed.setText('C' + r, v, orange.of(ed.styleOf('C' + r)));
      else if (v != null) ed.setNumber('C' + r, v, orange.of(ed.styleOf('C' + r)));
    });
    if (ed.order.length) { out[part.Thong_tin_don_vi] = ed.apply(); removed += ed.sRemoved; }
    var people = slPersons(ud.c1, sl);
    if (people.length) {
      var ext = slD1Extend(await txt(zip, part.Phieu_D1), wbx, people.length);
      wbx = ext.wb; ed = new I.SheetEdit(ext.x, sst);
      var a2 = ed.value('A2');
      ed.setText('A2', (typeof a2 === 'string' && a2 ? a2.replace(/\.+$/, '') + '. ' : '') + SL_D1_NOTE);
      var unitName = new I.SheetEdit(await txt(zip, part.Huong_dan), sst).value('B2');
      people.forEach(function (x, i) {
        var r = 4 + i, info = ud.c1Info.get(x[0]) || [null, null];
        ed.setText('B' + r, x[0], orange.of(ed.styleOf('B' + r)));
        ed.setText('C' + r, slLoaiNl(ud.kind, x[1], info[0]), orange.of(ed.styleOf('C' + r)));
        ed.setNumber('D' + r, slGio(info[1]), orange.of(ed.styleOf('D' + r)));
        if (typeof unitName === 'string' && unitName.trim()) ed.setText('F' + r, unitName, orange.of(ed.styleOf('F' + r)));
      });
      out[part.Phieu_D1] = ed.apply(); removed += ed.sRemoved;
    }
    if (orange.add.length) out['xl/styles.xml'] = orange.xml();
    return { out: out, wbx: wbx, removed: removed };
  }
  async function fillForm(zip, ud, slIn) {
    ud.sl = slIn != null && slHasData(slCheck(slIn)) ? slPrepare(ud.kind, slIn) : null;   // 1.6.0: không nhập gì thì như 1.5.3
    var part = await partsOf(zip), p = part.Phieu_B1, x = await txt(zip, p);
    var sstX = await txt(zip, 'xl/sharedStrings.xml'), sst = sstX != null ? I.siTexts(sstX) : [];
    var ed = new I.SheetEdit(x, sst), fc = formColumns(ed), cols = fc.cols, recs = [];
    dataRows(ed, fc.hr, cols).forEach(function (rv) {
      var r = rv[0], v = rv[1], s = suggest(ud, v['mã công việc'], v['mã vtvl'], v['sản phẩm'] || '', v['tên công việc'] || '', v['đvt'] || '');
      if (s.min != null) { ed.setNumber(cols['phút/sp nhập tay nếu không đo'] + r, s.min); ed.setNumber(cols['gợi ý phút/sp ban đầu'] + r, s.min); }
      ed.setText(cols['căn cứ gợi ý'] + r, s.basis);
      if (s.count != null) { ed.setNumber(cols['số sản phẩm trong kỳ'] + r, s.count); ed.setNumber(cols['gợi ý số sp ban đầu'] + r, s.count); }
      recs.push([v, s]);
    });
    putXml(zip, p, ed.apply());
    if (!part[CC_SHEET]) throw new Error('Mẫu phiếu thiếu trang ' + CC_SHEET + ' (cần mẫu phiếu bản 1.4.2).');
    var ccX = await txt(zip, part[CC_SHEET]);
    var ccIn = TG.ap_dung.indexOf(ud.kind) >= 0 ? ccNote(ccX) : ccX;
    if (ud.sl) ccIn = slCcNote(ccIn, slCcText(ud.kind, ud.sl, ud.c1));   // 1.6.0: phần "Số liệu đơn vị đã dùng" ở A2
    var cc = ccSheet(ccIn, ccRows(ud, recs));
    putXml(zip, part[CC_SHEET], cc.xml);
    var wbx = wbCcLast(await txt(zip, 'xl/workbook.xml'), cc.last), removed = ed.sRemoved;
    if (ud.sl) {
      var more = await slSheets(zip, part, sst, ud, wbx);
      Object.keys(more.out).forEach(function (k) { putXml(zip, k, more.out[k]); });
      wbx = more.wbx; removed += more.removed;
    }
    putXml(zip, 'xl/workbook.xml', wbx);
    if (removed && sstX != null) putXml(zip, 'xl/sharedStrings.xml', sstCount(sstX, removed));
    return {
      rows: recs.length, minutes: recs.filter(function (x) { return x[1].min != null; }).length,
      counts: recs.filter(function (x) { return x[1].count != null; }).length,
      sources: recs.filter(function (x) { return x[0]['gợi ý nguồn ban đầu']; }).length,
      byDM: recs.filter(function (x) { return x[1].min != null && !x[1].kw && x[1].ref[0] !== 'tg'; }).length, byKeyword: recs.filter(function (x) { return x[1].kw; }).length,
      byTG: recs.filter(function (x) { return x[1].ref[0] === 'tg'; }).length, tgMatched: recs.filter(function (x) { return x[1].tg; }).length,
      tgRef: recs.filter(function (x) { return x[1].tg && x[1].ref[0] === 'method' && x[1].tgSt === 'tham khảo'; }).length, kind: ud.kind,
      noRows: ud.c1.map(function (x) { return x[0]; }).filter(function (vt) { return !recs.some(function (r) { return r[0]['mã vtvl'] === vt; }); }),
      positions: new Set(recs.map(function (x) { return x[0]['mã vtvl']; })).size, ccRows: cc.last - CC_FIRST + 1, recs: recs, ud: ud,
      sldv: recs.filter(function (x) { return x[1].sldv; }).length, d1: ud.sl ? slPersons(ud.c1, ud.sl).length : 0, slDefaults: ud.sl ? ud.sl.dflt : []
    };
  }
  // tệp goi_y_<mã>.csv như csv.writer của Python (QUOTE_MINIMAL, CRLF), chưa có BOM (= goi_y.csv_rows / csv_text)
  function csvRows(ud, recs) {
    var tg = TG.ap_dung.indexOf(ud.kind) >= 0;
    var head = ['Mã VTVL', 'Tên VTVL', 'Mã công việc', 'Tên công việc', 'Sản phẩm', 'ĐVT', 'Gợi ý phút/SP', 'Căn cứ gợi ý', 'Mục PL3 khớp']
      .concat(tg ? ['Mục bảng TG ĐVSN'] : [], ['Từ khóa khớp', 'Gợi ý số SP/năm', 'Cụm từ chu kỳ', 'Phương pháp (C3)', 'Mã SP (B1 cột L)', 'Nguồn số liệu điền sẵn']);
    var out = [head];
    recs.forEach(function (rs) {
      var v = rs[0], s = rs[1];
      out.push([v['mã vtvl'], v['tên vtvl'], v['mã công việc'], v['tên công việc'], v['sản phẩm'], v['đvt'], s.min == null ? '' : pyNum(s.min), s.basis, s.muc]
        .concat(tg ? [s.tg] : [], [s.kw, s.count == null ? '' : pyNum(s.count), s.countPhrase, s.method || '', s.sp, v['gợi ý nguồn ban đầu'] || '']));
    });
    return out;
  }
  function csvText(ud, recs) {
    return csvRows(ud, recs).map(function (row) {
      return row.map(function (x) {
        var t = x == null ? '' : typeof x === 'number' ? pyNum(x) : String(x);
        return /[",\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
      }).join(',') + '\r\n';
    }).join('');
  }

  // ---------- G3: phiếu riêng từng vị trí ----------
  function renumberRow(rx, r, n) {
    rx = rx.replace(/^<row r="\d+"/, '<row r="' + n + '"');
    rx = rx.replace(new RegExp('(<c r="[A-Z]+)' + r + '"', 'g'), function (q, a) { return a + n + '"'; });
    return rx.replace(/<f>([\s\S]*?)<\/f>/g, function (q, f) {
      return '<f>' + f.replace(new RegExp('(?<![A-Za-z0-9_$.!])([A-Z]{1,3})' + r + '(?![0-9])', 'g'), function (z, c) { return c + n; }) + '</f>';
    });
  }
  function b1ForPosition(x, hr, newrow, last, lastCol) {
    var sp = I.dataSpan(x), body = x.slice(sp[0], sp[1]), parts = [], lastEnd = null, m, re = new RegExp(I.ROW_RE.source, 'g');
    while ((m = re.exec(body))) {
      parts.push(lastEnd == null ? body.slice(0, m.index) : body.slice(lastEnd, m.index));
      var r = +I.attr(m[1], 'r');
      lastEnd = m.index + m[0].length;
      if (newrow.has(r)) parts.push(renumberRow(m[0], r, newrow.get(r)));
      else if (r <= hr) parts.push(m[0]);
    }
    parts.push(lastEnd == null ? body : body.slice(lastEnd));
    var y = x.slice(0, sp[0]) + parts.join('') + x.slice(sp[1]);
    y = y.replace(/<dimension ref="A1:[A-Z]+\d+"\/>/, '<dimension ref="A1:' + lastCol + last + '"/>');
    y = y.replace(/<autoFilter ref="A(\d+):[A-Z]+\d+"\/>/, function (q, a) { return '<autoFilter ref="A' + a + ':' + lastCol + last + '"/>'; });
    // danh sách kiểm tra và định dạng có điều kiện trên cả cột nhập theo dòng cuối mới
    return y.replace(/(<(?:dataValidation|conditionalFormatting)\b[^>]*?\ssqref=")([A-Z]+)(\d+):\2\d+(")/g, function (q, a, col, r0, b) { return a + col + r0 + ':' + col + last + b; });
  }
  function ccForPosition(x, vt, sst) {
    var sp = I.dataSpan(x), body = x.slice(sp[0], sp[1]), parts = [], lastEnd = null, n = CC_FIRST - 1, m, re = new RegExp(I.ROW_RE.source, 'g');
    while ((m = re.exec(body))) {
      parts.push(lastEnd == null ? body.slice(0, m.index) : body.slice(lastEnd, m.index));
      var r = +I.attr(m[1], 'r');
      lastEnd = m.index + m[0].length;
      if (r < CC_FIRST) { parts.push(m[0]); continue; }
      var a = null, cre = new RegExp(I.CELL_RE.source, 'g'), cm;
      while ((cm = cre.exec(m[2] || ''))) if (I.attr(cm[1], 'r') === 'A' + r) { a = I.cellValue(cm[1], cm[2], sst); break; }
      if (a === vt) { n++; parts.push(renumberRow(m[0], r, n)); }
    }
    parts.push(lastEnd == null ? body : body.slice(lastEnd));
    if (n < CC_FIRST) throw new Error('Can_cu_goi_y: không có dòng của ' + vt);
    var y = x.slice(0, sp[0]) + parts.join('') + x.slice(sp[1]);
    y = y.replace(/<dimension ref="A1:[A-Z]+\d+"\/>/, '<dimension ref="A1:J' + n + '"/>');
    y = y.replace(/<autoFilter ref="A(\d+):[A-Z]+\d+"\/>/, function (q, a2) { return '<autoFilter ref="A' + a2 + ':J' + n + '"/>'; });
    return { xml: y, last: n };
  }
  // workbook.xml của phiếu vị trí: bỏ Thong_tin_don_vi, Phieu_D1 thành Thong_tin_tep, bỏ DS_MA_VTVL, dời localSheetId (= goi_y.wb_for_position)
  function wbForPosition(wb, ttIndex, d1Index, b1Last, ccLast) {
    wb = wb.replace(/<sheet\b[^>]*\sname="Thong_tin_don_vi"[^>]*\/>/, '').replace('name="Phieu_D1"', 'name="Thong_tin_tep"');
    wb = wb.replace(/<definedName\b[^>]*>[^<]*<\/definedName>/g, function (x) {
      if (x.indexOf('<definedName name="DS_MA_VTVL"') >= 0) return '';
      var lid = /localSheetId="(\d+)"/.exec(x);
      if (lid) {
        var i = +lid[1];
        if (i === ttIndex || i === d1Index) return '';
        if (i > ttIndex) x = x.replace('localSheetId="' + i + '"', 'localSheetId="' + (i - 1) + '"');
      }
      return x;
    });
    wb = wb.replace(/(<definedName name="DS_MA_CONG_VIEC">Phieu_B1!\$D\$\d+:\$D\$)\d+(<\/definedName>)/, function (q, a, b) { return a + b1Last + b; })
      .replace(/(<definedName name="_xlnm\._FilterDatabase" localSheetId="\d+" hidden="1">'Phieu_B1'!\$A\$\d+:\$[A-Z]+\$)\d+(<\/definedName>)/, function (q, a, b) { return a + b1Last + b; });
    return wbCcLast(wb, ccLast);
  }
  function infoSheet(ma, vt, ngay, h, t, inp) {
    function c(ref, text, st) { return '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + I.esc(text) + '</t></is></c>'; }
    var head = ['Mã đơn vị', 'Mã VTVL', 'Người đo (chức danh)', 'Thời điểm xuất', 'Nguồn'];
    var r1 = head.map(function (x, i) { return c(String.fromCharCode(65 + i) + '1', x, h); }).join('');
    var r2 = c('A2', ma, t) + c('B2', vt, t) + '<c r="C2" s="' + inp + '"/>' + c('D2', ngay.slice(0, 2) + '/' + ngay.slice(2, 4) + '/' + ngay.slice(4), t) + c('E2', NGUON_VI_TRI, t);
    var cols = [14, 20, 30, 16, 22].map(function (w, i) { return '<col width="' + w + '" customWidth="1" min="' + (i + 1) + '" max="' + (i + 1) + '"/>'; }).join('');
    return '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:E2"/>' +
      '<sheetViews><sheetView workbookViewId="0"><selection activeCell="C2" sqref="C2"/></sheetView></sheetViews>' +
      '<sheetFormatPr baseColWidth="8" defaultRowHeight="15"/><cols>' + cols + '</cols><sheetData><row r="1">' + r1 + '</row>' +
      '<row r="2">' + r2 + '</row></sheetData><pageMargins left="0.3" right="0.3" top="0.45" bottom="0.55" header="0.2" footer="0.25"/></worksheet>';
  }
  function huongDanForPosition(x, sst, ma) {
    var ed = new I.SheetEdit(x, sst), rows = {};
    Object.keys(ed.cells).forEach(function (ref) { var v = ed.value(ref); if (I.colOf(ref) === 'B' && typeof v === 'string') rows[v] = I.rowOf(ref); });
    [['Trang Thong_tin_don_vi', HD_TT], ['Trang Phieu_D1', HD_D1]].forEach(function (kv) {
      ed.setText('B' + rows[kv[0]], kv[1][0]); ed.setText('C' + rows[kv[0]], kv[1][1]);
    });
    ed.setText('B4', ma, null, true);
    return { xml: ed.apply(), removed: ed.sRemoved };
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  /* Tạo zip "Phieu_tung_vi_tri_<mã>.zip" từ phiếu đã điền gợi ý (bytes); ngay = ddmmyyyy (Thời điểm xuất ở Thong_tin_tep).
     type: 'blob' | 'uint8array' | 'nodebuffer' */
  async function perPosition(JSZip, formBytes, ma, ngay, type, onProgress) {
    var prog = onProgress || function () {};
    var base = await JSZip.loadAsync(formBytes), part = await partsOf(base);
    var b1p = part.Phieu_B1, d1p = part.Phieu_D1, hdp = part.Huong_dan, ttp = part.Thong_tin_don_vi, ccp = part[CC_SHEET];
    var texts = {}, names = Object.keys(base.files).filter(function (n) { return !base.files[n].dir; });
    for (var i = 0; i < names.length; i++) if (/\.(xml|rels)$/.test(names[i])) texts[names[i]] = await base.file(names[i]).async('string');
    var sst = texts['xl/sharedStrings.xml'] != null ? I.siTexts(texts['xl/sharedStrings.xml']) : [];
    var sheetNames = I.sheetMap(texts['xl/workbook.xml'], texts['xl/_rels/workbook.xml.rels']).map(function (x) { return x.name; });
    var ttIndex = sheetNames.indexOf('Thong_tin_don_vi'), d1Index = sheetNames.indexOf('Phieu_D1');
    var b1ed = new I.SheetEdit(texts[b1p], sst), fc = formColumns(b1ed), hr = fc.hr, cols = fc.cols;
    var pos = new Map();
    dataRows(b1ed, hr, cols).forEach(function (rv) {
      var vt = rv[1]['mã vtvl'];
      if (!pos.has(vt)) pos.set(vt, { name: rv[1]['tên vtvl'], rows: [] });
      pos.get(vt).rows.push(rv);
    });
    // 1.5.2 B: vị trí chỉ có ở Can_cu_goi_y (không có dòng ở Phieu_B1): phiếu không có dòng, ghi chú ở A2
    var rre = new RegExp(I.ROW_RE.source, 'g'), rm2;
    while ((rm2 = rre.exec(texts[ccp]))) {
      if (+I.attr(rm2[1], 'r') < CC_FIRST) continue;
      var cv = {}, cre2 = new RegExp(I.CELL_RE.source, 'g'), cm2;
      while ((cm2 = cre2.exec(rm2[2] || ''))) cv[I.colOf(I.attr(cm2[1], 'r'))] = I.cellValue(cm2[1], cm2[2], sst);
      var xvt = cv.A;
      if (typeof xvt === 'string' && xvt && !pos.has(xvt)) pos.set(xvt, { name: cv.B || '', rows: [], note: cv.D || '' });
    }
    var hd = huongDanForPosition(texts[hdp], sst, ma);
    var ttRid = I.attr(/<sheet\b[^>]*\sname="Thong_tin_don_vi"[^>]*\/>/.exec(texts['xl/workbook.xml'])[0], 'r:id');
    var rels = texts['xl/_rels/workbook.xml.rels'].replace(new RegExp('<Relationship\\b[^>]*\\sId="' + escRe(ttRid) + '"[^>]*\\/>'), '');
    var ctypes = texts['[Content_Types].xml'].replace('<Override PartName="/' + ttp + '" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>', '');
    if (rels === texts['xl/_rels/workbook.xml.rels'] || ctypes === texts['[Content_Types].xml']) throw new Error('Phiếu không đúng cấu trúc mẫu (Thong_tin_don_vi).');
    var lastCol = /<dimension ref="A1:([A-Z]+)\d+"\/>/.exec(texts[b1p])[1];
    var outer = new JSZip(), list = [], k = 0, total = pos.size;
    for (var entry of pos) {
      k++;
      var vt = entry[0], info = entry[1];
      prog('Đang tạo phiếu ' + k + '/' + total + '…', k / total);
      var ed = new I.SheetEdit(texts[b1p], sst), newrow = new Map(), last = hr + info.rows.length;
      info.rows.forEach(function (rv, j) { newrow.set(rv[0], hr + 1 + j); });
      if (info.rows.length) ed.setText('A2', 'Phiếu của vị trí ' + vt + ' – ' + info.name + ': chỉ gồm công việc của vị trí này. ' + NOTE_B1);
      else { // 1.5.2 B: không dòng dữ liệu; vùng tham chiếu giữ một dòng trống
        last = hr + 1;
        ed.setText('A2', 'Phiếu của vị trí ' + vt + ' – ' + info.name + ': không có dòng khối lượng. ' + info.note);
      }
      var b1 = b1ForPosition(ed.apply(), hr, newrow, last, lastCol);
      var cc = ccForPosition(texts[ccp], vt, sst);
      var d1 = infoSheet(ma, vt, ngay, b1ed.styleOf('A3'), b1ed.styleOf('B' + (hr + 1)), b1ed.styleOf(cols['nguồn số liệu'] + (hr + 1)));
      var wbx = wbForPosition(texts['xl/workbook.xml'], ttIndex, d1Index, last, cc.last);
      var z = await JSZip.loadAsync(formBytes);
      putXml(z, b1p, b1); putXml(z, d1p, d1); putXml(z, hdp, hd.xml); putXml(z, 'xl/workbook.xml', wbx); putXml(z, ccp, cc.xml);
      putXml(z, 'xl/_rels/workbook.xml.rels', rels); putXml(z, '[Content_Types].xml', ctypes);
      z.remove(ttp);
      var removed = ed.sRemoved + hd.removed;
      if (removed && texts['xl/sharedStrings.xml'] != null) putXml(z, 'xl/sharedStrings.xml', sstCount(texts['xl/sharedStrings.xml'], removed));
      var name = 'Phieu_' + vt + '_' + vtvlShort(info.name) + '.xlsx';
      var bytes = await z.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: I.MIME });
      outer.file(name, bytes, { binary: true, createFolders: false, date: new Date(Date.UTC(2026, 9, 31)) });
      var nPre = 0;
      info.rows.forEach(function (rv) { ['gợi ý phút/sp ban đầu', 'gợi ý số sp ban đầu', 'gợi ý nguồn ban đầu'].forEach(function (c) { if (rv[1][c] != null) nPre++; }); });
      list.push({ name: name, rows: info.rows.length, prefilled: nPre });
    }
    var zipName = 'Phieu_tung_vi_tri_' + ma + '.zip';
    var data = await outer.generateAsync({ type: type || 'blob', compression: 'STORE', mimeType: 'application/zip' });
    return { name: zipName, data: data, files: list };
  }

  return { unitData: unitData, suggest: suggest, fillForm: fillForm, perPosition: perPosition, vtvlShort: vtvlShort, csvText: csvText, MAP: MAP, TG: TG,
    _t: { low: low, countSuggestion: countSuggestion, matchRule: matchRule, pl3Items: pl3Items, actionPart: actionPart, seg: seg, hasKw: hasKw, kwToks: kwToks,
      dmSingle: dmSingle, dmSegment: dmSegment, ccRows: ccRows, tgItem: tgItem, csvRows: csvRows } };
}));
