/* Vị trí việc làm 360 · bản web 1.3.0 (02/11/2026). Tệp dựng tự động bằng build-web.js; sửa ở nguồn rồi dựng lại. */

(function () {
  'use strict';
  var MODE = 'online';
  var E = window.VTVLCheck;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var nf = function (n, d) { return (typeof n === 'number' && isFinite(n)) ? n.toLocaleString('vi-VN', { maximumFractionDigits: d == null ? 2 : d }) : ''; };
  var LV = { fix: 'Phải sửa', evidence: 'Cần bổ sung căn cứ', review: 'Nên xem lại' };
  var SHEET_LABEL = { 'Tệp': 'Tệp', 'Nhiều tệp': 'Nhiều tệp', A1: 'A1', A2: 'A2', B1: 'B1', B2: 'B2', C1: 'C1', C2: 'C2', C3: 'C3', D1: 'D1', D2: 'D2', DM: 'DM', K: 'K_KiemTra' };
  var BIG_MB = 20;
  var state = { res: null, sample: false, names: [], sizes: {}, level: 'all', sheet: 'all', file: 'all', q: '', tab: 'issues', open: {}, pages: {}, aiFor: null };
  var dlPromise = null;
  if (window.claude && typeof window.claude.use === 'function') { try { dlPromise = window.claude.use('downloads'); } catch (e) { dlPromise = null; } }

  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 3800);
  }

  // ---------- mốc nộp ----------
  function milestones() {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var items = [
      { d: new Date(2026, 10, 5), title: 'Đợt 1', what: 'A1, A2, C1, C2, B1, B2 phần đã có + danh sách nội dung chưa đủ căn cứ', note: 'Mục VII ghi 05/11, Mục VI ghi 06/11: nộp theo mốc sớm hơn.' },
      { d: new Date(2026, 10, 15), title: 'Hồ sơ hoàn chỉnh', what: 'Đủ 9 biểu, C3, D1, D2 và thuyết minh', note: 'Mục VII ghi 15/11, Mục VI ghi 17/11.' },
    ];
    $('milestones').innerHTML = items.map(function (m) {
      var days = Math.round((m.d - today) / 86400000);
      var left = days > 0 ? 'Còn ' + days + ' ngày' : (days === 0 ? 'Hạn hôm nay' : 'Đã qua ' + (-days) + ' ngày');
      return '<div class="ms' + (days < 0 ? ' past' : '') + '"><div class="date"><span class="dd">' + String(m.d.getDate()).padStart(2, '0') + '</span><span class="mm">tháng ' + (m.d.getMonth() + 1) + '</span></div>' +
        '<b>' + esc(m.title) + '</b><span class="left">' + left + '</span><span class="note">' + esc(m.what) + '. ' + esc(m.note) + '</span></div>';
    }).join('');
  }

  // ---------- đọc tệp ----------
  function setProgress(text, pct) {
    var p = $('progress'); p.hidden = false;
    $('progressText').textContent = text;
    if (pct == null) { p.classList.add('indet'); } else { p.classList.remove('indet'); $('progressBar').style.width = Math.max(2, Math.min(100, pct)) + '%'; }
  }
  var tick = function () { return new Promise(function (r) { setTimeout(r, 30); }); };
  function readBuffer(file, i, n) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onprogress = function (e) { if (e.lengthComputable) setProgress('Đang đọc tệp ' + (i + 1) + '/' + n + ': ' + file.name, (i + e.loaded / e.total * 0.3) / n * 100); };
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(new Error('Không đọc được tệp từ máy.')); };
      fr.readAsArrayBuffer(file);
    });
  }
  function showErrors(list) {
    $('errors').innerHTML = list.map(function (m) { return '<div class="alert err">' + esc(m) + '</div>'; }).join('');
  }
  async function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    if (typeof XLSX === 'undefined') { showErrors(['Chưa tải được thư viện đọc Excel. Kiểm tra kết nối mạng hoặc dùng bản offline.']); return; }
    var errs = [], wbs = [], sizes = {};
    $('pickBtn').disabled = true;
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!/\.(xlsx|xlsm)$/i.test(f.name)) { errs.push('“' + f.name + '” không phải tệp .xlsx. Mở bằng Excel rồi lưu lại dạng .xlsx.'); continue; }
      try {
        var buf = await readBuffer(f, i, files.length);
        var mb = f.size / 1048576;
        sizes[f.name] = mb;
        setProgress('Đang phân tích ' + f.name + ' (' + nf(mb, 1) + ' MB)…' + (mb > BIG_MB ? ' Tệp lớn, có thể mất một đến vài phút; giữ nguyên trang.' : ''), null);
        await tick();
        var names = XLSX.read(buf, { type: 'array', bookSheets: true }).SheetNames;
        var pick = E.pickSheets(names);
        if (!Object.keys(pick.map).length) { errs.push('“' + f.name + '” không có trang nào của bộ 9 biểu (1. A1_NhiemVu, 3. B1_KhoiLuong…).'); continue; }
        await tick();
        var wb = XLSX.read(buf, { type: 'array', cellFormula: true, cellHTML: false, cellText: false, sheetStubs: true, sheets: pick.parse });
        wbs.push({ name: f.name, wb: wb });
      } catch (e) {
        var m = String(e && e.message || e);
        errs.push('Không đọc được “' + f.name + '”' + (/password|encrypt/i.test(m) ? ': tệp đang đặt mật khẩu, hãy gỡ mật khẩu rồi chọn lại.' : ': ' + m));
      }
    }
    if (wbs.length) {
      setProgress('Đang kiểm tra ' + wbs.length + ' tệp…', null);
      await tick();
      try {
        var res = E.runChecks(wbs);
        state.sample = false; state.res = res; state.names = wbs.map(function (w) { return w.name; }); state.sizes = sizes;
        state.level = 'all'; state.sheet = 'all'; state.file = 'all'; state.q = ''; state.open = {}; state.pages = {}; state.aiFor = null;
        $('q').value = '';
        render();
        toast('Đã kiểm tra ' + wbs.length + ' tệp: ' + nf(res.issues.length, 0) + ' vấn đề.');
        window.V360NhatKy && V360NhatKy.ghi('ra-soat', 'ra_soat', function () { var s = res.summary, ag = []; s.files.forEach(function (f) { if (f.agency && !f.placeholderAgency && ag.indexOf(f.agency) < 0) ag.push(f.agency); }); return { ma: ag[0], ban: 'ra-soat 1.2.2', chi_tiet: { so_tep: wbs.length, tep_loi: errs.length, so_ma: ag.length, phai_sua: s.counts.fix, thieu_can_cu: s.counts.evidence, nen_xem: s.counts.review, vtvl: s.vtvlTotal, b1_co_sp: s.b1Entered, b1_tong: s.b1Total } }; });
      } catch (e) { errs.push('Lỗi khi kiểm tra: ' + (e && e.message || e)); }
    }
    wbs.length = 0;
    $('progress').hidden = true; $('pickBtn').disabled = false; $('fileInput').value = '';
    if (errs.length && !res) window.V360NhatKy && V360NhatKy.ghi('ra-soat', 'ra_soat', function () { return { ban: 'ra-soat 1.2.2', loi: errs[0], chi_tiet: { so_tep: files.length, tep_loi: errs.length } }; });
    showErrors(errs);
  }

  // ---------- hiển thị ----------
  function filtered() {
    var q = state.q.trim().toLowerCase();
    return state.res.issues.filter(function (it) {
      if (state.level !== 'all' && it.level !== state.level) return false;
      if (state.sheet !== 'all' && it.sheet !== state.sheet) return false;
      if (state.file !== 'all' && it.file !== state.file) return false;
      if (q && (it.code + ' ' + it.msg + ' ' + it.rule).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function render() {
    var res = state.res, s = res.summary;
    $('sampleBanner').hidden = !state.sample;
    // Nhắc tệp lớn (thường do công thức kéo sẵn tới dòng 30.000)
    var big = state.names.filter(function (n) { return (state.sizes[n] || 0) > BIG_MB; });
    $('bigNote').hidden = !big.length;
    $('bigNote').innerHTML = big.map(function (n) {
      return (state.names.length > 1 ? '<span class="mono">' + esc(n) + '</span>: ' : '') + 'Tệp lớn (' + nf(state.sizes[n], 1) + ' MB), thường do công thức kéo sẵn tới dòng 30.000; nên cắt vùng công thức về số dòng thực dùng.';
    }).join('<br>');
    $('fileChips').innerHTML = s.files.map(function (f) {
      var bad = f.error || !f.recognized;
      return '<span class="file-chip" title="' + esc(f.file) + '"><span class="dot ' + (bad ? 'fix' : 'ok') + '"></span><span class="mono">' + esc(f.file) + '</span>' + (f.error ? '<span class="muted">lỗi đọc</span>' : '') + '</span>';
    }).join('');
    var c = s.counts, multi = s.files.length > 1;
    var tiles = [
      { cls: 'fix', k: LV.fix, v: c.fix, s: 'Ban Tổ chức sẽ trả về', lv: 'fix' },
      { cls: 'evidence', k: LV.evidence, v: c.evidence, s: 'Kể cả dòng Excel báo ĐẠT', lv: 'evidence' },
      { cls: 'review', k: LV.review, v: c.review, s: 'Có thể đúng nếu giải trình', lv: 'review' },
      { cls: '', k: 'Dòng B1 đã nhập', v: s.b1Entered, s: 'trên ' + nf(s.b1Total, 0) + ' dòng; ' + nf(s.b1Ok, 0) + ' dòng đủ điều kiện tính', dot: 'ok' },
      { cls: '', k: 'VTVL đã kết luận', v: s.vtvlConcluded, s: 'trên ' + nf(s.vtvlTotal, 0) + ' VTVL ở C1', dot: 'ok' },
    ];
    $('tiles').innerHTML = tiles.map(function (t) {
      var tag = t.lv ? 'button type="button" data-level="' + t.lv + '"' : 'div';
      return '<' + tag + ' class="tile ' + t.cls + '"><span class="k"><span class="dot ' + (t.lv || t.dot) + '"></span>' + esc(t.k) + '</span><span class="v">' + nf(t.v, 0) + '</span><span class="s">' + esc(t.s) + '</span></' + (t.lv ? 'button' : 'div') + '>';
    }).join('');
    Array.prototype.forEach.call($('tiles').querySelectorAll('button[data-level]'), function (b) {
      b.addEventListener('click', function () { state.level = b.getAttribute('data-level'); selectTab('issues'); renderIssues(); $('tab-issues').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    });
    // tiến độ theo biểu (gộp các tệp)
    var agg = {};
    s.files.forEach(function (f) { if (!f.sheets) return; E.ORDER.forEach(function (k) { var x = f.sheets[k]; var a = agg[k] || (agg[k] = { rows: 0, filled: 0, found: false, title: x.title }); a.rows += x.rows; a.filled += x.filled; a.found = a.found || x.found; }); });
    var bySheet = s.bySheet || {};
    var FILL = { B1: 'dòng có số liệu', B2: 'dòng đã khai', C3: 'VTVL đã kết luận', D1: 'dòng', D2: 'dòng đã khai' };
    $('sheets').innerHTML = E.ORDER.map(function (k) {
      var a = agg[k] || { rows: 0, filled: 0, found: false, title: E.SHEETS[k].title };
      var pct = a.rows ? Math.round(a.filled / a.rows * 100) : 0;
      var d = !a.found ? 'Không có trang' : (FILL[k] ? nf(a.filled, 0) + '/' + nf(a.rows, 0) + ' ' + FILL[k] : nf(a.rows, 0) + ' dòng');
      var iss = bySheet[k] || 0;
      return '<div class="sh' + (a.found ? '' : ' missing') + '"><span class="n"><span>' + k + ' · ' + esc(a.title) + '</span><span style="color:var(--' + (iss ? 'ink-2' : 'ok') + ')">' + (iss ? nf(iss, 0) + ' vấn đề' : '✓') + '</span></span><span class="d">' + esc(d) + '</span>' +
        (FILL[k] ? '<span class="meter"><i style="width:' + pct + '%"></i></span>' : '') + '</div>';
    }).join('');
    $('tc-issues').textContent = nf(res.issues.length, 0);
    $('tc-vtvl').textContent = nf(s.vtvl.length, 0);
    $('tc-evidence').textContent = nf(c.evidence, 0);
    $('tc-template').textContent = nf(res.templateBugs.length, 0);
    // bộ lọc
    var sheetsPresent = ['Tệp'].concat(E.ORDER, ['K', 'Nhiều tệp']).filter(function (k) { return bySheet[k]; });
    $('sheetSel').innerHTML = '<option value="all">Mọi biểu</option>' + sheetsPresent.map(function (k) { return '<option value="' + k + '">' + (E.SHEETS[k] ? k + ' · ' + esc(E.SHEETS[k].title) : (k === 'K' ? 'K_KiemTra · Trang tự kiểm' : k)) + ' (' + nf(bySheet[k], 0) + ')</option>'; }).join('');
    $('sheetSel').value = state.sheet;
    $('fileSel').hidden = !multi;
    $('fileSel').innerHTML = '<option value="all">Mọi tệp</option>' + state.names.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('');
    renderIssues(); renderVtvl(); renderEvidence(); renderTemplate(); renderRules();
  }

  function renderLevelSeg(list) {
    var cnt = { all: list.length, fix: 0, evidence: 0, review: 0 };
    list.forEach(function (it) { cnt[it.level]++; });
    var opts = [['all', 'Tất cả'], ['fix', LV.fix], ['evidence', LV.evidence], ['review', LV.review]];
    $('levelSeg').innerHTML = opts.map(function (o) {
      return '<button type="button" data-l="' + o[0] + '" aria-pressed="' + (state.level === o[0]) + '">' + (o[0] !== 'all' ? '<span class="dot ' + o[0] + '"></span>' : '') + esc(o[1]) + ' <span class="num muted">' + nf(cnt[o[0]], 0) + '</span></button>';
    }).join('');
    Array.prototype.forEach.call($('levelSeg').querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { state.level = b.getAttribute('data-l'); renderIssues(); });
    });
  }

  function renderIssues() {
    var base = state.res.issues.filter(function (it) {
      if (state.sheet !== 'all' && it.sheet !== state.sheet) return false;
      if (state.file !== 'all' && it.file !== state.file) return false;
      var q = state.q.trim().toLowerCase();
      return !q || (it.code + ' ' + it.msg + ' ' + it.rule).toLowerCase().indexOf(q) >= 0;
    });
    renderLevelSeg(base);
    var list = filtered();
    var groups = {};
    list.forEach(function (it) { var k = it.rule + '|' + it.level; (groups[k] || (groups[k] = { rule: it.rule, level: it.level, items: [] })).items.push(it); });
    var order = { fix: 0, evidence: 1, review: 2 };
    var arr = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return order[a.level] - order[b.level] || b.items.length - a.items.length; });
    var box = $('groups');
    if (!arr.length) { box.innerHTML = '<div class="empty">' + (state.res.issues.length ? 'Không có vấn đề nào khớp bộ lọc.' : 'Không phát hiện vấn đề nào. Vẫn nên đọc lại thuyết minh và nguồn số liệu trước khi nộp.') + '</div>'; return; }
    var firstOpen = !Object.keys(state.open).length;
    box.innerHTML = arr.map(function (g, i) {
      var meta = E.RULES[g.rule] || { title: g.rule };
      var key = g.rule + '|' + g.level;
      var open = state.open[key] || (firstOpen && i === 0);
      if (open) state.open[key] = true;
      return '<details class="grp" data-key="' + esc(key) + '"' + (open ? ' open' : '') + '><summary><span class="chip ' + g.level + '">' + LV[g.level] + '</span><span class="chip code">' + esc(g.rule) + '</span><span class="t">' + esc(meta.title) + '</span><span class="cnt">' + nf(g.items.length, 0) + '</span></summary><div class="grp-body"></div></details>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('details.grp'), function (d) {
      var key = d.getAttribute('data-key');
      var g = groups[key];
      var fill = function () { if (!d._filled) { d._filled = true; fillGroup(d.querySelector('.grp-body'), g); } };
      if (d.open) fill();
      d.addEventListener('toggle', function () { state.open[key] = d.open; if (d.open) fill(); });
    });
  }

  function rowsTable(items, multi) {
    return '<div class="tbl-wrap"><table class="rows"><thead><tr>' + (multi ? '<th>Tệp</th>' : '') + '<th>Biểu</th><th class="r">Dòng</th><th>Cột</th><th>Mã</th><th>Nội dung</th></tr></thead><tbody>' +
      items.map(function (it) {
        var meta = [multi ? it.file : '', SHEET_LABEL[it.sheet] || it.sheet, it.row ? 'dòng ' + it.row : '', it.col ? 'cột ' + it.col : '', it.code].filter(Boolean).join(' · ');
        return '<tr><td class="m">' + esc(meta) + '</td>' + (multi ? '<td class="mono">' + esc(it.file) + '</td>' : '') + '<td>' + esc(SHEET_LABEL[it.sheet] || it.sheet) + '</td><td class="r">' + (it.row || '') + '</td><td>' + esc(it.col) + '</td><td><span class="mono">' + esc(it.code) + '</span></td><td class="msg">' + esc(it.msg) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function fillGroup(el, g) {
    var meta = E.RULES[g.rule] || {};
    var multi = state.res.summary.files.length > 1;
    var html = '<div class="howto"><b>Cách sửa:</b> ' + esc(meta.fix || g.items[0].fix || '') + '</div>';
    if (g.rule === 'A201') {
      var by = {};
      g.items.forEach(function (it) { (by[it.group] || (by[it.group] = [])).push(it); });
      var prods = Object.keys(by).sort(function (a, b) { return by[b].length - by[a].length; });
      var withB1 = g.items.filter(function (it) { return it.hasB1; }).length;
      html += '<div class="ai"><div class="row"><b>Tạo lệnh AI</b><span class="muted" style="font-size:13px">Soạn sẵn lệnh nhờ trợ lý AI đề xuất sản phẩm cụ thể cho tối đa 60 dòng' + (withB1 ? ', ưu tiên ' + nf(withB1, 0) + ' dòng đã có số liệu B1' : '') + '. Lệnh chỉ chứa mã, tên công việc, sản phẩm, đơn vị tính; không có dữ liệu nhân sự.</span></div>' +
        '<div class="row"><button class="btn primary small" type="button" data-ai="all">Tạo lệnh cho 60 dòng</button><select data-ai-sel aria-label="Chọn một sản phẩm"><option value="">Hoặc chọn một sản phẩm…</option>' + prods.map(function (p) { return '<option value="' + esc(p) + '">' + esc(p) + ' (' + by[p].length + ')</option>'; }).join('') + '</select></div><div data-ai-out></div></div>';
      html += '<div class="muted" style="font-size:13px">' + nf(prods.length, 0) + ' tên sản phẩm ghép, ' + nf(g.items.length, 0) + ' dòng. Mỗi nhóm hiện tối đa 5 dòng ví dụ; đủ danh sách trong tệp xuất Excel.</div>';
      var page = state.pages['A201'] || 12;
      html += prods.slice(0, page).map(function (p) {
        var rows = by[p].slice().sort(function (a, b) { return (b.hasB1 ? 1 : 0) - (a.hasB1 ? 1 : 0); }).slice(0, 5);
        return '<div class="sub"><h4><span>“' + esc(p) + '”</span><span class="muted num" style="font-weight:500;font-size:13px">' + nf(by[p].length, 0) + ' dòng</span></h4><ul>' + rows.map(function (it) { return '<li><span class="mono">' + esc(it.code) + '</span> · dòng ' + it.row + ' · ' + esc(it.jobName || '') + (it.hasB1 ? ' <b>(đã có số liệu B1)</b>' : '') + '</li>'; }).join('') + '</ul></div>';
      }).join('');
      if (prods.length > page) html += '<button class="btn small more" type="button" data-more="A201">Xem thêm ' + Math.min(12, prods.length - page) + ' nhóm</button>';
    } else {
      var key = g.rule + '|' + g.level;
      var n = state.pages[key] || 50;
      html += rowsTable(g.items.slice(0, n), multi);
      if (g.items.length > n) html += '<button class="btn small more" type="button" data-more="' + esc(key) + '">Xem thêm ' + nf(Math.min(100, g.items.length - n), 0) + ' dòng (còn ' + nf(g.items.length - n, 0) + ')</button>';
    }
    el.innerHTML = html;
    var more = el.querySelector('[data-more]');
    if (more) more.addEventListener('click', function () {
      var k = more.getAttribute('data-more');
      state.pages[k] = (state.pages[k] || (k === 'A201' ? 12 : 50)) + (k === 'A201' ? 12 : 100);
      fillGroup(el, g);
    });
    var aiBtn = el.querySelector('[data-ai]'), aiSel = el.querySelector('[data-ai-sel]');
    if (aiBtn) aiBtn.addEventListener('click', function () { showAI(el, ''); });
    if (aiSel) aiSel.addEventListener('change', function () { if (aiSel.value) showAI(el, aiSel.value); });
  }

  function showAI(el, group) {
    var text = E.buildAIPrompt(state.res, 60, group || null);
    var out = el.querySelector('[data-ai-out]');
    out.innerHTML = '<textarea readonly aria-label="Lệnh AI" id="aiText"></textarea><div class="row" style="margin-top:6px"><button class="btn primary small" type="button" id="aiCopy">Sao chép lệnh</button><span class="muted" style="font-size:12.5px">Dán vào trợ lý AI đơn vị được phép dùng; kiểm tra lại đề xuất trước khi sửa biểu A2.</span></div>';
    var ta = out.querySelector('textarea'); ta.value = text;
    out.querySelector('#aiCopy').addEventListener('click', function () {
      var done = function () { toast('Đã sao chép lệnh.'); };
      var fallback = function () { ta.focus(); ta.select(); toast('Đã chọn sẵn nội dung, nhấn Ctrl+C để sao chép.'); };
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback(); } catch (e) { fallback(); }
    });
  }

  function renderVtvl() {
    var s = state.res.summary, multi = s.files.length > 1;
    var ex = s.c105Exempt || 0;
    $('vtExempt').hidden = !ex;
    $('vtExempt').textContent = ex ? nf(ex, 0) + ' VTVL không có công việc vì dùng PP1/PP3 hoặc tính chung — không cần B1.' : '';
    var only = $('vtOnly').checked, q = $('vtQ').value.trim().toLowerCase();
    var rows = s.vtvl.filter(function (v) {
      if (only && !(v.b1Entered || v.need !== null || v.d1People || v.pp1 !== null || v.pp3 !== null || v.b2Net !== null)) return false;
      return !q || (v.code + ' ' + v.name).toLowerCase().indexOf(q) >= 0;
    });
    var th = '<thead><tr>' + (multi ? '<th>Tệp</th>' : '') + '<th>Mã VTVL</th><th>Tên VTVL</th><th>Phương pháp</th><th class="r">Giờ B1</th><th class="r">trong đó câu mẫu</th><th class="r">Tác động B2</th><th class="r">Giờ ròng</th><th class="r">Quỹ giờ</th><th class="r">Người quy đổi PP2</th><th class="r">PP1</th><th class="r">PP3</th><th class="r">Cần bố trí (C3)</th><th class="r">Hiện có (D1)</th><th class="r">Chênh lệch</th><th>Trạng thái C3</th><th class="r">Vấn đề</th></tr></thead>';
    if (!rows.length) { $('vtTable').innerHTML = th + '<tbody><tr><td colspan="17" class="muted" style="padding:18px">' + (only ? 'Chưa VTVL nào có số liệu B1, C3 hoặc D1. Bỏ chọn “Chỉ VTVL đã có số liệu” để xem toàn bộ danh sách.' : 'Không có VTVL khớp tìm kiếm.') + '</td></tr></tbody>'; return; }
    $('vtTable').innerHTML = th + '<tbody>' + rows.slice(0, 600).map(function (v) {
      var gap = v.gap === null ? '' : (v.gap > 0 ? '+' : '') + nf(v.gap);
      return '<tr>' + (multi ? '<td class="mono">' + esc(v.file) + '</td>' : '') + '<td><span class="mono">' + esc(v.code) + '</span></td><td class="nm">' + esc(v.name) + '</td><td class="nw">' + esc(v.method) + '</td>' +
        '<td class="r">' + nf(v.b1Hours, 1) + '</td><td class="r">' + (v.b1HoursPrefill ? nf(v.b1HoursPrefill, 1) : '') + '</td><td class="r">' + nf(v.b2Net, 1) + '</td><td class="r">' + nf(v.netHours, 1) + '</td><td class="r">' + nf(v.quy, 0) + '</td>' +
        '<td class="r"><b>' + nf(v.pp2, 2) + '</b></td><td class="r">' + nf(v.pp1) + '</td><td class="r">' + nf(v.pp3) + '</td><td class="r"><b>' + nf(v.need) + '</b></td><td class="r nw">' + (v.d1People !== null ? nf(v.d1People, 0) + ' người' + (v.d1Fte !== null ? ' · ' + nf(v.d1Fte, 2) : '') : '') + '</td><td class="r">' + gap + '</td><td>' + esc(v.c3Status) + '</td><td class="r">' + (v.issues ? nf(v.issues, 0) : '') + '</td></tr>';
    }).join('') + '</tbody>';
  }

  function renderEvidence() {
    var items = state.res.issues.filter(function (it) { return it.level === 'evidence'; });
    var box = $('evidenceBox');
    if (!items.length) { box.innerHTML = '<div class="empty">Không có nội dung nào thiếu căn cứ theo các quy tắc của công cụ.</div>'; return; }
    var multi = state.res.summary.files.length > 1;
    var n = state.pages.evidence || 200;
    box.innerHTML = '<div class="tbl-wrap"><table><thead><tr><th class="r">STT</th>' + (multi ? '<th>Tệp</th>' : '') + '<th>Nội dung</th><th>Nguyên nhân</th><th>Thời hạn bổ sung</th><th>Đầu mối</th></tr></thead><tbody>' +
      items.slice(0, n).map(function (it, i) {
        return '<tr><td class="r">' + (i + 1) + '</td>' + (multi ? '<td class="mono">' + esc(it.file) + '</td>' : '') + '<td>' + esc(it.sheet) + (it.row ? ' dòng ' + it.row : '') + (it.code ? ' · <span class="mono">' + esc(it.code) + '</span>' : '') + '</td><td>' + esc(it.msg) + '</td><td class="muted">…</td><td class="muted">…</td></tr>';
      }).join('') + '</tbody></table></div>' + (items.length > n ? '<button class="btn small more" type="button" id="evMore">Xem thêm (còn ' + nf(items.length - n, 0) + ' dòng)</button>' : '');
    var m = $('evMore'); if (m) m.addEventListener('click', function () { state.pages.evidence = n + 300; renderEvidence(); });
  }

  function renderTemplate() {
    var t = state.res.templateBugs;
    var box = $('templateBox');
    if (!t.length) { box.innerHTML = '<div class="empty">Không phát hiện lỗi nào của biểu mẫu trong các tệp đã chọn.</div>'; return; }
    var multi = state.res.summary.files.length > 1;
    box.innerHTML = t.map(function (b) {
      return '<article class="tb"><h3><span class="chip code">' + esc(b.id) + '</span>' + esc(b.title) + '</h3><p class="muted" style="font-size:13px">' + (multi ? '<span class="mono">' + esc(b.file) + '</span> · ' : '') + 'Biểu ' + esc(b.sheet) + ', cột ' + esc(b.cells) + '</p><p>' + esc(b.detail) + '</p><p><b>Đề nghị sửa:</b> ' + esc(b.proposal) + '</p></article>';
    }).join('');
  }

  function renderRules() {
    if ($('rulesBox').childElementCount) return;
    var groups = [['Tệp và cấu trúc', /^F/], ['Liên kết mã', /^L/], ['A1, A2 · Nhiệm vụ, công việc', /^A/], ['B1 · Khối lượng', /^B1/], ['B2 · Tác động', /^B2/], ['C1, C2 · VTVL, năng lực', /^C[12]/], ['C3 · Nhu cầu', /^C3/], ['D1 · Nhân lực', /^D1/], ['D2 · Phương án', /^D2/], ['DM · Danh mục sản phẩm', /^DM/], ['K_KiemTra · Trang tự kiểm', /^K/], ['Nhiều tệp', /^X/]];
    var keys = Object.keys(E.RULES);
    var changes = [
      '<b>DM01</b> không báo khi phút chuẩn ở DM_SAN_PHAM bằng một mức giờ của Phụ lục 3 HD13 nhân 60; <b>B106</b> không báo khi phút/SP bằng phút chuẩn của mã sản phẩm ở cột L.',
      'Mới <b>B110</b>: phút/SP lớn hơn 4 lần hoặc nhỏ hơn 1/4 phút chuẩn ở DM_SAN_PHAM.',
      '<b>B104</b>: dòng giữ nguyên phút gợi ý (cột I ghi “Mức tham khảo: …; chưa đo thực tế”) vào danh sách chưa đủ căn cứ.',
      'Thêm bảng tham khảo định mức giờ của Phụ lục 3 HD13 ở cuối thẻ này.',
      'Bản 1.2.1: <b>B104</b> không báo thiếu nguồn thời gian ở dòng B1 của VTVL mà C3 chọn phương pháp không có PP2 (chỉ PP1, PP3), như C102; C3 để trống hoặc chưa có dòng của VTVL thì vẫn báo như cũ.',
      'Bản 1.2.2: <b>A205</b> chỉ báo khi cùng đơn vị có VTVL đúng mảng việc. Đơn vị là phần mã VTVL đứng trước mã nhóm (CM, LDQL, HTPV, HT, PV), ví dụ XXX-MN, XXX-DVTH, X52-TH01, XXX-DC. Nhận thêm việc thủ quỹ: “thu chi tiền mặt”, “bảo quản tiền”, “đối chiếu quỹ”, “thu tiền”, “biên lai”. A203, A205 bỏ phần tên nhiệm vụ chép sau “đối với:”, “liên quan đến:”, như sau “nhiệm vụ:”.',
      'Bản 1.2.2: <b>F03</b> nhận tên cột I của C3 “Số người theo đánh giá chuyên môn có căn cứ (PP3)”; <b>L02</b> gộp từ 10 mã công việc cùng một dạng lệch (ví dụ “&lt;mã nhiệm vụ&gt;-CV-NN”) thành một mục Nên xem lại, kèm số mã và 3 ví dụ; <b>F04</b> nhận tệp riêng của đơn vị sự nghiệp thuộc xã (tệp X52-TH01, mã nhiệm vụ X52-SN-A1-TH01-001).',
    ];
    var prev = 'Bản 1.1: thêm A205, A206, C203, F06, K01; bớt báo nhiễu ở C105, C102; nhận câu mẫu của mẫu trường THCS–THPT; nhắc tệp lớn hơn 20 MB; F04 so đủ mã đơn vị nhiều đoạn (SGDDT-HHN).';
    // Bảng tham khảo PL3 (chép nguyên văn từ Phụ lục 3 HD13, dữ liệu ở E.PL3)
    var P = E.PL3, gi = 0;
    var pl3Rows = P.items.map(function (it) {
      var head = '';
      if (gi < P.groups.length && P.groups[gi][0] === it[0]) { head = '<tr class="g"><td class="n">' + P.groups[gi][1] + '</td><td colspan="5">' + esc(P.groups[gi][2]) + '</td></tr>'; gi++; }
      return head + '<tr><td class="n">' + it[0] + '</td><td>' + esc(it[1]) + '</td><td>' + esc(it[2]) + '</td><td class="n">' + nf(it[3]) + '</td><td class="n">' + nf(it[4]) + '</td><td class="n">' + nf(it[5]) + '</td></tr>';
    }).join('');
    var pl3 = '<section class="wide pl3" id="pl3"><h3>Bảng tham khảo PL3</h3>' +
      '<p>' + esc(P.title) + ' (' + esc(P.source) + '). ' + esc(P.scope) + '</p>' +
      '<p>' + esc(P.levels) + ' Đơn vị tính: giờ/sản phẩm. Đổi sang phút để so với cột D của B1: nhân 60 (40 giờ = 2.400 phút).</p>' +
      '<div class="tbl-wrap"><table><thead><tr><th class="n">TT</th><th>Sản phẩm công việc</th><th>Đơn vị tính</th><th class="n">Đơn giản</th><th class="n">Thông thường</th><th class="n">Phức tạp</th></tr></thead><tbody>' + pl3Rows + '</tbody></table></div>' +
      '<h4>Ghi chú</h4><ul class="plain">' + P.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></section>';
    $('rulesBox').innerHTML = '<section class="wide"><h3>Thay đổi ở 1.2, 1.2.1, 1.2.2</h3><ul class="plain">' + changes.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul><p>' + esc(prev) + '</p><div><button class="btn small" type="button" id="toPl3">Xem bảng tham khảo PL3</button></div></section>' + groups.map(function (g) {
      var ks = keys.filter(function (k) { return g[1].test(k); });
      return '<section><h3>' + esc(g[0]) + '</h3><ol>' + ks.map(function (k) { var r = E.RULES[k]; return '<li><span class="mono">' + k + '</span><span><span class="chip ' + r.level + '" style="margin-right:6px">' + LV[r.level] + '</span>' + esc(r.title) + '<small>' + esc(r.fix) + '</small></span></li>'; }).join('') + '</ol></section>';
    }).join('') + '<section><h3>Lỗi của biểu mẫu</h3><ol>' + [
      ['T01', 'Công thức cảnh báo PP3 ở C3 kiểm sai'], ['T02', 'Tra cứu theo vị trí dòng thay vì theo mã'], ['T03', 'Câu mẫu điền sẵn làm kiểm tra của Excel không còn tác dụng'],
      ['T04', 'Giá trị tính sẵn trong tệp đã cũ'], ['T05', 'Vùng công thức cố định, không còn chỗ cho dòng mới'], ['T06', 'B1 không khớp một-một với A2'], ['T07', 'Cột J của B1 điền sẵn giá trị của danh sách khác']].map(function (x) { return '<li><span class="mono">' + x[0] + '</span><span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ol></section>' + pl3;
    $('toPl3').addEventListener('click', function () { $('pl3').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  function selectTab(name) {
    state.tab = name;
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === name)); });
    ['issues', 'vtvl', 'evidence', 'template', 'rules'].forEach(function (k) { $('tab-' + k).hidden = k !== name; });
  }

  // ---------- xuất Excel ----------
  function exportWorkbook() {
    var res = state.res, s = res.summary, multi = s.files.length > 1;
    var U = XLSX.utils, wb = U.book_new();
    var sheet = function (name, rows, widths) { var ws = U.aoa_to_sheet(rows); ws['!cols'] = widths.map(function (w) { return { wch: w }; }); ws['!autofilter'] = { ref: U.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(0, rows.length - 1), c: rows[0].length - 1 } }) }; U.book_append_sheet(wb, ws, name); };
    var h1 = ['STT'].concat(multi ? ['Tệp'] : [], ['Mức', 'Biểu', 'Dòng', 'Cột', 'Mã', 'Quy tắc', 'Nội dung', 'Cách sửa']);
    sheet('Can_xu_ly', [h1].concat(res.issues.map(function (it, i) {
      return [i + 1].concat(multi ? [it.file] : [], [LV[it.level], SHEET_LABEL[it.sheet] || it.sheet, it.row || '', it.col, it.code, it.rule + ' · ' + ((E.RULES[it.rule] || {}).title || ''), it.msg, it.fix]);
    })), [6].concat(multi ? [28] : [], [18, 8, 7, 6, 24, 34, 70, 70]));
    var h2 = (multi ? ['Tệp'] : []).concat(['Mã VTVL', 'Tên VTVL', 'Phương pháp', 'Giờ B1 (đủ điều kiện)', 'Trong đó dựa trên câu mẫu', 'Tác động B2 (giờ)', 'Giờ ròng', 'Quỹ giờ', 'Người quy đổi PP2', 'Người PP1', 'Người PP3', 'Người cần bố trí (C3)', 'Hiện có (D1, người)', 'Tương đương toàn thời gian', 'Chênh lệch (C3 − D1)', 'Trạng thái C3', 'Số vấn đề']);
    var nz = function (v) { return v === null || v === undefined ? '' : v; };
    sheet('Tong_hop_VTVL', [h2].concat(s.vtvl.map(function (v) {
      return (multi ? [v.file] : []).concat([v.code, v.name, v.method, nz(v.b1Hours), v.b1HoursPrefill || '', nz(v.b2Net), nz(v.netHours), nz(v.quy), nz(v.pp2), nz(v.pp1), nz(v.pp3), nz(v.need), nz(v.d1People), nz(v.d1Fte), nz(v.gap), v.c3Status, v.issues]);
    })), (multi ? [28] : []).concat([22, 40, 13, 12, 12, 12, 10, 9, 12, 9, 9, 12, 12, 12, 12, 16, 9]));
    var ev = res.issues.filter(function (it) { return it.level === 'evidence'; });
    sheet('Chua_du_can_cu', [['STT', 'Nội dung', 'Nguyên nhân', 'Thời hạn bổ sung', 'Đầu mối']].concat(ev.map(function (it, i) {
      return [i + 1, (multi ? it.file + ' · ' : '') + it.sheet + (it.row ? ' dòng ' + it.row : '') + (it.code ? ' · ' + it.code : ''), it.msg + ' ' + it.fix, '', ''];
    })), [6, 46, 90, 18, 22]);
    var PRI = { T01: 'Cao', T02: 'Cao', T03: 'Cao', T04: 'Trung bình', T05: 'Trung bình', T06: 'Cao', T07: 'Cao' };
    var GRP = { T01: 'Công thức', T02: 'Công thức', T03: 'Câu mẫu, hướng dẫn điền', T04: 'Công thức', T05: 'Công thức', T06: 'Cấu trúc biểu', T07: 'Danh sách lựa chọn' };
    sheet('Gop_y_bieu_mau', [['STT', 'Cơ quan/đơn vị góp ý', 'Nhóm nội dung', 'Tên biểu', 'Cột/ô hoặc điều khoản', 'Nội dung dự thảo', 'Nội dung đề nghị sửa', 'Lý do, căn cứ', 'Mức độ ưu tiên', 'Đầu mối liên hệ', 'Trạng thái tiếp thu (cơ quan chủ trì)']].concat(res.templateBugs.map(function (b, i) {
      var f = s.files.find(function (x) { return x.file === b.file; }) || {};
      return [i + 1, f.agency && !f.placeholderAgency ? f.agency : '', GRP[b.id] || '', (E.SHEETS[b.sheet] || {}).name || b.sheet, b.cells, b.detail, b.proposal, 'Phát hiện khi rà soát bằng công cụ Rà soát 9 biểu: ' + b.title + '.', PRI[b.id] || 'Trung bình', '', 'Chờ tiếp thu'];
    })), [6, 18, 18, 18, 18, 70, 60, 40, 12, 18, 18]);
    return wb;
  }
  async function doExport() {
    if (!state.res) return;
    var f0 = state.res.summary.files[0] || {};
    var ag = (f0.agency && !f0.placeholderAgency) ? f0.agency : (state.sample ? 'VI_DU' : 'DON_VI');
    var d = new Date(); var stamp = String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + d.getFullYear();
    var filename = 'KetQuaRaSoat_' + ag + '_' + stamp + '.xlsx';
    var wb;
    try { wb = exportWorkbook(); } catch (e) { toast('Không tạo được tệp kết quả: ' + (e && e.message || e)); return; }
    var dl = null;
    if (dlPromise) { try { dl = await dlPromise; } catch (e) { dl = null; } }
    if (dl) {
      try {
        var data = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        await dl.save({ filename: filename, data: new Blob([data]) });
        toast('Đã lưu ' + filename + '.');
        return;
      } catch (e) {
        var code = e && e.code;
        if (code === 'declined') { toast('Đã hủy lưu tệp.'); return; }
        if (code === 'rate_limited') { toast('Đang có hộp thoại lưu tệp khác. Thử lại sau giây lát.'); return; }
      }
    }
    try { XLSX.writeFile(wb, filename); toast('Đã tạo ' + filename + '. Nếu trình duyệt không tải xuống, hãy dùng bản offline của công cụ.'); if (!state.sample) window.V360NhatKy && V360NhatKy.ghi('ra-soat', 'xuat_ket_qua', function () { return { ma: f0.agency && !f0.placeholderAgency ? f0.agency : null, ban: 'ra-soat 1.2.2', chi_tiet: { so_muc: state.res.issues.length } }; }); }
    catch (e) { toast('Chế độ xem này không cho tải tệp. Mở công cụ trong cửa sổ riêng hoặc dùng bản offline.'); }
  }

  // ---------- ví dụ minh họa ----------
  function buildSample() {
    var U = XLSX.utils, wb = U.book_new();
    var KY = '01/10/2025–30/9/2026';
    var add = function (name, title, head, rows) { U.book_append_sheet(wb, U.aoa_to_sheet([[title], head].concat(rows)), name); };
    var PF_H = 'Hồ sơ/sổ/hệ thống nghiệp vụ xã; thống kê thực tế kỳ 01/10/2025–30/9/2026; người phụ trách xác nhận';
    var PF_K = 'Phương pháp gợi ý theo tính chất VTVL; nhu cầu chỉ chốt sau B1/B2 và xác nhận';
    add('1. A1_NhiemVu', 'Biểu A1_Nhiệm vụ', ['Mã nhiệm vụ', 'Tên nhiệm vụ', 'Cơ quan', 'Căn cứ', 'Kỳ', 'Trạng thái', 'Nguồn'], [
      ['X99-VP-A1-001', 'Quản lý văn bản đến', 'Văn phòng HĐND và UBND', 'Luật Văn thư; QĐ chức năng nhiệm vụ', 'K2526', 'Tiếp tục thực hiện', 'Danh mục nhiệm vụ cấp xã'],
      ['X99-VP-A1-002', 'Chứng thực bản sao từ bản chính', 'Văn phòng HĐND và UBND', 'Nghị định về chứng thực', 'K2526', 'Tiếp tục thực hiện', 'Danh mục thủ tục hành chính cấp xã'],
      ['X99-VH-A1-003', 'Tổ chức hoạt động văn hóa cơ sở', 'Phòng Văn hóa - Xã hội', 'QĐ chức năng nhiệm vụ', 'K2526', 'Đã chuyển giao', '']]);
    add('2. A2_CongViec', 'Biểu A2_Công việc', ['Mã công việc', 'Mã nhiệm vụ', 'Mã VTVL', 'Tên công việc', 'Sản phẩm', 'Đơn vị tính', 'Chất lượng', 'Căn cứ (nguồn)'], [
      ['X99-VP-A1-001-01', 'X99-VP-A1-001', 'X99-VP-CM-01', 'Tiếp nhận, vào sổ văn bản đến', 'Văn bản đến đã vào sổ', 'văn bản', 'Đúng thời hạn', 'Theo A1'],
      ['X99-VP-A1-001-02', 'X99-VP-A1-001', 'X99-VP-CM-01', 'Trình, chuyển văn bản đến người xử lý', 'Phiếu trình/phiếu chuyển', 'phiếu', 'Đúng người, đúng hạn', 'Theo A1'],
      ['X99-VP-A1-001-03', 'X99-VP-A1-001', 'X99-VP-CM-01', 'Lãnh đạo xem xét, quyết định phân công xử lý', 'Ý kiến phân công', 'văn bản', 'Rõ người chủ trì', 'Theo A1'],
      ['X99-VP-A1-002-01', 'X99-VP-A1-002', 'X99-VP-CM-02', 'Tiếp nhận, kiểm tra hồ sơ chứng thực', 'Hồ sơ chứng thực', 'hồ sơ', 'Đủ thành phần', 'Theo A1'],
      ['X99-VP-A1-002-02', 'X99-VP-A1-002', 'X99-VP-CM-02', 'Chứng thực bản sao', 'Bản sao đã chứng thực', 'bản', 'Đúng quy định', 'Theo A1'],
      ['X99-VH-A1-003-01', 'X99-VH-A1-003', 'X99-VH-CM-01', 'Tổ chức sự kiện văn hóa', 'Sự kiện', 'sự kiện', 'Đúng kế hoạch', 'Theo A1']]);
    var b1h = ['Mã công việc', 'Mã VTVL', 'Số SP/năm', 'Trung bình phút/SP (đo thực tế)', 'Giờ bổ sung (công việc liên quan)', 'Giờ SP (tính)', 'Giờ tổng (tính)', 'Nguồn SL', 'Nguồn thời gian', 'Trạng thái căn cứ thời gian', 'Kỳ', 'Mã SP trong danh mục', 'Nhóm (tự tra)', 'Phút/SP chuẩn (tự tra)', 'Xác nhận chuẩn (tự tra)', 'Phút/SP dùng để tính', 'Nguồn thời gian dùng tính', 'Cảnh báo dữ liệu', 'Giải trình khác chuẩn'];
    var KD = 'Kiểm đếm, ước lượng thực tế';
    var b1 = function (job, vt, c, d, h, i, j, sp) { return [job, vt, c, d, '', '', '', h, i, j, KY, sp, '', '', '', '', '', '', '']; };
    add('3. B1_KhoiLuong', 'Biểu B1_Khối lượng', b1h, [
      b1('X99-VP-A1-001-01', 'X99-VP-CM-01', 2400, 6, 'Sổ đăng ký văn bản đến 2025–2026 của văn thư', 'Phiếu đo 20 mẫu, công chức văn phòng xác nhận ngày 20/10/2026', KD, 'X99-SP-001'),
      b1('X99-VP-A1-001-02', 'X99-VP-CM-01', 1800, 4, PF_H, 'TC_02 tham chiếu sơ bộ: 3-6-12 phút/SP; không tự đưa vào phút thực tế.', KD, 'X99-SP-002'),
      b1('X99-VP-A1-001-03', 'X99-VP-CM-01', 1800, 2, 'Sổ đăng ký văn bản đến 2025–2026', 'Phiếu đo 15 mẫu ngày 21/10/2026', KD, 'X99-SP-003'),
      b1('X99-VP-A1-002-01', 'X99-VP-CM-02', 950, 2880, 'Sổ chứng thực 2025–2026', 'TC_02 tham chiếu sơ bộ: 10-20-40 phút/SP; không tự đưa vào phút thực tế.', KD, 'X99-SP-004'),
      b1('X99-VP-A1-002-02', 'X99-VP-CM-02', 950, 15, 'Sổ chứng thực 2025–2026', '', 'Có định mức', 'X99-SP-005'),
      b1('X99-VH-A1-003-01', 'X99-VH-CM-01', 0, 480, 'Kế hoạch hoạt động văn hóa năm 2026', 'Báo cáo tổng kết, cán bộ văn hóa xác nhận', KD, 'X99-SP-006')]);
    add('4. B2_CT_TacDong', 'Biểu B2_Chi tiết tác động', ['Mã công việc', 'Mã VTVL', 'Loại tác động', 'Công đoạn', 'SP áp dụng', 'Phút trước', 'Phút sau', 'Giờ giảm trực tiếp', 'Giờ việc mới', 'Nguồn/bằng chứng', 'Kỳ', 'Cơ sở B1', 'Trạng thái', 'Giờ giảm hợp lệ', 'Giờ tăng hợp lệ', 'Kiểm tra', 'Kinh phí trước', 'Kinh phí sau', 'Đối chiếu trùng/phạm vi (cán bộ xác nhận)'], [
      ['X99-VP-A1-002-02', 'X99-VP-CM-02', 'Số hóa', 'Chứng thực điện tử', 400, 15, 10, '', '', 'Báo cáo số hóa năm 2026', 'K2526', 'Trước thay đổi, có điều chỉnh', 'Đã kiểm chứng', '', '', '', '', '', 'Chờ đối chiếu']]);
    var c1h = ['Mã VTVL', 'Tên VTVL', 'Loại nhân lực', 'Quyết định', 'Giờ chuẩn PP2', 'Căn cứ xác định quỹ giờ', 'Trạng thái', 'Giờ riêng được xác nhận', 'Xác nhận giờ riêng', 'Chế độ làm việc', 'Kiểm tra quỹ giờ PP2'];
    var PB = 'Phổ biến (40 giờ/tuần)';
    add('6. C1_VTVL', 'Biểu C1_Vị trí việc làm', c1h, [
      ['X99-VP-LDQL-01', 'Chánh Văn phòng HĐND và UBND', 'Công chức', 'QĐ phê duyệt VTVL', '', 'Quỹ giờ chung', 'Tiếp tục sử dụng', '', '', PB, ''],
      ['X99-VP-CM-01', 'Văn thư', 'Công chức', 'QĐ phê duyệt VTVL', '', 'Quỹ giờ chung', 'Tiếp tục sử dụng', '', '', PB, ''],
      ['X99-VP-CM-02', 'Công chức tư pháp – chứng thực', 'Công chức', 'QĐ phê duyệt VTVL', '', 'Quỹ giờ chung', 'Tiếp tục sử dụng', '', '', PB, ''],
      ['X99-VH-CM-01', 'Công chức văn hóa – xã hội', 'Công chức', 'QĐ phê duyệt VTVL', '', 'Quỹ giờ chung', 'Tiếp tục sử dụng', '', '', PB, '']]);
    add('7. C2_NangLuc', 'Biểu C2_Năng lực', ['Mã VTVL', 'Trách nhiệm', 'Năng lực chung', 'Chuyên môn', 'Lãnh đạo', 'Căn cứ', 'Nguồn bản mô tả'], [
      ['X99-VP-LDQL-01', 'Chủ trì công tác văn phòng', 'Tổ chức, điều hành', 'Hành chính', 'Có', 'Bản mô tả', 'QĐ bản mô tả'],
      ['X99-VP-CM-01', 'Quản lý văn bản đi, đến', 'Cẩn thận, chính xác', 'Văn thư lưu trữ', '', 'Bản mô tả', 'QĐ bản mô tả'],
      ['X99-VP-CM-02', 'Thực hiện chứng thực', 'Tuân thủ quy trình', 'Tư pháp', '', 'Bản mô tả', 'QĐ bản mô tả'],
      ['X99-VH-CM-01', 'Tổ chức hoạt động văn hóa', 'Tổ chức sự kiện', 'Văn hóa', '', 'Bản mô tả', '']]);
    add('8. C3_NhuCau', 'Biểu C3_Nhu cầu', ['Mã VTVL', 'Phương pháp', 'Giờ B1', 'Giờ tác động B2', 'Giờ ròng', 'Giờ PP2 (từ C1)', 'Người quy đổi PP2', 'Người PP1', 'Người PP3 (ước lượng, cần giải trình)', 'Người cần bố trí', 'Nguồn/giải trình', 'Trạng thái', 'Cảnh báo', 'Số dòng B1 chưa đạt'], [
      ['X99-VP-LDQL-01', 'PP1+PP3', '', '', '', '', '', 1, 1, 1, 'Theo cơ cấu lãnh đạo văn phòng', 'Tính thử', '', ''],
      ['X99-VP-CM-01', 'PP2', '', '', '', '', '', '', '', 1, PF_K, 'Tính thử', '', ''],
      ['X99-VP-CM-02', 'PP2+PP3', '', '', '', '', '', '', '', 1, 'Theo khối lượng chứng thực năm 2026', 'Tính thử', '', ''],
      ['X99-VH-CM-01', 'PP3', '', '', '', '', '', '', 1, 1, 'Theo kế hoạch hoạt động văn hóa', 'Tính thử', '', '']]);
    add('9. D1_NhanLuc', 'Biểu D1_Nhân lực', ['Mã nguồn lực', 'Mã VTVL', 'Loại nhân lực', 'Giờ quy đổi/năm (tự lấy)', 'Giờ dành cho VTVL', 'Giờ việc khác', 'Nơi tính BC', 'Nguồn', 'Trạng thái', 'Cảnh báo', 'Giờ riêng theo chế độ'], [
      ['X99.01', 'X99-VP-LDQL-01', 'Công chức', '', 1904, 200, 'UBND xã X99', 'Quyết định phân công', 'Đã kiểm chứng', '', ''],
      ['X99.02', 'X99-VP-CM-01', 'Công chức', '', 1500, 300, 'UBND xã X99', 'Quyết định phân công', 'Đã kiểm chứng', '', ''],
      ['X99.03', 'X99-VP-CM-02', 'Công chức', '', 1700, '', 'UBND xã X99', '', 'Đã kiểm chứng', '', ''],
      ['X99.04', 'X99-VH-CM-01', 'Công chức', '', 1600, '', 'UBND xã X99', 'Quyết định phân công', 'Đã kiểm chứng', '', '']]);
    var d2 = [];
    var yr = function (vt, y, g, f, h, st, n) { d2.push([vt, y, '', 1, 1, f || '', g || 0, h || 'Giữ ổn định', st || 'Đang xây dựng', '', '', '', '', n || '']); };
    [2027, 2028, 2029, 2030, 2031].forEach(function (y) { yr('X99-VP-LDQL-01', y); });
    [2027, 2028, 2029].forEach(function (y) { yr('X99-VP-CM-01', y); });
    [2027, 2028, 2029, 2030, 2031].forEach(function (y) { if (y === 2027) yr('X99-VP-CM-02', y, 1, '', '', 'Đang xây dựng'); else yr('X99-VP-CM-02', y); });
    [2027, 2028, 2029, 2030, 2031].forEach(function (y) { yr('X99-VH-CM-01', y, 0, '', '', y === 2027 ? 'Đã được quyết định' : 'Đang xây dựng'); });
    add('10. D2_PhuongAn', 'Biểu D2_Phương án', ['Mã VTVL', 'Năm', 'Số người cần bố trí trong năm phương án', 'Số người có thể bố trí (cùng đơn vị tính)', 'Biên chế được giao theo đúng cấp', 'Điều chuyển/bố trí lại', 'Đề nghị điều chỉnh', 'Nguồn/giải trình', 'Trạng thái', 'Cảnh báo', 'PP2: người quy đổi (tham khảo)', 'Người cần bố trí C3 năm cơ sở (tham khảo)', 'Kiểm soát cơ sở đối chiếu', 'Văn bản thẩm định/quyết định (số, ngày, cơ quan)'], d2);
    add('11. DM_SAN_PHAM', 'Danh mục sản phẩm', ['Mã sản phẩm chuẩn', 'Tên/loại sản phẩm', 'Khối/ngành/lĩnh vực', 'Nhóm I–VI (nếu áp dụng)', 'Phút/SP chuẩn', 'Văn bản/nguồn xác nhận', 'Trạng thái', 'Cơ quan xác nhận', 'Ngày hiệu lực', 'Phạm vi áp dụng/ghi chú'],
      [1, 2, 3, 4, 5, 6].map(function (i) { return ['X99-SP-00' + i, 'Sản phẩm ' + i, 'Chính quyền', 'Không phân nhóm', '', '', 'Đang kiểm chứng', '', '', '']; }));
    return wb;
  }
  function loadSample() {
    if (typeof XLSX === 'undefined') { $('groups').innerHTML = '<div class="empty">Chưa tải được thư viện đọc Excel. Kiểm tra kết nối mạng hoặc dùng bản offline.</div>'; return; }
    var res = E.runChecks([{ name: 'X99_K2526_v1_05112026.xlsx', wb: buildSample() }]);
    state.sample = true; state.res = res; state.names = ['X99_K2526_v1_05112026.xlsx']; state.sizes = {};
    render();
  }

  // ---------- sự kiện ----------
  var drop = $('drop');
  $('pickBtn').addEventListener('click', function () { $('fileInput').click(); });
  $('fileInput').addEventListener('change', function (e) { handleFiles(e.target.files); });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files); });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); });
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (b) { b.addEventListener('click', function () { selectTab(b.getAttribute('data-tab')); }); });
  $('sheetSel').addEventListener('change', function (e) { state.sheet = e.target.value; renderIssues(); });
  $('fileSel').addEventListener('change', function (e) { state.file = e.target.value; renderIssues(); });
  var qT; $('q').addEventListener('input', function (e) { clearTimeout(qT); qT = setTimeout(function () { state.q = e.target.value; renderIssues(); }, 200); });
  $('vtOnly').addEventListener('change', renderVtvl);
  var vT; $('vtQ').addEventListener('input', function () { clearTimeout(vT); vT = setTimeout(renderVtvl, 200); });
  $('exportBtn').addEventListener('click', doExport);
  $('modeNote').textContent = MODE === 'offline' ? 'Bản offline: mở được khi không có mạng.' : 'Không gửi dữ liệu lên máy chủ.';

  milestones();
  loadSample();
})();
