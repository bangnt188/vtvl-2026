/* Vị trí việc làm 360 · bản web 1.3.0 (02/11/2026). Tệp dựng tự động bằng build-web.js; sửa ở nguồn rồi dựng lại. */

(() => {
  'use strict';
  // ---------- hằng số và hợp đồng tệp ----------
  const APP = 'Bấm giờ công việc 1.2.1';
  const XLSX_URL = (document.currentScript && document.currentScript.getAttribute('data-xlsx')) ||
    'lib/xlsx-0.18.5.full.min.js';
  const KY_DEFAULT = '01/10/2025–30/9/2026';
  const H_B1 = ['STT', 'Mã VTVL', 'Tên VTVL', 'Mã công việc', 'Tên công việc', 'Sản phẩm', 'ĐVT', 'Gợi ý nguồn số liệu',
    'Số sản phẩm trong kỳ (nhập)', 'Nguồn số liệu (nhập)', 'Phút/SP tính từ phiếu đo (công thức)', 'Phút/SP nhập tay nếu không đo',
    'Người xác nhận', 'Ghi chú'];
  const H_DO = ['Mã công việc', 'Lần đo', 'Ngày', 'Giờ bắt đầu (hh:mm)', 'Giờ kết thúc (hh:mm)', 'Số sản phẩm làm được', 'Phút/SP',
    'Người đo (chức danh, không cần họ tên)'];
  const H_TT = ['Mã đơn vị', 'Mã VTVL', 'Người đo (chức danh)', 'Thời điểm xuất', 'Nguồn'];
  const NEED = ['Mã VTVL', 'Mã công việc', 'Tên công việc'];
  // Phiếu 1.4 (SPEC_GOIY G3): ba cột gợi ý ngay sau "Gợi ý nguồn số liệu"; phiếu cũ không có thì trang chạy như bản 1.0
  const H_GOIY = ['Gợi ý phút/SP', 'Căn cứ gợi ý', 'Gợi ý số SP/năm'];
  // Phiếu điền sẵn (bản 1.4.2 trở đi, SPEC_GOIY_DIEN_SAN E7): ô nhập đã có gợi ý; ba cột “… ban đầu” giữ giá trị gợi ý để đối chiếu.
  // Cột nhận theo tiêu đề như bộ nạp: bỏ phần “(…)” cuối, chữ thường.
  const K_BD = ['gợi ý phút/sp ban đầu', 'gợi ý số sp ban đầu', 'gợi ý nguồn ban đầu'];
  const K_BD_NEED = ['mã vtvl', 'mã công việc', 'tên công việc', 'số sản phẩm trong kỳ', 'nguồn số liệu', 'phút/sp tính từ phiếu đo',
    'phút/sp nhập tay nếu không đo', 'người xác nhận'].concat(K_BD);
  const H_BD = ['STT', 'Mã VTVL', 'Tên VTVL', 'Mã công việc', 'Tên công việc', 'Sản phẩm', 'ĐVT', 'Số sản phẩm trong kỳ (nhập)',
    'Nguồn số liệu (nhập)', 'Phút/SP tính từ phiếu đo (công thức)', 'Phút/SP nhập tay nếu không đo', 'Căn cứ gợi ý', 'Người xác nhận', 'Ghi chú',
    'Gợi ý phút/SP ban đầu (để đối chiếu, không sửa)', 'Gợi ý số SP ban đầu (để đối chiếu, không sửa)', 'Gợi ý nguồn ban đầu (để đối chiếu, không sửa)'];
  const HKEY_TAIL = / *\([^()]*\) *$/;
  const hkey = v => (typeof v === 'string' ? v.replace(HKEY_TAIL, '').toLowerCase().replace(/^ +| +$/g, '') : null);
  const NOT_PP2 = 'Vị trí tính theo';
  const TAG_GOIY = 'gợi ý – chưa đo';
  const NOTE_EST = 'Phút/SP nhập tay là ước lượng của người thực hiện';
  const NOTE_GOIY = 'Phút/SP nhập tay theo gợi ý của phiếu, chưa đo thực tế';
  const WS_RE = new RegExp('[' + [0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x85, 0xa0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff].map(c => String.fromCharCode(c)).join('') + ']+', 'g'); // khoảng trắng như bộ nạp Python

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pad = n => String(n).padStart(2, '0');
  const nf = (x, d = 1) => Number(x).toLocaleString('vi-VN', { maximumFractionDigits: d });
  const clean = v => typeof v === 'string' ? v.normalize('NFC').replace(WS_RE, ' ').trim() : '';
  const fold = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const uerr = msg => Object.assign(new Error(msg), { user: true });

  // ---------- lưu tạm trên máy (localStorage, luôn bọc try/catch) ----------
  const LS = 'bamgio:v1:';
  const store = {
    get(k) { try { const s = localStorage.getItem(LS + k); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    wipe() {
      try {
        const ks = [];
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('bamgio:') === 0) ks.push(k); }
        ks.forEach(k => localStorage.removeItem(k));
        return true;
      } catch (e) { return false; }
    }
  };
  let storageOk = (() => { try { localStorage.setItem(LS + 'probe', '1'); localStorage.removeItem(LS + 'probe'); return true; } catch (e) { return false; } })();

  // ---------- thư viện đọc, ghi Excel: tải ngay khi mở trang, dùng lại khi mất mạng ----------
  let libP = null;
  function lib() {
    if (window.XLSX && window.XLSX.read) return Promise.resolve(window.XLSX);
    if (libP) return libP;
    libP = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      const fail = () => { libP = null; s.remove(); reject(uerr('Chưa tải được bộ đọc tệp Excel. Kiểm tra kết nối mạng rồi thử lại.')); };
      s.src = XLSX_URL; s.async = true;
      s.onload = () => (window.XLSX && window.XLSX.read ? resolve(window.XLSX) : fail());
      s.onerror = fail;
      document.head.appendChild(s);
    });
    return libP;
  }
  let dlP = null;
  try { if (window.claude && typeof window.claude.use === 'function') dlP = Promise.resolve(window.claude.use('downloads')).catch(() => null); } catch (e) { dlP = null; }

  // ---------- trạng thái ----------
  const S = { form: null, pos: null, rec: null, open: null, filter: 'all', q: '', dlg: null, delAsk: null, timerId: 0, timeOpen: new Set() };
  const EMPTY = Object.freeze({ sp: '', src: '', conf: '', est: '', meas: Object.freeze([]) });
  const jr = code => (S.rec && S.rec.jobs[code]) || EMPTY;
  function jw(code) {
    let x = S.rec.jobs[code];
    if (!x) x = S.rec.jobs[code] = { sp: '', src: '', conf: '', est: '', meas: [] };
    return x;
  }
  const isSchool = () => !!(S.form && S.form.prefix.indexOf('SGDDT-') === 0);
  const jobOf = code => (S.pos && S.pos.jobs.find(j => j.code === code)) || null;
  // gợi ý của phiếu 1.4: ô giữ đúng giá trị gợi ý thì gắn nhãn "gợi ý – chưa đo" (bước 4 nhận ra theo cùng phép so sánh)
  const hasGoiy = () => !!(S.form && S.form.goiy);
  const isBd = () => !!(S.form && S.form.bd);
  const noPP2Job = j => clean(j.gb).indexOf(NOT_PP2) === 0;
  const posNoPP2 = () => !!(hasGoiy() && S.pos && S.pos.jobs.length && S.pos.jobs.every(noPP2Job));
  const posHasGoiy = () => !!(hasGoiy() && S.pos && S.pos.jobs.some(j => j.gm != null || j.gn != null));
  const numStr = v => String(v).replace('.', ',');
  const spTag = (j, x) => j.gn != null && parseIntVN(x.sp).v === j.gn;
  const estTag = (j, x) => j.gm != null && !x.meas.length && parseDecVN(x.est).v === j.gm;
  const srcTag = (j, x) => !!j.gs && clean(x.src) === j.gs; // phiếu điền sẵn: nguồn còn đúng “Gợi ý nguồn ban đầu”
  function fillGoiy(j, x, onlyEmpty) { // điền gợi ý vào ô số SP và ô phút/SP nhập tay; trả về số ô đã đổi
    let n = 0;
    if (j.gn != null && (!onlyEmpty || !clean(x.sp)) && parseIntVN(x.sp).v !== j.gn) { x.sp = String(j.gn); n++; }
    if (j.gm != null && (!onlyEmpty || (!clean(x.est) && !x.meas.length)) && parseDecVN(x.est).v !== j.gm) { x.est = numStr(j.gm); n++; }
    return n;
  }

  // ---------- số kiểu Việt Nam ----------
  function parseIntVN(s) { // số nguyên ≥ 0; nhận 1200, 1.200, 1 200
    const t = String(s == null ? '' : s).trim().replace(/\s/g, '');
    if (!t) return { empty: true };
    if (/^\d+$/.test(t)) return { v: Number(t) };
    if (/^\d{1,3}(\.\d{3})+$/.test(t) || /^\d{1,3}(,\d{3})+$/.test(t)) return { v: Number(t.replace(/[.,]/g, '')) };
    return { bad: true };
  }
  function parseDecVN(s) { // số thập phân ≥ 0; nhận 2,5 hoặc 2.5; 1.200 là một nghìn hai trăm
    const t = String(s == null ? '' : s).trim().replace(/\s/g, '');
    if (!t) return { empty: true };
    if (/^\d+$/.test(t)) return { v: Number(t) };
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) return { v: Number(t.replace(/\./g, '').replace(',', '.')) };
    if (/^\d*[.,]\d+$/.test(t)) return { v: Number(t.replace(',', '.')) };
    return { bad: true };
  }
  // Phút/SP của một lần đo, đúng công thức của phiếu: ROUND((kết thúc − bắt đầu) × 1440 / số SP, 1)
  function excelRound(x, d) { const f = Math.pow(10, d); const r = Math.floor(Math.abs(x) * f + 0.5 + 1e-9) / f; return x < 0 ? -r : r; }
  const rowMin = m => (m.n > 0 ? excelRound((m.e / 86400 - m.s / 86400) * 1440 / m.n, 1) : null);
  const sortMeas = list => list.slice().sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.s - b.s));
  function meanMin(list) {
    const xs = sortMeas(list).map(rowMin).filter(v => v != null);
    if (!xs.length) return null;
    let t = 0;
    for (const x of xs) t += x;
    return t / xs.length;
  }

  // ---------- ngày giờ ----------
  const isoOf = ms => { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const sodOf = ms => { const d = new Date(ms); return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(); };
  const hm = sec => { sec = Math.floor(sec) % 86400; return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec % 3600 / 60)); };
  function clockStr(ms) {
    const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
    return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s);
  }
  function durStr(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (h) return h + ' giờ ' + pad(m) + ' phút';
    if (m) return m + ' phút' + (s ? ' ' + s + ' giây' : '');
    return s + ' giây';
  }
  const dm = iso => iso.slice(8, 10) + '/' + iso.slice(5, 7);
  const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const wd = iso => WD[new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)).getDay()];
  const serialOf = iso => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(1899, 11, 30)) / 86400000);
  const stampOf = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  const ddmmyyyy = d => pad(d.getDate()) + pad(d.getMonth() + 1) + d.getFullYear();
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- không ghi họ tên, số định danh ----------
  function looksLikeName(s) {
    const toks = s.split(' ');
    if (toks.length < 2 || toks.length > 5 || /\d/.test(s)) return false;
    return toks.every(t => /^\p{Lu}[\p{Ll}\p{M}]*$/u.test(t));
  }
  const looksLikeId = s => /^[0-9]{9,12}$/.test(s.replace(WS_RE, ''));
  const personLike = v => { const s = clean(v); return !!s && (looksLikeName(s) || looksLikeId(s)); };

  // ---------- đọc phiếu (SheetJS, chỉ đọc giá trị) ----------
  function unitOf(code) {
    const parts = code.split('-');
    if (code.indexOf('SGDDT-') === 0 && parts.length > 2) return { unit: parts[1], prefix: 'SGDDT-' + parts[1] + '-' };
    return { unit: parts[0], prefix: parts[0] + '-' };
  }
  function suggestion(hint) {
    const h = clean(hint);
    if (!h) return { src: '', note: '', time: '' };
    const k = h.indexOf('| Thời gian:');
    const srcPart = clean(k >= 0 ? h.slice(0, k) : h), time = k >= 0 ? clean(h.slice(k + 12)) : '';
    const sc = srcPart.indexOf(';');
    return { src: clean(sc >= 0 ? srcPart.slice(0, sc) : srcPart), note: sc >= 0 ? clean(srcPart.slice(sc + 1)) : '', time };
  }
  function parseForm(X, buf, fileName) {
    let wb;
    try {
      wb = X.read(buf, { type: 'array', sheets: ['Phieu_B1', 'Huong_dan'], cellText: false, cellHTML: false, cellFormula: false, cellNF: false });
    } catch (e) { throw uerr('Không đọc được tệp này như một tệp Excel (.xlsx). Hãy chọn đúng phiếu thu số liệu đầu mối gửi.'); }
    const names = wb.SheetNames || [];
    const ws = wb.Sheets.Phieu_B1;
    if (!ws) {
      if (names.some(n => /B1_KhoiLuong/.test(n))) throw uerr('Đây là tệp đơn vị (có biểu 3. B1_KhoiLuong), không phải phiếu. Hãy mở tệp Phieu_thu_so_lieu_….xlsx mà đầu mối gửi.');
      throw uerr('Tệp không có trang Phieu_B1 nên không phải phiếu thu số liệu. Hãy mở tệp Phieu_thu_so_lieu_….xlsx mà đầu mối gửi.');
    }
    if (!ws['!ref']) throw uerr('Trang Phieu_B1 của tệp đang trống.');
    const rg = X.utils.decode_range(ws['!ref']);
    const get = (r, c) => { const x = ws[X.utils.encode_cell({ r, c })]; return x ? (typeof x.v === 'string' ? clean(x.v) || null : (x.v == null ? null : x.v)) : null; };
    let hr = -1, col = null;
    for (let r = rg.s.r; r <= Math.min(rg.e.r, rg.s.r + 30) && hr < 0; r++) {
      const m = {};
      for (let c = rg.s.c; c <= rg.e.c; c++) { const v = get(r, c); if (typeof v === 'string' && !(v in m)) m[v] = c; }
      if ('Mã công việc' in m && 'Mã VTVL' in m) { hr = r; col = m; }
    }
    if (hr < 0) throw uerr('Không thấy dòng tiêu đề có “Mã VTVL” và “Mã công việc” ở trang Phieu_B1.');
    const miss = NEED.filter(h => !(h in col));
    if (miss.length) throw uerr('Trang Phieu_B1 thiếu cột ' + miss.join(', ') + '.');
    const opt = (r, h) => (h in col ? get(r, col[h]) : null);
    const str = v => (v == null ? '' : String(v));
    const ck = {}; // tiêu đề chuẩn hóa -> cột (như bộ nạp)
    Object.keys(col).forEach(h => { const k = hkey(h); if (k && !(k in ck)) ck[k] = col[h]; });
    const bd = K_BD.every(k => k in ck); // phiếu điền sẵn 1.4.2 trở đi
    const goiy = H_GOIY.every(h => h in col) || bd;
    const known = H_B1.concat(goiy && !bd ? H_GOIY : []);
    // thứ tự cột của phiếu đầy đủ, để phiếu một người giữ đúng tên và thứ tự cột
    const order = Object.keys(col).filter(h => known.indexOf(h) >= 0).sort((a, b) => col[a] - col[b]);
    let cols = H_B1.every(h => order.indexOf(h) >= 0) ? order : null;
    if (bd) { // giữ đúng tên, thứ tự cột của phiếu, kể cả “Căn cứ gợi ý” và ba cột “… ban đầu”
      const KN = new Set(H_BD.map(hkey)), seen = new Set();
      const ord = Object.keys(col).filter(h => { const k = hkey(h); return KN.has(k) && ck[k] === col[h] && !seen.has(k) && seen.add(k); }).sort((a, b) => col[a] - col[b]);
      cols = K_BD_NEED.every(k => ord.some(h => hkey(h) === k)) ? ord : null;
    }
    const numOf = v => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' ? (parseDecVN(v).v != null ? parseDecVN(v).v : null) : null);
    const map = new Map();
    let unit = null, prefix = null, foreign = 0, nJobs = 0;
    for (let r = hr + 1; r <= rg.e.r; r++) {
      const code = get(r, col['Mã công việc']), vt = get(r, col['Mã VTVL']);
      if (typeof code !== 'string' || typeof vt !== 'string') continue;
      if (!unit) ({ unit, prefix } = unitOf(vt));
      if (vt.indexOf(prefix) !== 0 || code.indexOf(prefix) !== 0) { foreign++; continue; }
      let p = map.get(vt);
      if (!p) { p = { code: vt, name: '', jobs: [], seen: {} }; map.set(vt, p); }
      if (!p.name) p.name = str(opt(r, 'Tên VTVL'));
      if (p.seen[code]) continue;
      p.seen[code] = 1;
      const stt = opt(r, 'STT');
      const job = { stt: typeof stt === 'number' || typeof stt === 'string' ? stt : null, code, name: str(opt(r, 'Tên công việc')),
        product: str(opt(r, 'Sản phẩm')), dvt: str(opt(r, 'ĐVT')), hint: str(opt(r, 'Gợi ý nguồn số liệu')) };
      if (bd) {
        const at = k => (k in ck ? get(r, ck[k]) : null);
        const gmRaw = at('gợi ý phút/sp ban đầu'), gnRaw = at('gợi ý số sp ban đầu'), gsRaw = at('gợi ý nguồn ban đầu');
        job.gmRaw = typeof gmRaw === 'number' || typeof gmRaw === 'string' ? gmRaw : null;
        job.gnRaw = typeof gnRaw === 'number' || typeof gnRaw === 'string' ? gnRaw : null;
        job.gsRaw = typeof gsRaw === 'number' || typeof gsRaw === 'string' ? gsRaw : null;
        const gm = numOf(gmRaw), gn = numOf(gnRaw);
        job.gm = gm != null && gm >= 0 ? gm : null;
        job.gn = gn != null && gn >= 0 && Number.isInteger(gn) ? gn : null;
        job.gs = job.gsRaw == null ? '' : clean(String(job.gsRaw));
        job.gb = str(at('căn cứ gợi ý'));
        job.hint = job.gs; // nút “Dùng gợi ý của phiếu” của ô nguồn trả về nguồn ban đầu
        job.note = str(at('ghi chú'));
        // giá trị đang có trong phiếu (gợi ý điền sẵn, hoặc đầu mối đã sửa): điểm xuất phát của hồ sơ trên máy
        const v0 = v => (v == null ? '' : typeof v === 'number' ? numStr(v) : String(v));
        job.v0 = { sp: v0(at('số sản phẩm trong kỳ')), src: v0(at('nguồn số liệu')), est: v0(at('phút/sp nhập tay nếu không đo')), conf: v0(at('người xác nhận')) };
      } else if (goiy) {
        const gmRaw = opt(r, 'Gợi ý phút/SP'), gnRaw = opt(r, 'Gợi ý số SP/năm');
        job.gmRaw = typeof gmRaw === 'number' || typeof gmRaw === 'string' ? gmRaw : null;
        job.gnRaw = typeof gnRaw === 'number' || typeof gnRaw === 'string' ? gnRaw : null;
        const gm = numOf(gmRaw), gn = numOf(gnRaw);
        job.gm = gm != null && gm >= 0 ? gm : null;
        job.gn = gn != null && gn >= 0 && Number.isInteger(gn) ? gn : null;
        job.gb = str(opt(r, 'Căn cứ gợi ý'));
      }
      p.jobs.push(job);
      nJobs++;
    }
    if (!nJobs) { // Tạo tệp 1.5.2: phiếu của vị trí không có dòng (tính chung khối lượng với vị trí khác, hoặc chưa có công việc)
      const a2 = ws.A2 && typeof ws.A2.v === 'string' ? clean(ws.A2.v) : '';
      const MARK = 'không có dòng khối lượng.', k = a2.indexOf(MARK), note = k >= 0 ? clean(a2.slice(k + MARK.length)) : '';
      throw uerr('Phiếu không có dòng khối lượng' + (note ? ': ' + note : ' (trang Phieu_B1 chưa có công việc nào có mã).') +
        ' Không có việc nào để bấm giờ ở phiếu này.');
    }
    if (unit === 'XXX' || unit === 'THCSTHPT') throw uerr('Phiếu này còn mã mẫu chung (' + prefix + '…). Đầu mối cần tạo phiếu riêng cho đơn vị ở bước 3 của Tạo tệp đơn vị rồi gửi lại.');
    let unitName = '', ky = KY_DEFAULT;
    const hd = wb.Sheets.Huong_dan;
    if (hd) {
      const b2 = hd.B2 && clean(String(hd.B2.v == null ? '' : hd.B2.v));
      if (b2 && !/^Mẫu chung/i.test(b2)) unitName = b2;
      const b3 = hd.B3 && clean(String(hd.B3.v == null ? '' : hd.B3.v));
      if (b3 && /\d{1,2}\/\d{1,2}\/\d{4}/.test(b3)) ky = b3;
    }
    const positions = Array.from(map.values()).map(p => ({ code: p.code, name: p.name, jobs: p.jobs }));
    return { v: 1, unit, prefix, unitName, ky, fileName: String(fileName || ''), loadedAt: Date.now(), foreign, goiy, bd, cols, positions };
  }

  // ---------- hồ sơ theo đơn vị + vị trí ----------
  const recKey = (unit, vt) => 'rec:' + unit + ':' + vt;
  function loadRec(unit, vt) {
    const r = store.get(recKey(unit, vt));
    const out = { v: 1, unit, vtvl: vt, who: '', jobs: {}, timer: null, exportedAt: 0, exportSig: '', updatedAt: 0 };
    if (r && r.v === 1 && r.jobs && typeof r.jobs === 'object') {
      out.who = typeof r.who === 'string' ? r.who : '';
      Object.keys(r.jobs).forEach(k => {
        const x = r.jobs[k] || {};
        const meas = Array.isArray(x.meas) ? x.meas.filter(m => m && typeof m.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.d) &&
          Number.isFinite(m.s) && Number.isFinite(m.e) && Number.isFinite(m.n)) : [];
        out.jobs[k] = { sp: String(x.sp || ''), src: String(x.src || ''), conf: String(x.conf || ''), est: String(x.est || ''), meas };
        const z = x.s0;
        if (z && typeof z === 'object') out.jobs[k].s0 = { sp: String(z.sp || ''), src: String(z.src || ''), conf: String(z.conf || ''), est: String(z.est || '') };
      });
      const t = r.timer;
      if (t && typeof t.code === 'string' && Number.isFinite(t.start)) out.timer = { code: t.code, start: t.start, end: Number.isFinite(t.end) ? t.end : null };
      out.exportedAt = Number.isFinite(r.exportedAt) ? r.exportedAt : 0;
      out.exportSig = typeof r.exportSig === 'string' ? r.exportSig : '';
    } else {
      out.who = String(store.get('who') || '');
    }
    return out;
  }
  // Phiếu điền sẵn: hồ sơ trên máy bắt đầu từ giá trị trong phiếu; việc người dùng chưa sửa thì theo phiếu mở sau cùng
  function seedRec(rec, p) {
    if (!isBd() || !rec || !p) return false;
    const same = (a, b) => a.sp === b.sp && a.src === b.src && a.est === b.est && a.conf === b.conf;
    let ch = false;
    p.jobs.forEach(j => {
      const v = j.v0;
      if (!v) return;
      const x = rec.jobs[j.code];
      if (!x) { rec.jobs[j.code] = { sp: v.sp, src: v.src, conf: v.conf, est: v.est, meas: [], s0: Object.assign({}, v) }; ch = true; }
      else if (x.s0 && !x.meas.length && same(x, x.s0) && !same(x, v)) {
        x.sp = v.sp; x.src = v.src; x.conf = v.conf; x.est = v.est; x.s0 = Object.assign({}, v); ch = true;
      }
    });
    return ch;
  }
  let saveT = 0;
  function flush() {
    clearTimeout(saveT); saveT = 0;
    if (!S.rec) return;
    S.rec.updatedAt = Date.now();
    if (!store.set(recKey(S.rec.unit, S.rec.vtvl), S.rec) && storageOk) { storageOk = false; $('storeNote').hidden = false; }
  }
  const persist = () => { clearTimeout(saveT); saveT = setTimeout(flush, 300); };
  function hasData(code) {
    const x = jr(code), t = S.rec && S.rec.timer;
    if (isBd()) { // phiếu điền sẵn: ô còn đúng gợi ý chưa phải số liệu của người dùng
      const j = jobOf(code);
      if (j) return !!(x.meas.length || (t && t.code === code) || clean(x.conf) || (clean(x.sp) && !spTag(j, x)) ||
        (clean(x.src) && !srcTag(j, x)) || (clean(x.est) && !(j.gm != null && parseDecVN(x.est).v === j.gm)));
    }
    return !!(clean(x.sp) || clean(x.src) || clean(x.conf) || clean(x.est) || x.meas.length || (t && t.code === code));
  }
  function dataSig() {
    const out = { who: clean(S.rec.who), jobs: [] };
    S.pos.jobs.forEach(j => {
      const x = jr(j.code);
      if (!hasData(j.code)) return;
      out.jobs.push([j.code, clean(x.sp), clean(x.src), clean(x.conf), clean(x.est), sortMeas(x.meas).map(m => [m.d, m.s, m.e, m.n])]);
    });
    return JSON.stringify(out);
  }

  // ---------- hiển thị ----------
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 4200);
  }
  function renderForm() {
    const f = S.form;
    $('how').hidden = !!f; $('pickBox').hidden = !!f; $('unitBox').hidden = !f; $('s2').hidden = !f; $('keep').hidden = !f;
    $('loadErr').innerHTML = '';
    if (!f) return;
    const n = f.positions.reduce((a, p) => a + p.jobs.length, 0);
    $('unitCode').textContent = f.unit;
    $('unitName').textContent = f.unitName || 'Đơn vị mã ' + f.unit;
    $('unitFacts').textContent = f.positions.length + ' vị trí · ' + nf(n, 0) + ' công việc · kỳ ' + f.ky;
    const at = new Date(f.loadedAt);
    $('unitFile').textContent = f.fileName + ' · mở lúc ' + pad(at.getHours()) + ':' + pad(at.getMinutes()) + ' ' + pad(at.getDate()) + '/' + pad(at.getMonth() + 1);
    $('pos').innerHTML = '<option value="">Chọn vị trí của bạn…</option>' + f.positions.map(p =>
      '<option value="' + esc(p.code) + '">' + esc(p.code) + ' · ' + esc(p.name) + ' (' + p.jobs.length + ' việc)</option>').join('');
    $('pos').value = S.pos ? S.pos.code : '';
  }
  function renderPos() {
    const has = !!(S.form && S.pos);
    $('s3').hidden = !has; $('s4').hidden = !has; $('whoBox').hidden = !has;
    if (!has) return;
    $('who').value = S.rec.who || '';
    $('who').placeholder = isSchool() ? 'Ví dụ: Giáo viên THCS' : 'Ví dụ: Văn thư';
    whoWarn();
    $('jobsCount').textContent = S.pos.jobs.length + ' việc';
    const np = posNoPP2();
    $('noPP2').hidden = !np;
    $('s3hint').textContent = (np ? 'Mỗi việc: ghi số sản phẩm cả kỳ và nguồn số liệu.' : 'Mỗi việc: ghi số sản phẩm cả kỳ và nguồn số liệu, rồi bấm giờ khi làm thật.') +
      (isBd() ? ' Phiếu đã điền sẵn gợi ý: ô còn đúng gợi ý mang nhãn “' + TAG_GOIY + '”; sửa theo thực tế thì nhãn mất.' : '') +
      ' Vị trí có nhiều người: thống nhất với đầu mối ai ghi số sản phẩm, để số không lệch khi gộp phiếu.';
    $('goiyBar').hidden = !posHasGoiy() || isBd(); // phiếu điền sẵn: gợi ý đã nằm trong ô
    $('tools').hidden = S.pos.jobs.length < 8;
    $('q').value = S.q;
    document.querySelectorAll('.fchip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === S.filter)));
    renderLists();
  }
  function renderLists() { // gợi ý nhập lại người xác nhận đã ghi ở việc khác
    const conf = new Set();
    S.pos.jobs.forEach(j => { const c = clean(jr(j.code).conf); if (c) conf.add(c); });
    let dc = $('dlConf');
    if (!dc) { dc = document.createElement('datalist'); dc.id = 'dlConf'; document.body.appendChild(dc); }
    dc.innerHTML = Array.from(conf).slice(0, 30).map(v => '<option value="' + esc(v) + '"></option>').join('');
  }
  function whoWarn() { $('whoWarn').hidden = !personLike($('who').value); }

  function ladder(n) {
    let h = '<span class="ladder" role="img" aria-label="' + n + ' lần đo, nên đo 3–5 lần">';
    for (let k = 0; k < 5; k++) h += '<i class="' + (k < 3 ? 'req' : 'opt') + (k < n ? ' on' : '') + '"></i>';
    return h + (n > 5 ? '<small>+' + (n - 5) + '</small>' : '') + '</span>';
  }
  function ladderNote(n) {
    if (!n) return 'Nên đo 3–5 lần, ở những lần làm thật khác nhau.';
    if (n < 3) return 'Đã đo ' + n + ' lần. Nên đo 3–5 lần, còn ' + (3 - n) + ' lần nữa.';
    if (n <= 5) return 'Đã đo ' + n + ' lần, đủ 3–5 lần.';
    return 'Đã đo ' + n + ' lần.';
  }
  function statHtml(j) {
    const x = jr(j.code), t = S.rec.timer, out = [];
    if (t && t.code === j.code) out.push(t.end ? '<span class="chip live">Chờ ghi số sản phẩm</span>'
      : '<span class="chip live"><span class="dot"></span>Đang đo <span data-clock>' + clockStr(Date.now() - t.start) + '</span></span>');
    const sp = parseIntVN(x.sp), est = parseDecVN(x.est), n = x.meas.length;
    if (sp.bad) out.push('<span class="chip bad">Số sản phẩm chưa đúng</span>');
    else if (sp.v != null) out.push(spTag(j, x) ? '<span class="chip est">' + nf(sp.v, 0) + ' ' + esc(j.dvt || 'SP') + ' · ' + TAG_GOIY + '</span>'
      : '<span class="chip on">' + nf(sp.v, 0) + ' ' + esc(j.dvt || 'SP') + '</span>');
    if (n) out.push('<span class="chip on">' + n + ' lần đo · ' + nf(meanMin(x.meas)) + ' phút/SP</span>' + ladder(n));
    else if (est.v != null) out.push(estTag(j, x) ? '<span class="chip est">' + nf(est.v) + ' phút/SP · ' + TAG_GOIY + '</span>'
      : '<span class="chip est">Ước lượng ' + nf(est.v) + ' phút/SP</span>');
    if (!out.length) out.push('<span class="chip">Chưa ghi' + (hasGoiy() && (j.gm != null || j.gn != null) ? ' · có gợi ý' : '') + '</span>');
    return out.join('');
  }
  function echoSp(v, j) {
    const p = parseIntVN(v);
    if (p.bad) return { t: 'Ghi số nguyên, ví dụ 1200 hoặc 1.200.', bad: true };
    return { t: p.v != null ? '= ' + nf(p.v, 0) + ' ' + (j.dvt || 'sản phẩm') + ' trong kỳ' : '', bad: false };
  }
  function echoEst(v, n) {
    const p = parseDecVN(v);
    if (p.bad) return { t: 'Ghi số, ví dụ 15 hoặc 2,5.', bad: true };
    if (p.v == null) return { t: '', bad: false };
    return { t: '= ' + nf(p.v, 2) + ' phút cho một sản phẩm' + (n ? ' (đã có lần đo nên phiếu dùng số đo)' : ''), bad: false };
  }
  function lapsHtml(j, ms) {
    return '<ol class="laps">' + ms.map((m, k) => {
      if (S.delAsk === m.id) {
        return '<li class="lap ask"><span>Xóa lần ' + (k + 1) + ' (' + dm(m.d) + ', ' + hm(m.s) + '–' + hm(m.e) + ')?</span>' +
          '<span class="lap-a"><button type="button" class="btn danger solid" data-act="del-yes" data-id="' + esc(m.id) + '">Xóa</button>' +
          '<button type="button" class="btn" data-act="del-no">Thôi</button></span></li>';
      }
      return '<li class="lap"><span class="lap-l"><span class="lap-k">Lần ' + (k + 1) + ' · ' + wd(m.d) + ' ' + dm(m.d) + ' · ' + durStr(m.e - m.s) + '</span>' +
        '<span class="lap-t">' + hm(m.s) + '–' + hm(m.e) + '</span>' +
        '<span class="lap-r"><b>' + nf(m.n, 2) + '</b> ' + esc(j.dvt || 'SP') + ' · <b>' + nf(rowMin(m)) + '</b> phút/SP</span></span>' +
        '<span class="lap-a"><button type="button" class="btn" data-act="edit" data-id="' + esc(m.id) + '" aria-label="Sửa lần ' + (k + 1) + '">Sửa</button>' +
        '<button type="button" class="btn" data-act="del" data-id="' + esc(m.id) + '" aria-label="Xóa lần ' + (k + 1) + '">Xóa</button></span></li>';
    }).join('') + '</ol>';
  }
  function goiyHtml(j, x) { // khối gợi ý của phiếu 1.4; phiếu không có cột gợi ý thì không hiện gì
    if (!hasGoiy() || !(j.gm != null || j.gn != null || clean(j.gb))) return '';
    const rows = [];
    if (j.gm != null) rows.push('<div><dt>Phút/SP</dt><dd><b>' + nf(j.gm, 2) + '</b> phút' + (j.gm >= 60 ? ' (' + nf(j.gm / 60, 2) + ' giờ)' : '') + '</dd></div>');
    if (j.gn != null) rows.push('<div><dt>Số SP/năm</dt><dd><b>' + nf(j.gn, 0) + '</b> ' + esc(j.dvt || 'sản phẩm') + '</dd></div>');
    if (clean(j.gb)) rows.push('<div><dt>Căn cứ</dt><dd>' + esc(j.gb) + '</dd></div>');
    const can = j.gm != null || j.gn != null;
    return '<div class="goiy">' +
      '<div class="goiy-h"><span class="grp-h">Gợi ý của phiếu</span>' + (can ? goiyBtn(j, x) : '') + '</div>' +
      '<dl>' + rows.join('') + '</dl>' +
      (can ? '<p class="hint soft">Điểm xuất phát để sửa nhanh. Ô giữ nguyên gợi ý được gắn nhãn “' + TAG_GOIY + '”.</p>' : '') +
    '</div>';
  }
  function goiyBtn(j, x) {
    const done = (j.gn == null || parseIntVN(x.sp).v === j.gn) && (j.gm == null || parseDecVN(x.est).v === j.gm);
    return '<button type="button" class="btn small" data-act="use-goiy"' + (done ? ' disabled' : '') + '>' + (done ? 'Đang dùng gợi ý' : 'Dùng gợi ý') + '</button>';
  }
  const tagHtml = (f, on) => '<span class="tag-goiy" data-tag="' + f + '"' + (on ? '' : ' hidden') + '>' + TAG_GOIY + '</span>';
  function bodyHtml(j, i) {
    const x = jr(j.code), t = S.rec.timer, mine = !!(t && t.code === j.code), other = !!(t && !mine);
    const g = suggestion(j.hint), ms = sortMeas(x.meas), n = ms.length, avg = meanMin(x.meas);
    const sp = parseIntVN(x.sp), est = parseDecVN(x.est), e1 = echoSp(x.sp, j), e2 = echoEst(x.est, n);
    const school = isSchool(), gy = hasGoiy();
    let face, btn;
    if (mine) {
      face = '<span class="digits" data-clock>' + clockStr((t.end || Date.now()) - t.start) + '</span>' +
        (t.end ? '<span class="face-s">Chờ ghi số sản phẩm</span>' : '<span class="face-s"><span class="dot"></span>Đang đo</span>');
      btn = t.end ? '<button type="button" class="btn big stop" data-act="pending">Ghi số sản phẩm</button>'
        : '<button type="button" class="btn big stop" data-act="stop">Kết thúc</button>';
    } else {
      face = '<span class="digits">00:00</span><span class="face-s">' + (n ? 'Lần đo thứ ' + (n + 1) : 'Chưa đo lần nào') + '</span>';
      btn = '<button type="button" class="btn big primary" data-act="start"' + (other ? ' disabled' : '') + '>Bắt đầu</button>';
    }
    const watch = '<div class="watch' + (mine ? ' run' : '') + '">' +
        '<div class="watch-h"><span class="grp-h">Bấm giờ</span>' + ladder(n) + '</div>' +
        '<div class="face">' + face + '</div>' + btn +
        (other ? '<p class="hint">Đang bấm giờ một việc khác. <button type="button" class="linkbtn" data-act="goto" data-code="' + esc(t.code) + '">Xem việc đó</button></p>'
          : '<p class="hint">Bấm Bắt đầu khi bắt tay vào việc thật, Kết thúc khi xong; trang sẽ hỏi làm được mấy sản phẩm. Tắt màn hình vẫn tính giờ.</p>') +
        (g.time ? '<p class="hint soft">Phiếu lưu ý về thời gian: ' + esc(g.time) + '</p>' : '') +
        (n ? lapsHtml(j, ms) + '<div class="avg"><span>' + n + ' lần đo · trung bình</span><b>' + nf(avg) + ' phút/SP</b></div>' : '') +
        '<p class="hint' + (n >= 3 ? ' good' : '') + '">' + ladderNote(n) + '</p>' +
        '<button type="button" class="linkbtn" data-act="add">Thêm lần đo đã ghi trên giấy</button>' +
      '</div>';
    const estBox = '<div class="grp">' +
        '<div class="field' + (est.bad ? ' invalid' : '') + '">' +
          '<label for="est-' + i + '">Phút/SP nhập tay <small>(ước lượng, khi không đo được)</small>' + (gy && j.gm != null ? tagHtml('est', estTag(j, x)) : '') + '</label>' +
          '<input type="text" id="est-' + i + '" data-f="est" inputmode="decimal" autocomplete="off" enterkeyhint="done" value="' + esc(x.est) + '">' +
          '<span class="echo' + (e2.bad ? ' bad' : '') + '" data-echo="est">' + esc(e2.t) + '</span>' +
          '<span class="hint">' + (gy && j.gm != null ? 'Phiếu ghi số này là ước lượng của người thực hiện; giữ đúng gợi ý thì ghi là mức tham khảo, chưa đo thực tế.'
            : 'Phiếu ghi số này là ước lượng của người thực hiện.') + ' Đã có lần đo thì đầu mối dùng số đo.</span>' +
        '</div>' +
      '</div>';
    // vị trí không tính theo PP2: phần thời gian thu gọn sẵn, mở ra được
    const timeOpen = S.timeOpen.has(j.code) || mine || n > 0 || !!clean(x.est);
    const timePart = posNoPP2()
      ? '<details class="timebox" data-timebox' + (timeOpen ? ' open' : '') + '><summary><span>Thời gian làm một sản phẩm <small>(không cần với vị trí này)</small></span></summary>' +
        '<div class="timebox-b">' + watch + estBox + '</div></details>'
      : watch + estBox;
    return '' + goiyHtml(j, x) +
      '<div class="grp">' +
        '<div class="grp-h">Số liệu cả kỳ ' + esc(S.form.ky) + '</div>' +
        '<div class="field' + (sp.bad ? ' invalid' : '') + '">' +
          '<label for="sp-' + i + '">Số sản phẩm trong kỳ' + (j.dvt ? ' <small>(' + esc(j.dvt) + ')</small>' : '') + (gy && j.gn != null ? tagHtml('sp', spTag(j, x)) : '') + '</label>' +
          '<input type="text" id="sp-' + i + '" data-f="sp" inputmode="numeric" autocomplete="off" enterkeyhint="next" value="' + esc(x.sp) + '">' +
          '<span class="echo' + (e1.bad ? ' bad' : '') + '" data-echo="sp">' + esc(e1.t) + '</span>' +
          '<span class="hint">Đếm từ sổ sách, phần mềm. Chưa có số thì để trống; chỉ ghi 0 khi chắc chắn không phát sinh.</span>' +
        '</div>' +
        '<div class="field">' +
          '<label for="src-' + i + '">Nguồn số liệu' + (gy && j.gs ? tagHtml('src', srcTag(j, x)) : '') + '</label>' +
          '<textarea id="src-' + i + '" data-f="src" rows="2" autocomplete="off" placeholder="Sổ, phần mềm đã dùng để đếm">' + esc(x.src) + '</textarea>' +
          (g.src ? '<button type="button" class="sugg" data-act="sugg"' + (clean(x.src) === g.src ? ' hidden' : '') + '><b>Dùng gợi ý của phiếu</b><span>' + esc(g.src) + '</span></button>' : '') +
          (g.note ? '<span class="hint soft">Lưu ý: ' + esc(g.note) + '</span>' : '') +
        '</div>' +
        '<div class="field">' +
          '<label for="conf-' + i + '">Người xác nhận <small>(chức danh)</small></label>' +
          '<input type="text" id="conf-' + i + '" data-f="conf" list="dlConf" autocomplete="off" enterkeyhint="done" value="' + esc(x.conf) + '" placeholder="' + (school ? 'Ví dụ: Phó hiệu trưởng' : 'Ví dụ: Chánh Văn phòng') + '">' +
          '<span class="warnline" data-warn="conf"' + (personLike(x.conf) ? '' : ' hidden') + '>Có vẻ là họ tên hoặc số định danh. Chỉ ghi chức danh.</span>' +
        '</div>' +
      '</div>' + timePart;
  }
  const CHEV = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function cardHtml(j) {
    const i = S.pos.jobs.indexOf(j), open = S.open === j.code, t = S.rec.timer, live = !!(t && t.code === j.code);
    const meta = [j.product && 'Sản phẩm: ' + j.product, j.dvt && 'ĐVT: ' + j.dvt].filter(Boolean).join(' · ');
    return '<article class="job' + (open ? ' open' : '') + (live ? ' live' : '') + '" data-code="' + esc(j.code) + '" id="job-' + i + '">' +
      '<button type="button" class="job-h" data-act="toggle" aria-expanded="' + open + '"' + (open ? ' aria-controls="jb-' + i + '"' : '') + '>' +
        '<span class="job-top"><span class="job-code">' + esc(j.code) + '</span>' + CHEV + '</span>' +
        '<span class="job-name">' + esc(j.name || j.code) + '</span>' +
        (meta ? '<span class="job-meta">' + esc(meta) + '</span>' : '') +
        '<span class="job-stat" data-stat>' + statHtml(j) + '</span>' +
      '</button>' +
      (open ? '<div class="job-b" id="jb-' + i + '">' + bodyHtml(j, i) + '</div>' : '') +
    '</article>';
  }
  function visibleJobs() {
    const toks = fold(S.q).split(/\s+/).filter(Boolean);
    return S.pos.jobs.filter(j => {
      const has = hasData(j.code);
      if (S.filter === 'done' && !has) return false;
      if (S.filter === 'todo' && has) return false;
      if (!toks.length) return true;
      const hay = j._f || (j._f = fold([j.code, j.name, j.product, j.dvt].join(' ')));
      return toks.every(t => hay.indexOf(t) >= 0);
    });
  }
  function renderCounts() {
    if (!S.pos) return;
    const done = S.pos.jobs.filter(j => hasData(j.code)).length;
    $('nAll').textContent = S.pos.jobs.length; $('nDone').textContent = done; $('nTodo').textContent = S.pos.jobs.length - done;
  }
  function renderList() {
    if (!S.pos) { $('jobs').innerHTML = ''; return; }
    const vis = visibleJobs();
    $('jobs').innerHTML = vis.length ? vis.map(cardHtml).join('')
      : '<p class="empty">' + (S.q ? 'Không có việc nào khớp “' + esc(S.q) + '”.' : S.filter === 'done' ? 'Chưa ghi việc nào.' : 'Việc nào cũng đã ghi.') + '</p>';
    renderCounts();
  }
  const cardEl = code => document.querySelector('.job[data-code="' + CSS.escape(code) + '"]');
  function refreshCard(code) {
    const el = cardEl(code), j = jobOf(code);
    if (el && j) el.outerHTML = cardHtml(j);
    renderCounts();
  }
  function liveUpdate(code, f, input) { // khi đang gõ: không vẽ lại ô đang nhập
    const card = cardEl(code), j = jobOf(code);
    if (!card || !j) return;
    const x = jr(code);
    if (f === 'sp' || f === 'est') {
      const e = f === 'sp' ? echoSp(x.sp, j) : echoEst(x.est, x.meas.length);
      const echo = card.querySelector('[data-echo="' + f + '"]');
      if (echo) { echo.textContent = e.t; echo.classList.toggle('bad', e.bad); }
      input.closest('.field').classList.toggle('invalid', e.bad);
      const tag = card.querySelector('[data-tag="' + f + '"]');
      if (tag) tag.hidden = !(f === 'sp' ? spTag(j, x) : estTag(j, x));
      const gb = card.querySelector('[data-act="use-goiy"]');
      if (gb) gb.outerHTML = goiyBtn(j, x);
    }
    if (f === 'conf') { const w = card.querySelector('[data-warn="conf"]'); if (w) w.hidden = !personLike(x.conf); }
    if (f === 'src') {
      const b = card.querySelector('[data-act="sugg"]'); if (b) b.hidden = clean(x.src) === suggestion(j.hint).src;
      const tg = card.querySelector('[data-tag="src"]'); if (tg) tg.hidden = !srcTag(j, x);
    }
    const st = card.querySelector('[data-stat]');
    if (st) st.innerHTML = statHtml(j);
    renderCounts();
    scheduleExport();
  }
  function setOpen(code, scroll) {
    const prev = S.open;
    S.open = prev === code ? null : code;
    S.delAsk = null;
    if (prev && prev !== code) refreshCard(prev);
    if (code) refreshCard(code);
    if (scroll && S.open) {
      const el = cardEl(S.open);
      if (el) el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }
  function goto(code) {
    if (!jobOf(code)) return;
    if (!visibleJobs().some(j => j.code === code)) { S.filter = 'all'; S.q = ''; renderPos(); renderList(); }
    if (S.open !== code) setOpen(code, true); else { const el = cardEl(code); if (el) el.scrollIntoView({ block: 'start' }); }
  }

  // ---------- đồng hồ ----------
  function tick() {
    const t = S.rec && S.rec.timer;
    if (!t) return;
    const txt = clockStr((t.end || Date.now()) - t.start);
    document.querySelectorAll('[data-clock]').forEach(el => { if (el.textContent !== txt) el.textContent = txt; });
  }
  function syncTicker() {
    const run = !!(S.rec && S.rec.timer && !S.rec.timer.end);
    if (run && !S.timerId) S.timerId = setInterval(tick, 1000);
    if (!run && S.timerId) { clearInterval(S.timerId); S.timerId = 0; }
    tick();
  }
  function renderDock() {
    const t = S.rec && S.rec.timer, dock = $('dock');
    if (!t) { dock.hidden = true; document.body.classList.remove('has-dock'); document.documentElement.style.setProperty('--dock-h', '0px'); return; }
    const j = jobOf(t.code);
    $('dockJob').textContent = j ? j.name || j.code : t.code;
    const st = $('dockState');
    st.classList.toggle('wait', !!t.end);
    st.innerHTML = t.end ? 'Đã kết thúc, chờ ghi số sản phẩm' : '<span class="dot"></span><span data-clock>' + clockStr(Date.now() - t.start) + '</span>';
    $('dockBtn').textContent = t.end ? 'Ghi số SP' : 'Kết thúc';
    $('dockBtn').dataset.act = t.end ? 'pending' : 'stop';
    dock.hidden = false; document.body.classList.add('has-dock');
    document.documentElement.style.setProperty('--dock-h', dock.offsetHeight + 'px');
  }
  function startTimer(code) {
    if (!S.rec || S.rec.timer) return;
    S.rec.timer = { code, start: Date.now(), end: null };
    flush(); refreshCard(code); renderDock(); syncTicker(); scheduleExport();
  }
  function stopTimer() {
    const t = S.rec && S.rec.timer;
    if (!t) return;
    if (!t.end) { t.end = Date.now(); flush(); refreshCard(t.code); renderDock(); syncTicker(); }
    openDlg('stop');
  }

  // ---------- hộp ghi lần đo ----------
  function fieldSec(v, orig) {
    const m = /^(\d{1,2}):(\d{2})/.exec(v || '');
    if (!m) return null;
    if (orig != null && hm(orig) === pad(+m[1]) + ':' + m[2]) return orig; // giữ cả giây khi không sửa
    return (+m[1]) * 3600 + (+m[2]) * 60;
  }
  function dlgRead() {
    const D = S.dlg, errs = [], warns = [];
    const d = $('dlgDate').value, s = fieldSec($('dlgStart').value, D.s), e = fieldSec($('dlgEnd').value, D.e);
    const nn = parseDecVN($('dlgN').value), today = isoOf(Date.now());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) errs.push({ k: 'date', t: 'Chọn ngày đo.' });
    else if (d > today) errs.push({ k: 'date', t: 'Ngày đo không được sau hôm nay.' });
    else if (d < '2025-10-01') errs.push({ k: 'date', t: 'Ngày đo phải từ 01/10/2025.' });
    if (s == null) errs.push({ k: 'time', t: 'Ghi giờ bắt đầu.' });
    if (e == null) errs.push({ k: 'time', t: 'Ghi giờ kết thúc.' });
    if (s != null && e != null) {
      if (e >= 86400) errs.push({ k: 'midnight', t: 'Lần đo qua nửa đêm. Sửa giờ kết thúc trong cùng ngày, hoặc bỏ lần đo này.' });
      else if (e <= s) errs.push({ k: 'time', t: 'Giờ kết thúc phải sau giờ bắt đầu.' });
      else if (e - s > 4 * 3600) warns.push('Lần đo dài hơn 4 giờ. Nếu quên bấm Kết thúc, hãy sửa giờ kết thúc.');
    }
    if (nn.empty) errs.push({ k: 'n', t: 'Ghi số sản phẩm làm được.' });
    else if (nn.bad || !(nn.v > 0)) errs.push({ k: 'n', t: 'Số sản phẩm phải lớn hơn 0, ví dụ 1 hoặc 2,5.' });
    return { errs, warns, m: { d, s, e, n: nn.v } };
  }
  function dlgCalc() {
    const D = S.dlg;
    if (!D) return;
    const r = dlgRead(), j = jobOf(D.code), unit = (j && j.dvt) || 'sản phẩm', m = r.m;
    const timeOk = m.s != null && m.e != null && m.e > m.s && m.e < 86400;
    $('dlgTime').innerHTML = m.s != null && m.e != null
      ? '<span class="mono">' + hm(m.s) + ' → ' + hm(m.e) + '</span>' + (timeOk ? ' · ' + durStr(m.e - m.s) : '') + (/^\d{4}-\d{2}-\d{2}$/.test(m.d) ? ' · ' + wd(m.d) + ' ' + dm(m.d) : '')
      : 'Ghi giờ bắt đầu, giờ kết thúc ở “Sửa ngày, giờ”.';
    $('dlgCalc').textContent = timeOk && m.n > 0 ? '= ' + nf(rowMin(m)) + ' phút cho mỗi ' + unit : '';
    const shown = r.errs.filter(x => D.tried || x.k === 'midnight');
    $('dlgMsg').innerHTML = shown.map(x => '<p class="e">' + esc(x.t) + '</p>').join('') + r.warns.map(w => '<p class="w">' + esc(w) + '</p>').join('');
    if (shown.some(x => x.k !== 'n')) $('dlgMore').open = true;
    return r;
  }
  function openDlg(mode, code, id) {
    if (!S.rec) return;
    let d, s, e, n = '';
    if (mode === 'stop') {
      const t = S.rec.timer;
      if (!t || !t.end) return;
      code = t.code; d = isoOf(t.start); s = sodOf(t.start); e = s + (Math.floor(t.end / 1000) - Math.floor(t.start / 1000)); n = '1';
    } else if (mode === 'edit') {
      const m = jr(code).meas.find(q => q.id === id);
      if (!m) return;
      d = m.d; s = m.s; e = m.e; n = nf(m.n, 4).replace(/\./g, '');
    } else { d = isoOf(Date.now()); s = null; e = null; }
    const j = jobOf(code);
    S.dlg = { mode, code, id, d, s, e, tried: false, armed: false };
    $('dlgH').textContent = mode === 'stop' ? 'Làm được mấy sản phẩm?' : mode === 'edit' ? 'Sửa lần đo' : 'Thêm lần đo đã ghi trên giấy';
    $('dlgJob').textContent = j ? j.name || j.code : code;
    $('dlgNL').textContent = 'Số ' + ((j && j.dvt) || 'sản phẩm') + ' làm được trong lần này';
    $('dlgN').value = n;
    $('dlgDate').value = d; $('dlgDate').max = isoOf(Date.now());
    $('dlgStart').value = s != null ? hm(s) : ''; $('dlgEnd').value = e != null ? hm(e) : '';
    $('dlgMore').open = mode !== 'stop';
    $('dlgSave').textContent = mode === 'edit' ? 'Lưu thay đổi' : 'Lưu lần đo';
    $('dlgResume').hidden = mode !== 'stop';
    $('dlgCancel').hidden = mode === 'stop';
    $('dlgDiscard').hidden = mode === 'add';
    $('dlgDiscard').textContent = mode === 'stop' ? 'Bỏ lần đo này' : 'Xóa lần đo này';
    dlgCalc();
    const dlg = $('dlg');
    try { if (!dlg.open) dlg.showModal(); } catch (err) { dlg.setAttribute('open', ''); }
    setTimeout(() => { const el = mode === 'add' ? $('dlgStart') : $('dlgN'); try { el.focus(); if (el.select) el.select(); } catch (err) { /* bỏ qua */ } }, 40);
  }
  function closeDlg() { const dlg = $('dlg'); try { dlg.close(); } catch (e) { dlg.removeAttribute('open'); } S.dlg = null; }
  function dlgSave(ev) {
    if (ev) ev.preventDefault();
    const D = S.dlg;
    if (!D) return;
    D.tried = true;
    const r = dlgCalc();
    if (r.errs.length) { const bad = r.errs[0].k; ({ n: $('dlgN'), date: $('dlgDate'), time: $('dlgEnd'), midnight: $('dlgEnd') })[bad].focus(); return; }
    const x = jw(D.code), m = r.m;
    if (D.mode === 'edit') { const q = x.meas.find(z => z.id === D.id); if (q) Object.assign(q, { d: m.d, s: m.s, e: m.e, n: m.n }); }
    else x.meas.push({ id: newId(), d: m.d, s: m.s, e: m.e, n: m.n });
    if (D.mode === 'stop') S.rec.timer = null;
    flush(); closeDlg();
    refreshCard(D.code); renderDock(); syncTicker(); scheduleExport();
    toast(D.mode === 'edit' ? 'Đã sửa lần đo.' : 'Đã lưu lần đo: ' + nf(rowMin(m)) + ' phút/SP.');
  }
  function dlgDiscard() {
    const D = S.dlg;
    if (!D) return;
    if (!D.armed) { D.armed = true; $('dlgDiscard').textContent = D.mode === 'stop' ? 'Bấm lần nữa để bỏ lần đo' : 'Bấm lần nữa để xóa'; return; }
    if (D.mode === 'stop') S.rec.timer = null;
    else { const x = jw(D.code); x.meas = x.meas.filter(q => q.id !== D.id); }
    flush(); closeDlg();
    refreshCard(D.code); renderDock(); syncTicker(); scheduleExport();
    toast(D.mode === 'stop' ? 'Đã bỏ lần đo.' : 'Đã xóa lần đo.');
  }
  function dlgResume() {
    const t = S.rec && S.rec.timer;
    if (!t) return;
    t.end = null; flush(); closeDlg();
    refreshCard(t.code); renderDock(); syncTicker();
  }

  // ---------- xuất phiếu một người ----------
  function stats() {
    const st = { withSp: 0, meas: 0, jobsMeas: 0, minDo: 0, minTay: 0, any: false, badSp: [], badEst: [], noSp: [], noSrc: [], noMin: [], few: [], person: [], keptGm: [], keptGn: [] };
    S.pos.jobs.forEach(j => {
      const x = jr(j.code), sp = parseIntVN(x.sp), est = parseDecVN(x.est), n = x.meas.length, src = clean(x.src);
      if (sp.bad) st.badSp.push(j);
      if (est.bad) st.badEst.push(j);
      if (sp.v != null) st.withSp++;
      if (n) { st.meas += n; st.jobsMeas++; }
      const own = isBd() ? hasData(j.code) : true;
      if (isBd() ? (own || sp.v != null) : (sp.v != null || n || est.v != null || src || clean(x.conf))) st.any = true;
      if (sp.v == null && !sp.bad && (isBd() ? own : (n || est.v != null))) st.noSp.push(j);
      if (sp.v != null) {
        if (n) st.minDo++;
        else if (est.v != null) { st.minTay++; if (estTag(j, x)) st.keptGm.push(j); }
        else if (!(hasGoiy() && noPP2Job(j))) st.noMin.push(j); // vị trí không tính theo PP2: không cần phút/SP
        if (!src) st.noSrc.push(j);
      }
      if (spTag(j, x)) st.keptGn.push(j);
      if (n > 0 && n < 3) st.few.push(j);
      if (personLike(x.conf)) st.person.push(j);
    });
    return st;
  }
  let expT = 0;
  const scheduleExport = () => { clearTimeout(expT); expT = setTimeout(renderExport, 200); };
  function jobLinks(list) {
    const short = s => (s.length > 60 ? s.slice(0, 58) + '…' : s);
    return '<span class="jl">' + list.slice(0, 3).map(j => '<button type="button" class="linkbtn" data-act="goto" data-code="' + esc(j.code) + '">' + esc(short(j.name || j.code)) + '</button>').join('') +
      (list.length > 3 ? '<span class="more">và ' + (list.length - 3) + ' việc khác</span>' : '') + '</span>';
  }
  function renderExport() {
    clearTimeout(expT);
    if (!S.pos || !S.rec) return;
    const st = stats(), p = S.pos, now = new Date(), t = S.rec.timer;
    $('tiles').innerHTML =
      '<div class="tile"><span class="k">Việc có số sản phẩm</span><span class="v">' + st.withSp + '<small style="font-size:15px;color:var(--ink-3);font-weight:500"> / ' + p.jobs.length + '</small></span><span class="s">ghi vào Phieu_B1</span></div>' +
      '<div class="tile"><span class="k">Lần đo</span><span class="v">' + st.meas + '</span><span class="s">ở ' + st.jobsMeas + ' việc</span></div>' +
      '<div class="tile"><span class="k">Phút/SP</span><span class="v">' + st.minDo + ' đo · ' + st.minTay + ' tay</span><span class="s">trên ' + st.withSp + ' việc có số sản phẩm' + (st.keptGm.length ? '; ' + st.keptGm.length + ' theo gợi ý, chưa đo' : '') + '</span></div>';
    const items = [];
    if (st.badSp.length) items.push(['err', 'Số sản phẩm chưa đúng dạng số nguyên. Sửa rồi mới xuất được.', st.badSp]);
    if (st.badEst.length) items.push(['err', 'Phút/SP nhập tay chưa đúng dạng số. Sửa rồi mới xuất được.', st.badEst]);
    if (st.noSp.length) items.push(['warn', 'Đã đo hoặc ước lượng nhưng chưa ghi số sản phẩm cả kỳ: khi nạp, đầu mối không ghi được các việc này.', st.noSp]);
    if (st.noSrc.length) items.push(['warn', 'Chưa ghi nguồn số liệu.', st.noSrc]);
    if (st.noMin.length) items.push(['warn', 'Chưa có phút/SP: chưa đo, chưa ước lượng. Phiếu chỉ ghi số sản phẩm.', st.noMin]);
    if (st.keptGm.length) items.push(['warn', 'Giữ nguyên gợi ý phút/SP, chưa đo thực tế: đầu mối ghi là mức tham khảo và đưa vào danh sách chưa đủ căn cứ. Nên đo bổ sung các việc chiếm nhiều giờ nhất.', st.keptGm]);
    if (st.keptGn.length) items.push(['warn', 'Số sản phẩm đang đúng gợi ý chu kỳ trong tên công việc: đối chiếu sổ sách trước khi gửi.', st.keptGn]);
    if (st.few.length) items.push(['warn', 'Mới đo 1–2 lần. Nên đo 3–5 lần.', st.few]);
    if (st.meas && !clean(S.rec.who)) items.push(['warn', 'Chưa ghi người đo (chức danh) ở bước 2.', []]);
    if (st.person.length || personLike(S.rec.who)) items.push(['warn', 'Có ô giống họ tên hoặc số định danh. Phiếu chỉ ghi chức danh.', st.person]);
    if (t) items.push(['warn', t.end ? 'Có lần đo đã kết thúc nhưng chưa ghi số sản phẩm, nên chưa vào phiếu.' : 'Đang bấm giờ: lần đo đang chạy chưa vào phiếu.', jobOf(t.code) ? [jobOf(t.code)] : []]);
    if (!st.any) items.push(['warn', 'Chưa có số liệu nào để xuất. Mở một công việc ở bước 3 để ghi.', []]);
    else if (!items.length) items.push(['ok', 'Đủ số liệu cho các việc đã ghi. Sẵn sàng xuất.', []]);
    $('checks').innerHTML = items.map(it => '<li class="' + it[0] + '"><span class="h">' + esc(it[1]) + '</span>' + (it[2].length ? jobLinks(it[2]) : '') + '</li>').join('');
    const name = 'Phieu_' + p.code + '_' + ddmmyyyy(now) + '.xlsx';
    const nRows = p.jobs.length;
    $('filePv').innerHTML = '<svg viewBox="0 0 20 22" aria-hidden="true"><path d="M3 1h10l5 5v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.3"/><path d="M6 10l4 6M10 10l-4 6" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round"/></svg>' +
      '<span><span class="mono">' + esc(name) + '</span><small>Phieu_B1: ' + nRows + ' dòng của vị trí · Do_thoi_gian: ' + st.meas + ' lần đo · Thong_tin_tep</small></span>';
    const blocked = !st.any || st.badSp.length > 0 || st.badEst.length > 0;
    $('exportBtn').disabled = blocked;
    const ex = $('exported');
    if (S.rec.exportedAt) {
      const d = new Date(S.rec.exportedAt);
      ex.textContent = 'Đã xuất lúc ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ngày ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
        (S.rec.exportSig && S.rec.exportSig !== dataSig() ? '. Đã sửa số liệu sau lần xuất đó: xuất lại rồi gửi tệp mới cho đầu mối.' : '.');
      ex.hidden = false;
    } else ex.hidden = true;
  }
  function buildBook(X) {
    const f = S.form, p = S.pos, rec = S.rec, now = new Date();
    const who = clean(rec.who), stamp = stampOf(now);
    const put = (ws, r, c, cell) => { ws[X.utils.encode_cell({ r, c })] = cell; };
    const txt = v => ({ t: 's', v: String(v) });
    const num = (v, z) => (z ? { t: 'n', v, z } : { t: 'n', v });
    const rows = [];
    p.jobs.forEach(j => sortMeas(jr(j.code).meas).forEach((m, k) => rows.push({ code: j.code, k: k + 1, m })));
    const last = 3 + Math.max(rows.length, 300);
    // Phieu_B1: chỉ các dòng của vị trí, đúng tên và thứ tự cột của phiếu đầy đủ (phiếu 1.4: kể cả 3 cột gợi ý), tiêu đề ở dòng 3
    const hdrs = Array.isArray(f.cols) && f.cols.length ? f.cols : f.bd ? H_BD : f.goiy ? H_B1.slice(0, 8).concat(H_GOIY, H_B1.slice(8)) : H_B1;
    const L = c => X.utils.encode_col(c);
    const jc = L(hdrs.findIndex(h => hkey(h) === 'mã công việc'));
    const WCH = { 'STT': 5, 'Mã VTVL': 16, 'Tên VTVL': 22, 'Mã công việc': 18, 'Tên công việc': 44, 'Sản phẩm': 28, 'ĐVT': 9,
      'Gợi ý nguồn số liệu': 34, 'Gợi ý phút/SP': 10, 'Căn cứ gợi ý': 34, 'Gợi ý số SP/năm': 10, 'Số sản phẩm trong kỳ (nhập)': 12,
      'Nguồn số liệu (nhập)': 26, 'Phút/SP tính từ phiếu đo (công thức)': 12, 'Phút/SP nhập tay nếu không đo': 12, 'Người xác nhận': 18, 'Ghi chú': 24 };
    const WCHK = { 'gợi ý phút/sp ban đầu': 12, 'gợi ý số sp ban đầu': 12, 'gợi ý nguồn ban đầu': 30 };
    const raw = v => (v == null || v === '' ? null : typeof v === 'number' ? num(v) : txt(v));
    const b1 = {};
    put(b1, 0, 0, txt('Phiếu B1: số sản phẩm trong kỳ và thời gian làm một sản phẩm'));
    put(b1, 1, 0, txt('Phiếu một người – vị trí ' + p.code + (p.name ? ' (' + p.name + ')' : '') + '. Xuất từ trang ' + APP + ' lúc ' + stamp + '. Kỳ ' + f.ky + '.'));
    hdrs.forEach((h, c) => put(b1, 2, c, txt(h)));
    p.jobs.forEach((j, i) => {
      const r = 3 + i, R = r + 1, x = jr(j.code);
      const sp = parseIntVN(x.sp), est = parseDecVN(x.est), avg = meanMin(x.meas);
      const fK = 'IFERROR(AVERAGEIF(Do_thoi_gian!$A$4:$A$' + last + ',' + jc + R + ',Do_thoi_gian!$G$4:$G$' + last + '),"")';
      const val = {
        'STT': raw(j.stt), 'Mã VTVL': txt(p.code), 'Tên VTVL': raw(p.name), 'Mã công việc': txt(j.code), 'Tên công việc': raw(j.name),
        'Sản phẩm': raw(j.product), 'ĐVT': raw(j.dvt), 'Gợi ý nguồn số liệu': raw(j.hint),
        'Gợi ý phút/SP': raw(j.gmRaw), 'Căn cứ gợi ý': raw(j.gb), 'Gợi ý số SP/năm': raw(j.gnRaw), // giữ nguyên để bước 4 nhận ra gợi ý chưa sửa
        'Số sản phẩm trong kỳ (nhập)': sp.v != null ? num(sp.v) : null,
        'Nguồn số liệu (nhập)': raw(clean(x.src)),
        'Phút/SP tính từ phiếu đo (công thức)': avg != null ? { t: 'n', v: avg, f: fK } : { t: 'n', f: fK },
        'Phút/SP nhập tay nếu không đo': est.v != null ? num(est.v) : null,
        'Người xác nhận': raw(clean(x.conf)),
        'Ghi chú': raw([est.v != null ? (estTag(j, x) ? NOTE_GOIY : NOTE_EST) : '', j.note || ''].filter(Boolean).join('. '))
      };
      // phiếu điền sẵn: ba cột “… ban đầu” giữ nguyên giá trị của phiếu để bước 4 nhận ra ô còn đúng gợi ý
      const valK = { 'gợi ý phút/sp ban đầu': raw(j.gmRaw), 'gợi ý số sp ban đầu': raw(j.gnRaw), 'gợi ý nguồn ban đầu': raw(j.gsRaw) };
      hdrs.forEach((h, c) => { const v = h in val ? val[h] : valK[hkey(h)]; if (v) put(b1, r, c, v); });
    });
    const lastCol = L(hdrs.length - 1);
    b1['!ref'] = 'A1:' + lastCol + (3 + p.jobs.length);
    b1['!cols'] = hdrs.map(h => ({ wch: WCH[h] || WCHK[hkey(h)] || 12 }));
    b1['!autofilter'] = { ref: 'A3:' + lastCol + (3 + p.jobs.length) };
    // Do_thoi_gian: mỗi lần đo một dòng; giờ là số thời gian Excel (phần ngày), định dạng hh:mm
    const dt = {};
    put(dt, 0, 0, txt('Phiếu đo thời gian'));
    put(dt, 1, 0, txt('Mỗi lần đo một dòng. Giờ lấy từ đồng hồ điện thoại, lưu đến giây (hiện hh:mm); Phút/SP tính từ giờ đã lưu.'));
    H_DO.forEach((h, c) => put(dt, 2, c, txt(h)));
    rows.forEach((o, i) => {
      const r = 3 + i, R = r + 1, m = o.m;
      put(dt, r, 0, txt(o.code));
      put(dt, r, 1, num(o.k));
      put(dt, r, 2, num(serialOf(m.d), 'dd/mm/yyyy'));
      put(dt, r, 3, num(m.s / 86400, 'hh:mm'));
      put(dt, r, 4, num(m.e / 86400, 'hh:mm'));
      put(dt, r, 5, num(m.n));
      put(dt, r, 6, { t: 'n', v: rowMin(m), f: 'IF(OR(D' + R + '="",E' + R + '="",F' + R + '=""),"",IFERROR(ROUND((E' + R + '-D' + R + ')*1440/F' + R + ',1),""))' });
      if (who) put(dt, r, 7, txt(who));
    });
    dt['!ref'] = 'A1:H' + Math.max(3, 3 + rows.length);
    dt['!cols'] = [20, 8, 12, 12, 12, 12, 10, 34].map(w => ({ wch: w }));
    if (rows.length) dt['!autofilter'] = { ref: 'A3:H' + (3 + rows.length) };
    // Thong_tin_tep
    const tt = {};
    put(tt, 0, 0, txt('Thông tin tệp'));
    put(tt, 1, 0, txt('Phiếu một người, xuất từ trang ' + APP + '. Không có họ tên, số định danh.'));
    H_TT.forEach((h, c) => put(tt, 2, c, txt(h)));
    put(tt, 3, 0, txt(f.unit));
    put(tt, 3, 1, txt(p.code));
    if (who) put(tt, 3, 2, txt(who));
    put(tt, 3, 3, txt(stamp));
    put(tt, 3, 4, txt(APP));
    tt['!ref'] = 'A1:E4';
    tt['!cols'] = [14, 22, 26, 18, 24].map(w => ({ wch: w }));
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, b1, 'Phieu_B1');
    X.utils.book_append_sheet(wb, dt, 'Do_thoi_gian');
    X.utils.book_append_sheet(wb, tt, 'Thong_tin_tep');
    wb.Props = { Title: 'Phiếu một người ' + p.code, Subject: 'Phiếu thu số liệu vị trí việc làm', Author: APP, CreatedDate: now };
    const out = X.write(wb, { bookType: 'xlsx', type: 'array', bookSST: true, compression: true });
    return { name: 'Phieu_' + p.code + '_' + ddmmyyyy(now) + '.xlsx', blob: new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), rows: rows.length };
  }
  async function saveFile(name, blob) {
    let dl = null;
    if (dlP) { try { dl = await dlP; } catch (e) { dl = null; } }
    if (dl) {
      try { await dl.save({ filename: name, data: blob }); toast('Đã lưu ' + name + '. Gửi tệp này cho đầu mối.'); return true; }
      catch (e) {
        const code = e && e.code;
        if (code === 'declined') { toast('Đã hủy lưu tệp.'); return false; }
        if (code === 'rate_limited') { toast('Đang có hộp thoại lưu tệp khác. Thử lại sau giây lát.'); return false; }
      }
    }
    try {
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast('Đã tạo ' + name + '.' + (window.claude ? ' Nếu máy không tải xuống, hãy mở trang này trong claude.ai.' : ' Gửi tệp này cho đầu mối.'));
      return true;
    } catch (e) { toast(window.claude ? 'Chế độ xem này không cho tải tệp. Mở trang trong claude.ai rồi thử lại.' : 'Trình duyệt không cho tải tệp. Thử trình duyệt khác.'); return false; }
  }
  async function doExport() {
    renderExport();
    if ($('exportBtn').disabled) return;
    const btn = $('exportBtn');
    btn.disabled = true; btn.textContent = 'Đang tạo tệp…'; $('exportErr').innerHTML = '';
    try {
      flush();
      const X = await lib();
      const res = buildBook(X);
      if (await saveFile(res.name, res.blob)) { S.rec.exportedAt = Date.now(); S.rec.exportSig = dataSig(); flush(); window.V360NhatKy && V360NhatKy.ghi('bam-gio', 'xuat_phieu', function () { var st = stats(), fm = S.form || {}; return { ma: fm.prefix ? String(fm.prefix).replace(/-$/, '') : fm.unit, ten: fm.unitName, ban: 'bam-gio 1.2.1', chi_tiet: { so_viec: S.pos ? S.pos.jobs.length : 0, viec_co_sp: st.withSp, lan_do: st.meas, viec_co_do: st.jobsMeas, phut_nhap_tay: st.minTay } }; }); }
    } catch (e) {
      $('exportErr').innerHTML = '<div class="alert">Không tạo được tệp: ' + esc(e && e.message || e) + '</div>';
      window.V360NhatKy && V360NhatKy.ghi('bam-gio', 'xuat_phieu', function () { var fm = S.form || {}; return { ma: fm.prefix ? String(fm.prefix).replace(/-$/, '') : fm.unit, ten: fm.unitName, ban: 'bam-gio 1.2.1', loi: e }; });
    } finally {
      btn.textContent = 'Xuất phiếu của tôi'; renderExport();
    }
  }

  // ---------- mở phiếu, chọn vị trí ----------
  function choosePos(code) {
    flush();
    const p = (S.form && S.form.positions.find(x => x.code === code)) || null;
    S.pos = p; S.open = null; S.delAsk = null; S.q = ''; S.filter = 'all'; S.timeOpen = new Set();
    S.rec = p ? loadRec(S.form.unit, p.code) : null;
    if (p && seedRec(S.rec, p)) flush();
    if (p) {
      store.set('last', { unit: S.form.unit, vtvl: p.code });
      if (S.rec.timer && p.jobs.some(j => j.code === S.rec.timer.code)) S.open = S.rec.timer.code;
      else if (p.jobs.length === 1) S.open = p.jobs[0].code;
    }
    renderPos(); renderList(); renderExport(); renderDock(); syncTicker();
  }
  async function onFile() {
    const fi = $('file'), file = fi.files && fi.files[0];
    if (!file) return;
    $('pick').classList.add('busy'); $('pickT').textContent = 'Đang đọc phiếu…'; $('loadErr').innerHTML = '';
    try {
      if (file.size > 40 * 1048576) throw uerr('Tệp quá lớn để là phiếu thu số liệu (phiếu thường dưới 1 MB).');
      const X = await lib();
      const cat = parseForm(X, await file.arrayBuffer(), file.name);
      flush();
      const keep = S.pos && S.form && S.form.unit === cat.unit ? S.pos.code : null;
      S.form = cat; S.pos = null; S.rec = null;
      if (!store.set('form', cat) && storageOk) $('storeNote').hidden = false;
      renderForm();
      const last = store.get('last'), want = keep || (last && last.unit === cat.unit ? last.vtvl : null);
      choosePos(want && cat.positions.some(p => p.code === want) ? want : '');
      $('loadErr').innerHTML = cat.foreign ? '<p class="notice">Bỏ qua ' + cat.foreign + ' dòng có mã không cùng đơn vị ' + esc(cat.unit) + '.</p>' : '';
      toast('Đã mở phiếu ' + cat.unit + ': ' + cat.positions.length + ' vị trí.');
      window.V360NhatKy && V360NhatKy.ghi('bam-gio', 'mo_phieu', function () { return { ma: cat.prefix ? String(cat.prefix).replace(/-$/, '') : cat.unit, ten: cat.unitName, ban: 'bam-gio 1.2.1', chi_tiet: { so_vi_tri: cat.positions.length, dong_khac_don_vi: cat.foreign || 0 } }; });
      if (!S.pos) setTimeout(() => { try { $('pos').focus(); } catch (e) { /* bỏ qua */ } }, 50);
    } catch (e) {
      $('loadErr').innerHTML = '<div class="alert">' + esc(e && e.user ? e.message : 'Không đọc được tệp: ' + (e && e.message || e)) + '</div>';
      window.V360NhatKy && V360NhatKy.ghi('bam-gio', 'mo_phieu', function () { return { ban: 'bam-gio 1.2.1', loi: e && e.user ? e.message : e }; });
    } finally {
      $('pick').classList.remove('busy'); $('pickT').textContent = 'Chọn tệp phiếu (.xlsx)'; fi.value = '';
    }
  }
  function wipe() {
    if (S.timerId) { clearInterval(S.timerId); S.timerId = 0; }
    clearTimeout(saveT); saveT = 0;
    const ok = store.wipe();
    S.form = S.pos = S.rec = S.open = S.dlg = null; S.q = ''; S.filter = 'all';
    $('wipeAsk').hidden = true; $('wipeBtn').hidden = false;
    renderForm(); renderPos(); renderList(); renderDock();
    window.scrollTo(0, 0);
    toast(ok ? 'Đã xóa dữ liệu của trang này trên máy.' : 'Trình duyệt không cho xóa; hãy xóa dữ liệu trang web trong cài đặt trình duyệt.');
  }

  // ---------- sự kiện ----------
  $('file').addEventListener('change', onFile);
  $('reopen').addEventListener('click', () => $('file').click());
  $('pos').addEventListener('change', () => choosePos($('pos').value));
  $('who').addEventListener('input', () => {
    if (!S.rec) return;
    S.rec.who = $('who').value; store.set('who', clean($('who').value)); persist(); whoWarn(); scheduleExport();
  });
  let qT = 0;
  $('q').addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { S.q = $('q').value; renderList(); }, 120); });
  document.querySelectorAll('.fchip').forEach(b => b.addEventListener('click', () => {
    S.filter = b.dataset.filter;
    document.querySelectorAll('.fchip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderList();
  }));
  $('jobs').addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const card = b.closest('.job'), code = card ? card.dataset.code : null;
    switch (b.dataset.act) {
      case 'toggle': setOpen(code, false); break;
      case 'start': startTimer(code); break;
      case 'stop': stopTimer(); break;
      case 'pending': openDlg('stop'); break;
      case 'add': openDlg('add', code); break;
      case 'edit': openDlg('edit', code, b.dataset.id); break;
      case 'del': S.delAsk = b.dataset.id; refreshCard(code); break;
      case 'del-no': S.delAsk = null; refreshCard(code); break;
      case 'del-yes': {
        const x = jw(code), id = b.dataset.id;
        x.meas = x.meas.filter(q => q.id !== id); S.delAsk = null;
        flush(); refreshCard(code); scheduleExport(); toast('Đã xóa lần đo.');
        break;
      }
      case 'sugg': {
        const j = jobOf(code), inp = card.querySelector('[data-f="src"]');
        if (!j || !inp) break;
        inp.value = suggestion(j.hint).src; jw(code).src = inp.value; persist(); liveUpdate(code, 'src', inp); renderLists();
        break;
      }
      case 'use-goiy': {
        const j = jobOf(code);
        if (!j) break;
        const n = fillGoiy(j, jw(code), false);
        flush(); refreshCard(code); scheduleExport();
        toast(n ? 'Đã điền gợi ý. Sửa theo thực tế nếu khác.' : 'Các ô đã đúng gợi ý.');
        break;
      }
      case 'goto': goto(b.dataset.code); break;
    }
  });
  $('jobs').addEventListener('toggle', e => { // nhớ phần thời gian đã mở (vị trí không tính theo PP2)
    const d = e.target;
    if (!d.matches || !d.matches('details[data-timebox]')) return;
    const code = d.closest('.job').dataset.code;
    if (d.open) S.timeOpen.add(code); else S.timeOpen.delete(code);
  }, true);
  $('goiyAll').addEventListener('click', () => {
    if (!S.pos || !S.rec) return;
    let cells = 0, jobs = 0;
    S.pos.jobs.forEach(j => {
      const had = !!S.rec.jobs[j.code], n = fillGoiy(j, jw(j.code), true);
      if (n) { cells += n; jobs++; } else if (!had) delete S.rec.jobs[j.code];
    });
    flush(); renderList(); scheduleExport();
    toast(cells ? 'Đã điền gợi ý vào ' + cells + ' ô ở ' + jobs + ' việc. Sửa theo thực tế; ô giữ nguyên gợi ý được ghi là chưa đo.'
      : 'Không còn việc nào chưa có số mà có gợi ý.');
  });
  $('jobs').addEventListener('input', e => {
    const el = e.target, f = el.dataset && el.dataset.f;
    if (!f || !S.rec) return;
    const code = el.closest('.job').dataset.code;
    jw(code)[f] = el.value; persist(); liveUpdate(code, f, el);
  });
  $('jobs').addEventListener('change', e => { if (e.target.dataset && (e.target.dataset.f === 'src' || e.target.dataset.f === 'conf')) renderLists(); });
  $('checks').addEventListener('click', e => { const b = e.target.closest('[data-act="goto"]'); if (b) goto(b.dataset.code); });
  $('toExport').addEventListener('click', () => { renderExport(); $('s4').scrollIntoView({ block: 'start' }); });
  $('exportBtn').addEventListener('click', doExport);
  $('dockBtn').addEventListener('click', () => { if ($('dockBtn').dataset.act === 'pending') openDlg('stop'); else stopTimer(); });
  $('dockGo').addEventListener('click', () => { const t = S.rec && S.rec.timer; if (t) goto(t.code); });
  $('dlgForm').addEventListener('submit', dlgSave);
  $('dlgDiscard').addEventListener('click', dlgDiscard);
  $('dlgResume').addEventListener('click', dlgResume);
  $('dlgCancel').addEventListener('click', closeDlg);
  $('dlg').addEventListener('close', () => { if (!$('dlg').open) S.dlg = null; }); // sự kiện close đến muộn không xóa hộp vừa mở lại
  ['dlgN', 'dlgDate', 'dlgStart', 'dlgEnd'].forEach(id => $(id).addEventListener('input', dlgCalc));
  document.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
    const cur = parseDecVN($('dlgN').value).v || 0, d = +b.dataset.step;
    const next = d > 0 ? Math.floor(cur) + 1 : Math.max(1, Math.ceil(cur) - 1);
    $('dlgN').value = String(next); dlgCalc();
  }));
  $('wipeBtn').addEventListener('click', () => { $('wipeAsk').hidden = false; $('wipeBtn').hidden = true; $('wipeNo').focus(); });
  $('wipeNo').addEventListener('click', () => { $('wipeAsk').hidden = true; $('wipeBtn').hidden = false; });
  $('wipeYes').addEventListener('click', wipe);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); else flush(); });
  window.addEventListener('pagehide', flush);
  window.addEventListener('pageshow', tick);
  window.addEventListener('resize', () => { if (!$('dock').hidden) document.documentElement.style.setProperty('--dock-h', $('dock').offsetHeight + 'px'); });

  // ---------- khởi động: mở lại phiếu, vị trí, đồng hồ đang chạy ----------
  lib().catch(() => {});
  if (!storageOk) $('storeNote').hidden = false;
  const cat = store.get('form');
  if (cat && cat.v === 1 && Array.isArray(cat.positions) && cat.positions.length && typeof cat.prefix === 'string') {
    S.form = cat;
    renderForm();
    const last = store.get('last');
    choosePos(last && last.unit === cat.unit && cat.positions.some(p => p.code === last.vtvl) ? last.vtvl : '');
    if (S.rec && S.rec.timer && S.rec.timer.end) openDlg('stop');
  } else {
    renderForm();
  }
})();
