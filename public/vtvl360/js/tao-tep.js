/* Vị trí việc làm 360 · bản web 1.3.0 (02/11/2026). Tệp dựng tự động bằng build-web.js; sửa ở nguồn rồi dựng lại. */

(function () {
  'use strict';
  var XA = window.VTVL_XA || [];
  // bảng số chỗ thay mã đã rà soát của 6 mẫu đơn vị sự nghiệp (dvsn_variants.json): lõi đếm lại, lệch thì dừng
  var DVSN = window.VTVL_DVSN || {};
  var S = window.VTVLSplit, G = window.VTVLGoiY;
  // Mẫu nguồn nhúng sẵn cuối trang (base64, có mã kiểm tra SHA-256): không tải gì từ mạng
  var TPL = {
    dang: { unit: 'mau-dang-v11', form: 'phieu-dang' },
    ubnd: { unit: 'mau-ubnd-v9', form: 'phieu-ubnd' },
    truong: { unit: 'mau-truong-v3', form: 'phieu-truong' }
  };
  function tplOf(kind, dv) { return kind === 'dvsn' ? { unit: 'mau-dvsn-' + dv + '-v2', form: 'phieu-dvsn-' + dv } : TPL[kind]; }
  // nhiệm vụ · công việc · VTVL của từng mẫu đơn vị sự nghiệp v2
  var DV_FACTS = { MN: [14, 39, 14], TH: [17, 45, 16], THCS: [19, 48, 18], DVTH: [18, 46, 15], TYT: [27, 66, 21], BQLDA: [9, 25, 7] };
  var DV_NAME_EX = { MN: 'Trường Mầm non …', TH: 'Trường Tiểu học …', THCS: 'Trường THCS …', DVTH: 'Trung tâm Dịch vụ tổng hợp xã …', TYT: 'Trạm Y tế xã …', BQLDA: 'Ban Quản lý dự án đầu tư xây dựng xã …' };
  var SUFFIX = ' – khối Đảng, MTTQ và các tổ chức chính trị – xã hội', SUFFIX_UBND = ' – HĐND, UBND và các cơ quan chuyên môn';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var nf = function (n) { return Number(n).toLocaleString('vi-VN'); };
  var mb = function (b) { return b >= 1048576 ? (b / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' MB' : Math.max(1, Math.round(b / 1024)).toLocaleString('vi-VN') + ' KB'; };
  var state = { kind: 'dang', dv: 'TH', autoName: '', dvAuto: 'TH01', busy: false, result: null, sig: '', cache: {} };
  var dlPromise = null;
  if (window.claude && typeof window.claude.use === 'function') { try { dlPromise = window.claude.use('downloads'); } catch (e) { dlPromise = null; } }

  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 4200);
  }

  // ---------- mốc thời gian (1.7.0: theo công văn của Ban Tổ chức Thành ủy về Hội nghị trực tiếp 03/11/2026) ----------
  function milestones() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var items = [ // truoc: hạn "trước ngày d" (đến ngày d là đã qua hạn)
      { d: new Date(2026, 10, 3), truoc: true, title: 'Chốt dữ liệu gốc', what: 'Trước 03/11: chốt bộ dữ liệu gốc A1, A2, C1, C2; ban hành quyết định phê duyệt danh mục sản phẩm' },
      { d: new Date(2026, 10, 3), now: 'Hôm nay', title: 'Hội nghị trực tiếp', what: '03/11, cả ngày, Hội trường Thành ủy: hoàn thiện B1, B2, C3, D1, D2' },
      { d: new Date(2026, 10, 4), now: 'Hạn 13 giờ hôm nay', title: 'Báo cáo hoàn thiện', what: 'Trước 13 giờ ngày 04/11: gửi văn bản báo cáo hoàn thiện bộ biểu về Ban Tổ chức Thành ủy' }
    ];
    $('milestones').innerHTML = items.map(function (m) {
      var days = Math.round((m.d - today) / 86400000), past = days < 0 || (m.truoc && days === 0);
      var left = days > 0 ? 'Còn ' + days + ' ngày' : past ? (m.truoc ? 'Đã qua hạn' : 'Đã qua ' + (-days) + ' ngày') : m.now;
      return '<div class="ms' + (past ? ' past' : '') + '"><div class="date"><span class="dd">' + String(m.d.getDate()).padStart(2, '0') + '</span><span class="mm">tháng ' + (m.d.getMonth() + 1) + '</span></div>' +
        '<b>' + esc(m.title) + '</b><span class="left">' + left + '</span><span class="note">' + esc(m.what) + '.</span></div>';
    }).join('');
  }

  // ---------- danh sách xã, phường ----------
  function fillXa() {
    var groups = [['Phường', 'P'], ['Xã', 'X']];
    var html = '<option value="">Chọn mã và tên xã, phường…</option>';
    groups.forEach(function (g) {
      var list = XA.filter(function (x) { return x[0].charAt(0) === g[1]; });
      html += '<optgroup label="' + g[0] + ' (' + list.length + ')">' + list.map(function (x) {
        return '<option value="' + x[0] + '">' + x[0] + ' · ' + esc(x[1]) + '</option>';
      }).join('') + '</optgroup>';
    });
    $('xa').innerHTML = html;
  }
  function xaByCode(code) { for (var i = 0; i < XA.length; i++) if (XA[i][0] === code) return XA[i]; return null; }
  function lowerFirst(s) { return s ? s.charAt(0).toLocaleLowerCase('vi') + s.slice(1) : s; }
  function autoNameFor(code, kind) {
    var x = xaByCode(code); if (!x) return '';
    return kind === 'ubnd' ? 'Khối chính quyền ' + lowerFirst(x[1]) + ' (' + code + ')' + SUFFIX_UBND : 'Đảng ủy ' + lowerFirst(x[1]) + ' (' + code + ')' + SUFFIX;
  }
  function placeOf(code) { var x = xaByCode(String(code || '').split('-')[0]); return x ? { full: x[1], typ: x[2] } : null; }

  // ---------- ngày ----------
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function isoToDmy(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + m[2] + m[1] : ''; }

  // ---------- đọc biểu mẫu ----------
  function readInput() {
    var kind = state.kind, errs = {}, xa = $('xa').value, dv = kind === 'dvsn' ? state.dv : null;
    var code, name;
    if (kind === 'dang' || kind === 'ubnd') {
      code = xa; name = $('nameDang').value.replace(/\s+/g, ' ').trim();
      if (!code) errs.xa = 'Chọn xã, phường.';
      if (!name) errs.nameDang = 'Nhập tên đơn vị.';
    } else if (kind === 'dvsn') {
      var unit = $('dvCode').value.trim().toUpperCase();
      if (!xa) errs.xa = 'Chọn xã, phường.';
      if (!unit) errs.dvCode = 'Nhập mã đơn vị.';
      else if (!/^[A-Z0-9]{2,10}$/.test(unit)) errs.dvCode = 'Mã chỉ gồm 2–10 ký tự A–Z, 0–9, không dấu, không khoảng trắng.';
      else if (S.codeClash('dvsn', unit, dv)) errs.dvCode = S.codeClash('dvsn', unit, dv); // 1.5.3: mã trùng mã mẫu
      code = xa && unit ? xa + '-' + unit : '';
      name = $('nameDvsn').value.replace(/\s+/g, ' ').trim();
      if (!name) errs.nameDvsn = 'Nhập tên đơn vị, ví dụ “' + DV_NAME_EX[dv] + '”.';
    } else {
      code = $('code').value.trim().toUpperCase(); name = $('nameTruong').value.replace(/\s+/g, ' ').trim();
      if (!code) errs.code = 'Nhập mã trường.';
      else if (!/^[A-Z0-9]{2,10}$/.test(code)) errs.code = 'Mã chỉ gồm 2–10 ký tự A–Z, 0–9, không dấu, không khoảng trắng.';
      else if (S.codeClash('truong', code)) errs.code = S.codeClash('truong', code); // 1.5.3: mã trùng mã mẫu
      if (!name) errs.nameTruong = 'Nhập tên trường.';
    }
    var iso = $('date').value, date = isoToDmy(iso);
    if (!date) errs.date = 'Chọn ngày lập tệp.';
    else { var y = +iso.slice(0, 4); if (y < 2026 || y > 2027) errs.date = 'Năm phải là 2026 hoặc 2027 (kỳ K2526).'; }
    return { kind: kind, dv: dv, code: code, name: name, date: date, errs: errs, place: kind === 'truong' ? null : placeOf(xa) };
  }
  function sigOf(inp) { return JSON.stringify([inp.kind, inp.dv, inp.code, inp.name, inp.date]); }
  function showErrs(errs) {
    [['xa', 'fXa', 'eXa'], ['nameDang', 'fNameDang', 'eNameDang'], ['dvCode', 'fDvCode', 'eDvCode'], ['nameDvsn', 'fNameDvsn', 'eNameDvsn'],
      ['code', 'fCode', 'eCode'], ['nameTruong', 'fNameTruong', 'eNameTruong'], ['date', 'fDate', 'eDate']].forEach(function (k) {
      var m = errs[k[0]]; $(k[1]).classList.toggle('invalid', !!m); $(k[2]).hidden = !m; $(k[2]).textContent = m || '';
      $(k[0]).setAttribute('aria-invalid', m ? 'true' : 'false');
    });
  }

  // ---------- xem trước ----------
  var BLOCK = {
    dang: 'Tệp <b>khối Đảng, MTTQ</b> và các tổ chức chính trị – xã hội, gửi <b>Ban Tổ chức Thành ủy</b>.',
    ubnd: 'Tệp này thuộc <b>khối chính quyền</b> (HĐND, UBND và các cơ quan chuyên môn), gửi <b>Sở Nội vụ</b>. Tên tệp cùng dạng với tệp khối Đảng của xã: lưu riêng thư mục để khỏi lẫn.',
    dvsn: 'Tệp của một <b>đơn vị sự nghiệp</b> thuộc UBND xã, gửi <b>Sở Nội vụ</b>. Mỗi đơn vị một tệp; không khai trùng người với khối Đảng, khối chính quyền.'
  };
  // ---------- 1.6.0: khung "Số liệu đơn vị để điền sẵn" (bước 2) ----------
  // Ô số liệu theo loại đơn vị (window.SO_LIEU_DV) và bảng số người theo mọi VTVL ở C1 của mẫu. Không nhập gì thì tệp ra như 1.5.3.
  // Ghi nhớ theo mã đơn vị bằng localStorage, chỉ cho tiện (không có localStorage thì trang vẫn chạy).
  var SLDV = window.SO_LIEU_DV || (G && G.SLDV) || { truong_so_lieu: {} }, LS_SL = 'vtvl-sldv:v1:';
  var sl = { kind: null, key: null, c1: null, c1s: {}, loading: null, pending: null };
  function slKindKey() { return state.kind === 'dvsn' ? 'dvsn:' + state.dv : state.kind; }
  function slStoreKey(inp) { return inp.code && !inp.errs.code && !inp.errs.xa && !inp.errs.dvCode ? slKindKey() + '|' + inp.code : null; }
  function slLoad(k) { try { var s = localStorage.getItem(LS_SL + k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function slSave(k, v) { try { localStorage.setItem(LS_SL + k, JSON.stringify(v)); } catch (e) { /* không lưu được: trang vẫn chạy */ } }
  function slPrefix() { return state.kind === 'truong' ? 'SGDDT-THCSTHPT-' : state.kind === 'dvsn' ? 'XXX-' + state.dv + '-' : 'XXX-'; }
  function slValues() { // 1.7.0: thêm các dòng bảng ngạch (chỉ để ghi nhớ; tạo tệp chỉ đọc so_lieu, nguoi)
    var v = { so_lieu: {}, nguoi: {}, ngach: ngRowsStore() };
    document.querySelectorAll('#sldvFields input[data-ma]').forEach(function (el) { if (el.value !== '') v.so_lieu[el.getAttribute('data-ma')] = el.value; });
    document.querySelectorAll('#sldvPpl input[data-vt]').forEach(function (el) { if (el.value !== '') v.nguoi[el.getAttribute('data-vt')] = el.value; });
    return v;
  }
  function slFill(v, which) {
    if (which !== 'ppl') document.querySelectorAll('#sldvFields input[data-ma]').forEach(function (el) { var x = v && v.so_lieu ? v.so_lieu[el.getAttribute('data-ma')] : null; el.value = x != null ? String(x) : ''; });
    if (which !== 'fields') document.querySelectorAll('#sldvPpl input[data-vt]').forEach(function (el) { var x = v && v.nguoi ? v.nguoi[el.getAttribute('data-vt')] : null; el.value = x != null ? String(x) : ''; });
  }
  function slRenderFields() {
    var fs = SLDV.truong_so_lieu[slKindKey()] || [];
    $('sldvFields').innerHTML = fs.map(function (f) {
      var id = 'sl_' + f.ma, md = f.mac_dinh != null ? String(f.mac_dinh) : '';
      return '<div class="field"><label for="' + id + '">' + esc(f.nhan) + '</label><input type="text" id="' + id + '" data-ma="' + esc(f.ma) +
        '" inputmode="numeric" maxlength="7" autocomplete="off"' + (md ? ' placeholder="' + esc(md) + '"' : '') + '>' + (md ? '<span class="hint">Để trống: ' + esc(md) + '.</span>' : '') + '</div>';
    }).join('');
    $('sldvFields').hidden = !fs.length;
  }
  async function slPeople() { // VTVL ở C1 của mẫu (mã mẫu, tên), đọc một lần cho mỗi mẫu
    var id = tplOf(state.kind, state.dv).unit;
    if (!sl.c1s[id]) {
      var ud = await G.unitData(await JSZip.loadAsync(await getTpl(id, false)));
      sl.c1s[id] = ud.c1.map(function (x) { return [x[0], x[1]]; });
    }
    return sl.c1s[id];
  }
  function slRenderPeople(c1) {
    var pre = slPrefix();
    $('sldvPpl').innerHTML = c1.map(function (x, i) {
      var id = 'slp_' + i, sc = x[0].indexOf(pre) === 0 ? x[0].slice(pre.length) : x[0];
      return '<div class="ppl-row"><span class="mono">' + esc(sc) + '</span><label for="' + id + '">' + esc(x[1]) + '</label><input type="text" id="' + id +
        '" data-vt="' + esc(x[0]) + '" inputmode="numeric" maxlength="4" autocomplete="off"></div>';
    }).join('');
    $('sldvPplNote').textContent = c1.length + ' vị trí ở Biểu C1 của mẫu; để trống thì không điền vị trí đó.';
  }
  function slLoadPeople() {
    var kk = sl.kind;
    $('sldvPplNote').textContent = 'Đang đọc danh sách vị trí của mẫu…';
    sl.loading = slPeople().then(function (c1) {
      if (!state.busy) $('progress').hidden = true;
      if (sl.kind !== kk) return;
      sl.c1 = c1; slRenderPeople(c1);
      if (sl.pending) slFill(sl.pending, 'ppl');
      ngRender(); pvDraftSync();   // 1.7.0
    }, function (e) {
      if (!state.busy) $('progress').hidden = true;
      $('sldvPplNote').textContent = 'Chưa đọc được danh sách vị trí: ' + (e && e.message || e);
    }).then(function () { sl.loading = null; });
  }
  function sldvSync() {
    var kk = slKindKey(), inp = readInput(), key = slStoreKey(inp);
    if (sl.kind !== kk) { sl.kind = kk; sl.c1 = null; sl.key = undefined; sl.pending = null; slRenderFields(); $('sldvPpl').innerHTML = ''; ngSet([]); }
    if (key !== sl.key) {
      var stored = key ? slLoad(key) : null;
      if (stored) { slFill(stored); sl.pending = stored; ngSet(ngFromStore(stored.ngach)); $('sldv').open = true; $('sldvNote').textContent = 'Đã điền lại số liệu đã nhập trên máy này cho ' + inp.code + '.'; }
      else if (sl.key) { slFill(null); sl.pending = null; ngSet([]); $('sldvNote').textContent = ''; }
      sl.key = key;
    }
    if ($('sldv').open && !sl.c1 && !sl.loading) slLoadPeople();
  }
  async function sldvCollect(inp) { // {so_lieu, nguoi: {mã VTVL của đơn vị: n}} hoặc null khi không nhập gì
    if (sl.loading) await sl.loading;
    var v = slValues(), so = {}, ng = {}, any = false, steps = S.KIND[inp.kind].steps(inp.code, inp.dv);
    Object.keys(v.so_lieu).forEach(function (k) { so[k] = +v.so_lieu[k]; any = true; });
    Object.keys(v.nguoi).forEach(function (k) { var c = k; steps.forEach(function (st) { c = c.split(st[1]).join(st[2]); }); ng[c] = +v.nguoi[k]; any = true; });
    return any ? { so_lieu: so, nguoi: ng } : null;
  }
  // ---------- 1.7.0: bảng "Nhân sự theo mã ngạch" (khung số liệu, ngay trên bảng số người theo vị trí; mọi loại đơn vị) ----------
  // Chỉ là công cụ tính số người theo VTVL: nút "Đưa vào…" ghi vào bảng số người như gõ tay (sự kiện input). Tạo tệp không đọc bảng này.
  // Gợi ý vị trí (lõi ngach-core.js) chỉ cho mẫu trường và ĐVSN, chỉ cho dòng chưa tự chọn vị trí. Ghi nhớ chung với số liệu (slValues().ngach).
  var NG = window.VTVLNgach || null, ng = { rows: [] };
  function ngBlank() { return { ma: '', n: '', vt: '', tay: false }; }
  function ngRowsStore() {
    return ng.rows.filter(function (r) { return r.ma !== '' || r.n !== '' || r.vt !== ''; }).map(function (r) { return { ma: r.ma, n: r.n, vt: r.vt, tay: !!r.tay }; });
  }
  function ngFromStore(v) {
    if (!Array.isArray(v)) return [];
    return v.filter(function (r) { return r && typeof r === 'object'; }).slice(0, 500).map(function (r) {
      return { ma: typeof r.ma === 'string' ? r.ma.slice(0, 40) : '', n: typeof r.n === 'string' || typeof r.n === 'number' ? String(r.n).replace(/[^0-9]/g, '').slice(0, 4) : '',
        vt: typeof r.vt === 'string' ? r.vt : '', tay: r.tay === true };
    });
  }
  function ngSave() { if (sl.key) slSave(sl.key, slValues()); }
  function ngMsg(kind, text) { var m = $('ngMsg'); m.hidden = !kind; m.className = 'ng-msg' + (kind ? ' ' + kind : ''); m.textContent = text || ''; }
  function ngSet(rows) { ng.rows = rows; ngMsg(null); ngRender(); }
  function ngShort(vt) { var pre = slPrefix(); return vt.indexOf(pre) === 0 ? vt.slice(pre.length) : vt; }
  function ngName(ma) { var lk = NG.lookup(ma); return !lk.ma ? ['', ''] : lk.entry ? [lk.entry.ten || lk.ma, ''] : ['Chưa có trong danh mục, chọn vị trí', 'miss']; }
  function ngOpts(vt) {
    return '<option value="">— chọn —</option>' + sl.c1.map(function (x) {
      return '<option value="' + esc(x[0]) + '"' + (x[0] === vt ? ' selected' : '') + '>' + esc(ngShort(x[0]) + ' – ' + x[1]) + '</option>';
    }).join('');
  }
  function ngRowHtml(r, i) {
    var nm = ngName(r.ma), k = i + 1;
    return '<div class="ng-row" data-i="' + i + '" role="group" aria-label="Dòng ' + k + '">' +
      '<input type="text" class="ng-ma" data-ng="ma" list="ngDm" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Mã ngạch" aria-label="Mã ngạch, dòng ' + k + '" value="' + esc(r.ma) + '">' +
      '<span class="ng-ten' + (nm[1] ? ' ' + nm[1] : '') + '">' + esc(nm[0]) + '</span>' +
      '<input type="text" class="ng-n" data-ng="n" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="Số người" aria-label="Số người, dòng ' + k + '" value="' + esc(r.n) + '">' +
      '<select class="ng-vt" data-ng="vt" aria-label="Xếp vào vị trí, dòng ' + k + '">' + ngOpts(r.vt) + '</select>' +
      '<span class="ng-btns"><button type="button" class="btn sm" data-ng-act="tach"' + (NG.count(r.n) >= 2 ? '' : ' disabled') +
      ' aria-label="Tách 1 người, dòng ' + k + '" title="Thêm dòng cùng mã, 1 người, để chọn vị trí khác; dòng này bớt 1 người">Tách 1 người</button>' +
      '<button type="button" class="btn sm" data-ng-act="xoa" aria-label="Xóa dòng ' + k + '">Xóa</button></span></div>';
  }
  function ngRender() {
    if (!NG || !sl.c1) { $('ng').hidden = true; return; }
    var have = new Set(sl.c1.map(function (x) { return x[0]; }));
    ng.rows.forEach(function (r) { if (r.vt && !have.has(r.vt)) { r.vt = ''; r.tay = false; } });   // vị trí không còn ở C1 của mẫu
    if (!ng.rows.length) ng.rows.push(ngBlank());
    $('ngList').innerHTML = ng.rows.map(ngRowHtml).join('');
    $('ngNote').textContent = (NG.isGuess(slKindKey()) ? 'vị trí tự chọn theo tên VTVL ở C1, kiểm lại từng dòng' : 'mẫu này không tự chọn vị trí: chọn cho từng dòng') +
      '; danh mục ' + nf(NG.size) + ' mã' + (NG.version ? ' (bản ' + NG.version + ')' : '') + '.';
    $('ng').hidden = false;
    ngSummary();
  }
  function ngDiffers(s) {
    var d = false;
    document.querySelectorAll('#sldvPpl input[data-vt]').forEach(function (el) { if (el.value !== String(s.byVt.get(el.getAttribute('data-vt')) || 0)) d = true; });
    return d;
  }
  function ngSummary() { // tổng, theo mã ngạch (để đối chiếu bảng lương), người chưa xếp vị trí
    if (!NG || $('ng').hidden) return;
    var s = NG.sum(ng.rows), h = [];
    if (s.byCode.length) {
      h.push('<span><b>Tổng ' + nf(s.total) + ' người</b></span>');
      h.push('<span>Theo mã ngạch: ' + s.byCode.map(function (b) { return '<span class="mono">' + esc(b[0]) + '</span>: ' + nf(b[1]) + (b[2] > 1 ? ' (' + nf(b[2]) + ' dòng)' : ''); }).join('; ') + '</span>');
    }
    if (s.free.n) h.push('<span class="warn">Chưa xếp vị trí: ' + nf(s.free.n) + ' người (mã ' + s.free.codes.map(esc).join(', ') + ')</span>');
    else if (s.total && ngDiffers(s)) h.push('<span>Bảng số người theo vị trí bên dưới chưa khớp bảng này: bấm “Đưa vào bảng số người theo vị trí”.</span>');
    $('ngSum').innerHTML = h.join('');
  }
  function ngPush() { // cộng theo vị trí, ghi vào #sldvPpl (vị trí không có dòng nào: 0); còn người chưa xếp thì không ghi
    var s = NG.sum(ng.rows);
    if (!s.total) { ngMsg('err', 'Chưa có dòng nào có số người: gõ mã ngạch và số người trước.'); return; }
    if (s.free.n) {
      ngMsg('err', 'Chưa ghi: còn ' + nf(s.free.n) + ' người chưa xếp vị trí (mã ' + s.free.codes.join(', ') + '). Chọn vị trí ở cột “Xếp vào vị trí” rồi bấm lại.');
      var i = ng.rows.findIndex(function (r) { return NG.count(r.n) > 0 && !r.vt; }), sel = document.querySelector('#ngList [data-i="' + i + '"] [data-ng="vt"]');
      if (sel) sel.focus();
      return;
    }
    var els = document.querySelectorAll('#sldvPpl input[data-vt]'), nPos = 0;
    if (!els.length) { ngMsg('err', 'Bảng số người theo vị trí chưa sẵn sàng: thử lại sau giây lát.'); return; }
    els.forEach(function (el) {
      var n = s.byVt.get(el.getAttribute('data-vt')) || 0;
      if (n) nPos++;
      el.value = String(n);
      el.dispatchEvent(new Event('input', { bubbles: true }));   // như gõ tay: ghi nhớ trên máy; tạo tệp đọc bảng số người như hiện nay
    });
    ngSummary();
    ngMsg('ok', 'Đã ghi vào bảng số người theo vị trí: ' + nf(s.total) + ' người ở ' + nf(nPos) + ' vị trí; các vị trí khác ghi 0. Bảng số người vẫn sửa tay được.');
  }
  function ngRowOf(el) { var r = el && el.closest ? el.closest('[data-i]') : null; return r ? +r.getAttribute('data-i') : -1; }
  function ngNameCell(rowEl, ma) { var nm = ngName(ma), c = rowEl.querySelector('.ng-ten'); c.textContent = nm[0]; c.className = 'ng-ten' + (nm[1] ? ' ' + nm[1] : ''); }
  function ngGuess(i, rowEl) { // vị trí mặc định khi nhập, đổi mã; dòng đã tự chọn vị trí thì giữ
    var r = ng.rows[i];
    if (r.tay) return;
    var g = NG.suggest(sl.c1, NG.lookup(r.ma).entry, slKindKey());
    r.vt = g ? g.vt : '';
    var sel = rowEl.querySelector('[data-ng="vt"]'); if (sel) sel.value = r.vt;
  }
  function pvDraftSync() { var v = slValues(); $('pvDraftRow').hidden = !(Object.keys(v.so_lieu).length || Object.keys(v.nguoi).length); }
  // 1.5.3: mã trùng mã mẫu báo ngay dưới ô khi gõ; ngày đã chọn hiện theo kiểu Việt Nam (trình duyệt tiếng Anh hiện tháng/ngày/năm)
  var FIELD = { code: ['fCode', 'eCode'], dvCode: ['fDvCode', 'eDvCode'] };
  function liveClash(id) {
    var v = $(id).value.trim().toUpperCase(), m = id === 'code' ? S.codeClash('truong', v) : S.codeClash('dvsn', v, state.dv), f = FIELD[id];
    $(f[0]).classList.toggle('invalid', !!m); $(f[1]).hidden = !m; $(f[1]).textContent = m || ''; $(id).setAttribute('aria-invalid', m ? 'true' : 'false');
  }
  function vnDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? 'Ngày ' + m[3] + '/' + m[2] + '/' + m[1] : 'Chưa chọn ngày'; }
  function showDates() { $('dateVn').textContent = vnDate($('date').value); $('napDateVn').textContent = vnDate($('napDate').value); }
  function render() {
    showDates();
    sldvSync();
    var inp = readInput(), k = state.kind, xa = $('xa').value;
    var ok = inp.code && !inp.errs.code && !inp.errs.xa && !inp.errs.dvCode;
    var unit = $('dvCode').value.trim().toUpperCase() || state.dv + '01';
    var code = ok ? inp.code : (k === 'truong' ? 'MÃ' : k === 'dvsn' ? (xa || 'X..') + '-' + unit : 'X..');
    var d = inp.date || 'ddmmyyyy';
    $('pvUnit').textContent = (k === 'truong' ? 'SGDDT-' : '') + code + '_K2526_v1_' + d + '.xlsx';
    var nm = inp.name ? S.shortName(inp.name) : ({ dang: 'Dang_uy_xa_…', ubnd: 'Khoi_chinh_quyen_xa_…', dvsn: 'Ten_don_vi', truong: 'Ten_truong' })[k];
    $('pvForm').textContent = 'Phieu_thu_so_lieu_' + code + '_' + nm + '.xlsx';
    $('pvZip').textContent = 'Phieu_tung_vi_tri_' + code + '.zip';
    $('pvZipRow').hidden = !$('optViTri').checked;
    $('pvDraft').textContent = (k === 'truong' ? 'SGDDT-' : '') + code + '_K2526_v2_' + d + '.xlsx';   // 1.7.0: chỉ khi có số liệu đơn vị
    pvDraftSync();
    var xaEx = xa || 'X52';
    $('exDang').textContent = xaEx + '-VP-CM-03';
    $('exUbnd').textContent = xaEx + '-PKT-CM-01';
    $('exDvsnFrom').textContent = 'XXX-' + state.dv + '-CM-01';
    $('exDvsn').textContent = xaEx + '-' + unit + '-CM-01';
    $('exTruong').textContent = 'SGDDT-' + (k === 'truong' && ok ? inp.code : 'HHN') + '-CM-03';
    var f = DV_FACTS[state.dv];
    $('factsDvsn').textContent = f[0] + ' nhiệm vụ · ' + f[1] + ' công việc · ' + f[2] + ' VTVL';
    $('dvFull').textContent = (xa || 'X..') + '-' + unit + '-CM-01';
    $('destNote').hidden = !BLOCK[k]; $('destNote').innerHTML = BLOCK[k] || '';
    var place = inp.place ? lowerFirst(inp.place.full) : 'xã, phường';
    var steps = S.KIND[k].steps(k === 'dvsn' ? (xa || 'X..') + '-' + unit : code, state.dv);
    var swap = steps.filter(function (st) { return st[0] !== 'ma' || k !== 'dvsn'; }).map(function (st) {
      return '<code class="tok">' + esc(st[1]) + '</code> → <code class="tok">' + esc(st[2]) + '</code>';
    }).join(', ');
    var lines = ['Thay ' + swap + ' ở mọi mã nhiệm vụ, công việc, VTVL' + (k === 'dvsn' ? ', sản phẩm; đếm lại số chỗ thay, phải khớp bảng đã rà soát của mẫu' : '') + '. Không sửa công thức.'];
    if (k !== 'truong') {
      lines.push('Đổi “xã XXX” và tên cơ quan có XXX (ví dụ “Phòng Kinh tế XXX”) thành tên <b>' + esc(place) + '</b>. Giữ nguyên câu nói về mã mẫu, tên tệp mẫu và các dòng nhật ký của mẫu (ô đơn vị “XXX” ở đó ghi “Mẫu chung”); còn XXX ở biểu dữ liệu thì dừng, không tạo tệp.');
    }
    lines.push(k === 'dang' || k === 'ubnd' ? 'Điền kỳ <b>01/10/2025–30/9/2026</b> cho các dòng B1 có mã công việc mà chưa ghi kỳ.' : 'Giữ kỳ <b>01/10/2025–30/9/2026</b> đã có ở B1; điền thêm nếu dòng nào còn trống.');
    lines.push('Ghi tên đơn vị và kỳ K2526 vào <b>14. T_TienDo</b>' + (k === 'dang' ? ', tên tệp mới vào <b>13. K_KiemTra</b>' : '') + ', một dòng nhật ký vào <b>15. S_NhatKy</b>.');
    lines.push('Tạo phiếu thu số liệu cùng mã, <b>điền sẵn gợi ý</b> vào ô nhập (ô màu cam, sửa xong tự đổi màu): phút/SP ở vị trí tính theo PP2, nguồn số liệu, số sản phẩm khi tên sản phẩm ghi rõ chu kỳ. Căn cứ ghi ngay trên dòng và ở trang Can_cu_goi_y theo vị trí.');
    lines.push('Có số liệu đơn vị ở bước 2: nạp phiếu đầy đủ vừa tạo vào tệp đơn vị như ở bước 4, được thêm <b>tệp đơn vị dự thảo</b> (v2) đã có trang D1 và số sản phẩm điền sẵn.');
    lines.push('Giữ nguyên trang ẩn, danh sách chọn, công thức, định dạng và các câu hướng dẫn có chỗ trống <code class="tok">&lt;mã …&gt;</code>.');
    $('does').innerHTML = lines.map(function (x) { return '<li>' + x + '</li>'; }).join('');
    $('stale').hidden = !(state.result && state.sig !== sigOf(inp));
  }

  function setKind(kind) {
    var prev = state.kind;
    state.kind = kind;
    $('fieldsXa').hidden = kind === 'truong';
    $('fieldsDang').hidden = !(kind === 'dang' || kind === 'ubnd');
    $('fieldsDvsn').hidden = kind !== 'dvsn';
    $('fieldsTruong').hidden = kind !== 'truong';
    $('dvPick').hidden = kind !== 'dvsn';
    if ((kind === 'dang' || kind === 'ubnd') && prev !== kind) { // tên tự điền theo mẫu khi người dùng chưa sửa
      var cur = $('nameDang').value.trim(), next = autoNameFor($('xa').value, kind);
      if (!cur || cur === state.autoName) $('nameDang').value = next;
      state.autoName = next;
    }
    $('nameDang').placeholder = kind === 'ubnd' ? 'Khối chính quyền xã … (X..) – HĐND, UBND và các cơ quan chuyên môn' : 'Đảng ủy xã … (X..) – khối Đảng, MTTQ và các tổ chức chính trị – xã hội';
    showErrs({});
    render();
  }
  function setDv(dv) {
    var cur = $('dvCode').value.trim().toUpperCase();
    state.dv = dv;
    if (!cur || cur === state.dvAuto) $('dvCode').value = dv + '01';
    state.dvAuto = dv + '01';
    $('nameDvsn').placeholder = DV_NAME_EX[dv] + ' (mã tạm ' + dv + '01)';
    $('dvCode').placeholder = dv + '01';
    render();
  }

  // ---------- tạo tệp ----------
  function setProgress(text, frac) {
    $('progress').hidden = false; $('progressText').textContent = text;
    $('progressBar').style.width = Math.max(2, Math.min(100, Math.round(frac * 100))) + '%';
  }
  var domReady = new Promise(function (r) { if (document.readyState !== 'loading') r(); else document.addEventListener('DOMContentLoaded', r, { once: true }); });
  function b64ToBytes(b64) { var bin = atob(b64), n = bin.length, out = new Uint8Array(n); for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i); return out; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }
  // Mẫu: nhúng sẵn trong trang (bản artifact, bản tải về) hoặc tải từ thư mục mau/ của bản web (window.VTVL_MAU: id → tệp, sha256)
  async function getTpl(id, optional) {
    if (state.cache[id]) return state.cache[id];
    await domReady;
    var el = document.getElementById(id), web = window.VTVL_MAU && window.VTVL_MAU[id], bytes, want, label;
    if (el) {
      bytes = b64ToBytes(el.textContent.replace(/\s+/g, '')); want = el.getAttribute('data-sha256'); label = el.getAttribute('data-name');
    } else if (web) {
      want = web.sha256; label = web.name;
      setProgress('Đang tải mẫu ' + web.name + '…', 0.02);
      var res = null;
      try { res = await fetch(web.url, { credentials: 'same-origin' }); } catch (e) { res = null; }
      if (!res || !res.ok) throw new Error('Không tải được mẫu ' + web.name + ' từ máy chủ' + (res ? ' (mã ' + res.status + ')' : '') + '. Kiểm tra mạng rồi thử lại, hoặc dùng bản tải về một tệp ở thư mục tai-ve/ (tao-tep-don-vi.html), chạy được khi không có mạng.');
      bytes = new Uint8Array(await res.arrayBuffer());
    } else { if (optional) return null; throw new Error('Trang thiếu mẫu ' + id + '. Tải lại trang rồi thử lại.'); }
    // http thường không có crypto.subtle: bỏ qua bước kiểm mã
    if (want && window.crypto && crypto.subtle) {
      var got = hex(await crypto.subtle.digest('SHA-256', bytes));
      if (got !== want) throw new Error('Mẫu ' + label + (web ? ' tải về bị hỏng hoặc không đúng bản (sai mã kiểm tra). Tải lại trang rồi thử lại.' : ' trong trang bị hỏng (sai mã kiểm tra). Tải lại trang rồi thử lại.'));
    }
    state.cache[id] = bytes;
    return bytes;
  }
  function blobOut(data) { return data instanceof Blob ? data : new Blob([data], { type: S.MIME }); }

  async function generate(ev) {
    if (ev) ev.preventDefault();
    if (state.busy) return;
    var inp = readInput();
    showErrs(inp.errs);
    var first = Object.keys(inp.errs)[0];
    if (first) { $(first).focus(); return; }
    if (typeof JSZip === 'undefined') { $('errors').innerHTML = '<div class="alert err">Chưa tải được thư viện nén tệp. Kiểm tra kết nối mạng rồi tải lại trang.</div>'; return; }
    state.busy = true; $('go').disabled = true; $('errors').innerHTML = ''; $('result').hidden = true;
    var base = { kind: inp.kind, dv: inp.dv, code: inp.code, name: inp.name, date: inp.date, place: inp.place };
    var opts = Object.assign({ table: inp.kind === 'dvsn' ? DVSN[inp.dv] : null }, base);
    try {
      setProgress('Đang mở mẫu…', 0.02);
      var t = tplOf(inp.kind, inp.dv);
      var unitBuf = await getTpl(t.unit, false);
      var formBuf = await getTpl(t.form, true);
      var withZip = $('optViTri').checked;
      opts.onProgress = function (t, f) { setProgress(t, 0.03 + f * 0.5); };
      var uzip = await JSZip.loadAsync(unitBuf);
      var urep = await S.applyRules(uzip, opts);
      var ud = formBuf ? await G.unitData(uzip) : null;
      var udata = await uzip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: S.MIME },
        function (m) { setProgress('Đang nén tệp đơn vị…', 0.55 + 0.2 * m.percent / 100); });
      base.sl = await sldvCollect(inp);   // 1.6.0
      var withDraft = !!(formBuf && base.sl);   // 1.7.0: có số liệu đơn vị thì thêm tệp đơn vị dự thảo
      var built = formBuf ? await buildForm(formBuf, base, ud, withZip, 0.76, withDraft ? 0.88 : 0.98) : null;
      var draft = withDraft ? await buildDraft(udata, urep.fileName, built.form, inp.date, 0.88) : null;
      setProgress('Xong.', 1);
      state.result = {
        place: inp.place,
        unit: { name: urep.fileName, blob: blobOut(udata), report: urep },
        form: built ? built.form : null, zip: built ? built.zip : null, goiy: built ? built.goiy : null, draft: draft
      };
      state.sig = sigOf(inp);
      showResult();
      var nOut = 1 + (built ? 1 : 0) + (built && built.zip ? 1 : 0) + (draft && draft.blob ? 1 : 0);
      toast('Đã tạo ' + (nOut > 1 ? nOut + ' tệp' : 'tệp đơn vị') + ' cho ' + inp.code + '.');
      window.V360NhatKy && V360NhatKy.ghi('tao-tep', 'tao_tep', function () { var sl = base.sl, nguoi = 0; if (sl && sl.nguoi) Object.keys(sl.nguoi).forEach(function (k) { nguoi += +sl.nguoi[k] || 0; }); return { ma: String(urep && urep.fileName || '').split('_K2526_')[0] || inp.code, ten: inp.name, loai: inp.kind === 'dvsn' ? 'dvsn:' + inp.dv : inp.kind, ban: 'tao-tep 1.7.0', chi_tiet: { so_tep: nOut, phieu: !!built, phieu_vi_tri: !!(built && built.zip), du_thao: !!(draft && draft.blob), du_thao_loi: !!(draft && draft.err), so_lieu_o: sl && sl.so_lieu ? Object.keys(sl.so_lieu).length : 0, so_nguoi: nguoi, dong_ngach: ngRowsStore().length } }; });
    } catch (e) {
      $('errors').innerHTML = '<div class="alert err">Không tạo được tệp: ' + esc(e && e.message || e) + '</div>';
      window.V360NhatKy && V360NhatKy.ghi('tao-tep', 'tao_tep', function () { return { ma: urep && urep.fileName ? String(urep.fileName).split('_K2526_')[0] : (inp.kind === 'truong' ? 'SGDDT-' + inp.code : inp.code), ten: inp.name, loai: inp.kind === 'dvsn' ? 'dvsn:' + inp.dv : inp.kind, ban: 'tao-tep 1.7.0', loi: e }; });
    } finally {
      state.busy = false; $('go').disabled = false;
      setTimeout(function () { $('progress').hidden = true; }, 600);
      render();
    }
  }

  /* Phiếu 1.4: T1 + tên đơn vị, điền gợi ý theo dữ liệu tệp đơn vị (ud), có thể kèm zip phiếu từng vị trí. */
  async function buildForm(formBuf, o, ud, withZip, p0, p1) {
    p1 = p1 || 0.98;
    var fzip = await JSZip.loadAsync(formBuf);
    var frep = await S.applyRules(fzip, { kind: o.kind, dv: o.dv, code: o.code, name: o.name, date: o.date, place: o.place, form: true });
    setProgress('Phiếu thu số liệu: đang điền gợi ý…', p0);
    var gy = await G.fillForm(fzip, ud, o.sl);
    var fdata = await fzip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 }, mimeType: S.MIME });
    var zip = null;
    if (withZip) {
      var z = await G.perPosition(JSZip, fdata, o.code, o.date, 'blob', function (t, f) { setProgress('Phiếu từng vị trí: ' + t.charAt(0).toLowerCase() + t.slice(1), p0 + 0.05 + f * (p1 - p0 - 0.05)); });
      zip = { name: z.name, blob: z.data, files: z.files };
    }
    return { form: { name: S.formFileName(o.code, o.name), blob: blobOut(fdata), report: frep, bytes: fdata }, zip: zip, goiy: gy };
  }
  /* 1.7.0 B: tệp đơn vị dự thảo = bộ nạp của bước 4 (nap-core) chạy trong bộ nhớ với đúng phiếu đầy đủ vừa tạo, vào tệp đơn vị v1
     vừa tạo, ngày ở bước 2 (= nap_phieu.py <tệp v1> <phiếu đầy đủ> <thư mục> <ngày>). Không ghi được gì, hoặc lỗi: không có tệp này. */
  async function buildDraft(unitBlob, unitName, form, ngay, p0) {
    try {
      var ub = unitBlob.arrayBuffer ? await unitBlob.arrayBuffer() : await new Response(unitBlob).arrayBuffer();
      var res = await N.build(JSZip, ub, unitName, [{ name: form.name, data: form.bytes }], ngay, 'blob',
        function (t, f) { setProgress('Tệp đơn vị dự thảo: ' + t.charAt(0).toLowerCase() + t.slice(1), p0 + f * (0.99 - p0)); });
      var r = res.report;
      if (r.written + r.d1 === 0) return { none: true, name: r.outName, report: r };
      return { name: r.outName, blob: blobOut(res.data), report: r };
    } catch (e) {
      return { err: (e && e.message) || String(e), name: String(unitName).replace(/_K2526_v(\d+)_/, function (m, v) { return '_K2526_v' + (+v + 1) + '_'; }) };
    }
  }
  function draftWarn(r) { // nhãn ngắn: số việc chưa nạp vì chưa có phút/SP, số cảnh báo khác (giữ nguyên gợi ý là đương nhiên ở tệp dự thảo)
    var noMin = r.warnings.filter(function (w) { return w.kind === 'b1_sldv_no_minutes'; }).length;
    var other = r.errors.length + r.warnings.filter(function (w) { return ['b1_sldv_no_minutes', 'b1_min_suggestion', 'b1_sp_suggestion'].indexOf(w.kind) < 0; }).length;
    return [noMin ? nf(noMin) + ' việc chưa nạp vì chưa có phút/SP' : '', other ? nf(other) + ' cảnh báo khác' : ''].filter(Boolean).join(' · ');
  }
  function goiyHtml(gy) { // 1.6.0: thêm câu về số liệu đơn vị
    var h = goiyHtml0(gy);
    if (!gy || !(gy.sldv || gy.d1)) return h;
    return h.replace(/<\/p>$/, ' Theo <b>số liệu đơn vị</b> đã nhập: số sản phẩm cho <b>' + nf(gy.sldv) + '</b> việc' + (gy.d1 ? ', <b>' + nf(gy.d1) + '</b> dòng ở trang D1' : '') +
      ' (ô cam, cần đối chiếu sổ sách).</p>');
  }
  function goiyHtml0(gy) {
    if (!gy) return '';
    return '<p class="gy">Phiếu đã <b>điền sẵn gợi ý</b> (ô màu cam, sửa xong tự đổi màu): phút/SP cho <b>' + nf(gy.minutes) + '</b>/' + nf(gy.rows) + ' việc ở vị trí tính theo PP2 (' +
      nf(gy.byDM) + ' theo Danh mục sản phẩm, ' + nf(gy.byKeyword) + ' theo Phụ lục 3), nguồn số liệu cho <b>' + nf(gy.sources) + '</b> việc, số sản phẩm cho <b>' + nf(gy.counts) +
      '</b> việc có chu kỳ ghi rõ trong tên sản phẩm. Căn cứ ở cột ngay sau ô phút và ở trang Can_cu_goi_y (' + nf(gy.ccRows) + ' dòng, theo vị trí).' +
      (gy.tgMatched ? ' Bảng thời gian ĐVSN (dự kiến): <b>' + nf(gy.tgMatched) + '</b> việc khớp mục của bảng' + (gy.byTG ? ', ' + nf(gy.byTG) + ' việc dùng mức của bảng' : '') +
        (gy.tgRef ? ', ' + nf(gy.tgRef) + ' việc ghi mức để tham khảo' : '') + '; xem trang Can_cu_goi_y.' : '') +
      (gy.noRows && gy.noRows.length ? ' <b>' + nf(gy.noRows.length) + '</b> vị trí ở C1 không có dòng công việc: phiếu của các vị trí này chỉ có ghi chú (tính chung khối lượng với vị trí khác, hoặc chưa có công việc ở A2).' : '') + '</p>';
  }
  function zipRow(z, key) {
    var ico = '<svg class="xl-ico" viewBox="0 0 20 22" aria-hidden="true"><path d="M3 1h10l5 5v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="var(--sheet)" stroke="var(--accent)" stroke-width="1.3"/><path d="M9 3v2M11 5v2M9 7v2M11 9v2M8.5 12h3v4h-3z" stroke="var(--accent)" stroke-width="1.2" fill="none"/></svg>';
    var pre = z.files.reduce(function (a, f) { return a + f.prefilled; }, 0);
    return '<div class="file">' + ico + '<div class="meta"><span class="mono">' + esc(z.name) + '</span><small>Phiếu riêng từng vị trí · ' + nf(z.files.length) + ' phiếu · ' + nf(pre) + ' ô điền sẵn gợi ý · không có D1, thông tin đơn vị · ' + mb(z.blob.size) + '</small></div>' +
      '<button class="btn" type="button" data-save="' + key + '">Tải về</button></div>';
  }
  function codesOf(rep) { var c = rep.t1.counts || {}, n = 0; Object.keys(c).forEach(function (k) { if (k.indexOf('|') > 0) n += c[k]; }); return n; }
  function showResult() {
    var r = state.result, rep = r.unit.report;
    var parts = rep.t1.parts.map(function (p) { return '<tr><td>' + esc(p.sheet) + '</td><td class="mono">' + esc(p.part.replace(/^xl\//, '')) + '</td><td class="r">' + nf(p.n) + '</td></tr>'; }).join('');
    var ico = '<svg class="xl-ico" viewBox="0 0 20 22" aria-hidden="true"><path d="M3 1h10l5 5v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.3"/><path d="M6 10l4 6M10 10l-4 6" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/></svg>';
    var fileRow = function (item, label, key) {
      return '<div class="file">' + ico + '<div class="meta"><span class="mono">' + esc(item.name) + '</span><small>' + label + ' · ' + mb(item.blob.size) + '</small></div>' +
        '<button class="btn" type="button" data-save="' + key + '">Tải về</button></div>';
    };
    var formRow = r.form ? fileRow(r.form, 'Phiếu thu số liệu · ' + nf(codesOf(r.form.report)) + ' chỗ đã thay mã', 'form')
      : '<div class="file off">' + ico + '<div class="meta"><span class="mono">' + esc(S.formFileName(rep.code, rep.name)) + '</span><small>Phiếu thu số liệu đang hoàn thiện, sẽ có ở bản sau.</small></div></div>';
    var ky = rep.t2 ? { v: nf(rep.t2), s: 'biểu 3. B1_KhoiLuong, cột K' } : { v: '0', s: 'mẫu đã có sẵn kỳ ở B1' };
    var cnt = rep.t1.counts || {}, nCode = codesOf(rep);
    var nName = (cnt.R2 || 0) + (cnt.ten || 0), place = r.place ? lowerFirst(r.place.full) : '';
    var nameLine = rep.kind === 'truong' ? '' : '<p class="kept">' + (nName ? 'Đổi “xã XXX” và tên cơ quan có XXX thành “' + esc(place) + '” ở <b>' + nf(nName) + '</b> chuỗi. ' : '') +
      (rep.r4.length ? nf(rep.r4.length) + ' ô đơn vị ở dòng nhật ký của mẫu ghi “Mẫu chung”. ' : '') + (rep.r3.length + rep.k1.length ? nf(rep.r3.length + rep.k1.length) + ' ô mã đơn vị ghi ' + esc(rep.code) + '. ' : '') +
      (rep.t3b != null ? 'Kỳ ở 14. T_TienDo ghi K2526. ' : '') + 'Không còn XXX ở biểu dữ liệu.</p>';
    var left = rep.xxx ? Object.keys(rep.xxx.bySheet) : [];
    var KIND_LEFT = { R4_lich_su: 'nhật ký của mẫu', R5_ten_tep: 'tên tệp mẫu', R6: 'câu nói về mã mẫu', 'ghi_chu_<mã': 'ghi chú cách đặt mã', T5_dong_moi: 'dòng nhật ký mới (mẫu gốc)', o_chi_XXX: 'ô ghi XXX ở trang đối chiếu', khac: 'khác' };
    var leftTbl = rep.kind === 'truong' || !left.length ? '' : '<details class="parts"><summary>XXX còn lại theo trang (' + nf(left.reduce(function (a, k) { return a + rep.xxx.bySheet[k]; }, 0)) + ' chỗ, không phải mã của đơn vị)</summary><div class="tbl-wrap"><table><thead><tr><th>Trang</th><th>Loại</th><th class="r">Số chỗ</th></tr></thead><tbody>' +
      left.map(function (k) { var d = rep.xxx.detail[k]; return '<tr><td>' + esc(k) + '</td><td>' + esc(Object.keys(d).map(function (q) { return (KIND_LEFT[q] || q) + ' ' + d[q]; }).join('; ')) + '</td><td class="r">' + nf(rep.xxx.bySheet[k]) + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
    $('result').innerHTML =
      '<h3><span class="ok" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-4.9" stroke="var(--sheet)" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Đã tạo xong cho ' + esc(rep.code) + '</h3>' +
      '<div class="tiles">' +
        '<div class="tile"><span class="k">Chỗ đã thay mã</span><span class="v">' + nf(nCode) + '</span><span class="s">ở ' + rep.t1.parts.length + ' phần của tệp</span></div>' +
        '<div class="tile"><span class="k">Dòng kỳ đã điền</span><span class="v">' + ky.v + '</span><span class="s">' + ky.s + '</span></div>' +
        '<div class="tile"><span class="k">Nhật ký</span><span class="v">Dòng ' + rep.t5.row + '</span><span class="s">15. S_NhatKy · phiên bản ' + esc(rep.code) + '-v1</span></div>' +
      '</div>' +
      (rep.t1.kept ? '<p class="kept">Giữ nguyên ' + nf(rep.t1.kept) + ' câu hướng dẫn có chỗ trống <code class="tok">&lt;mã …&gt;</code>: đó là ghi chú cách đặt mã, không phải mã của đơn vị.</p>' : '') +
      nameLine +
      '<details class="parts"><summary>Xem số chỗ thay mã theo trang</summary><div class="tbl-wrap"><table><thead><tr><th>Trang</th><th>Phần trong tệp</th><th class="r">Số chỗ</th></tr></thead><tbody>' + parts + '</tbody></table></div></details>' +
      leftTbl + (BLOCK[rep.kind] && rep.kind !== 'dang' ? '<p class="dest-note">' + BLOCK[rep.kind] + '</p>' : '') +
      goiyHtml(r.goiy) +
      '<div class="files">' + fileRow(r.unit, 'Tệp đơn vị', 'unit') + formRow + (r.zip ? zipRow(r.zip, 'zip') : '') + draftRow(r.draft, ico, fileRow) + '</div>' +
      draftNote(r.draft);
    $('result').hidden = false;
  }
  // 1.7.0 B: dòng thứ tư "Tệp đơn vị dự thảo" và câu hướng dẫn dưới danh sách tệp
  function draftRow(d, ico, fileRow) {
    if (!d) return '';
    if (d.blob) {
      var r = d.report, w = draftWarn(r);
      return fileRow(d, 'Tệp đơn vị dự thảo · đã nạp phiếu điền sẵn: D1 ' + nf(r.d1) + ' dòng, B1 ' + nf(r.written) + ' việc' + (w ? ' · ' + w : ''), 'draft');
    }
    return '<div class="file off">' + ico + '<div class="meta"><span class="mono">' + esc(d.name || '') + '</span><small>' +
      (d.err ? 'Tệp đơn vị dự thảo: chưa tạo được (' + esc(d.err) + '). Các tệp trên vẫn dùng được: nạp phiếu ở bước 4.'
        : 'Tệp đơn vị dự thảo: chưa tạo, vì phiếu điền sẵn chưa có số người hay số sản phẩm nào nạp được vào tệp đơn vị.') + '</small></div></div>';
  }
  function draftNote(d) {
    if (!d || !d.blob) return '';
    var r = d.report, n = r.errors.length + r.warnings.length, list = napGroups(r.errors, 'err') + napGroups(r.warnings, 'warn');
    return '<p class="kept">Tệp dự thảo để mở xem, sửa trực tiếp và mang đi Hội nghị. Phiếu thu về thì nạp vào tệp dự thảo ở bước 4. Sửa D1 ở một nơi: hoặc trong phiếu đầy đủ rồi nạp lại, hoặc trực tiếp trong tệp; nạp lại phiếu đầy đủ sẽ ghi đè D1.</p>' +
      (list ? '<details class="parts"><summary>Cảnh báo khi nạp phiếu điền sẵn vào tệp dự thảo (' + nf(n) + ' mục)</summary><ul class="warns" aria-label="Cảnh báo của tệp dự thảo">' + list + '</ul></details>' : '');
  }

  function save(key) { return saveItem(state.result && state.result[key]); }
  async function saveItem(item) {
    if (!item) return;
    var dl = null;
    if (dlPromise) { try { dl = await dlPromise; } catch (e) { dl = null; } }
    if (dl) {
      try { await dl.save({ filename: item.name, data: item.blob }); toast('Đã lưu ' + item.name + '.'); return; }
      catch (e) {
        var code = e && e.code;
        if (code === 'declined') { toast('Đã hủy lưu tệp.'); return; }
        if (code === 'rate_limited') { toast('Đang có hộp thoại lưu tệp khác. Thử lại sau giây lát.'); return; }
      }
    }
    try {
      var url = URL.createObjectURL(item.blob), a = document.createElement('a');
      a.href = url; a.download = item.name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      toast('Đã tạo ' + item.name + '.' + (window.claude ? ' Nếu trình duyệt không tải xuống, hãy mở trang trong claude.ai.' : ''));
    } catch (e) { toast(window.claude ? 'Chế độ xem này không cho tải tệp. Mở trang trong claude.ai rồi thử lại.' : 'Trình duyệt không cho tải tệp. Thử trình duyệt khác.'); }
  }

  // ---------- tạo lại phiếu từ tệp đơn vị đã sửa ----------
  var regen = { seq: 0, result: null };
  async function sheetEd(zip, sheetRe) {
    var wb = await zip.file('xl/workbook.xml').async('string'), rels = await zip.file('xl/_rels/workbook.xml.rels').async('string');
    var sh = S.internals.sheetMap(wb, rels).filter(function (x) { return sheetRe.test(x.name); })[0];
    if (!sh || !zip.file(sh.part)) return null;
    var sf = zip.file('xl/sharedStrings.xml'), sst = sf ? S.internals.siTexts(await sf.async('string')) : [];
    return new S.internals.SheetEdit(await zip.file(sh.part).async('string'), sst);
  }
  async function sheetValue(zip, sheetRe, ref) {
    var ed = await sheetEd(zip, sheetRe), v = ed ? ed.value(ref) : null;
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  }
  // cột E của dòng 'Tách tệp cho đơn vị' cuối cùng ở 15. S_NhatKy: cho biết tệp tách từ mẫu nào (bản 1.5)
  async function splitLogE(zip) {
    var ed = await sheetEd(zip, /S_NhatKy/);
    if (!ed) return null;
    for (var r = ed.lastDataRow(); r > 2; r--) if (ed.value('D' + r) === 'Tách tệp cho đơn vị') { var e = ed.value('E' + r); return typeof e === 'string' ? e : null; }
    return null;
  }
  async function runRegen() {
    var f = $('regenUnit').files && $('regenUnit').files[0], seq = ++regen.seq;
    $('regenErrors').innerHTML = ''; $('regenResult').hidden = true; regen.result = null;
    if (!f) return;
    if (typeof JSZip === 'undefined' || !N || !G) { $('regenErrors').innerHTML = '<div class="alert err">Chưa tải được thư viện nén tệp. Tải lại trang rồi thử lại.</div>'; return; }
    try {
      setProgress('Đang đọc tệp đơn vị…', 0.05);
      var u = await N.readUnit(JSZip, await f.arrayBuffer(), f.name);
      var logE = await splitLogE(u.zip), kind, dv = null;
      if (u.prefix.indexOf('SGDDT-') === 0) kind = 'truong';
      else if (/^[XP]\d{2}-[A-Z0-9]{2,10}$/.test(u.ma)) {
        kind = 'dvsn';
        var md = /đơn vị sự nghiệp loại ([A-Z]+)/.exec(logE || '');
        dv = md && DVSN[md[1]] ? md[1] : null;
        if (!dv) throw new Error('không nhận ra loại đơn vị sự nghiệp của tệp: nhật ký thiếu dòng “Tách tệp cho đơn vị” của bản 1.5.');
      } else if (/khối chính quyền/.test(logE || '')) kind = 'ubnd';
      else if (logE) kind = 'dang';
      else kind = Array.from(u.b1Rows.keys()).some(function (c) { return /-NV-\d+-CV-\d+$/.test(c); }) ? 'ubnd' : 'dang';
      var name = (await sheetValue(u.zip, /T_TienDo/, 'A3')) || u.ma;
      if (!S.KIND[kind].codeOk(u.ma)) throw new Error('mã đơn vị “' + u.ma + '” trong tệp không đúng dạng ' + (kind === 'truong' ? 'mã trường.' : kind === 'dvsn' ? 'mã xã-mã đơn vị, ví dụ X52-TH01.' : 'X01–X72, P01–P31.'));
      var ud = await G.unitData(u.zip);
      var formBuf = await getTpl(tplOf(kind, dv).form, false);
      var built = await buildForm(formBuf, { kind: kind, dv: dv, code: u.ma, name: name, date: isoToDmy(todayIso()), place: kind === 'truong' ? null : placeOf(u.ma) }, ud, $('optViTri').checked, 0.4);
      if (seq !== regen.seq) return;
      setProgress('Xong.', 1);
      regen.result = built;
      $('regenResult').innerHTML = '<p class="gy">Đã tạo lại phiếu cho <b>' + esc(u.ma) + '</b> (' + esc(S.KIND[kind].label + (dv ? ', loại ' + dv : '')) + ') theo Biểu C3 của tệp ' + '<span class="mono">' + esc(f.name) + '</span>.</p>' + goiyHtml(built.goiy) +
        '<div class="files"><div class="file"><svg class="xl-ico" viewBox="0 0 20 22" aria-hidden="true"><path d="M3 1h10l5 5v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="var(--sheet)" stroke="var(--ink-3)" stroke-width="1.3"/><path d="M5.5 10h8M5.5 13h8M5.5 16h5" stroke="var(--ink-3)" stroke-width="1.3" stroke-linecap="round"/></svg><div class="meta"><span class="mono">' + esc(built.form.name) + '</span><small>Phiếu thu số liệu điền sẵn gợi ý · ' + mb(built.form.blob.size) + '</small></div>' +
        '<button class="btn" type="button" data-regen="form">Tải về</button></div>' + (built.zip ? zipRow(built.zip, 'regen-zip').replace('data-save="regen-zip"', 'data-regen="zip"') : '') + '</div>';
      $('regenResult').hidden = false;
      window.V360NhatKy && V360NhatKy.ghi('tao-tep', 'tao_lai_phieu', function () { return { ma: String(N.outFileName(u.ma, 1, '01012026')).split('_K2526_')[0], ten: name, loai: kind === 'dvsn' ? 'dvsn:' + dv : kind, ban: 'tao-tep 1.7.0', chi_tiet: { phieu_vi_tri: !!built.zip } }; });
    } catch (e) {
      if (seq !== regen.seq) return;
      $('regenErrors').innerHTML = '<div class="alert err">Không tạo lại được phiếu: ' + esc(e && e.message || e) + '</div>';
      window.V360NhatKy && V360NhatKy.ghi('tao-tep', 'tao_lai_phieu', function () { return { ban: 'tao-tep 1.7.0', loi: e }; });
    } finally {
      setTimeout(function () { if (seq === regen.seq) $('progress').hidden = true; }, 600);
    }
  }

  // ---------- bước 4: nạp phiếu đã điền (một hoặc nhiều phiếu, gộp lại) ----------
  var N = window.VTVLNap;
  var nap = { seq: 0, result: null, forms: [] };
  var NAP_KIND = {
    b1_code_missing: ['err', 'Mã công việc không có trong tệp đơn vị: các dòng này không được nạp'],
    d1_name_or_id: ['err', 'Dòng D1 có họ tên hoặc số định danh: không nạp (HD 13-HD/BTCTU không cho ghi)'],
    d1_id: ['err', 'Dòng D1 có dãy số giống số định danh: không nạp'],
    b1_deadline_like: ['warn', 'Phút/SP từ 1.440 trở lên, chia hết cho 480: có thể là thời hạn giải quyết'],
    b1_sp_not_integer: ['warn', 'Số sản phẩm không phải số nguyên'],
    b1_no_source: ['warn', 'Chưa ghi nguồn số liệu'],
    b1_no_minutes: ['warn', 'Chưa có phút/SP: chỉ ghi số sản phẩm'],
    b1_sp_not_number: ['warn', 'Số sản phẩm không phải số: bỏ qua'],
    b1_duplicate: ['warn', 'Một phiếu ghi trùng mã công việc ở hai dòng: gộp giá trị hai dòng'],
    do_no_code: ['warn', 'Dòng đo chưa chọn mã công việc: bỏ qua'],
    do_incomplete: ['warn', 'Dòng đo thiếu giờ hoặc số sản phẩm: không tính'],
    do_nonpositive: ['warn', 'Dòng đo cho phút/SP không dương'],
    do_duplicate: ['warn', 'Lần đo trùng hệt ở nhiều phiếu: chỉ tính một lần'],
    sheet_no_header: ['warn', 'Trang không có dòng tiêu đề đủ cột: bỏ qua trang đó'],
    d1_no_code: ['warn', 'Dòng D1 thiếu mã nguồn lực'],
    d1_not_number: ['warn', 'Giờ/năm ở D1 không phải số: để trống'],
    d1_existing: ['warn', 'Biểu D1 đã có dữ liệu: phiếu ghi từ dòng 3'],
    log_no_split_row: ['warn', 'Nhật ký thiếu dòng tách tệp: mã lấy từ tên tệp'],
    b1_min_suggestion: ['warn', 'Phút/SP giữ nguyên mức tham khảo: ghi “chưa đo thực tế”, nên đo bổ sung'],
    b1_sp_suggestion: ['warn', 'Số SP giữ nguyên gợi ý chu kỳ: cần đối chiếu sổ sách'],
    d1_ignored: ['warn', 'Phiếu một người, phiếu vị trí có dòng D1: không nạp (D1 do đầu mối điền ở phiếu đầy đủ)'],
    b1_no_sp: ['warn', 'Dòng có sửa phút, nguồn, người xác nhận hoặc lần đo nhưng chưa có Số sản phẩm: chưa nạp dòng đó'],
    b1_sldv_no_minutes: ['warn', 'Số SP điền sẵn từ số liệu đơn vị ở việc tính PP2 chưa có phút/SP: chưa nạp dòng đó (đo hoặc nhập phút/SP rồi nạp lại)'],
    form_no_b1_rows: ['info', 'Phiếu không có dòng khối lượng (vị trí tính chung với vị trí khác hoặc chưa có công việc): không có gì để nạp từ phiếu này']
  };
  var NAP_OWN = { b1_conflict: 1, d1_conflict: 1, file_rejected: 1 };  // hiện ở khung riêng
  function napFile(id) { var f = $(id).files; return f && f.length ? f[0] : null; }
  function setNapProgress(text, frac) {
    $('napProgress').hidden = false; $('napProgressText').textContent = text;
    $('napProgressBar').style.width = Math.max(2, Math.min(100, Math.round(frac * 100))) + '%';
  }
  function addForms(list) {
    Array.prototype.forEach.call(list || [], function (f) {
      var same = nap.forms.some(function (g) { return g.name === f.name && g.size === f.size && g.lastModified === f.lastModified; });
      if (!same) nap.forms.push(f);
    });
    showPicked();
  }
  function showPicked() {
    var n = nap.forms.length;
    $('napPickedWrap').hidden = !n;
    $('napPicked').innerHTML = nap.forms.map(function (f, i) {
      return '<li><span class="mono">' + esc(f.name) + '</span><span class="sz">' + mb(f.size) + '</span>' +
        '<button type="button" class="x" data-rm="' + i + '" aria-label="Bỏ ' + esc(f.name) + '" title="Bỏ tệp này">×</button></li>';
    }).join('');
    $('napPickedN').textContent = n ? nf(n) + ' phiếu đã chọn' : '';
  }
  async function runNap() {
    var unitF = napFile('napUnit'), forms = nap.forms.slice();
    var seq = ++nap.seq;
    $('napErrors').innerHTML = ''; $('napResult').hidden = true; nap.result = null;
    $('napHint').hidden = !!(unitF && forms.length);
    if (!unitF || !forms.length) { $('napProgress').hidden = true; return; }
    var ngay = isoToDmy($('napDate').value);
    if (!ngay) { $('napErrors').innerHTML = '<div class="alert err">Chọn ngày nạp.</div>'; return; }
    if (typeof JSZip === 'undefined' || !N) { $('napErrors').innerHTML = '<div class="alert err">Chưa tải được thư viện nén tệp. Kiểm tra kết nối mạng rồi tải lại trang.</div>'; return; }
    setNapProgress('Đang đọc tệp…', 0.02);
    try {
      var bufs = await Promise.all([unitF.arrayBuffer()].concat(forms.map(function (f) { return f.arrayBuffer(); })));
      if (seq !== nap.seq) return;
      var list = forms.map(function (f, i) { return { name: f.name, data: bufs[i + 1] }; });
      var res = await N.build(JSZip, bufs[0], unitF.name, list, ngay, 'blob', function (t, f) { if (seq === nap.seq) setNapProgress(t, f); });
      if (seq !== nap.seq) return;
      nap.result = { name: res.report.outName, blob: blobOut(res.data), report: res.report };
      setNapProgress('Xong.', 1);
      showNap();
      window.V360NhatKy && V360NhatKy.ghi('tao-tep', 'nap_phieu', function () { var r = nap.result.report, v = /^(.*)-v(\d+)$/.exec(String(r.version || '')) || []; return { ma: String(r.outName || '').split('_K2526_')[0] || v[1], ban: 'tao-tep 1.7.0', chi_tiet: { so_phieu: forms.length, phieu_nhan: (r.files || []).filter(function (f) { return f.accepted; }).length, b1_ghi: r.written, b1_do: r.measured, b1_nhap_tay: r.manual, d1: r.d1, loi_phieu: (r.errors || []).length, canh_bao: (r.warnings || []).length, lan_nop: +v[2] || 0 } }; });
    } catch (e) {
      if (seq !== nap.seq) return;
      window.V360NhatKy && V360NhatKy.ghi('tao-tep', 'nap_phieu', function () { return { ban: 'tao-tep 1.7.0', loi: e && e.allRejected ? 'không phiếu nào dùng được với tệp đơn vị này' : e, chi_tiet: { so_phieu: forms.length } }; });
      if (e && e.allRejected) {
        $('napErrors').innerHTML = '<div class="alert err">Chưa nạp được: không phiếu nào dùng được với tệp đơn vị này. Kiểm tra lại tệp đơn vị hoặc chọn đúng phiếu của đơn vị.</div>' + filesHtml(e.files || []);
      } else {
        $('napErrors').innerHTML = '<div class="alert err">Không nạp được: ' + esc(e && e.message || e) + ' Kiểm tra lại: ô thứ nhất là tệp đơn vị, ô phiếu là các phiếu đã điền.</div>';
      }
    } finally {
      if (seq === nap.seq) setTimeout(function () { if (seq === nap.seq) $('napProgress').hidden = true; }, 500);
    }
  }
  function napGroups(list, sev) {
    var by = {}, order = [];
    list.forEach(function (w) { if (NAP_OWN[w.kind]) return; if (!by[w.kind]) { by[w.kind] = []; order.push(w.kind); } by[w.kind].push(w.msg); });
    return order.map(function (k) {
      var meta = NAP_KIND[k] || [sev, k], msgs = by[k];
      return '<li class="' + meta[0] + '"><span class="h">' + esc(meta[1]) + '<span class="n">' + nf(msgs.length) + ' mục</span></span><ul>' +
        msgs.slice(0, 3).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + (msgs.length > 3 ? '<li>… và ' + nf(msgs.length - 3) + ' mục khác</li>' : '') + '</ul></li>';
    }).join('');
  }
  function filesHtml(files) {
    if (!files.length) return '';
    return '<ul class="flist" aria-label="Các tệp phiếu">' + files.map(function (f) {
      if (!f.accepted) return '<li class="no"><span class="tag">Từ chối</span><span class="mono">' + esc(f.name) + '</span><small>' + esc(f.reason) + '. Tệp này không được nạp.</small></li>';
      var c = f.counts || { b1: 0, do: 0, d1: 0 }, bits = [];
      if (f.kind === 'mot_nguoi') {
        if (f.info && f.info.vtvl) bits.push(f.info.vtvl);
        if (f.info && f.info.who) bits.push('người đo: ' + f.info.who);
        if (f.info && f.info.time) bits.push('xuất ' + f.info.time);
      }
      bits.push(nf(c.b1) + ' dòng B1 có số liệu', nf(c.do) + ' lần đo');
      if (f.kind === 'day_du') bits.push(nf(c.d1) + ' dòng D1');
      var empty = !c.b1 && !c.do && !c.d1;
      var lab = f.kind === 'mot_nguoi' && f.info && /^Phiếu vị trí/.test(f.info.source || '') ? 'Phiếu vị trí' : (N.FORM_KINDS[f.kind] || f.kind);
      return '<li><span class="tag">' + esc(lab) + '</span><span class="mono">' + esc(f.name) + '</span><small>' +
        esc(empty ? 'Chưa có số liệu nào trong tệp này.' : bits.join(' · ')) + '</small></li>';
    }).join('') + '</ul>';
  }
  function conflictsHtml(c) {
    if (!c.b1.length && !c.d1.length) return '';
    var items = c.b1.map(function (x) {
      return '<li><span class="mono">' + esc(x.code) + '</span> (B1)' + x.fields.map(function (fd) {
        return '<div>' + esc(fd.field) + ':</div><ul class="vals">' + fd.values.map(function (v) {
          return '<li><span class="mono">' + esc(v.file) + '</span> dòng ' + nf(v.row) + ': <b>' + esc(v.value) + '</b></li>';
        }).join('') + '</ul>';
      }).join('') + '</li>';
    }).concat(c.d1.map(function (x) {
      return '<li>Mã nguồn lực <span class="mono">' + esc(x.code) + '</span> (D1), khác ở ' + esc(x.fields.join(', ')) + ':<ul class="vals">' + x.values.map(function (v) {
        return '<li><span class="mono">' + esc(v.file) + '</span> dòng ' + nf(v.row) + ': <b>' + esc(v.value) + '</b></li>';
      }).join('') + '</ul></li>';
    }));
    return '<div class="conf" role="group" aria-label="Xung đột giữa các phiếu"><p class="h">Xung đột: ' + nf(c.b1.length + c.d1.length) +
      ' mục các phiếu ghi khác nhau, chưa nạp. Sửa phiếu cho thống nhất rồi nạp lại.</p><ul>' + items.join('') + '</ul></div>';
  }
  function showNap() {
    var it = nap.result, r = it.report, none = r.written + r.d1 === 0;
    var ico = '<svg class="xl-ico" viewBox="0 0 20 22" aria-hidden="true"><path d="M3 1h10l5 5v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.3"/><path d="M6 10l4 6M10 10l-4 6" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/></svg>';
    var acc = r.files.filter(function (f) { return f.accepted; }), rej = r.files.length - acc.length;
    var isViTri = function (f) { return f.kind === 'mot_nguoi' && f.info && /^Phiếu vị trí/.test(f.info.source || ''); };
    var nFull = acc.filter(function (f) { return f.kind === 'day_du'; }).length, nViTri = acc.filter(isViTri).length, nOne = acc.length - nFull - nViTri;
    var nConf = r.conflicts.b1.length + r.conflicts.d1.length, noMin = r.written - r.measured - r.manual;
    var st = r.b1Stats || { co_so_sp: r.written, giu_phut_goi_y: 0, sua_phut: r.manual, co_do: r.measured, chua_co_phut: noMin };
    var stat = function (k, v, sub) { return '<div class="tile"><span class="k">' + esc(k) + '</span><span class="v">' + nf(v) + '</span><span class="s">' + esc(sub) + '</span></div>'; };
    var kinds = [nFull ? nf(nFull) + ' phiếu đầy đủ' : '', nViTri ? nf(nViTri) + ' phiếu vị trí' : '', nOne ? nf(nOne) + ' phiếu một người' : ''].filter(Boolean).join(', ');
    var warns = napGroups(r.errors, 'err') + napGroups(r.warnings, 'warn');
    $('napResult').innerHTML =
      '<p class="nap-sum">Đã đọc <b>' + nf(acc.length) + '</b> tệp phiếu (' + esc(kinds) + ')' + (rej ? ', từ chối <b>' + nf(rej) + '</b> tệp' : '') +
        '; nhân lực D1: <b>' + nf(r.d1) + '</b> dòng' + (r.refused.length ? ', từ chối ' + nf(r.refused.length) + ' dòng có họ tên, số định danh' : '') + '. Xem lại trước khi tải.</p>' +
      '<div class="tiles">' +
        '<div class="tile' + (rej ? ' bad' : '') + '"><span class="k">Tệp phiếu dùng được</span><span class="v">' + nf(acc.length) + '/' + nf(r.files.length) + '</span><span class="s">' + (rej ? 'từ chối ' + nf(rej) + ' tệp, xem lý do bên dưới' : 'cùng đơn vị, mã bắt đầu bằng ' + esc(r.prefix)) + '</span></div>' +
        '<div class="tile"><span class="k">Lần đo</span><span class="v">' + nf(r.measurements.rows) + '</span><span class="s">' + (r.measurements.duplicates ? 'bỏ ' + nf(r.measurements.duplicates) + ' dòng trùng hệt' : 'tính lại phút/SP từ giờ đo') + '</span></div>' +
        '<div class="tile' + (nConf ? ' bad' : '') + '"><span class="k">Xung đột</span><span class="v">' + nf(nConf) + '</span><span class="s">' + (nConf ? 'chưa nạp các mục này' : 'các phiếu khớp nhau') + '</span></div>' +
      '</div>' +
      '<p class="tiles-cap">Biểu B1 sau khi nạp: dòng có Số sản phẩm và nguồn của phút/SP. Dòng chỉ có gợi ý điền sẵn, chưa có Số sản phẩm thì không nạp.</p>' +
      '<div class="tiles four">' +
        stat('Dòng có Số SP', st.co_so_sp, 'ghi vào biểu B1' + (st.chua_co_phut ? '; ' + nf(st.chua_co_phut) + ' dòng chưa có phút/SP' : '') + (r.missing.length ? '; ' + nf(r.missing.length) + ' mã không có trong tệp đơn vị' : '')) +
        stat('Giữ nguyên phút gợi ý', st.giu_phut_goi_y, 'ghi là mức tham khảo, chưa đo; vào danh sách chưa đủ căn cứ') +
        stat('Đã sửa phút', st.sua_phut, 'nhập tay khác gợi ý') +
        stat('Có đo', st.co_do, 'phút/SP tính từ phiếu đo') +
      '</div>' +
      (r.keptSuggestions && r.keptSuggestions.so_sp ? '<p class="gy">Số sản phẩm giữ nguyên gợi ý chu kỳ ở <b>' + nf(r.keptSuggestions.so_sp) + '</b> dòng: cần đối chiếu sổ sách trước khi nộp.</p>' : '') +
      (r.files.length > 1 || rej ? filesHtml(r.files) : '') +
      conflictsHtml(r.conflicts) +
      (warns ? '<ul class="warns" aria-label="Cảnh báo">' + warns + '</ul>' : '<p class="kept">Không có cảnh báo.</p>') +
      (none ? '<div class="alert err">Các phiếu chưa có số liệu nào ghép được vào tệp đơn vị, nên chưa tạo tệp mới.</div>'
        : '<div class="files"><div class="file">' + ico + '<div class="meta"><span class="mono">' + esc(it.name) + '</span><small>Tệp đơn vị đã nạp · phiên bản ' + esc(r.version) + ' · ' + mb(it.blob.size) + '</small></div>' +
          '<button class="btn primary" type="button" data-nap-save="1">Tải về</button></div></div>' +
          '<p class="check-next">Kéo tệp vừa nạp vào <a href="ra-soat.html" target="_blank" rel="noopener">Rà soát 9 biểu</a> để kiểm trước khi nộp.</p>');
    $('napResult').hidden = false;
  }

  // ---------- gắn sự kiện ----------
  milestones();
  fillXa();
  $('date').value = todayIso();
  document.querySelectorAll('input[name="kind"]').forEach(function (r) { r.addEventListener('change', function () { if (r.checked) setKind(r.value); }); });
  $('xa').addEventListener('change', function () {
    var cur = $('nameDang').value.trim(), next = autoNameFor($('xa').value, state.kind === 'ubnd' ? 'ubnd' : 'dang');
    if (!cur || cur === state.autoName) $('nameDang').value = next;
    state.autoName = next;
    showErrs({}); render();
  });
  ['code', 'dvCode'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      var el = $(id), v = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (v !== el.value) el.value = v;
      render();
      liveClash(id);
    });
  });
  $('dvType').addEventListener('change', function () { setDv($('dvType').value); liveClash('dvCode'); });
  ['nameDang', 'nameDvsn', 'nameTruong', 'date'].forEach(function (id) { $(id).addEventListener('input', render); $(id).addEventListener('change', render); });
  ['nameDang', 'nameDvsn', 'nameTruong'].forEach(function (id) { $(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); generate(); } }); });
  $('form').addEventListener('submit', generate);
  $('result').addEventListener('click', function (e) { var b = e.target.closest('[data-save]'); if (b) save(b.getAttribute('data-save')); });
  $('regenUnit').addEventListener('change', runRegen);
  $('optViTri').addEventListener('change', render);
  $('regenResult').addEventListener('click', function (e) { var b = e.target.closest('[data-regen]'); if (b && regen.result) saveItem(regen.result[b.getAttribute('data-regen')]); });
  $('napDate').value = todayIso();
  showDates();
  $('sldv').addEventListener('toggle', function () { if ($('sldv').open) sldvSync(); });
  $('sldv').addEventListener('input', function (e) {
    var el = e.target;
    if (!el.matches || !el.matches('input[data-ma], input[data-vt]')) return;
    var v = el.value.replace(/[^0-9]/g, ''); if (v !== el.value) el.value = v;
    if (sl.key) slSave(sl.key, slValues());
    if (el.matches('input[data-vt]')) { if (e.isTrusted) ngMsg(null); ngSummary(); }   // 1.7.0: sửa tay bảng số người
    pvDraftSync();
  });
  // 1.7.0: bảng "Nhân sự theo mã ngạch"
  if (NG) $('ngDm').innerHTML = NG.options().map(function (o) { return '<option value="' + esc(o.ma) + '">' + esc(o.ten) + '</option>'; }).join('');
  $('ngList').addEventListener('input', function (e) {
    var el = e.target, i = ngRowOf(el), what = el.getAttribute ? el.getAttribute('data-ng') : null;
    if (i < 0 || !ng.rows[i] || (what !== 'ma' && what !== 'n')) return;
    var rowEl = el.closest('[data-i]'), r = ng.rows[i];
    if (what === 'ma') { r.ma = el.value; ngNameCell(rowEl, r.ma); ngGuess(i, rowEl); }
    else {
      var v = el.value.replace(/[^0-9]/g, ''); if (v !== el.value) el.value = v;
      r.n = v; rowEl.querySelector('[data-ng-act="tach"]').disabled = NG.count(v) < 2;
    }
    ngMsg(null); ngSummary(); ngSave();
  });
  $('ngList').addEventListener('change', function (e) {
    var el = e.target, i = ngRowOf(el), what = el.getAttribute ? el.getAttribute('data-ng') : null;
    if (i < 0 || !ng.rows[i]) return;
    var rowEl = el.closest('[data-i]'), r = ng.rows[i];
    if (what === 'ma') { // chuẩn hóa mã khi rời ô: V07.04.31 -> V.07.04.31, V.06.031 -> 06.031, hd -> HĐ
      var c = NG.lookup(el.value).ma;
      if (c !== el.value) { el.value = c; r.ma = c; ngNameCell(rowEl, c); ngGuess(i, rowEl); }
    } else if (what === 'vt') { r.vt = el.value; r.tay = el.value !== ''; }
    else return;
    ngMsg(null); ngSummary(); ngSave();
  });
  $('ngList').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-ng-act]') : null; if (!b) return;
    var i = ngRowOf(b), r = ng.rows[i], focus;
    if (!r) return;
    if (b.getAttribute('data-ng-act') === 'tach') { // dòng mới cùng mã, 1 người, vị trí trống; dòng gốc bớt 1 người
      var n = NG.count(r.n); if (n < 2) return;
      r.n = String(n - 1);
      ng.rows.splice(i + 1, 0, { ma: r.ma, n: '1', vt: '', tay: false });
      focus = [i + 1, 'vt'];
    } else { ng.rows.splice(i, 1); focus = [i, 'ma']; }
    ngMsg(null); ngRender(); ngSave();
    var el = document.querySelector('#ngList [data-i="' + Math.min(focus[0], ng.rows.length - 1) + '"] [data-ng="' + focus[1] + '"]');
    if (el) el.focus();
  });
  $('ngAdd').addEventListener('click', function () {
    ng.rows.push(ngBlank()); ngMsg(null); ngRender();
    var el = document.querySelector('#ngList [data-i="' + (ng.rows.length - 1) + '"] [data-ng="ma"]'); if (el) el.focus();
  });
  $('ngPush').addEventListener('click', ngPush);
  ['input', 'change'].forEach(function (ev) { $('napDate').addEventListener(ev, showDates); });
  ['napUnit', 'napDate'].forEach(function (id) { $(id).addEventListener('change', runNap); });
  $('napForm').addEventListener('change', function () { addForms($('napForm').files); try { $('napForm').value = ''; } catch (e) { /* bỏ qua */ } runNap(); });
  $('napPicked').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]'); if (!b) return;
    nap.forms.splice(+b.getAttribute('data-rm'), 1); showPicked(); runNap();
  });
  $('napClear').addEventListener('click', function () { nap.forms = []; showPicked(); runNap(); });
  $('napResult').addEventListener('click', function (e) { if (e.target.closest('[data-nap-save]')) saveItem(nap.result); });
  $('dvCode').value = state.dvAuto;
  setDv($('dvType').value || 'TH');
  var checked = document.querySelector('input[name="kind"]:checked');
  setKind(checked ? checked.value : 'dang');
})();
