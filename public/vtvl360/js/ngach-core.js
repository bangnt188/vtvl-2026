/* Tạo tệp đơn vị 1.7.0 — lõi bảng "Nhân sự theo mã ngạch" (SPEC_TOOL_170 A): chuẩn hóa mã ngạch nhập tay, tra danh mục
   (ngach.json: dac_biet, bi_danh, ngach[].tu_khoa), gợi ý vị trí theo tên VTVL ở C1 của mẫu, cộng số người theo vị trí.
   Chỉ là công cụ tính ra số người theo VTVL (như bảng số người của bản 1.6.1): không đụng tới phần tạo tệp.
   Trình duyệt: window.VTVLNgach (dữ liệu ở window.NGACH_DM, nhúng lúc dựng trang); Node: module.exports (danh mục ở tệp chỉ bởi biến môi
   trường VTVL_NGACH_JSON, nếu có), thêm .create(dữ liệu) để dựng với danh mục bất kỳ. Đọc danh mục theo cấu trúc, không gắn với danh sách mã cụ thể. */
(function (root, factory) {
  var data = root && root.NGACH_DM ? root.NGACH_DM : null;
  if (!data && typeof require === 'function' && typeof module === 'object' && typeof process === 'object' && process.env && process.env.VTVL_NGACH_JSON)
    data = JSON.parse(require('fs').readFileSync(process.env.VTVL_NGACH_JSON, 'utf8'));
  var api = factory(data);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VTVLNgach = api;
}(typeof self !== 'undefined' ? self : this, function (data0) {
  'use strict';
  // khoảng trắng như low() của goiy-core (tập str.isspace() của Python cộng U+FEFF)
  var WS_RUN = new RegExp('[\\t\\n\\x0b\\x0c\\r\\x1c-\\x1f \\x85\\xa0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]+', 'g');
  function low(s) { return String(s == null ? '' : s).normalize('NFC').replace(WS_RUN, ' ').replace(/^ +| +$/g, '').toLowerCase(); }
  function deaccent(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); }
  // khóa so mã: bỏ khoảng trắng, chữ hoa, "V07.04.31" -> "V.07.04.31" (một chữ cái đứng liền chữ số ở đầu mã)
  function key(s) { return String(s == null ? '' : s).normalize('NFC').replace(WS_RUN, '').toUpperCase().replace(/^([A-Z])(?=[0-9])/, '$1.'); }
  function isGuess(kind) { return kind === 'truong' || /^dvsn:/.test(String(kind || '')); }   // Đảng, chính quyền xã: không gợi ý

  function create(data) {
    data = data || {};
    var list = Array.isArray(data.ngach) ? data.ngach : [], special = Array.isArray(data.dac_biet) ? data.dac_biet : [];
    var alias = data.bi_danh && typeof data.bi_danh === 'object' ? data.bi_danh : {};
    var IDX = new Map(), SPEC = new Map(), ALIAS = new Map();
    list.forEach(function (e) { if (e && typeof e.ma === 'string' && e.ma.trim() && !IDX.has(key(e.ma))) IDX.set(key(e.ma), e); });
    special.forEach(function (e) { if (e && typeof e.ma === 'string' && e.ma.trim()) { var k = deaccent(key(e.ma)); if (!SPEC.has(k)) SPEC.set(k, e); } });
    Object.keys(alias).forEach(function (a) { if (typeof alias[a] === 'string' && alias[a].trim()) ALIAS.set(key(a), alias[a]); });

    /* Tra một mã nhập tay: { ma: mã chuẩn ('' khi trống), entry: mục danh mục | null, special: bool, alias: mã nhập khi đã đổi theo bi_danh }.
       Thứ tự: mục đặc biệt (CB, HĐ; so không dấu nên "hd", "hđ" cũng nhận) -> bi_danh -> danh mục. Không có thì giữ mã đã chuẩn hóa. */
    function lookup(raw) {
      var k = key(raw);
      if (!k) return { ma: '', entry: null, special: false, alias: null };
      var sp = SPEC.get(deaccent(k));
      if (sp) return { ma: sp.ma, entry: sp, special: true, alias: null };
      var al = ALIAS.has(k) ? ALIAS.get(k) : null, k2 = al != null ? key(al) : k, e = IDX.get(k2);
      if (e) return { ma: e.ma, entry: e, special: false, alias: al != null ? k : null };
      return { ma: al != null ? String(al).replace(WS_RUN, '') : k, entry: null, special: false, alias: al != null ? k : null };
    }
    /* Vị trí mặc định cho một mã: chỉ mẫu trường và ĐVSN. Với từng từ khóa theo thứ tự: (a) tên VTVL (chuẩn hóa như low()) TRÙNG
       từ khóa, đúng một vị trí thì chọn; (b) tên CHỨA từ khóa, đúng một vị trí thì chọn; chưa chọn được thì sang từ khóa sau.
       c1 = [[mã VTVL, tên], …]. Trả { vt, ten, kw, how: 'trùng'|'chứa' } hoặc null. */
    function suggest(c1, entry, kind) {
      if (!entry || !isGuess(kind) || !Array.isArray(entry.tu_khoa)) return null;
      var names = (c1 || []).map(function (x) { return low(x[1]); });
      for (var i = 0; i < entry.tu_khoa.length; i++) {
        var kw = low(entry.tu_khoa[i]);
        if (!kw) continue;
        var ex = [], ct = [];
        names.forEach(function (n, j) { if (n === kw) ex.push(j); if (n.indexOf(kw) >= 0) ct.push(j); });
        if (ex.length === 1) return { vt: c1[ex[0]][0], ten: c1[ex[0]][1], kw: entry.tu_khoa[i], how: 'trùng' };
        if (ct.length === 1) return { vt: c1[ct[0]][0], ten: c1[ct[0]][1], kw: entry.tu_khoa[i], how: 'chứa' };
      }
      return null;
    }
    function count(v) { var t = String(v == null ? '' : v).trim(); return /^[0-9]+$/.test(t) ? parseInt(t, 10) : 0; }
    /* Cộng các dòng [{ma, n, vt}] (mã đã nhập, số người, mã VTVL của mẫu hoặc ''):
       total; byCode [[mã, số người, số dòng]] theo thứ tự xuất hiện; free = người chưa xếp vị trí {n, codes}; byVt Map(VTVL -> số người). */
    function sum(rows) {
      var out = { total: 0, byCode: [], free: { n: 0, codes: [] }, byVt: new Map(), people: 0 }, at = new Map();
      (rows || []).forEach(function (r) {
        var n = count(r.n), m = lookup(r.ma).ma;
        if (!m && !n) return;
        var c = m || '(chưa ghi mã)';
        if (!at.has(c)) { at.set(c, out.byCode.length); out.byCode.push([c, 0, 0]); }
        var b = out.byCode[at.get(c)]; b[1] += n; b[2] += 1;
        out.total += n;
        if (!n) return;
        if (!r.vt) { out.free.n += n; if (out.free.codes.indexOf(c) < 0) out.free.codes.push(c); return; }
        out.byVt.set(r.vt, (out.byVt.get(r.vt) || 0) + n);
      });
      return out;
    }
    return {
      version: typeof data.phien_ban === 'string' ? data.phien_ban : '', size: IDX.size,
      options: function () { return special.concat(list).filter(function (e) { return e && typeof e.ma === 'string' && e.ma.trim(); }).map(function (e) { return { ma: e.ma, ten: e.ten || '' }; }); },
      lookup: lookup, suggest: suggest, sum: sum, count: count, isGuess: isGuess, create: create,
      _t: { low: low, key: key, deaccent: deaccent }
    };
  }
  return create(data0);
}));
