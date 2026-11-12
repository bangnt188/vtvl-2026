/* Rà soát 9 biểu — bộ quy tắc kiểm tra bộ biểu vị trí việc làm (Hướng dẫn 13-HD/BTCTU).
   Bản 1.2.2 · 31/10/2026. Chạy được trong trình duyệt và Node (UMD).
   Đầu vào: [{name, wb}] với wb là workbook SheetJS đọc bằng {cellFormula:true}.
   Không dùng giá trị tính sẵn của công thức để tính; chỉ dùng chuỗi công thức để phát hiện lỗi mẫu. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VTVLCheck = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '1.2.2';
  const PREFILL_RAW = {"C1.F":["chưa mặc định quỹ #.# giờ: vtvl lãnh đạo/hỗ trợ ","chưa xác định tại bước a#-a#","chưa xác định tại bước a#-a#; quỹ giờ pp# xác đị","mốc tham chiếu pp#: (# ngày − # ngày lễ/tết − # ","mức chung #.# giờ – bộ luật lao động và quy định","mức tham chiếu pp# chung của bộ biểu cho chế độ ","mức tham chiếu pp# của bộ biểu; dữ liệu giờ riên","mức tham chiếu pp# của bộ biểu; giờ riêng chỉ gh","mức tham chiếu pp#: (# ngày − # ngày lễ, tết − #","mức tham chiếu pp#; giờ đặc thù chỉ ghi khi có v","quỹ giờ chỉ xác định từ hợp đồng/lịch làm việc t","quỹ giờ pp# lấy từ dm_tham_so; giờ đặc thù chỉ g","quỹ giờ pp# tham chiếu chung theo bộ biểu; chỉ s","quỹ giờ pp# theo dm_tham_so; đối chiếu chế độ là","vtvl hỗ trợ, phục vụ theo hđlđ; chưa xác định qu","vtvl hỗ trợ, phục vụ theo hđlđ; quỹ giờ chỉ xác ","vtvl hỗ trợ, phục vụ theo hợp đồng lao động; chư","vtvl lãnh đạo, báo chí, kỹ thuật, cntt/an toàn t","vtvl lãnh đạo/giảng viên có chế độ giảng dạy, ng"],"B1.H":["chương trình công tác, lịch làm việc, hồ sơ chủ ","cơ sở dữ liệu/hệ thống/sổ theo dõi; danh mục bản","hệ thống chuyên ngành/sổ nghiệp vụ/hồ sơ phát si","hệ thống chuyên ngành/tthc/quản lý văn bản; sổ n","hệ thống giải quyết tthc/cổng dvc hoặc hồ sơ nhâ","hệ thống một cửa/cổng dvc; sổ theo dõi hồ sơ chu","hệ thống quản lý văn bản, chương trình công tác,","hệ thống quản lý văn bản/tthc/đăng ký đầu tư/tài","hệ thống quản lý văn bản/điều hành; hệ thống tth","hệ thống quản lý văn bản; chương trình công tác;","hệ thống tthc/chuyên ngành; quản lý văn bản; sổ ","hệ thống tthc/quản lý văn bản/chuyên ngành; sổ t","hệ thống tthc/đăng ký đầu tư/quản lý văn bản/chu","hệ thống/cơ sở dữ liệu kcn, đầu tư, doanh nghiệp","hệ thống/cơ sở dữ liệu/sổ nghiệp vụ/nhật ký; dan","hệ thống/cơ sở dữ liệu/sổ nghiệp vụ; danh mục bả","hệ thống/sổ nghiệp vụ; hồ sơ, chứng từ, bản ghi ","hồ sơ công việc/hệ thống nghiệp vụ; danh mục sản","hồ sơ/sổ/hệ thống nghiệp vụ của phường; thống kê","hồ sơ/sổ/hệ thống nghiệp vụ phường; thống kê thự","hồ sơ/sổ/hệ thống nghiệp vụ xã; thống kê thực tế","kế hoạch kiểm tra/thẩm định/kiểm định; hồ sơ, bi","kế hoạch kiểm tra/thẩm định; hồ sơ, biên bản, kế","kế hoạch/hồ sơ thẩm định, kiểm tra; biên bản, kế","lịch trực/nhật trình/phiếu giao việc và hồ sơ xá","qđ #/#/qđ-ubnd; qđ #/qđ-sct; bmtcv; hd#; hd btct","qđ #/qđ-ubnd; bmtcv; hd#; hd btctu","qđ#/#/qđ-ubnd; qđ#/qđ-sngv; tt#/#/tt-bng; bmtcv;","qđ#/#/qđ-ubnd; qđ#–#/qđ-sxd; qđ#/qđ-sxd; bmtcv; ","sổ theo dõi, hệ thống quản lý văn bản, chứng từ/"],"B1.I":["chưa xác nhận phút/sp; ưu tiên định mức còn hiệu","tc_# tham chiếu sơ bộ: #-#-# phút/sp; không tự đ","định mức chuyên ngành còn hiệu lực → tham chiếu ","định mức/chỉ dẫn chuyên ngành còn hiệu lực → tha","định mức/chỉ dẫn chuyên ngành → tham chiếu xác n"],"B1.S":["chờ ban quản lý xác nhận sản lượng và thời gian/","chờ sở nông nghiệp và môi trường xác nhận sản lư","chờ sở nội vụ xác nhận sản lượng và thời gian/đị","chờ sở tài chính xác nhận sản lượng và thời gian","chờ sở tư pháp xác nhận sản lượng và thời gian/đ","chờ sở xác nhận sản lượng và thời gian/định mức.","chờ sở xác nhận sản lượng và thời gian/định mức;","chờ sở y tế xác nhận sản lượng và thời gian/định","chờ thanh tra thành phố xác nhận sản lượng và th","chờ văn phòng ubnd thành phố xác nhận sản lượng "],"C3.K":["chuyên môn, nghiệp vụ: pp# là trục chính; pp# ch","chuyên môn/hỗ trợ: ưu tiên pp# khi đủ sản lượng ","chờ b#/b# và phương pháp được ban quản lý xác nh","chờ b#/b# và phương pháp được sở nội vụ xác nhận","chờ b#/b# và phương pháp được sở tư pháp xác nhậ","chờ b#/b# và phương pháp được sở xác nhận","chờ b#/b# và phương pháp được sở xác nhận; htpv ","chờ b#/b# và phương pháp được sở y tế xác nhận; ","chờ b#/b# và phương pháp được văn phòng ubnd thà","chờ b#/b#, phương pháp và qđ phê duyệt vtvl được","hỗ trợ, phục vụ: pp# khi có sản phẩm/sản lượng/t","hỗ trợ/phục vụ: pp# theo yêu cầu hiện diện kết h","lãnh đạo/quản lý: pp# kết hợp pp# cho phần trực ","phương pháp gợi ý theo tính chất vtvl; nhu cầu c","phần việc lặp lại, đo được dùng pp#; phần tham m"],"B2.J":["cần phường xác nhận mốc trước–sau, sản lượng và ","cần xã xác nhận mốc trước–sau, sản lượng và giờ ","dữ liệu nguồn xác định nhiệm vụ có yếu tố phân c"],"A1.G":["cv #/#/# + danh mục #.# nhiệm vụ cấp xã đã chuẩn"]};
  const PREFILL = {};
  if (PREFILL_RAW) for (const k of Object.keys(PREFILL_RAW)) PREFILL[k] = new Set(PREFILL_RAW[k]);

  // ---------- tiện ích ----------
  const NFC = (s) => (s && s.normalize ? s.normalize('NFC') : s);
  function txt(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return String(v);
    return NFC(String(v)).replace(/[\s ]+/g, ' ').trim();
  }
  const low = (v) => txt(v).toLowerCase();
  const blank = (v) => txt(v) === '';
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const fmt = (n, d) => (isNum(n) ? n.toLocaleString('vi-VN', { maximumFractionDigits: d === undefined ? 2 : d }) : '');
  const hk = (s) => low(s).replace(/\([^)]*\)?/g, ' ').replace(/\s+/g, ' ').trim();
  const pkey = (s) => low(s).replace(/\d+/g, '#').slice(0, 48);
  const deaccent = (s) => txt(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase();
  const short = (s, n) => { const t = txt(s); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  const COLS = 'ABCDEFGHIJKLMNOPQRSTU'.split('');
  function colIdx(L) { let n = 0; for (const ch of L) n = n * 26 + (ch.charCodeAt(0) - 64); return n; }
  function decodeRef(ref) {
    const m = /^\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/.exec(String(ref || ''));
    if (!m) return null;
    return { r1: +m[2], r2: +(m[4] || m[2]), c1: colIdx(m[1]), c2: colIdx(m[3] || m[1]) };
  }
  function indexBy(rows, col) {
    const m = new Map();
    for (const r of rows) { const k = txt(r.v[col]); if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
    return m;
  }
  const numericText = (v) => typeof v === 'string' && /^\s*-?\d+([.,]\d+)?\s*$/.test(v);

  // ---------- cấu trúc bộ biểu ----------
  const SHEETS = {
    A1: { name: '1. A1_NhiemVu', title: 'Nhiệm vụ', req: { A: 'mã nhiệm vụ', B: 'tên nhiệm vụ', D: 'căn cứ', E: 'kỳ', F: 'trạng thái', G: 'nguồn' } },
    A2: { name: '2. A2_CongViec', title: 'Công việc', req: { A: 'mã công việc', B: 'mã nhiệm vụ', C: 'mã vtvl', D: 'tên công việc', E: 'sản phẩm', F: 'đơn vị tính' } },
    B1: { name: '3. B1_KhoiLuong', title: 'Khối lượng', req: { A: 'mã công việc', B: 'mã vtvl', C: 'số sp/năm', D: 'trung bình phút/sp', E: 'giờ bổ sung', H: 'nguồn sl', I: 'nguồn thời gian', J: 'trạng thái căn cứ thời gian', K: 'kỳ', L: 'mã sp trong danh mục', S: 'giải trình khác chuẩn' } },
    B2: { name: '4. B2_CT_TacDong', title: 'Tác động', req: { A: 'mã công việc', C: 'loại tác động', D: 'công đoạn', E: 'sp áp dụng', F: 'phút trước', G: 'phút sau', I: 'giờ việc mới', J: 'nguồn/bằng chứng', K: 'kỳ', L: 'cơ sở b1', M: 'trạng thái', S: 'đối chiếu trùng/phạm vi' } },
    C1: { name: '6. C1_VTVL', title: 'Vị trí việc làm', req: { A: 'mã vtvl', B: 'tên vtvl', C: 'loại nhân lực', E: 'giờ chuẩn pp2', F: 'căn cứ xác định quỹ giờ', G: 'trạng thái', H: 'giờ riêng được xác nhận', I: 'xác nhận giờ riêng', J: 'chế độ làm việc' } },
    C2: { name: '7. C2_NangLuc', title: 'Năng lực', req: { A: 'mã vtvl', B: 'trách nhiệm', G: 'nguồn bản mô tả' } },
    C3: { name: '8. C3_NhuCau', title: 'Nhu cầu', req: { A: 'mã vtvl', B: 'phương pháp', H: 'người pp1', I: 'người pp3', J: 'người cần bố trí', K: 'nguồn/giải trình', L: 'trạng thái' },
      // tên cột khác chữ nhưng cùng nghĩa (so nguyên văn, không phân biệt hoa thường)
      alias: { I: ['số người theo đánh giá chuyên môn có căn cứ (pp3)'] } },
    D1: { name: '9. D1_NhanLuc', title: 'Nhân lực', req: { A: 'mã nguồn lực', B: 'mã vtvl', C: 'loại nhân lực', E: 'giờ dành cho vtvl', F: 'giờ việc khác', G: 'nơi tính bc', H: 'nguồn', I: 'trạng thái', K: 'giờ riêng theo chế độ' } },
    D2: { name: '10. D2_PhuongAn', title: 'Phương án', req: { A: 'mã vtvl', B: 'năm', D: 'số người có thể bố trí', E: 'biên chế được giao theo đúng cấp', F: 'điều chuyển/bố trí lại', G: 'đề nghị điều chỉnh', H: 'nguồn/giải trình', I: 'trạng thái', N: 'văn bản thẩm định/quyết định' } },
    DM: { name: '11. DM_SAN_PHAM', title: 'Danh mục sản phẩm', req: { A: 'mã sản phẩm chuẩn', B: 'tên/loại sản phẩm', E: 'phút/sp chuẩn', F: 'văn bản/nguồn xác nhận', G: 'trạng thái' } },
  };
  const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3', 'D1', 'D2', 'DM'];
  const EXTRA = { TC02: 'TC_02_B1_THAM_CHIEU', TS: 'DM_THAM_SO', YK: 'Y_KIEN_DON_VI' };

  const LISTS = {
    TT_A1: ['Tiếp tục thực hiện', 'Mới tiếp nhận', 'Đã chuyển giao', 'Không còn thực hiện'],
    TT_B1: ['Có định mức', 'Kiểm đếm, ước lượng thực tế'],
    KIEM_CHUNG: ['Đã kiểm chứng', 'Chưa kiểm chứng'],
    TT_B2CT: ['Đã kiểm chứng', 'Chưa kiểm chứng', 'Ước lượng tham khảo'],
    LOAI_TD: ['Số hóa', 'Cải tiến quy trình', 'Thuê dịch vụ/đặt hàng', 'Tự chủ', 'Xã hội hóa', 'Công việc mới phát sinh'],
    CO_SO_B1: ['Trước thay đổi, có điều chỉnh', 'Đã đo sau thay đổi (không trừ)'],
    DOI_CHIEU: ['Chờ đối chiếu', 'Đã đối chiếu'],
    TT_C1: ['Tiếp tục sử dụng', 'Cần cập nhật', 'Đề nghị bổ sung', 'Đề nghị sửa đổi', 'Đề nghị bãi bỏ'],
    CHE_DO: ['Phổ biến (40 giờ/tuần)', 'Đặc thù'],
    PP: ['PP1', 'PP2', 'PP3', 'PP1+PP2', 'PP1+PP3', 'PP2+PP3', 'PP1+PP2+PP3'],
    TT_C3: ['Tính thử', 'Chưa đủ dữ liệu', 'Đã kiểm chứng', 'Không áp dụng'],
    TT_D2: ['Đang xây dựng', 'Đã hoàn thành ở đơn vị', 'Đã thẩm định', 'Đã được quyết định'],
    NAM: ['2027', '2028', '2029', '2030', '2031'],
    LOAI_NL: ['Cán bộ', 'Công chức', 'Viên chức', 'Hợp đồng lao động', 'Khác'],
  };
  const KY_CHUAN = '01/10/2025–30/9/2026';

  // ---------- Phụ lục 3 HD13: bảng tham khảo định mức giờ lao động trực tiếp (giờ/sản phẩm), chép nguyên văn ----------
  // items: [TT, sản phẩm công việc, đơn vị tính, Đơn giản, Thông thường, Phức tạp]; groups: [TT mục đầu nhóm, số La Mã, tên nhóm]
  const PL3 = {
    source: 'Phụ lục 3 kèm theo Hướng dẫn số 13-HD/BTCTU ngày 26/10/2026 của Ban Tổ chức Thành ủy',
    title: 'Bảng tham khảo định mức giờ lao động trực tiếp cho sản phẩm công việc',
    scope: 'Phạm vi áp dụng: cơ quan Đảng, Mặt trận Tổ quốc và các tổ chức chính trị - xã hội; Hội đồng nhân dân, Ủy ban nhân dân, các sở, ban, ngành; đơn vị sự nghiệp công lập; xã, phường thuộc thành phố.',
    levels: 'Cách chọn mức: Đơn giản – làm theo mẫu, số liệu có sẵn, ít đầu mối; Thông thường – trường hợp phổ biến (mức mặc định); Phức tạp – liên ngành, nhiều vòng góp ý, thẩm định, xác minh, phạm vi rộng hoặc nhạy cảm.',
    groups: [[1, 'I', 'Văn bản tham mưu, chính sách'], [12, 'II', 'Hồ sơ nghiệp vụ, thủ tục hành chính'], [16, 'III', 'Tổ chức, cán bộ, đảng viên, đoàn viên, hội viên'],
      [21, 'IV', 'Kiểm tra, giám sát, thanh tra, giải quyết đơn thư'], [28, 'V', 'Tài chính, tài sản'], [32, 'VI', 'Số liệu, văn thư, lưu trữ'],
      [36, 'VII', 'Hội nghị, vận động, tuyên truyền, đào tạo'], [43, 'VIII', 'Hỗ trợ, phục vụ']],
    items: [
      [1, 'Đề án, nghị quyết, chỉ thị, quy chế, quy định, văn bản quy phạm pháp luật (xây dựng mới)', 'văn bản', 40, 80, 160],
      [2, 'Sửa đổi, bổ sung các văn bản nêu tại mục 1', 'văn bản', 16, 32, 80],
      [3, 'Chương trình, kế hoạch, hướng dẫn, phương án', 'văn bản', 8, 20, 40],
      [4, 'Báo cáo sơ kết, tổng kết, chuyên đề', 'báo cáo', 16, 40, 80],
      [5, 'Báo cáo 6 tháng, năm', 'báo cáo', 8, 16, 32],
      [6, 'Báo cáo tháng, quý, đột xuất ngắn', 'báo cáo', 2, 4, 8],
      [7, 'Tờ trình (kèm dự thảo văn bản)', 'tờ trình', 4, 8, 16],
      [8, 'Quyết định cá biệt (kèm thẩm định hồ sơ)', 'quyết định', 2, 4, 8],
      [9, 'Công văn chỉ đạo, hướng dẫn; thông báo, kết luận', 'văn bản', 2, 4, 8],
      [10, 'Công văn trả lời, góp ý dự thảo', 'văn bản', 1, 2, 4],
      [11, 'Ý kiến thẩm định, thẩm tra, phản biện chuyên môn', 'ý kiến', 4, 8, 24],
      [12, 'Tiếp nhận, kiểm tra, trả kết quả hồ sơ (bộ phận một cửa, văn thư)', 'hồ sơ', 0.5, 1, 2],
      [13, 'Giải quyết hồ sơ thủ tục hành chính, cấp phép, chứng nhận', 'hồ sơ', 1, 3, 8],
      [14, 'Thẩm định dự án, quy hoạch, thiết kế, phương án kỹ thuật', 'hồ sơ', 8, 16, 40],
      [15, 'Hồ sơ hợp tác, thỏa thuận, đối ngoại', 'hồ sơ', 4, 8, 24],
      [16, 'Nhận xét, đánh giá, cập nhật hồ sơ cán bộ, công chức, viên chức', 'hồ sơ', 2, 4, 8],
      [17, 'Tuyển dụng, quy hoạch, bổ nhiệm, điều động, luân chuyển', 'hồ sơ', 8, 16, 40],
      [18, 'Giải quyết chế độ, chính sách', 'hồ sơ', 1, 3, 6],
      [19, 'Hồ sơ đảng viên, tổ chức đảng; đoàn viên, hội viên', 'hồ sơ', 1, 3, 8],
      [20, 'Thẩm tra, xác minh, bảo vệ chính trị nội bộ', 'hồ sơ', 8, 16, 40],
      [21, 'Cuộc kiểm tra, giám sát, thanh tra', 'cuộc', 8, 16, 40],
      [22, 'Kết luận, kiến nghị sau kiểm tra, giám sát', 'văn bản', 4, 8, 24],
      [23, 'Theo dõi, đôn đốc thực hiện kết luận', 'đợt', 1, 2, 6],
      [24, 'Khảo sát, kiểm tra thực tế, hiện trường', 'đợt', 4, 8, 24],
      [25, 'Tiếp công dân; tiếp nhận, phân loại đơn thư', 'lượt/đơn', 0.5, 1, 2],
      [26, 'Giải quyết khiếu nại, tố cáo, phản ánh, vụ việc', 'vụ việc', 8, 24, 80],
      [27, 'Xử lý kỷ luật, xử lý vi phạm hành chính', 'hồ sơ', 2, 6, 16],
      [28, 'Dự toán, quyết toán, kế hoạch tài chính', 'hồ sơ', 4, 8, 24],
      [29, 'Mua sắm, đấu thầu, hợp đồng, nghiệm thu', 'hồ sơ', 2, 6, 16],
      [30, 'Chứng từ kế toán, thanh toán', 'chứng từ', 0.25, 0.5, 1.5],
      [31, 'Kiểm kê, điều chuyển, thanh lý tài sản', 'hồ sơ', 1, 2, 6],
      [32, 'Tổng hợp, xử lý số liệu thống kê', 'bộ số liệu', 2, 4, 12],
      [33, 'Lập bảng, danh sách; cập nhật cơ sở dữ liệu', 'bảng/đợt', 0.5, 1.5, 4],
      [34, 'Lập hồ sơ, chỉnh lý, lưu trữ tài liệu', 'hồ sơ', 1, 2, 6],
      [35, 'Tra cứu, cung cấp thông tin, tài liệu', 'lượt', 0.25, 0.5, 2],
      [36, 'Tổ chức hội nghị, cuộc họp (đơn vị chủ trì)', 'cuộc', 4, 8, 16],
      [37, 'Đại hội, kỳ họp, sự kiện, phong trào lớn', 'sự kiện', 8, 24, 80],
      [38, 'Tiếp xúc cử tri, đối thoại với nhân dân', 'cuộc', 4, 8, 16],
      [39, 'Tổ chức lớp tập huấn, bồi dưỡng', 'lớp', 8, 16, 40],
      [40, 'Bài phát biểu, tham luận phục vụ lãnh đạo', 'bài', 2, 4, 8],
      [41, 'Tin, bài, ấn phẩm, tài liệu tuyên truyền', 'sản phẩm', 1, 2, 6],
      [42, 'Đoàn công tác, tiếp khách, đối ngoại', 'đoàn/cuộc', 2, 4, 12],
      [43, 'Ca trực, bảo vệ, vận hành hệ thống', 'ca', 4, 8, 12],
      [44, 'Lái xe, phục vụ, hậu cần', 'lượt', 1, 2, 4],
      [45, 'Hỗ trợ kỹ thuật, CNTT, bảo trì thiết bị', 'lượt', 0.5, 1, 2],
    ],
    notes: [
      'Chỉ tính thời gian trực tiếp làm ra sản phẩm, không tính thời gian chờ duyệt, chờ ký. Nhiều người cùng làm một sản phẩm thì chia giờ theo phần việc, không tính trùng.',
      'Chọn mức theo độ khó của từng sản phẩm, không theo cấp hành chính hay loại cơ quan. Nếu không xác định được thì dùng mức Thông thường.',
      'Cách tính: Số lượng sản phẩm/năm × mức giờ = tổng số giờ/năm. Kết quả dùng để đối chiếu, kiểm tra tính hợp lý của số liệu khảo sát; không tự động dùng để giao biên chế.',
      'Dự họp, hội nghị (không chủ trì tổ chức) ghi theo giờ thực tế; sản phẩm chưa có trong bảng thì đối chiếu loại tương đương gần nhất; lĩnh vực đã có định mức chuyên ngành thì áp dụng định mức đó.',
    ],
  };
  // Mọi mức giờ (Đơn giản/Thông thường/Phức tạp) của mọi mục PL3: phút ở DM_SAN_PHAM = giờ PL3 × 60 là có nguồn
  const PL3_HOURS = [...new Set(PL3.items.flatMap((it) => it.slice(3)))];
  const isPL3Hours = (h) => typeof h === 'number' && isFinite(h) && PL3_HOURS.some((v) => Math.abs(v - h) < 1e-9);

  // ---------- quy tắc ----------
  const L_FIX = 'fix', L_EV = 'evidence', L_RV = 'review';
  const LEVELS = {
    fix: { label: 'Phải sửa', order: 0 },
    evidence: { label: 'Cần bổ sung căn cứ', order: 1 },
    review: { label: 'Nên xem lại', order: 2 },
  };
  const RULES = {
    F01: [L_RV, 'Tệp', 'Tên tệp chưa theo quy ước', 'Đặt tên [Mã cơ quan]_K2526_v[lần nộp]_[ngày tháng năm].xlsx, ví dụ X05_K2526_v1_05112026.xlsx.'],
    F02: [L_FIX, 'Tệp', 'Thiếu trang hoặc trang bị đổi tên', 'Giữ đúng tên 11 trang của mẫu; không đổi tên, không xóa trang.'],
    F03: [L_FIX, 'Tệp', 'Tiêu đề cột khác mẫu', 'Không chèn, xóa hay đổi tên cột. Chép lại dòng tiêu đề từ mẫu gốc.'],
    F04: [L_RV, 'Tệp', 'Mã còn tiền tố tạm hoặc lẫn tiền tố', 'Khi tách tệp, thay XXX bằng mã xã (X01–X72) hoặc phường (P01–P31); mỗi tệp chỉ một mã đơn vị.'],
    F06: [L_RV, 'Tệp', 'Ghi chú làm việc trong cột nguồn', 'Xóa ghi chú nội bộ (Judge, TODO, prompt, tên công cụ AI) khỏi cột nguồn/căn cứ; chỉ để lại nguồn thật.'],
    F05: [L_RV, 'Tệp', 'Mã VTVL thiếu tiền tố mã xã/phường', 'Phụ lục 1, trang “Quy ước mã”, dòng 3: mã cấp xã là [Mã xã/phường]-[Mã cơ quan cấp xã]-[Mã nhóm]-[STT], ví dụ P02-VP-CM-03 (trang 3b: mã gốc VP-CM-03, mã đầy đủ P01-VP-CM-03). Thêm tiền tố để mã không trùng giữa 72 xã khi tổng hợp.'],
    L01: [L_FIX, 'A2', 'Mã nhiệm vụ không có ở A1', 'Sửa mã nhiệm vụ ở cột B cho khớp A1, hoặc bổ sung nhiệm vụ vào A1.'],
    L02: [L_RV, 'A2', 'Mã công việc không theo mã nhiệm vụ', 'Mã công việc = mã nhiệm vụ + "-" + 2 chữ số, ví dụ X05-D-A1-002-01.'],
    L03: [L_FIX, 'A2', 'Mã VTVL ở A2 thiếu, sai hoặc ghép hai mã', 'Mỗi công việc gắn đúng một mã VTVL có trong C1.'],
    L04: [L_FIX, 'Tệp', 'Trùng mã', 'Mỗi mã chỉ xuất hiện một lần trong biểu; gộp hoặc đánh lại số thứ tự.'],
    L05: [L_FIX, 'Tệp', 'Mã không có ở biểu gốc', 'Mã công việc phải có ở A2; mã VTVL phải có ở C1.'],
    L06: [L_FIX, 'B1', 'Liên kết mã VTVL sai hoặc chưa có công thức', 'Chép lại công thức cột B (và cột P ở B2) từ dòng mẫu; không sắp xếp hay chèn dòng giữa bảng.'],
    L07: [L_FIX, 'B1', 'Mã sản phẩm không khớp danh mục', 'Mã ở cột L phải có trong 11. DM_SAN_PHAM; đổi mã thì sửa lại công thức tra cứu M, N, O.'],
    A101: [L_FIX, 'A1', 'Trạng thái nhiệm vụ ngoài danh sách', 'Chọn một trong: Tiếp tục thực hiện, Mới tiếp nhận, Đã chuyển giao, Không còn thực hiện. Ghi chú để ở cột G.'],
    A102: [L_EV, 'A1', 'Thiếu căn cứ cho thay đổi nhiệm vụ', 'Mới tiếp nhận: ghi văn bản giao ở cột D. Đã chuyển giao/Không còn thực hiện: ghi chuyển cho ai, văn bản, thời điểm ở cột G.'],
    A201: [L_RV, 'A2', 'Sản phẩm ghép nhiều loại bằng dấu "/"', 'Ghi một sản phẩm đầu ra cụ thể, đếm được, đúng đơn vị tính.'],
    A202: [L_RV, 'A2', 'Công việc chưa phân rã khỏi nhiệm vụ', 'Tách nhiệm vụ thành các công việc có sản phẩm riêng.'],
    A203: [L_RV, 'A2', 'Bước quyết định theo thẩm quyền gán cho chuyên viên', 'Chuyển bước quyết định sang VTVL lãnh đạo (LDQL) hoặc ghi rõ phần việc của chuyên viên là tham mưu.'],
    A204: [L_FIX, 'A2', 'Thiếu sản phẩm hoặc đơn vị tính', 'Ghi sản phẩm đầu ra (E) và đơn vị tính (F).'],
    A205: [L_RV, 'A2', 'Công việc lệch chức trách VTVL', 'Gán công việc cho VTVL đúng mảng (kế toán, văn thư, thủ quỹ, cơ yếu, chuyển đổi số) trong đơn vị, hoặc ghi rõ lý do kiêm nhiệm.'],
    A206: [L_RV, 'C1', 'VTVL hỗ trợ chỉ có công việc khuôn chung', 'Bổ sung công việc vận hành thường xuyên của vị trí (văn bản đến/đi, chứng từ, phiếu thu chi, điện mật, lượt hỗ trợ…) để PP2 đo được phần việc chính.'],
    B101: [L_RV, 'B1', 'Ghi số 0', 'Chưa có số liệu thì để trống; chỉ ghi 0 khi đã xác nhận không phát sinh.'],
    B102: [L_FIX, 'B1', 'Số liệu không hợp lệ', 'C là số nguyên ≥ 0; D là số phút > 0; E không âm; nhập dạng số, không gõ chữ.'],
    B103: [L_EV, 'B1', 'Nguồn sản lượng chưa thật', 'Thay câu mẫu ở cột H bằng nguồn thực: sổ, hệ thống, báo cáo và người xác nhận.'],
    B104: [L_EV, 'B1', 'Nguồn thời gian chưa thật', 'Có định mức: ghi số hiệu văn bản. Kiểm đếm: ghi phiếu đo, số mẫu, người xác nhận.'],
    B105: [L_RV, 'B1', 'Phút/SP lệch xa khung tham chiếu', 'Kiểm tra lại cách đo; nếu đúng, ghi giải trình và minh chứng.'],
    B106: [L_RV, 'B1', 'Có thể ghi thời hạn thay cho phút lao động', 'Cột D là phút lao động trực tiếp cho một sản phẩm, không phải thời hạn giải quyết.'],
    B107: [L_FIX, 'B1', 'Kỳ hoặc trạng thái căn cứ chưa đúng', 'Kỳ ghi 01/10/2025–30/9/2026; J chọn "Có định mức" hoặc "Kiểm đếm, ước lượng thực tế".'],
    B108: [L_RV, 'B1', 'Một công việc có số liệu ở nhiều dòng', 'Gộp về một dòng để không tính trùng giờ cho cùng VTVL.'],
    B109: [L_RV, 'B1', 'Giải trình khác chuẩn chưa được xác nhận', 'Bắt đầu cột S bằng "Đã xác nhận:" kèm người, văn bản xác nhận; nếu không, Excel để "CHỜ XÁC NHẬN KHÁC CHUẨN".'],
    B110: [L_RV, 'B1', 'Lệch xa mức tham khảo', 'Phút/SP lớn hơn 4 lần hoặc nhỏ hơn 1/4 phút ở DM_SAN_PHAM (mức Phụ lục 3 HD13 × 60): kiểm tra lại cách đo; nếu đúng, ghi giải trình và minh chứng.'],
    B201: [L_EV, 'B2', 'Tác động chưa có bằng chứng', 'Ghi nguồn, bằng chứng thật ở cột J trước khi chuyển trạng thái.'],
    B202: [L_FIX, 'B2', 'Giá trị B2 ngoài danh sách hoặc thiếu', 'Chọn từ danh sách thả xuống của mẫu; kỳ ghi K2526 hoặc 01/10/2025–30/9/2026.'],
    B203: [L_FIX, 'B2', 'SP áp dụng vượt sản lượng B1', 'SP áp dụng (E) không lớn hơn số sản phẩm của công việc ở B1.'],
    B204: [L_RV, 'B2', 'Có thể trừ hai lần hoặc chưa trừ', 'Đối chiếu cột L với cách đo ở B1: đo trước thay đổi mới chọn "Trước thay đổi, có điều chỉnh".'],
    B205: [L_RV, 'B2', 'Thời gian tăng chưa ghi giờ mới', 'Phút sau lớn hơn phút trước thì ghi giờ việc mới ở cột I.'],
    B206: [L_RV, 'B2', 'Đã kiểm chứng nhưng chưa đối chiếu trùng', 'Cán bộ đối chiếu chọn "Đã đối chiếu" ở cột S; trước đó dòng chưa được cộng vào C3.'],
    C101: [L_FIX, 'C1', 'Thông tin VTVL ngoài danh sách hoặc mã ghép', 'Chọn loại nhân lực, trạng thái, chế độ làm việc từ danh sách; mỗi dòng một mã VTVL.'],
    C102: [L_EV, 'C1', 'Quỹ giờ riêng chưa có căn cứ', 'Chế độ đặc thù/giờ riêng: ghi văn bản ở cột F và chọn "Đã kiểm chứng" ở cột I.'],
    C103: [L_RV, 'C1', 'Giờ riêng không cần thiết hoặc chưa rõ căn cứ', 'Không ghi lại 1.904 giờ (mức chung). Giờ riêng khác phải có văn bản ở cột F.'],
    C104: [L_FIX, 'C1', 'Công thức giờ chuẩn bị ghi đè', 'Chép lại công thức cột E từ dòng khác; không gõ số tay.'],
    C105: [L_RV, 'C1', 'VTVL chưa có công việc nào ở A2', 'Gắn công việc ở A2 cho VTVL này, hoặc xem lại VTVL có còn cần thiết.'],
    C203: [L_RV, 'C2', 'Mô tả C2 không khớp chức danh', 'Viết lại trách nhiệm ở C2 theo đúng chức danh (kế toán, văn thư, thủ quỹ, cơ yếu, chuyển đổi số), không chép mô tả của vị trí khác.'],
    C201: [L_RV, 'C2', 'Thiếu khung năng lực', 'Mỗi VTVL ở C1 có một dòng C2 với trách nhiệm (B) và nguồn bản mô tả (G).'],
    C301: [L_FIX, 'C3', 'Phương pháp hoặc trạng thái ngoài danh sách', 'Chọn PP1, PP2, PP3 hoặc tổ hợp; trạng thái theo danh sách.'],
    C302: [L_FIX, 'C3', 'Chọn PP3 nhưng chưa ghi số người PP3', 'Ghi số người ước lượng ở cột I kèm giải trình ở cột K.'],
    C303: [L_FIX, 'C3', 'Chọn PP1 nhưng chưa ghi số người PP1', 'Ghi số người theo PP1 ở cột H.'],
    C304: [L_EV, 'C3', 'Kết luận nhu cầu chưa có giải trình', 'Ghi nguồn, lý do chọn số người ở cột K (thay câu mẫu).'],
    C305: [L_FIX, 'C3', 'Số người cần bố trí không hợp lệ', 'J là số không âm; nên là số nguyên sau khi đã giải trình.'],
    C306: [L_RV, 'C3', 'Kết luận cộng cơ học hoặc lấy số lớn nhất', 'Theo Hướng dẫn 13, kết hợp phương pháp phải phân tích, không cộng dồn hay chọn số lớn nhất; ghi giải trình.'],
    C307: [L_FIX, 'C3', 'Ghi "Đã kiểm chứng" khi dữ liệu chưa đủ', 'Chỉ chọn "Đã kiểm chứng" khi mọi dòng B1 của VTVL đã có nguồn thật và K có giải trình.'],
    C308: [L_RV, 'C3', 'Chọn PP2 nhưng chưa có công việc hoặc giờ B1', 'PP2 tính từ giờ của các công việc ở B1: gắn công việc ở A2, nhập B1, hoặc đổi phương pháp.'],
    C309: [L_RV, 'C3', 'VTVL chưa có kết luận nhu cầu', 'Bổ sung dòng C3, chọn phương pháp và ghi số người cần bố trí.'],
    D101: [L_FIX, 'D1', 'Mã nguồn lực lộ thông tin cá nhân', 'Ghi [mã cơ quan].[số thứ tự], ví dụ X05.01; không ghi họ tên, số định danh.'],
    D102: [L_FIX, 'D1', 'Thông tin nhân lực ngoài danh sách hoặc thiếu', 'Chọn loại nhân lực, trạng thái từ danh sách; ghi nơi tính biên chế.'],
    D103: [L_EV, 'D1', 'Thiếu nguồn số liệu nhân lực', 'Ghi nguồn: quyết định tuyển dụng, phân công, bảng chấm công…'],
    D104: [L_FIX, 'D1', 'Tổng giờ vượt quỹ giờ', 'Tổng giờ cho VTVL và việc khác của một người không vượt quỹ giờ năm.'],
    D105: [L_RV, 'D1', 'Một người tính biên chế ở nhiều nơi', 'Người kiêm nhiệm chỉ tính biên chế một lần tại nơi tính chính.'],
    D201: [L_FIX, 'D2', 'Phương án thiếu năm hoặc trùng năm', 'Mỗi VTVL đã kết luận ở C3 có đủ 5 dòng năm 2027–2031.'],
    D202: [L_FIX, 'D2', 'Năm hoặc trạng thái phương án ngoài danh sách', 'Năm 2027–2031; trạng thái theo danh sách.'],
    D203: [L_FIX, 'D2', 'Đề nghị điều chỉnh chưa có căn cứ', 'Đề nghị điều chỉnh khác 0 phải ghi điều chuyển (F) và giải trình (H); số nguyên.'],
    D204: [L_RV, 'D2', 'Biên chế giao ghi lặp', 'Biên chế giao theo tổng cơ quan ghi một lần trong thuyết minh, không lặp từng dòng.'],
    D205: [L_FIX, 'D2', 'Đã được quyết định nhưng thiếu văn bản', 'Ghi số, ngày, cơ quan ban hành quyết định ở cột N.'],
    K01: [L_RV, 'K', 'Trang tự kiểm lệch số thực', 'Cập nhật trang K_KiemTra theo số dòng thật của A1, A2, B2 và C1 trước khi nộp.'],
    DM01: [L_RV, 'DM', 'Phút chuẩn tròn theo ngày làm việc', 'Xác nhận đây là thời gian lao động trực tiếp cho một sản phẩm, không phải thời hạn giải quyết; đối chiếu mức giờ ở Phụ lục 3 HD13 (giờ × 60 = phút) trước khi dùng làm chuẩn.'],
    X01: [L_RV, 'Nhiều tệp', 'Mã trùng giữa các tệp', 'Kiểm tra cộng trùng giữa các khối; một người/nhiệm vụ chỉ khai ở một tệp.'],
  };
  const RULE_META = {};
  for (const [k, v] of Object.entries(RULES)) RULE_META[k] = { level: v[0], scope: v[1], title: v[2], fix: v[3] };

  // ---------- nhận diện câu mẫu ----------
  const GENERIC_PREFILL = [/^tc_?# tham chiếu sơ bộ/, /^hồ sơ\/sổ\/hệ thống nghiệp vụ/, /^chờ /, /→/, /^cần (xã|phường) xác nhận/,
    /^phương pháp gợi ý/, /chưa tính vào nhu cầu/, /không tự đưa vào phút thực tế/, /^chưa xác nhận phút/, /^chưa xác định tại bước/,
    // 1.1: câu mẫu của mẫu dùng chung trường THCS–THPT
    /^cần đơn vị xác nhận/, /^chưa có số đo\/định mức được xác nhận/, /^mẫu công việc, chưa phải sản lượng/, /^chờ xác nhận/, /^đơn vị xác nhận kỳ rà soát/];
  function isPrefill(field, v) {
    if (blank(v)) return false;
    const set = PREFILL[field];
    if (set && set.has(pkey(v))) return true;
    const l = low(v).replace(/\d+/g, '#');
    return GENERIC_PREFILL.some((re) => re.test(l));
  }

  // ---------- đọc tệp ----------
  const canon = (n) => low(n).replace(/^\d+\.\s*/, '').replace(/\s+/g, '').replace(/\(\d+\)$/, '');
  function pickSheets(names) {
    names = names || [];
    const map = {}, renamed = {}, extra = {};
    for (const k of ORDER) {
      const d = SHEETS[k];
      if (names.indexOf(d.name) >= 0) { map[k] = d.name; continue; }
      const want = canon(d.name);
      const cand = names.find((n) => canon(n) === want || canon(n).indexOf(want) >= 0);
      if (cand) { map[k] = cand; renamed[k] = cand; }
    }
    for (const [k, n] of Object.entries(EXTRA)) if (names.indexOf(n) >= 0) extra[k] = n;
    const kk = names.find((n) => /K_KiemTra/i.test(n));
    if (kk) extra.K = kk;
    return { map, renamed, extra, parse: Object.values(map).concat(Object.values(extra)) };
  }

  // Dòng tiêu đề: dòng 1–5 có cột A khớp tiêu đề mẫu (mẫu v8 đặt tiêu đề DM ở dòng 3); mặc định dòng 2.
  function headerRow(ws, key) {
    const exp = key && SHEETS[key] ? SHEETS[key].req.A : '';
    if (exp) for (let r = 1; r <= 5; r++) { const x = ws['A' + r]; const h = x ? hk(x.v) : ''; if (h && (h === exp || h.indexOf(exp) === 0)) return r; }
    return 2;
  }
  function readTable(ws, key) {
    const out = { rows: [], hdr: {}, hdrRow: 2, maxRow: 0, lastRow: 0, byRow: new Map() };
    if (!ws || !ws['!ref']) return out;
    const rg = decodeRef(ws['!ref']);
    if (!rg) return out;
    out.lastRow = rg.r2;
    const hr = out.hdrRow = headerRow(ws, key);
    for (const c of COLS) { const x = ws[c + hr]; if (x && !blank(x.v)) out.hdr[c] = txt(x.v); }
    for (let r = hr + 1; r <= rg.r2; r++) {
      const a = ws['A' + r];
      if (!a || blank(a.v)) continue;
      const row = { r, v: {}, f: {} };
      for (const c of COLS) {
        const x = ws[c + r];
        if (!x) continue;
        if (x.v !== undefined && x.t !== 'z') row.v[c] = x.v;
        if (x.f) row.f[c] = x.f;
      }
      out.rows.push(row); out.byRow.set(r, row); out.maxRow = r;
    }
    return out;
  }

  function headerMismatch(key, table) {
    const bad = [];
    for (const [c, exp] of Object.entries(SHEETS[key].req)) {
      const act = hk(table.hdr[c] || '');
      const raw = low(table.hdr[c] || '').replace(/\s+/g, ' ');
      const ok = act === exp || (act.length >= 4 && (act.indexOf(exp) === 0 || exp.indexOf(act) === 0)) || ((SHEETS[key].alias || {})[c] || []).indexOf(raw) >= 0;
      if (!ok) bad.push({ col: c, expected: exp, actual: table.hdr[c] || '(trống)' });
    }
    return bad;
  }

  function parseFileName(name) {
    const base = String(name || '').split(/[\\/]/).pop();
    const m = /^([^_]+)_K2526_v(\d+)_(\d{2})(\d{2})(\d{4})\.xlsx$/i.exec(base);
    const loose = /^([^_]+)_K2526_/i.exec(base);
    const agency = m ? m[1] : (loose ? loose[1] : '');
    // Mã cơ quan có thể gồm nhiều đoạn: trường thuộc Sở ghi SGDDT-<mã trường>. Có đoạn là mã tạm
    // (XXX, PXX, X00, P00; THCSTHPT trong "SGDDT-THCSTHPT" của mẫu dùng chung) thì cả mã là mã tạm.
    const segs = agency ? agency.split(/[-.]/).filter(Boolean) : [];
    const placeholder = segs.some((s) => /^(XXX|PXX|X00|P00|THCSTHPT)$/i.test(s));
    let ok = !!m, why = '';
    if (m) {
      const d = +m[3], mo = +m[4], y = +m[5];
      if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 2026 || y > 2027) { ok = false; why = 'ngày tháng năm trong tên tệp không hợp lệ'; }
    } else why = loose ? 'có phần thêm sau ngày tháng năm' : 'không theo cấu trúc [Mã]_K2526_v[số]_[ddmmyyyy].xlsx';
    return { base, ok, why, agency, segs, placeholder, version: m ? +m[2] : null };
  }

  function readParams(wb, ts) {
    let quy = null;
    const names = (wb.Workbook && wb.Workbook.Names) || [];
    const nm = names.find((n) => n.Name === 'QUY_GIO_PP2');
    if (nm && nm.Ref) {
      const mm = /^'?([^'!]+)'?!(\$?[A-Z]+\$?\d+)$/.exec(nm.Ref);
      if (mm && wb.Sheets[mm[1]]) { const c = wb.Sheets[mm[1]][mm[2].replace(/\$/g, '')]; if (c && isNum(c.v)) quy = c.v; }
    }
    const lists = {};
    for (const k of Object.keys(LISTS)) lists[k] = LISTS[k].slice();
    if (ts && ts['!ref']) {
      const rg = decodeRef(ts['!ref']);
      const maxR = Math.min(rg ? rg.r2 : 40, 60);
      if (quy === null) {
        for (let r = 1; r <= Math.min(maxR, 30); r++) {
          const a = ts['A' + r]; const b = ts['B' + r];
          if (a && /quỹ giờ|quy_gio_pp2/i.test(txt(a.v)) && b && isNum(b.v)) { quy = b.v; break; }
        }
      }
      // danh sách lựa chọn: tìm dòng có tên danh sách (TT_B1, PP…)
      let keyRow = 0;
      for (let r = 1; r <= maxR && !keyRow; r++) for (const c of COLS) { const x = ts[c + r]; if (x && (txt(x.v) === 'TT_B1' || txt(x.v) === 'LOAI_TD')) { keyRow = r; break; } }
      if (keyRow) {
        for (const c of COLS) {
          const x = ts[c + keyRow]; const key = x ? txt(x.v) : '';
          if (!lists[key]) continue;
          for (let r = keyRow + 1; r <= keyRow + 20; r++) {
            const y = ts[c + r]; if (!y || blank(y.v)) break;
            const v = txt(y.v);
            if (!lists[key].some((z) => low(z) === low(v))) lists[key].push(v);
          }
        }
      }
    }
    if (!(isNum(quy) && quy >= 1000 && quy <= 2500)) quy = 1904;
    return { quy, lists };
  }

  function inList(raw, list) {
    if (blank(raw)) return 'blank';
    const rawS = typeof raw === 'number' ? String(raw) : String(raw).replace(/[\s ]+/g, ' ').trim();
    const v = NFC(rawS).toLowerCase();
    if (!list.some((x) => NFC(x).toLowerCase() === v)) return 'bad';
    if (rawS !== NFC(rawS)) return 'nfd';
    return 'ok';
  }
  const NFD_MSG = 'Chữ đang ở dạng Unicode tổ hợp nên công thức Excel không nhận; chọn lại từ danh sách hoặc gõ bằng bảng mã Unicode dựng sẵn.';
  // Giá trị hợp lệ + ghi chú ("Tiếp tục sử dụng theo QĐ 341…") → trả về giá trị gốc
  function noteBase(raw, list) {
    const v = low(raw);
    for (const x of list) {
      const b = NFC(x).toLowerCase();
      if (v.length > b.length && v.indexOf(b) === 0 && /^[\s;:–—\-(]/.test(v.slice(b.length))) return x;
    }
    return '';
  }

  function normKy(v) {
    return low(v).replace(/\s+/g, '').replace(/[–—−]/g, '-').replace(/(^|[^\d])0(\d)/g, '$1$2');
  }
  const kyOk = (v) => { const k = normKy(v); return k.indexOf('1/10/2025-30/9/2026') >= 0 || k.indexOf('k2526') >= 0; };

  // ---------- kiểm tra một tệp ----------
  function checkFile(fileName, wb) {
    const issues = [];
    const tbugs = [];
    const add = (rule, sheet, row, col, code, msg, o) => {
      const m = RULE_META[rule];
      const it = { file: fileName, rule, level: m.level, sheet, row: row || null, col: col || '', code: code ? String(code) : '', msg, fix: m.fix };
      if (o) Object.assign(it, o);
      issues.push(it);
      return it;
    };
    // Kiểm tra giá trị theo danh sách. formula=true: cột được công thức Excel so khớp nguyên văn.
    const listIssue = (rule, sheet, r, col, code, list, nm, formula, blankOk) => {
      const raw = r.v[col]; const s = inList(raw, list);
      if (s === 'ok') return s;
      if (s === 'blank') { if (!blankOk) add(rule, sheet, r.r, col, code, `Chưa chọn ${nm}.`); return s; }
      if (s === 'nfd') { add(rule, sheet, r.r, col, code, NFD_MSG); return s; }
      const base = noteBase(raw, list);
      if (base && formula) add(rule, sheet, r.r, col, code, `“${short(raw, 60)}” có thêm ghi chú nên công thức Excel không nhận; để đúng “${base}”, chuyển ghi chú sang cột nguồn/giải trình.`);
      else if (base) add(rule, sheet, r.r, col, code, `“${short(raw, 60)}” lẫn ghi chú; để đúng “${base}”, chuyển ghi chú sang cột nguồn/giải trình.`, { level: L_RV });
      else add(rule, sheet, r.r, col, code, `“${short(raw, 50)}” không có trong danh sách ${nm}.`);
      return base ? 'note' : s;
    };
    const fn = parseFileName(fileName);
    if (!fn.ok) add('F01', 'Tệp', null, '', '', `Tên tệp “${fn.base}” ${fn.why}.`);
    else if (fn.placeholder) add('F01', 'Tệp', null, '', '', `Mã cơ quan trên tên tệp (${fn.agency}) là mã tạm của mẫu chung.`);

    const pick = pickSheets(wb.SheetNames);
    const T = {}, usable = {};
    for (const k of ORDER) {
      if (!pick.map[k]) { add('F02', k, null, '', '', `Không có trang “${SHEETS[k].name}”.`); T[k] = readTable(null); usable[k] = false; continue; }
      if (pick.renamed[k]) add('F02', k, null, '', '', `Trang “${pick.renamed[k]}” đã đổi tên; đổi lại đúng “${SHEETS[k].name}”.`);
      T[k] = readTable(wb.Sheets[pick.map[k]], k);
      const bad = (T[k].rows.length || Object.keys(T[k].hdr).length) ? headerMismatch(k, T[k]) : [];
      for (const b of bad) add('F03', k, T[k].hdrRow, b.col, '', `Cột ${b.col}: mẫu là “${b.expected}”, tệp ghi “${short(b.actual, 60)}”. Biểu này chưa được kiểm tra.`);
      usable[k] = bad.length === 0;
      if (!usable[k]) T[k] = Object.assign(readTable(null), { skipped: true, rowsAll: T[k].rows.length });
    }
    const ts = pick.extra.TS ? wb.Sheets[pick.extra.TS] : null;
    const P = readParams(wb, ts);
    const LS = P.lists;

    const A1 = T.A1.rows, A2 = T.A2.rows, B1 = T.B1.rows, B2 = T.B2.rows, C1 = T.C1.rows, C2 = T.C2.rows, C3 = T.C3.rows, D1 = T.D1.rows, D2 = T.D2.rows, DM = T.DM.rows;
    const a1By = indexBy(A1, 'A'), a2By = indexBy(A2, 'A'), b1By = indexBy(B1, 'A'), c1By = indexBy(C1, 'A'), c2By = indexBy(C2, 'A'), c3By = indexBy(C3, 'A'), dmBy = indexBy(DM, 'A');
    const code = (r) => txt(r.v.A);
    const vtvlOfJob = (job) => { const r = a2By.get(job); return r ? txt(r[0].v.C) : ''; };
    // C3 cột B của VTVL đã chọn phương pháp nhưng không có PP2 (chỉ PP1/PP3): không dùng giờ B1, không cần giờ PP2, không cần công việc B1.
    // C3 trống hoặc không có dòng của VTVL: trả về false (giữ cách kiểm tra cũ).
    const noPP2 = (vt) => { const x = vt ? c3By.get(vt) : null; const m = x ? txt(x[0].v.B) : ''; return !!m && !/PP2/i.test(m); };

    // TC_02: khung phút tham chiếu theo mã công việc
    const tc = new Map();
    if (pick.extra.TC02) {
      const ws = wb.Sheets[pick.extra.TC02]; const rg = decodeRef(ws['!ref'] || '');
      if (rg) {
        let hr = 0;
        for (let r = 1; r <= 6 && !hr; r++) { const a = ws['A' + r]; if (a && low(a.v) === 'mã công việc') hr = r; }
        if (hr) {
          let cMin = '', cMid = '', cMax = '';
          for (const c of COLS) {
            const h = low(ws[c + hr] ? ws[c + hr].v : '');
            if (!cMin && /tối thiểu|\bmin\b/.test(h)) cMin = c;
            else if (!cMid && /trung tâm/.test(h)) cMid = c;
            else if (!cMax && /tối đa|\bmax\b/.test(h)) cMax = c;
          }
          if (cMin && cMax) for (let r = hr + 1; r <= rg.r2; r++) {
            const a = ws['A' + r]; if (!a || blank(a.v)) continue;
            const mn = ws[cMin + r], mx = ws[cMax + r], md = cMid ? ws[cMid + r] : null;
            if (mn && mx && isNum(mn.v) && isNum(mx.v) && mx.v > 0) tc.set(txt(a.v), { min: mn.v, mid: md && isNum(md.v) ? md.v : null, max: mx.v });
          }
        }
      }
    }
    const tcOf = (row) => {
      const t = tc.get(code(row)); if (t) return t;
      const m = /(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*phút/i.exec(txt(row.v.I));
      return m ? { min: +m[1], mid: +m[2], max: +m[3] } : null;
    };

    // ---------- F04: tiền tố ----------
    const PH = /^(XXX|PXX)(?=[-.])/i;
    const phCols = [['A1', 'A'], ['A2', 'A'], ['A2', 'C'], ['B1', 'A'], ['B1', 'L'], ['B2', 'A'], ['C1', 'A'], ['C3', 'A'], ['D1', 'B'], ['D2', 'A'], ['DM', 'A']];
    const realAgency = fn.agency && !fn.placeholder;
    const phBySheet = {};
    for (const [k, c] of phCols) {
      let n = 0; for (const r of T[k].rows) if (PH.test(txt(r.v[c]))) n++;
      if (n) { phBySheet[k] = phBySheet[k] || { n: 0, cols: [] }; phBySheet[k].n += n; phBySheet[k].cols.push(c); }
    }
    for (const [k, o] of Object.entries(phBySheet)) {
      add('F04', k, null, o.cols.join(', '), '', `Còn ${fmt(o.n, 0)} mã có tiền tố tạm XXX/PXX (cột ${o.cols.join(', ')}).${realAgency ? ' Tệp đã mang mã ' + fn.agency + ' nên phải thay trước khi nộp.' : ''}`,
        { level: realAgency ? L_FIX : L_RV, count: o.n });
    }
    // Mã cơ quan trên tên tệp gồm k đoạn (SGDDT-HHN: k = 2) thì tiền tố đơn vị của mã cũng là k đoạn đầu
    // (SGDDT-HHN-NV-01 → SGDDT-HHN), không chỉ đoạn đầu. Không có mã cơ quan trên tên tệp: k = 1 như trước.
    const kSeg = Math.max(1, fn.segs.length);
    const prefixes = new Map();
    const fileAg = deaccent(fn.segs.join('-'));
    for (const r of A1) {
      const parts = code(r).split(/[-.]/);
      if (!parts[0] || PH.test(parts[0] + '-')) continue;
      let s = parts.slice(0, kSeg).join('-');
      // Đơn vị sự nghiệp thuộc xã: tệp X52-TH01, mã nhiệm vụ X52-SN-A1-TH01-001 (mã xã ở đầu, mã đơn vị ở đoạn sau) vẫn là cùng đơn vị
      if (kSeg > 1 && deaccent(s) !== fileAg && deaccent(parts[0]) === deaccent(fn.segs[0])) {
        const unit = deaccent(fn.segs.slice(1).join('-')), rest = parts.slice(1);
        for (let i = 0; i + kSeg - 1 <= rest.length; i++) if (deaccent(rest.slice(i, i + kSeg - 1).join('-')) === unit) { s = fn.segs.join('-'); break; }
      }
      prefixes.set(s, (prefixes.get(s) || 0) + 1);
    }
    const tmpNote = (s) => (/(^|-)THCSTHPT(-|$)/i.test(s) ? ' Mã còn phần tạm THCSTHPT của mẫu dùng chung: thay bằng mã trường khi tách tệp.' : '');
    if (prefixes.size > 1) add('F04', 'A1', null, 'A', '', `Mã nhiệm vụ dùng ${prefixes.size} tiền tố khác nhau (${[...prefixes.keys()].slice(0, 6).join(', ')}); mỗi tệp chỉ dùng một mã đơn vị.` + tmpNote([...prefixes.keys()].join(' ')), { level: L_FIX });
    else if (prefixes.size === 1 && realAgency) {
      const s = [...prefixes.keys()][0];
      if (deaccent(s) !== deaccent(fn.segs.join('-'))) add('F04', 'A1', null, 'A', '', `Tiền tố mã nhiệm vụ (${s}) khác mã cơ quan trên tên tệp (${fn.agency}).` + tmpNote(s), { level: L_FIX });
    }

    // ---------- F05: mã VTVL thiếu tiền tố xã/phường (Phụ lục 1, trang “Quy ước mã”, dòng 3) ----------
    const XA_SEG = /^(XXX|PXX|X\d{2}|P\d{2})$/i;
    const a1Segs = A1.map((r) => code(r).split(/[-.]/)[0]);
    // Mã xã/phường là đoạn đầu của mã cơ quan trên tên tệp (tên một đoạn như X05 thì là cả mã)
    const ag0 = fn.segs[0] || '';
    const xaLevel = XA_SEG.test(ag0) || (a1Segs.length > 0 && a1Segs.filter((s) => XA_SEG.test(s)).length > a1Segs.length / 2);
    const BASE_VT = /^[A-ZĐ]{1,8}-(LDQL|LĐQL|CM|HTPV|HT|PV)-\d{1,3}$/i;
    // Mã xã/phường thật (X01–X72, P01–P31): từ tên tệp, hoặc tiền tố chiếm đa số ở mã A1
    const REAL_SEG = /^(X\d{2}|P\d{2})$/i;
    let realSeg = REAL_SEG.test(ag0) ? ag0.toUpperCase() : '';
    if (!realSeg && a1Segs.length) {
      const cnt = new Map(); for (const s of a1Segs) if (REAL_SEG.test(s)) cnt.set(s.toUpperCase(), (cnt.get(s.toUpperCase()) || 0) + 1);
      for (const [s, n] of cnt) if (n > a1Segs.length / 2) realSeg = s;
    }
    if (xaLevel) {
      for (const [k, c] of [['C1', 'A'], ['A2', 'C'], ['C3', 'A'], ['D1', 'B'], ['D2', 'A']]) {
        const codes = new Set(); let n = 0;
        for (const r of T[k].rows) { const v = txt(r.v[c]); if (BASE_VT.test(v)) { n++; codes.add(v); } }
        if (n) add('F05', k, null, c, '', `${fmt(n, 0)} ô ở cột ${c} (${fmt(codes.size, 0)} mã, ví dụ “${[...codes].slice(0, 3).join('”, “')}”) chưa có tiền tố mã xã/phường, nên trùng mã giữa các xã khi tổng hợp. ` +
          (realSeg ? `Tệp đã mang mã ${realSeg}: phải thêm tiền tố này vào mã VTVL trước khi nộp.` : 'Trong mẫu chung, nên ghi XXX-VP-CM-03 để bước thay XXX áp dụng luôn cho mã VTVL.'),
          { count: n, level: realSeg ? L_FIX : L_RV });
      }
    }

    // ---------- L04: trùng mã ----------
    for (const [k, by] of [['A1', a1By], ['A2', a2By], ['C1', c1By], ['C3', c3By]]) {
      for (const [c, rows] of by) if (rows.length > 1) for (const r of rows.slice(1)) add('L04', k, r.r, 'A', c, `Mã “${c}” trùng với dòng ${rows[0].r}.`);
    }

    // ---------- A1 ----------
    const ttA1 = LS.TT_A1;
    for (const r of A1) {
      const F = r.v.F; const st = inList(F, ttA1); const c = code(r);
      let base = '';
      if (st === 'ok' || st === 'nfd') base = low(F);
      if (st === 'blank') add('A101', 'A1', r.r, 'F', c, 'Chưa chọn trạng thái nhiệm vụ.');
      else if (st === 'nfd') add('A101', 'A1', r.r, 'F', c, NFD_MSG);
      else if (st === 'bad') {
        const f = txt(F);
        const hit = ttA1.find((x) => low(f).indexOf(low(x)) === 0);
        if (txt(F) === '0') add('A101', 'A1', r.r, 'F', c, 'Trạng thái ghi số 0.');
        else if (hit) { base = low(hit); add('A101', 'A1', r.r, 'F', c, `Trạng thái “${short(f, 70)}” lẫn ghi chú; để “${hit}” ở cột F, chuyển phần còn lại sang cột G.`, { level: L_RV }); }
        else add('A101', 'A1', r.r, 'F', c, `Trạng thái “${short(f, 60)}” không có trong danh sách.`);
      }
      if (base === 'mới tiếp nhận' && blank(r.v.D)) add('A102', 'A1', r.r, 'D', c, 'Nhiệm vụ mới tiếp nhận chưa ghi văn bản giao ở cột D.');
      if ((base === 'đã chuyển giao' || base === 'không còn thực hiện') && (blank(r.v.G) || isPrefill('A1.G', r.v.G)))
        add('A102', 'A1', r.r, 'G', c, `Nhiệm vụ “${base === 'đã chuyển giao' ? 'Đã chuyển giao' : 'Không còn thực hiện'}” chưa ghi chuyển cho ai, văn bản, thời điểm ở cột G.`);
    }

    // ---------- A2 ----------
    // Chỉ xét phần hành động (trước "nhiệm vụ:", "đối với:", "liên quan đến:"), vì phía sau là tên nhiệm vụ chép lại, thường bắt đầu bằng
    // "Quyết định…" hoặc liệt kê mọi mảng của nhiệm vụ ("…hồ sơ liên quan đến: Thực hiện quản lý tài chính, kế toán, ngân sách…").
    const DECIDE = /quyết định\/(kết luận|ban hành) theo thẩm quyền|xem xét,? quyết định|ký (ban hành|duyệt)|^phê duyệt/i;
    const NOT_DECIDE = /trình|xin ý kiến|đề nghị|sau quyết định/i;
    const actionOf = (s) => { const t = txt(s); const m = /nhiệm vụ:|đối với:|liên quan đến:/.exec(t.toLowerCase()); return (m ? t.slice(0, m.index) : t).replace(/\s*đối với\s*$/i, '').trim(); };
    const isCM = (v) => /-CM-/i.test(v) || /^CMNV\b/i.test(v) || /(^|[-.])CMNV([-.]|$)/i.test(v);
    // L02: mã bắt đầu bằng mã nhiệm vụ nhưng phần đuôi khác "-NN" thì ghi lại dạng đuôi (chữ số thành N) để gộp khi lặp nhiều lần
    const l02 = [];
    for (const r of A2) {
      const c = code(r), b = txt(r.v.B), vt = txt(r.v.C);
      if (T.A1.rows.length && b && !a1By.has(b)) add('L01', 'A2', r.r, 'B', c, `Mã nhiệm vụ “${b}” không có ở A1.`);
      else if (!b) add('L01', 'A2', r.r, 'B', c, 'Chưa ghi mã nhiệm vụ.');
      if (b && !(c.indexOf(b + '-') === 0 && /^\d{2}$/.test(c.slice(b.length + 1))))
        l02.push({ r, c, b, pat: c.indexOf(b) === 0 && c.length > b.length ? '<mã nhiệm vụ>' + c.slice(b.length).replace(/\d/g, 'N') : '' });
      if (!vt) add('L03', 'A2', r.r, 'C', c, 'Chưa gắn mã VTVL.');
      else if (vt.indexOf('/') >= 0) add('L03', 'A2', r.r, 'C', c, `Một ô ghi hai mã VTVL (“${short(vt, 50)}”).`);
      else if (C1.length && !c1By.has(vt)) add('L03', 'A2', r.r, 'C', c, `Mã VTVL “${vt}” không có ở C1.`);
      const prod = txt(r.v.E);
      if (!prod || blank(r.v.F)) add('A204', 'A2', r.r, !prod ? 'E' : 'F', c, !prod ? 'Chưa ghi sản phẩm đầu ra.' : 'Chưa ghi đơn vị tính.');
      if (prod.indexOf('/') >= 0) add('A201', 'A2', r.r, 'E', c, `Sản phẩm “${short(prod, 60)}” ghép nhiều loại.`, { group: prod, jobName: txt(r.v.D), unit: txt(r.v.F), hasB1: false });
      const a1r = a1By.get(b);
      if (a1r && low(r.v.D) && low(r.v.D) === low(a1r[0].v.B)) add('A202', 'A2', r.r, 'D', c, 'Tên công việc trùng nguyên tên nhiệm vụ ở A1.');
      const act = actionOf(r.v.D);
      if (isCM(vt) && DECIDE.test(act) && !NOT_DECIDE.test(act)) add('A203', 'A2', r.r, 'D', c, `Bước quyết định theo thẩm quyền (“${short(act, 60)}”) đang gán cho VTVL chuyên môn ${vt}.`);
    }
    // Từ 10 mã cùng một dạng lệch trở lên (ví dụ "<mã nhiệm vụ>-CV-NN" cả biểu) là quy ước của mẫu: gộp thành một mục Nên xem lại
    const l02Pat = new Map();
    for (const x of l02) if (x.pat) { if (!l02Pat.has(x.pat)) l02Pat.set(x.pat, []); l02Pat.get(x.pat).push(x); }
    for (const x of l02) {
      const grp = x.pat ? l02Pat.get(x.pat) : null;
      if (grp && grp.length >= 10) {
        if (grp[0] !== x) continue;
        add('L02', 'A2', x.r.r, 'A', '', `${fmt(grp.length, 0)} mã công việc có dạng “${x.pat}” thay vì “<mã nhiệm vụ>-NN” (mã nhiệm vụ + số thứ tự 02 chữ số), ví dụ ${grp.slice(0, 3).map((y) => y.c).join(', ')}.`,
          { level: L_RV, count: grp.length, fix: 'Cả biểu dùng chung một quy ước mã: nếu giữ, ghi rõ quy ước trong thuyết minh; nếu sửa, đổi đồng loạt thành mã nhiệm vụ + "-" + 2 chữ số và sửa theo ở B1, B2.' });
      } else add('L02', 'A2', x.r.r, 'A', x.c, `Mã công việc “${x.c}” không có dạng “${x.b}-NN”.`);
    }

    // ---------- B1 ----------
    let b1FormulaB = 0, b1PosB = 0, b1PosDM = 0;
    for (const r of B1) { if (r.f.B) b1FormulaB++; }
    const b1Calc = new Map(); // row -> calc
    const enteredByJob = new Map();
    const b1Soft = { outRange: 0 };
    let b104Exempt = 0;
    const kyCheck = (r, col, sheet, rule, c) => {
      const k = r.v[col];
      if (blank(k)) { add(rule, sheet, r.r, col, c, 'Thiếu kỳ.'); return; }
      if (kyOk(k)) return;
      if (isPrefill('KY', k)) add(rule, sheet, r.r, col, c, `Kỳ vẫn là câu mẫu (“${short(k, 40)}”); ghi kỳ chung ${KY_CHUAN}.`);
      else add(rule, sheet, r.r, col, c, `Kỳ “${short(k, 40)}” khác kỳ chung ${KY_CHUAN}.`);
    };
    for (const r of B1) {
      const c = code(r);
      const C = r.v.C, D = r.v.D, E = r.v.E;
      const entered = !blank(C) || !blank(D) || !blank(E);
      const vt = vtvlOfJob(c);
      // liên kết
      if (A2.length && !a2By.has(c)) add('L05', 'B1', r.r, 'A', c, `Mã công việc “${c}” không có ở A2.`);
      const fb = r.f.B || '';
      const mb = /A2_CongViec'?!\$C\$(\d+)(?![\d:])/.exec(fb);
      if (mb) {
        b1PosB++;
        const tr = T.A2.byRow.get(+mb[1]);
        if (A2.length && (!tr || code(tr) !== c)) add('L06', 'B1', r.r, 'B', c, `Công thức cột B lấy mã VTVL ở dòng ${mb[1]} của A2${tr ? ' (công việc ' + code(tr) + ')' : ''}, không phải công việc này.`);
      } else if (!fb && b1FormulaB > 0 && A2.length) {
        add('L06', 'B1', r.r, 'B', c, 'Dòng chưa có công thức lấy mã VTVL (dòng thêm mới?).');
      } else if (!fb && !blank(r.v.B) && vt && txt(r.v.B) !== vt) {
        add('L06', 'B1', r.r, 'B', c, `Mã VTVL ở cột B (${txt(r.v.B)}) khác mã ở A2 (${vt}).`);
      }
      const L = txt(r.v.L);
      const dmr = L ? dmBy.get(L) : null;
      if (L && DM.length && !dmr) add('L07', 'B1', r.r, 'L', c, `Mã sản phẩm “${L}” không có trong danh mục.`);
      const fn2 = r.f.N || '';
      const mn = /DM_SAN_PHAM'?!\$E\$(\d+)(?![\d:])/.exec(fn2);
      if (mn) {
        b1PosDM++;
        const tr = T.DM.byRow.get(+mn[1]);
        if (L && DM.length && (!tr || code(tr) !== L)) add('L07', 'B1', r.r, 'N', c, `Đã đổi mã SP thành “${L}” nhưng công thức vẫn tra dòng ${mn[1]} của danh mục${tr ? ' (' + code(tr) + ')' : ''}.`);
      }
      // tính lại theo logic cột R (tra theo mã)
      const dm = dmr ? dmr[0] : null;
      const dmE = dm && isNum(dm.v.E) ? dm.v.E : null;
      const dmStd = dmE !== null && dmE > 0 && low(dm.v.G) === 'đã xác nhận';
      // Câu mẫu ở S ("Mẫu công việc, chưa phải sản lượng…") không phải giải trình khác chuẩn: coi như trống.
      const pfS = isPrefill('B1.S', r.v.S), pfK = !blank(r.v.K) && !kyOk(r.v.K) && isPrefill('KY', r.v.K);
      const S = pfS ? '' : txt(r.v.S);
      const J = low(r.v.J), H = r.v.H, I = r.v.I;
      const jKD = J === low(LISTS.TT_B1[1]), jDM = J === low(LISTS.TT_B1[0]);
      let status;
      let Pm = '';
      if (!vt) status = 'THIẾU MÃ VTVL';
      else if (blank(H)) status = 'THIẾU NGUỒN SẢN LƯỢNG';
      else if (blank(r.v.K)) status = 'THIẾU KỲ';
      else if (blank(C) && isNum(E) && E > 0 && !blank(I)) status = 'ĐẠT';
      else if (blank(C)) status = 'THIẾU SẢN LƯỢNG';
      else if (!J) status = 'CHƯA CHỌN TRẠNG THÁI';
      else if (dmStd && S && low(S).indexOf('đã xác nhận:') !== 0) status = 'CHỜ XÁC NHẬN KHÁC CHUẨN';
      else if (blank(I) && !(dmStd && !S)) status = 'THIẾU NGUỒN THỜI GIAN';
      else {
        if (dmStd && !S) Pm = dmE;
        else if (isNum(D) && D > 0 && (jKD || (jDM && !blank(I)))) Pm = D;
        status = Pm === '' ? 'THIẾU THỜI GIAN' : (isNum(C) ? 'ĐẠT' : 'LỖI SỐ');
      }
      let hours = null;
      if (status === 'ĐẠT') {
        const f = (blank(C) && isNum(E) && E > 0) ? 0 : C * Pm / 60;
        hours = f + (isNum(E) ? E : 0);
      }
      const pfH = isPrefill('B1.H', H), pfI = isPrefill('B1.I', I);
      // Phiếu giữ nguyên phút gợi ý: I = "Mức tham khảo: <căn cứ gợi ý>; chưa đo thực tế" → chưa đủ căn cứ
      const lI = low(I), refI = !pfI && lI.indexOf('mức tham khảo:') === 0 && lI.indexOf('chưa đo thực tế') >= 0;
      const calc = { vt, status, hours, pfH, pfI, pfK, pfS, refI, entered, dmStd };
      b1Calc.set(r, calc);
      if (!entered) continue;
      if (!enteredByJob.has(c)) enteredByJob.set(c, []);
      enteredByJob.get(c).push(r);
      // B101, B102
      for (const [col, v] of [['C', C], ['D', D], ['E', E]]) {
        if (v === 0) add('B101', 'B1', r.r, col, c, `Ô ${col} ghi số 0.`);
        if (typeof v === 'string' && !blank(v)) add('B102', 'B1', r.r, col, c, numericText(v) ? `Ô ${col} là số nhưng đang lưu dạng chữ (“${short(v, 20)}”); Excel không tính.` : `Ô ${col} chứa chữ (“${short(v, 30)}”).`);
      }
      if (isNum(C) && (C < 0 || !Number.isInteger(C))) add('B102', 'B1', r.r, 'C', c, `Số sản phẩm ${fmt(C)} phải là số nguyên không âm.`);
      if (isNum(D) && D < 0) add('B102', 'B1', r.r, 'D', c, `Phút/SP ${fmt(D)} phải lớn hơn 0.`);
      if (isNum(E) && E < 0) add('B102', 'B1', r.r, 'E', c, `Giờ bổ sung ${fmt(E)} không được âm.`);
      // B103
      if (blank(H)) add('B103', 'B1', r.r, 'H', c, 'Thiếu nguồn sản lượng.', { level: L_FIX });
      else if (pfH) add('B103', 'B1', r.r, 'H', c, 'Cột H vẫn là câu mẫu; Excel vẫn có thể báo ĐẠT.');
      // B104 (nguồn thời gian/phút). VTVL mà C3 chọn phương pháp không có PP2 không dùng giờ B1: không báo, chỉ đếm (như C102).
      if (!(dmStd && !S)) {
        const b104 = noPP2(vt || txt(r.v.B)) ? () => { b104Exempt++; } : add;
        if (jDM && (blank(I) || pfI)) b104('B104', 'B1', r.r, 'I', c, blank(I) ? 'Chọn "Có định mức" nhưng chưa ghi văn bản định mức.' : 'Chọn "Có định mức" nhưng cột I vẫn là câu mẫu; ghi số hiệu văn bản định mức.', { level: L_FIX });
        else if (blank(I)) b104('B104', 'B1', r.r, 'I', c, 'Thiếu nguồn thời gian.', { level: L_FIX });
        else if (pfI) b104('B104', 'B1', r.r, 'I', c, 'Cột I vẫn là câu mẫu (khung TC_02 chỉ để tham chiếu).');
        else if (refI) b104('B104', 'B1', r.r, 'I', c, 'Phút/SP theo mức tham khảo, chưa đo.',
          { fix: 'Đo thực tế 3–5 lần (phiếu đo, người xác nhận), sửa phút/SP ở cột D và ghi nguồn ở cột I; trước khi đo xong, dòng này nằm trong danh sách nội dung chưa đủ căn cứ nộp kèm đợt 1.' });
      }
      // B105, B106
      if (isNum(D) && D > 0) {
        const t = tcOf(r);
        if (t) {
          if (D < t.min / 2 || D > t.max * 2) add('B105', 'B1', r.r, 'D', c, `${fmt(D)} phút/SP; khung tham chiếu ${fmt(t.min, 0)}–${fmt(t.max, 0)} phút.`);
          else if (D < t.min || D > t.max) b1Soft.outRange++;
        }
        // B106: D trùng phút ở DM_SAN_PHAM của mã SP cột L (mức PL3 × 60) thì là mức tham khảo, không phải thời hạn giải quyết
        if (D >= 1440 && D % 480 === 0 && D !== dmE) add('B106', 'B1', r.r, 'D', c, `${fmt(D, 0)} phút = ${fmt(D / 480, 0)} ngày làm việc tròn.`);
        // B110: lệch xa phút ở DM_SAN_PHAM (mức tham khảo) quá 4 lần
        if (dmE !== null && dmE > 0 && (D < dmE / 4 || D > dmE * 4))
          add('B110', 'B1', r.r, 'D', c, `${fmt(D)} phút/SP lệch xa mức tham khảo ${isPL3Hours(dmE / 60) ? 'PL3 ' : ''}ở DM_SAN_PHAM ${L} (${fmt(dmE, 0)} phút); kiểm tra lại cách đo.`);
      }
      // B107
      kyCheck(r, 'K', 'B1', 'B107', c);
      if (LISTS.KIEM_CHUNG.some((x) => low(x) === J) && inList(r.v.J, LS.TT_B1) === 'bad') add('B107', 'B1', r.r, 'J', c, `“${txt(r.v.J)}” thuộc danh sách kiểm chứng, không phải trạng thái căn cứ thời gian; Excel sẽ không lấy phút ở cột D.`);
      else listIssue('B107', 'B1', r, 'J', c, LS.TT_B1, 'trạng thái căn cứ thời gian', true);
      // B109
      if (dmStd && S && low(S).indexOf('đã xác nhận:') !== 0) add('B109', 'B1', r.r, 'S', c, 'Có giải trình khác phút chuẩn nhưng chưa ghi “Đã xác nhận:”.');
    }
    for (const [c, rows] of enteredByJob) if (rows.length > 1) for (const r of rows.slice(1)) add('B108', 'B1', r.r, 'A', c, `Công việc đã có số liệu ở dòng ${rows[0].r}.`);
    for (const it of issues) if (it.rule === 'A201') it.hasB1 = enteredByJob.has(it.code);

    // ---------- B2 ----------
    let b2PosB = 0, b2PosP = 0;
    const b1SumC = new Map(), b1HoursJob = new Map(), b1FirstD = new Map();
    for (const r of B1) {
      const c = code(r);
      if (isNum(r.v.C)) b1SumC.set(c, (b1SumC.get(c) || 0) + r.v.C);
      const k = b1Calc.get(r); if (k && k.hours !== null) b1HoursJob.set(c, (b1HoursJob.get(c) || 0) + k.hours);
      if (isNum(r.v.D) && !b1FirstD.has(c)) b1FirstD.set(c, r.v.D);
    }
    const b2Net = new Map(); // vtvl -> {up, down, rows}
    for (const r of B2) {
      const c = code(r);
      const vt = vtvlOfJob(c);
      if (A2.length && !a2By.has(c)) add('L05', 'B2', r.r, 'A', c, `Mã công việc “${c}” không có ở A2.`);
      const mb = /A2_CongViec'?!\$C\$(\d+)(?![\d:])/.exec(r.f.B || '');
      if (mb) { b2PosB++; const tr = T.A2.byRow.get(+mb[1]); if (A2.length && (!tr || code(tr) !== c)) add('L06', 'B2', r.r, 'B', c, `Công thức cột B lấy mã VTVL ở dòng ${mb[1]} của A2, không phải công việc này.`); }
      const mp = /B1_KhoiLuong'?!\$C\$(\d+)(?![\d:])/.exec(r.f.P || '');
      if (mp) { b2PosP++; const tr = T.B1.byRow.get(+mp[1]); if (B1.length && (!tr || code(tr) !== c)) add('L06', 'B2', r.r, 'P', c, `Công thức kiểm tra cột P so với dòng ${mp[1]} của B1${tr ? ' (công việc ' + code(tr) + ')' : ''}.`); }
      const M = low(r.v.M);
      const E = r.v.E, F = r.v.F, G = r.v.G, I = r.v.I, L = low(r.v.L), S = low(r.v.S);
      const active = (M !== '' && M !== 'ước lượng tham khảo') || !blank(E) || !blank(F) || !blank(G) || !blank(I);
      // tính lại cột P (tra theo mã)
      const Hh = (isNum(E) && isNum(F) && isNum(G) && F >= G) ? E * (F - G) / 60 : null;
      let st;
      if (M === 'ước lượng tham khảo') st = 'THAM KHẢO';
      else if (!vt || blank(r.v.D) || blank(r.v.J) || blank(r.v.K) || !L || M !== 'đã kiểm chứng') st = 'CHƯA ĐỦ CĂN CỨ';
      else if (inList(r.v.C, LS.LOAI_TD) !== 'ok') st = 'LOẠI TÁC ĐỘNG KHÔNG HỢP LỆ';
      else if (S !== 'đã đối chiếu') st = 'CHỜ SOÁT TRÙNG';
      else if (Hh === null && blank(I)) st = 'THIẾU GIỜ TÁC ĐỘNG';
      else if (Hh !== null && !(isNum(E) && E > 0)) st = 'THIẾU SẢN PHẨM ÁP DỤNG';
      else if (Hh !== null && E > (b1SumC.get(c) || 0)) st = 'VƯỢT B1';
      else if (isNum(F) && isNum(G) && F < G && !(isNum(I) && I > 0)) st = 'TĂNG CHƯA GHI GIỜ';
      else if (L === low(LISTS.CO_SO_B1[0]) && Hh !== null && Hh > (b1HoursJob.get(c) || 0)) st = 'GIẢM VƯỢT B1';
      else st = 'ĐẠT';
      if (st === 'ĐẠT' && vt) {
        const o = b2Net.get(vt) || { up: 0, down: 0, rows: 0 };
        if (L === low(LISTS.CO_SO_B1[0]) && Hh !== null) o.down += Hh;
        if (isNum(I)) o.up += I;
        o.rows++; b2Net.set(vt, o);
      }
      if (!active) continue;
      if ((M === 'đã kiểm chứng' || M === 'chưa kiểm chứng') && (blank(r.v.J) || isPrefill('B2.J', r.v.J)))
        add('B201', 'B2', r.r, 'J', c, blank(r.v.J) ? 'Thiếu nguồn/bằng chứng.' : 'Đã đổi trạng thái nhưng cột J vẫn là câu mẫu.');
      for (const [col, list, nm] of [['C', LS.LOAI_TD, 'loại tác động'], ['L', LS.CO_SO_B1, 'cơ sở B1'], ['M', LS.TT_B2CT, 'trạng thái'], ['S', LS.DOI_CHIEU, 'đối chiếu']])
        listIssue('B202', 'B2', r, col, c, list, nm, true);
      kyCheck(r, 'K', 'B2', 'B202', c);
      if (isNum(E) && E > 0) {
        const sc = b1SumC.get(c);
        if (!sc) add('B203', 'B2', r.r, 'E', c, 'Công việc chưa có sản lượng ở B1 để áp dụng tác động.');
        else if (E > sc) add('B203', 'B2', r.r, 'E', c, `SP áp dụng ${fmt(E)} lớn hơn sản lượng B1 (${fmt(sc)}).`);
      }
      const bd = b1FirstD.get(c);
      if (isNum(F) && isNum(G) && isNum(bd)) {
        if (L === low(LISTS.CO_SO_B1[0]) && bd === G && F !== G) add('B204', 'B2', r.r, 'L', c, `B1 ghi ${fmt(bd)} phút/SP, bằng phút sau thay đổi: có thể trừ hai lần.`);
        if (L === low(LISTS.CO_SO_B1[1]) && bd === F && F !== G) add('B204', 'B2', r.r, 'L', c, `B1 ghi ${fmt(bd)} phút/SP, bằng phút trước thay đổi: phần giảm chưa được trừ.`);
      }
      if (isNum(F) && isNum(G) && F < G && blank(I)) add('B205', 'B2', r.r, 'I', c, `Phút sau (${fmt(G)}) lớn hơn phút trước (${fmt(F)}).`);
      if (M === 'đã kiểm chứng' && S !== 'đã đối chiếu') add('B206', 'B2', r.r, 'S', c, 'Dòng chưa được cộng vào C3.');
    }

    // ---------- C1, C2 ----------
    let c1FormulaE = 0; for (const r of C1) if (r.f.E) c1FormulaE++;
    const quyOf = (vt) => {
      const rr = c1By.get(vt); if (!rr) return null; const r = rr[0];
      const J = low(r.v.J), H = r.v.H;
      if (J !== low(LISTS.CHE_DO[0]) && J !== low(LISTS.CHE_DO[1])) return null;
      if (J === low(LISTS.CHE_DO[1]) || !blank(H)) return (isNum(H) && H > 0 && !blank(r.v.F) && low(r.v.I) === 'đã kiểm chứng') ? H : null;
      return P.quy;
    };
    let staleE = 0;
    let c102Exempt = 0;
    for (const r of C1) {
      const c = code(r);
      if (c.indexOf('/') >= 0) add('C101', 'C1', r.r, 'A', c, 'Một dòng ghi hai mã VTVL; tách thành hai dòng.');
      for (const [col, list, nm, f] of [['C', LS.LOAI_NL, 'loại nhân lực', false], ['G', LS.TT_C1, 'trạng thái', false], ['J', LS.CHE_DO, 'chế độ làm việc', true]])
        listIssue('C101', 'C1', r, col, c, list, nm, f);
      const J = low(r.v.J), H = r.v.H, F = r.v.F;
      if ((J === 'đặc thù' || !blank(H)) && (blank(F) || isPrefill('C1.F', F) || low(r.v.I) !== 'đã kiểm chứng')) {
        if (noPP2(c)) c102Exempt++; // giờ riêng chỉ dùng cho PP2
        else add('C102', 'C1', r.r, blank(F) || isPrefill('C1.F', F) ? 'F' : 'I', c, blank(F) || isPrefill('C1.F', F) ? 'Có giờ riêng/chế độ đặc thù nhưng cột F chưa ghi văn bản căn cứ.' : 'Giờ riêng chưa được xác nhận “Đã kiểm chứng”.');
      }
      if (H === P.quy) add('C103', 'C1', r.r, 'H', c, `Giờ riêng ${fmt(H, 0)} trùng mức chung; để trống.`);
      else if (H === 1600 && (blank(F) || isPrefill('C1.F', F))) add('C103', 'C1', r.r, 'H', c, 'Giờ riêng 1.600 chưa có văn bản căn cứ.');
      if (c1FormulaE > 0 && !r.f.E) add('C104', 'C1', r.r, 'E', c, `Ô E không còn công thức (đang ghi “${short(r.v.E, 20)}”).`);
      if (r.f.E && J === low(LISTS.CHE_DO[0]) && blank(H) && ('E' in r.v) && Number(r.v.E) !== P.quy) staleE++;
    }
    if (usable.C2) for (const r of C1) if (!c2By.has(code(r))) add('C201', 'C1', r.r, 'A', code(r), 'VTVL chưa có dòng ở C2.');
    const a2Vt = new Set(A2.map((r) => txt(r.v.C)).filter(Boolean));
    // C105: miễn khi C3 chỉ dùng PP1/PP3 hoặc ghi "Tính chung khối lượng với…"
    let c105Exempt = 0;
    if (A2.length) for (const r of C1) {
      if (a2Vt.has(code(r))) continue;
      const c3r = c3By.get(code(r)); const kk = c3r ? low(c3r[0].v.K) : '';
      if (noPP2(code(r)) || kk.indexOf('tính chung khối lượng với') >= 0) { c105Exempt++; continue; }
      add('C105', 'C1', r.r, 'A', code(r), 'VTVL chưa có công việc nào ở A2.');
    }

    // ---------- họ chức trách hỗ trợ: A205, A206, C203 ----------
    // Thủ quỹ xét trước kế toán: "thu, chi và bảo quản quỹ theo chứng từ" là việc của thủ quỹ dù có chữ "chứng từ".
    // name: nhận họ theo tên VTVL · work: nhận mảng của công việc (A205) và của mô tả C2 (C203) · desc: chỉ dùng thêm cho mô tả C2
    // core: từ khóa đặc trưng, dùng khi VTVL được gán không thuộc họ hỗ trợ nào ("tài chính", "ngân sách", "dự toán",
    //       "chuyển đổi số"… còn là tên lĩnh vực quản lý ngành nên không đủ để coi là việc của kế toán, CĐS).
    // Thủ quỹ: "tiền mặt" (trừ "không dùng tiền mặt"), "thu tiền", "biên lai" nhận việc thu chi của thủ quỹ ("Thực hiện thu chi tiền mặt, bảo quản tiền
    // và đối chiếu quỹ theo chứng từ", "Thu tiền dịch vụ…; xuất biên lai"); các từ rộng này không có trong core nên không làm VTVL ngoài họ bị báo.
    const CASH = (l) => l.replace(/không dùng tiền mặt/g, '').indexOf('tiền mặt') >= 0;
    const TQ_CORE = ['thủ quỹ', 'quỹ tiền mặt', /thu,? chi tiền mặt/, 'sổ quỹ', /thu,? chi[^.;]{0,30}quỹ/, 'bảo quản quỹ', 'bảo quản tiền', 'đối chiếu quỹ', 'tồn quỹ', 'kiểm kê quỹ', 'giấy tờ có giá'];
    const FAMILIES = [
      { id: 'chuyển đổi số', name: ['chuyển đổi số', 'công nghệ thông tin'], work: ['chuyển đổi số', 'công nghệ thông tin', 'nền tảng số', 'quản trị hệ thống'], core: ['quản trị hệ thống'] },
      { id: 'thủ quỹ', name: ['thủ quỹ'], work: TQ_CORE.concat([CASH, 'thu tiền', 'biên lai']), core: TQ_CORE,
        desc: (l) => l.indexOf('quỹ') >= 0 && /(^|[^\p{L}])(thu|chi)([^\p{L}]|$)|bảo quản|kiểm kê/u.test(l) },
      { id: 'kế toán', name: ['kế toán'], work: ['kế toán', 'tài chính', 'chứng từ', 'ngân sách', 'dự toán', 'quyết toán'], core: ['kế toán', 'chứng từ'],
        desc: (l) => ['phần hành', 'hạch toán', 'sổ kế toán', 'báo cáo tài chính'].some((w) => l.indexOf(w) >= 0) },
      { id: 'văn thư', name: ['văn thư', 'lưu trữ'], work: ['văn thư', 'lưu trữ', 'văn bản đến', 'văn bản đi'], core: ['văn thư', 'văn bản đến', 'văn bản đi'] },
      { id: 'cơ yếu', name: ['cơ yếu'], work: ['cơ yếu', 'điện mật'] },
    ];
    const FAM = {}; for (const f of FAMILIES) FAM[f.id] = f;
    const kwHit = (l, w) => (typeof w === 'string' ? l.indexOf(w) >= 0 : typeof w === 'function' ? w(l) : w.test(l));
    const famIn = (text, key) => { const l = low(text); return l ? FAMILIES.filter((f) => f[key].some((w) => kwHit(l, w))).map((f) => f.id) : []; };
    const vtName = new Map(C1.map((r) => [code(r), txt(r.v.B)]));
    // Họ của VTVL lấy theo phần đầu tên (trước dấu phẩy, chấm phẩy đầu tiên): tên dài liệt kê nhiều lĩnh vực
    // ("Chuyên viên … kiểm soát thủ tục hành chính, …, ứng dụng công nghệ thông tin") không phải vị trí hỗ trợ.
    const vtFam = new Map(C1.map((r) => [code(r), famIn(txt(r.v.B).split(/[,;]/)[0], 'name')]));
    // VTVL hợp với mảng việc khi tên có từ khóa của mảng ("Chuyên viên về tài chính Đảng" làm việc tài chính, ngân sách)
    const vtFits = new Map(C1.map((r) => [code(r), famIn(r.v.B, 'name').concat(famIn(r.v.B, 'work'))]));
    const LEADER = /^(phó\s+)?(trưởng|chánh|giám đốc|chủ tịch|hiệu trưởng|bí thư|chi cục trưởng|cục trưởng|tổng biên tập|chủ nhiệm|thủ trưởng)/;
    const isLeader = (vt) => /-(LDQL|LĐQL)-/i.test(vt) || LEADER.test(low(vtName.get(vt)));
    // Phạm vi đơn vị của VTVL: các đoạn mã đứng trước mã nhóm (LDQL, CM, HTPV, TK theo Phụ lục 1; HT, PV của mẫu đơn vị sự nghiệp;
    // CMNV, LĐQL), bỏ mã xã/mã tạm ở đầu khi sau đó còn đoạn đơn vị. Ở cấp xã đúng bằng hai đoạn đầu của mã:
    // XXX-MN-CM-01, XXX-MN-HT-02 → MN; XXX-DVTH-CM-02 → DVTH; X52-TH01-CM-01 → TH01; XXX-DC-CM-04, XXX-DC-HTPV-01 → DC.
    // Cấp thành phố: SCT-CM-19, SCT-HTPV-01 → SCT; STC.CMNV-37 → STC; SGDDT-HHN-CM-01 → SGDDT-HHN; SYT-CCATTP-CM-04 → SYT-CCATTP.
    // Mã mở đầu bằng mã nhóm (CMNV.25): chưa rõ đơn vị, không xét. Mã không có mã nhóm: hai đoạn đầu.
    const TYPE_SEG = /^(CM|CMNV|LDQL|LĐQL|HTPV|HT|PV|TK)$/;
    const scopeOf = (v) => {
      const s = txt(v).toUpperCase().split(/[-.]/).filter(Boolean);
      if (!s.length || TYPE_SEG.test(s[0])) return '';
      const i = s.findIndex((x) => TYPE_SEG.test(x));
      let p = i > 0 ? s.slice(0, i) : s.slice(0, 2);
      if (i > 1 && /^(XXX|PXX|X\d{2}|P\d{2})$/.test(p[0])) p = p.slice(1);
      return p.join('-');
    };
    const famVt = new Map();
    for (const r of C1) { const sc = scopeOf(code(r)); if (sc) for (const f of vtFam.get(code(r))) { const k = sc + '|' + f; if (!famVt.has(k)) famVt.set(k, []); famVt.get(k).push(code(r)); } }
    const jobsByVt = new Map();
    for (const r of A2) {
      const vt = txt(r.v.C); if (!vt) continue;
      if (!jobsByVt.has(vt)) jobsByVt.set(vt, []);
      jobsByVt.get(vt).push(r);
      const act = actionOf(r.v.D);
      if (DECIDE.test(act) && !NOT_DECIDE.test(act)) continue; // bước quyết định theo thẩm quyền: A203 xử lý
      let jf = famIn(act, 'work'), fromTask = false;
      if (!jf.length) {
        // lấy theo vế chính của tên nhiệm vụ (trước dấu ";"), chỉ khi khớp đúng một họ
        const t = a1By.get(txt(r.v.B)); const tf = t ? famIn(txt(t[0].v.B).split(';')[0], 'work') : [];
        if (tf.length === 1) { jf = tf; fromTask = true; }
      }
      if (!jf.length) continue;
      const g = vtFam.get(vt) || [];
      if (g.concat(vtFits.get(vt) || []).some((f) => jf.indexOf(f) >= 0)) continue;
      if (!g.length) {
        // VTVL ngoài các họ hỗ trợ: chỉ báo khi chính phần hành động có từ khóa đặc trưng, và VTVL không phải lãnh đạo
        // (lãnh đạo chỉ đạo, kiểm soát mọi mảng).
        if (fromTask || isLeader(vt)) continue;
        const la = low(act);
        jf = jf.filter((f) => (FAM[f].core || FAM[f].work).some((w) => kwHit(la, w)));
        if (!jf.length) continue;
      }
      // Chỉ báo khi cùng đơn vị (scopeOf) có VTVL thuộc đúng mảng việc: trường mầm non không có vị trí chuyển đổi số thì văn thư
      // cập nhật CSDL không bị báo dù trung tâm dịch vụ tổng hợp của xã có vị trí đó.
      const sc = scopeOf(vt);
      let sug = null;
      for (const f of jf) { const x = (famVt.get(sc + '|' + f) || []).find((y) => y !== vt); if (x) { sug = [f, x]; break; } }
      if (!sug) continue;
      add('A205', 'A2', r.r, 'C', code(r), `Công việc thuộc mảng ${sug[0]} nhưng gán cho ${vtName.get(vt) || vt}; trong đơn vị có ${sug[1]} (${vtName.get(sug[1]) || ''}).`);
    }
    const GENERIC = ['nghiên cứu căn cứ', 'rà soát căn cứ', 'xác định yêu cầu', 'thu thập', 'phân tích, tổng hợp', 'xây dựng dự thảo', 'lấy ý kiến', 'hoàn thiện hồ sơ'];
    // Câu dẫn chung dùng cho nhiều VTVL ("Thực hiện trách nhiệm theo Bản mô tả công việc…") là câu trỏ tới bản mô tả,
    // không phải mô tả chép của vị trí khác: C203 bỏ qua khi cùng một câu dùng cho từ 5 dòng C2 trở lên.
    const c2Key = (s) => low(s).replace(/\d+/g, '#');
    const c2Share = new Map(); for (const r of C2) { const k = c2Key(r.v.B); if (k) c2Share.set(k, (c2Share.get(k) || 0) + 1); }
    for (const r of C1) {
      const c = code(r); const g = vtFam.get(c) || [];
      if (!g.length) continue;
      const jobs = jobsByVt.get(c) || [];
      if (jobs.length && jobs.every((j) => { const a = low(actionOf(j.v.D)); return GENERIC.some((p) => a.indexOf(p) === 0); }))
        add('A206', 'C1', r.r, 'A', c, `${vtName.get(c)}: ${jobs.length > 1 ? fmt(jobs.length, 0) + ' công việc đều là' : 'công việc duy nhất là'} bước khuôn chung. Chưa có công việc vận hành thường xuyên (văn bản đến/đi, chứng từ, phiếu thu chi, điện mật, lượt hỗ trợ…), nên PP2 thiếu phần việc chính của vị trí.`);
      const c2 = c2By.get(c);
      const desc = c2 ? low(c2[0].v.B) : '';
      if (desc && (c2Share.get(c2Key(desc)) || 0) < 5 && !FAMILIES.filter((f) => g.indexOf(f.id) >= 0).some((f) => f.work.some((w) => kwHit(desc, w)) || (f.desc && f.desc(desc))))
        add('C203', 'C2', c2[0].r, 'B', c, `${vtName.get(c)}: trách nhiệm ở C2 không nhắc đến mảng ${g.join(', ')}.`);
    }

    // ---------- F06: ghi chú làm việc trong cột nguồn ----------
    const NOTE_RE = /\bjudge\b|\btodo\b|chatgpt|\bclaude\b|\bprompt\b/i;
    for (const [k, cols] of [['A1', 'DG'], ['A2', 'H'], ['B1', 'HIS'], ['B2', 'J'], ['C1', 'F'], ['C2', 'FG'], ['C3', 'K'], ['D1', 'H'], ['D2', 'H']]) {
      for (const c of cols) {
        let n = 0; const ex = [];
        for (const r of T[k].rows) if (typeof r.v[c] === 'string' && NOTE_RE.test(r.v[c])) { n++; if (ex.length < 3) ex.push(k === 'D1' ? 'dòng ' + r.r : code(r)); }
        if (n) add('F06', k, null, c, '', `${fmt(n, 0)} ô ở cột ${c} còn ghi chú làm việc, ví dụ ${ex.join(', ')}.`, { count: n });
      }
    }

    // ---------- K01: trang tự kiểm lệch số thực ----------
    if (pick.extra.K && wb.Sheets[pick.extra.K] && wb.Sheets[pick.extra.K]['!ref']) {
      const ws = wb.Sheets[pick.extra.K]; const rg = decodeRef(ws['!ref']);
      const actual = { vtvl: C1.length, 'công việc': A2.length, 'nhiệm vụ': A1.length, b2: B2.length };
      const SUB = /^\s*[–—-]?\s*(khối|đảng|mttq|chính quyền|master|vận hành|nội bộ|cấp|thuộc|của|đoàn|hội)/i;
      let shown = 0;
      for (let rr = 1; rg && rr <= Math.min(rg.r2, 300) && shown < 5; rr++) {
        const label = ws['A' + rr] ? low(ws['A' + rr].v) : '';
        for (const c of COLS) {
          const x = ws[c + rr]; if (!x || typeof x.v !== 'string') continue;
          const s = NFC(x.v);
          // Chỉ xét số đứng ngay trước "VTVL", "công việc", "nhiệm vụ", không dính vào chữ/số/ký hiệu khác (B1, K2526, 1,5…)
          const re = /(^|[^\p{L}\p{N}.,/-])(\d{1,3}(?:\.\d{3})+|\d+)\s+(VTVL|công việc|nhiệm vụ)/giu; let m;
          while ((m = re.exec(s)) && shown < 5) {
            const at = m.index + m[1].length;
            // Bỏ số có 0 đứng đầu (01, 02) và số < 2: là số thứ tự hoặc "mỗi … chỉ có 01 …", không phải tổng số
            if (/^0\d/.test(m[2])) continue;
            const num = +m[2].replace(/\./g, ''); const kind = m[3].toLowerCase();
            if (num < 2) continue;
            const clause = s.slice(Math.max(0, at - 80), at).split(/[;:\n]|\.\s/).pop().toLowerCase();
            if (/(^|[^\p{L}])mỗi([^\p{L}]|$)/u.test(clause) || /(chỉ có|chỉ gồm|tối đa|tối thiểu|ít nhất|không quá|khoảng|gần|hơn|trên|dưới)\s*$/u.test(clause)) continue;
            const isB2 = kind === 'công việc' && label.indexOf('b2') === 0;
            const act = isB2 ? actual.b2 : actual[kind];
            if (!act) continue;
            // Số chỉ là một phần khi: có dấu "+" liền kề ("39 nhóm + 36 nhiệm vụ"), hoặc sau cụm còn chữ định danh nhóm con
            // ("36 nhiệm vụ cụ thể", "33 VTVL công chức", "13 VTVL/công việc hỗ trợ", "49 VTVL khối Đảng"): khi đó chỉ báo nếu lớn hơn số thực.
            const after = s.slice(m.index + m[0].length).replace(/^\s*[–—-]\s*/, ' ');
            const qualified = /^\s*(\/(?=\S)|\p{L})/u.test(after) && !/^\s*(có|gồm|bao gồm|trong đó)(?![\p{L}])/u.test(after);
            const sub = SUB.test(after) || qualified || /\+\s*$/.test(s.slice(0, at)) || /^\s*\+/.test(after);
            if (sub ? num > act : num !== act) {
              add('K01', 'K', rr, c, '', `${pick.extra.K}, ô ${c}${rr} ghi “${m[2]} ${m[3]}” nhưng tệp có ${fmt(act, 0)} ${kind === 'vtvl' ? 'VTVL' : kind}${isB2 ? ' ở B2' : ''}.`);
              shown++;
            }
          }
        }
      }
    }
    // DM01: phút chuẩn tròn theo ngày làm việc
    const b1ByL = new Map();
    for (const r of B1) { const l = txt(r.v.L); if (l) b1ByL.set(l, (b1ByL.get(l) || 0) + 1); }
    for (const r of DM) {
      const e = r.v.E;
      // Không báo khi phút chuẩn = một mức giờ của Phụ lục 3 HD13 × 60 (có nguồn PL3)
      if (isNum(e) && e >= 1440 && e % 480 === 0 && !isPL3Hours(e / 60)) {
        const n = b1ByL.get(code(r)) || 0;
        add('DM01', 'DM', r.r, 'E', code(r), `Phút chuẩn ${fmt(e, 0)} = ${fmt(e / 480, 0)} ngày làm việc tròn, không trùng mức giờ nào của Phụ lục 3 HD13; ${fmt(n, 0)} dòng B1 dùng mã này.`, { b1Uses: n });
      }
    }
    for (const r of C2) {
      const c = code(r);
      if (blank(r.v.B) || blank(r.v.G)) add('C201', 'C2', r.r, blank(r.v.B) ? 'B' : 'G', c, blank(r.v.B) ? 'Chưa ghi trách nhiệm.' : 'Chưa ghi nguồn bản mô tả.');
    }

    // ---------- tổng hợp giờ theo VTVL ----------
    const vt = new Map();
    const vtGet = (k) => { if (!vt.has(k)) vt.set(k, { code: k, b1Rows: 0, b1Entered: 0, b1Ok: 0, b1Hours: 0, b1HoursPrefill: 0, b1Bad: 0, issues: 0 }); return vt.get(k); };
    for (const r of B1) {
      const k = b1Calc.get(r); if (!k || !k.vt) continue;
      const o = vtGet(k.vt); o.b1Rows++;
      if (k.entered) {
        o.b1Entered++;
        if (k.hours !== null) { o.b1Ok++; o.b1Hours += k.hours; if (k.pfH || k.pfI || k.pfK) o.b1HoursPrefill += k.hours; }
        if (k.status !== 'ĐẠT' || k.pfH || k.pfI || k.pfK || k.refI) o.b1Bad++;
      }
    }

    // ---------- C3 ----------
    const c1Has = (c) => c1By.has(c);
    let c3BugRows = 0; const c3BugEx = [];
    for (const r of C3) {
      const m = r.f.M || '';
      const re = /SEARCH\("PP(\d+)",B\d+\)\),I\d+=""/g; let x;
      while ((x = re.exec(m))) if (x[1] !== '3') { c3BugRows++; if (c3BugEx.length < 3) c3BugEx.push(`M${r.r}: SEARCH("PP${x[1]}",B${r.r})`); break; }
    }
    const concluded = new Set();
    for (const r of C3) {
      const c = code(r);
      if (C1.length && !c1Has(c)) add('L05', 'C3', r.r, 'A', c, `Mã VTVL “${c}” không có ở C1.`);
      const B = txt(r.v.B);
      const pp1 = /PP1/i.test(B), pp2 = /PP2/i.test(B), pp3 = /PP3/i.test(B);
      listIssue('C301', 'C3', r, 'B', c, LS.PP, 'phương pháp', true, true);
      listIssue('C301', 'C3', r, 'L', c, LS.TT_C3, 'trạng thái', true, true);
      const H = r.v.H, I = r.v.I, J = r.v.J, K = r.v.K, L = low(r.v.L);
      const started = !blank(H) || !blank(I) || !blank(J) || L === 'tính thử' || L === 'đã kiểm chứng';
      const o = vtGet(c);
      const quy = quyOf(c);
      const net = b2Net.get(c);
      const rong = (o.b1Hours > 0 || net) ? o.b1Hours + (net ? net.up - net.down : 0) : null;
      const g = pp2 && rong !== null && quy ? rong / quy : null;
      if (isNum(J)) concluded.add(c);
      const noJobs = pp2 && A2.length > 0 && !a2Vt.has(c);
      if (noJobs) add('C308', 'C3', r.r, 'B', c, `Chọn ${B} nhưng VTVL chưa có công việc nào ở A2, nên không tính được PP2.`);
      if (!started) continue;
      if (!B) add('C309', 'C3', r.r, 'B', c, 'Đã nhập số liệu nhưng chưa chọn phương pháp.');
      if (pp3 && blank(I)) add('C302', 'C3', r.r, 'I', c, 'Chưa ghi số người PP3.' + (c3BugRows ? ' Excel của mẫu không báo lỗi này do công thức cột M kiểm sai (PP5, PP6… thay vì PP3).' : ''));
      if (pp1 && blank(H)) add('C303', 'C3', r.r, 'H', c, 'Chưa ghi số người PP1.');
      if (!blank(J) && (blank(K) || isPrefill('C3.K', K))) add('C304', 'C3', r.r, 'K', c, blank(K) ? 'Có kết luận J nhưng chưa có giải trình.' : 'Có kết luận J nhưng cột K vẫn là câu mẫu.');
      if (!blank(J) && !isNum(J)) add('C305', 'C3', r.r, 'J', c, `J ghi “${short(J, 20)}”, không phải số.`);
      else if (isNum(J) && J < 0) add('C305', 'C3', r.r, 'J', c, 'J âm.');
      else if (isNum(J) && !Number.isInteger(J)) add('C305', 'C3', r.r, 'J', c, `J = ${fmt(J)} chưa là số nguyên.`, { level: L_RV });
      const vals = [];
      if (pp1 && isNum(H)) vals.push(H);
      if (pp2 && g !== null) vals.push(g);
      if (pp3 && isNum(I)) vals.push(I);
      if (vals.length >= 2 && isNum(J)) {
        const sum = vals.reduce((a, b) => a + b, 0);
        const mx = Math.max(pp1 && isNum(H) ? H : 0, pp2 && g !== null ? Math.ceil(g - 1e-9) : 0, pp3 && isNum(I) ? I : 0);
        if (Math.abs(J - sum) < 0.005) add('C306', 'C3', r.r, 'J', c, `J = ${fmt(J)} bằng tổng các phương pháp.`);
        else if (Math.abs(J - mx) < 0.005) add('C306', 'C3', r.r, 'J', c, `J = ${fmt(J)} là số lớn nhất của các phương pháp.`);
      }
      if (L === 'đã kiểm chứng' && (o.b1Bad > 0 || blank(K) || isPrefill('C3.K', K)))
        add('C307', 'C3', r.r, 'L', c, o.b1Bad > 0 ? `Còn ${o.b1Bad} dòng B1 của VTVL chưa đủ căn cứ.` : 'Cột K chưa có giải trình thật.');
      if (pp2 && !noJobs && !(o.b1Hours > 0)) add('C308', 'C3', r.r, 'B', c, 'VTVL chưa có giờ B1 nào đạt.');
      if (B && blank(J)) add('C309', 'C3', r.r, 'J', c, 'Đã có số liệu phương pháp nhưng chưa kết luận số người cần bố trí.');
    }
    if (usable.C3) for (const r of C1) if (!c3By.has(code(r))) add('C309', 'C1', r.r, 'A', code(r), 'VTVL chưa có dòng ở C3.');

    // ---------- D1 ----------
    const NAME_RE = /^(\p{Lu}[\p{Ll}\p{M}]*)(\s+\p{Lu}[\p{Ll}\p{M}]*){1,4}$/u;
    const d1ByA = indexBy(D1, 'A');
    const d1Vt = new Map();
    // Ô A có dạng họ tên/số định danh: không đưa giá trị vào kết quả (chỉ nêu số dòng)
    const pii = new Set();
    for (const r of D1) {
      const a = txt(r.v.A);
      if ((NAME_RE.test(a) && !/\d/.test(a)) || /^\d{9,12}$/.test(a.replace(/\s/g, ''))) pii.add(r.r);
    }
    const safeA = (r) => (pii.has(r.r) ? `(D1 dòng ${r.r})` : txt(r.v.A));
    for (const r of D1) {
      const a = txt(r.v.A), b = txt(r.v.B), sa = safeA(r);
      if (pii.has(r.r)) add('D101', 'D1', r.r, 'A', sa, /\d/.test(a) ? `Ô A dòng ${r.r} có dạng số định danh.` : `Ô A dòng ${r.r} có dạng họ tên người.`);
      else if (!/^[\p{L}\p{N}&_-]+\.\d+$/u.test(a)) add('D101', 'D1', r.r, 'A', sa, `Mã “${short(a, 30)}” không theo dạng [mã cơ quan].[số thứ tự].`, { level: L_RV });
      if (C1.length && b && !c1Has(b)) add('L05', 'D1', r.r, 'B', sa, `Mã VTVL “${b}” không có ở C1.`);
      for (const [col, list, nm] of [['C', LS.LOAI_NL, 'loại nhân lực'], ['I', LS.KIEM_CHUNG, 'trạng thái']]) listIssue('D102', 'D1', r, col, sa, list, nm, false);
      if (blank(r.v.G)) add('D102', 'D1', r.r, 'G', sa, 'Chưa ghi nơi tính biên chế.');
      if (blank(r.v.H)) add('D103', 'D1', r.r, 'H', sa, 'Chưa ghi nguồn.');
      if (b) { const o = d1Vt.get(b) || { people: new Set(), hours: 0 }; o.people.add(a); if (isNum(r.v.E)) o.hours += r.v.E; d1Vt.set(b, o); }
    }
    for (const [, rows] of d1ByA) {
      let sum = 0, quy = null;
      const sa = safeA(rows[0]);
      for (const r of rows) { if (isNum(r.v.E)) sum += r.v.E; if (isNum(r.v.F)) sum += r.v.F; if (isNum(r.v.K) && r.v.K > 0) quy = r.v.K; }
      if (quy === null) quy = quyOf(txt(rows[0].v.B)) || P.quy;
      if (sum > quy + 0.01) add('D104', 'D1', rows[0].r, 'E', sa, `Tổng giờ ${fmt(sum)} vượt quỹ ${fmt(quy, 0)} giờ.`);
      const gs = new Set(rows.map((r) => low(r.v.G)).filter(Boolean));
      if (gs.size > 1) add('D105', 'D1', rows[1].r, 'G', sa, `Mã nguồn lực có ${gs.size} nơi tính biên chế khác nhau.`);
    }

    // ---------- D2 ----------
    const d2By = indexBy(D2, 'A');
    const eCount = new Map();
    for (const r of D2) {
      const a = code(r);
      if (C1.length && !c1Has(a)) add('L05', 'D2', r.r, 'A', a, `Mã VTVL “${a}” không có ở C1.`);
      const sy = inList(r.v.B, LS.NAM);
      if (sy === 'blank') add('D202', 'D2', r.r, 'B', a, 'Chưa ghi năm.');
      else if (sy !== 'ok') add('D202', 'D2', r.r, 'B', a, `Năm “${short(r.v.B, 12)}” ngoài 2027–2031.`);
      listIssue('D202', 'D2', r, 'I', a, LS.TT_D2, 'trạng thái', true);
      const G = r.v.G;
      if (typeof G === 'string' && !blank(G)) add('D203', 'D2', r.r, 'G', a, `Ô G chứa chữ (“${short(G, 20)}”).`);
      else if (isNum(G) && G !== 0) {
        if (!Number.isInteger(G)) add('D203', 'D2', r.r, 'G', a, `Đề nghị điều chỉnh ${fmt(G)} chưa là số nguyên.`);
        const hBad = blank(r.v.H) || isPrefill('D2.H', r.v.H);
        if (blank(r.v.F) || hBad) add('D203', 'D2', r.r, blank(r.v.F) ? 'F' : 'H', a, `Đề nghị điều chỉnh ${fmt(G, 0)} nhưng thiếu ${blank(r.v.F) ? 'điều chuyển/bố trí lại (F)' : 'giải trình thật (H)'}.`);
      }
      if (low(r.v.I) === 'đã được quyết định' && blank(r.v.N)) add('D205', 'D2', r.r, 'N', a, 'Chưa ghi văn bản quyết định.');
      // biên chế giao theo tổng cơ quan bị ghi lặp: cùng năm, cùng giá trị ≥ 5, ở ≥ 5 VTVL khác nhau
      if (isNum(r.v.E) && r.v.E >= 5) { const k = txt(r.v.B) + '|' + r.v.E; if (!eCount.has(k)) eCount.set(k, { rows: [], vt: new Set() }); const o = eCount.get(k); o.rows.push(r); o.vt.add(a); }
    }
    for (const [k, o] of eCount) if (o.vt.size >= 5) add('D204', 'D2', o.rows[0].r, 'E', '', `Năm ${k.split('|')[0]}: ${o.vt.size} VTVL cùng ghi biên chế giao ${fmt(+k.split('|')[1])}.`);
    for (const c of concluded) {
      const rows = d2By.get(c) || [];
      const years = rows.map((r) => txt(r.v.B));
      const miss = LISTS.NAM.filter((y) => years.indexOf(y) < 0);
      const dup = LISTS.NAM.filter((y) => years.filter((z) => z === y).length > 1);
      const at = c3By.get(c) ? c3By.get(c)[0].r : null;
      if (miss.length) add('D201', rows.length ? 'D2' : 'C3', rows.length ? rows[0].r : at, rows.length ? 'B' : 'J', c, `Thiếu năm ${miss.join(', ')} trong phương án.`);
      if (dup.length) add('D201', 'D2', rows[0].r, 'B', c, `Năm ${dup.join(', ')} bị lặp.`);
    }

    // ---------- lỗi của biểu mẫu ----------
    const sheetN = (k) => SHEETS[k].name;
    if (c3BugRows) tbugs.push({ id: 'T01', sheet: 'C3', cells: 'M', count: c3BugRows,
      title: 'Công thức cảnh báo PP3 ở C3 kiểm sai',
      detail: `${fmt(c3BugRows, 0)} dòng cột M dùng SEARCH("PP5"…), SEARCH("PP6"…) theo số dòng thay vì "PP3", nên chọn PP3 mà bỏ trống cột I vẫn không bị cảnh báo. Ví dụ: ${c3BugEx.join('; ')}.`,
      proposal: 'Sửa điều kiện thành ISNUMBER(SEARCH("PP3",Bn)) cho mọi dòng cột M của 8. C3_NhuCau.' });
    const posParts = [];
    if (b1PosB) posParts.push(`B1 cột B: ${fmt(b1PosB, 0)} ô lấy mã VTVL theo dòng cố định của A2`);
    if (b1PosDM) posParts.push(`B1 cột M, N, O: ${fmt(b1PosDM, 0)} dòng tra danh mục theo dòng cố định, không theo mã ở cột L`);
    if (b2PosB || b2PosP) posParts.push(`B2 cột B/P: ${fmt(Math.max(b2PosB, b2PosP), 0)} dòng so với A2, B1 theo dòng cố định`);
    if (posParts.length) tbugs.push({ id: 'T02', sheet: 'B1', cells: 'B, M, N, O; B2 B, P', count: b1PosB + b1PosDM + Math.max(b2PosB, b2PosP),
      title: 'Tra cứu theo vị trí dòng thay vì theo mã',
      detail: posParts.join('; ') + '. Hiện các dòng đang khớp; chèn, xóa, sắp xếp dòng hoặc đổi mã sản phẩm thì Excel tra nhầm mà không báo.',
      proposal: 'Thay bằng INDEX/MATCH theo mã công việc (A2) và mã sản phẩm (cột L), như mẫu của các cơ quan khối Đảng đang dùng.' });
    // Câu mẫu trong ô dữ liệu: đếm theo cột, kể cả dòng chưa nhập số liệu (tệp chưa nhập chỉ hiện ở đây, không thành lỗi từng dòng)
    const pfB1 = { H: 0, I: 0, K: 0, S: 0 }; let pfB1Rows = 0, pfC3K = 0, pfB2J = 0, pfD2H = 0, pfA1E = 0, kyEx = '';
    for (const r of B1) {
      const k = b1Calc.get(r); if (!k) continue;
      if (k.pfH) pfB1.H++; if (k.pfI) pfB1.I++; if (k.pfK) { pfB1.K++; kyEx = kyEx || txt(r.v.K); } if (k.pfS) pfB1.S++;
      if (k.pfH || k.pfI || k.pfK || k.pfS) pfB1Rows++;
    }
    for (const r of A1) if (!blank(r.v.E) && !kyOk(r.v.E) && isPrefill('KY', r.v.E)) { pfA1E++; kyEx = kyEx || txt(r.v.E); }
    for (const r of C3) if (isPrefill('C3.K', r.v.K)) pfC3K++;
    for (const r of B2) if (isPrefill('B2.J', r.v.J)) pfB2J++;
    for (const r of D2) if (isPrefill('D2.H', r.v.H)) pfD2H++;
    const rChecksH = B1.some((r) => /THIẾU NGUỒN SẢN LƯỢNG/.test(r.f.R || ''));
    if (pfB1Rows || pfA1E || pfC3K || pfB2J || pfD2H) {
      const parts = [];
      const b1Cols = Object.keys(pfB1).filter((c) => pfB1[c]);
      if (pfB1Rows) parts.push(`B1: ${fmt(pfB1Rows, 0)} dòng điền sẵn câu mẫu ở cột ` + (b1Cols.every((c) => pfB1[c] === pfB1Rows) ? b1Cols.join(', ') : b1Cols.map((c) => `${c} (${fmt(pfB1[c], 0)} dòng)`).join(', ')));
      if (pfA1E) parts.push(`A1: ${fmt(pfA1E, 0)} dòng ghi kỳ bằng câu mẫu ở cột E`);
      if (pfC3K) parts.push(`C3: ${fmt(pfC3K, 0)} dòng câu mẫu ở cột K`);
      if (pfB2J) parts.push(`B2: ${fmt(pfB2J, 0)} dòng câu mẫu ở cột J`);
      if (pfD2H) parts.push(`D2: ${fmt(pfD2H, 0)} dòng câu mẫu ở cột H`);
      const kyNote = kyEx ? ` Cột kỳ ghi “${short(kyEx, 40)}” thay cho kỳ chung ${KY_CHUAN} mà Hướng dẫn 13 quy định dùng chung.` : '';
      tbugs.push({ id: 'T03', sheet: pfB1Rows ? 'B1' : (pfA1E ? 'A1' : (pfC3K ? 'C3' : (pfB2J ? 'B2' : 'D2'))),
        cells: [pfB1Rows ? 'B1 ' + b1Cols.join(', ') : '', pfA1E ? 'A1 E' : '', pfC3K ? 'C3 K' : '', pfB2J ? 'B2 J' : '', pfD2H ? 'D2 H' : ''].filter(Boolean).join('; '),
        count: pfB1Rows + pfA1E + pfC3K + pfB2J + pfD2H,
        title: 'Câu mẫu điền sẵn làm kiểm tra của Excel không còn tác dụng',
        detail: parts.join('; ') + '.' + (rChecksH && pfB1.H ? ' Cột R chỉ kiểm tra ô có chữ hay không, nên chỉ cần nhập C và D là dòng báo ĐẠT dù chưa có nguồn thật.' : ' Ô đã có chữ nên công thức không báo thiếu; đơn vị dễ để nguyên câu mẫu khi nộp.') + kyNote,
        proposal: 'Để trống các cột nguồn (hoặc đưa câu gợi ý vào ghi chú ô, trang hướng dẫn riêng), và cho cột R báo "CHƯA CÓ NGUỒN THẬT" khi nội dung còn là câu mẫu.' + (kyEx ? ` Ghi sẵn kỳ chung ${KY_CHUAN} ở cột kỳ.` : '') });
    }
    if (staleE) tbugs.push({ id: 'T04', sheet: 'C1', cells: 'E', count: staleE,
      title: 'Giá trị tính sẵn trong tệp đã cũ',
      detail: `${fmt(staleE, 0)} ô C1 cột E đang lưu kết quả khác ${fmt(P.quy, 0)} giờ dù chế độ phổ biến (có ô lưu 0 hoặc chữ). Tệp mở bằng phần mềm không tự tính lại sẽ hiển thị sai.`,
      proposal: 'Bật tính lại toàn bộ (Ctrl+Alt+F9) rồi lưu trước khi phát hành mẫu.' });
    const rangeNotes = [];
    const rangeEnd = (f, sheetRe) => { const m = new RegExp(sheetRe + "'?!\\$[A-Z]+\\$\\d+:\\$[A-Z]+\\$(\\d+)").exec(f || ''); return m ? +m[1] : null; };
    const c3f = C3.length ? (C3[0].f.C || '') : '';
    const endB1 = rangeEnd(c3f, 'B1_KhoiLuong');
    if (endB1 && T.B1.maxRow && endB1 <= T.B1.maxRow) rangeNotes.push(endB1 < T.B1.maxRow ? `C3 chỉ cộng B1 đến dòng ${fmt(endB1, 0)} trong khi B1 có dữ liệu đến dòng ${fmt(T.B1.maxRow, 0)}: các dòng sau không được tính` : `C3 cộng B1 trong vùng cố định đến dòng ${fmt(endB1, 0)}, đúng bằng dòng cuối hiện có: thêm công việc mới bên dưới sẽ không được cộng`);
    const b1f = B1.length ? (B1[0].f.N || '') : '';
    const endDM = rangeEnd(b1f, 'DM_SAN_PHAM');
    if (endDM && T.DM.maxRow && endDM <= T.DM.maxRow) rangeNotes.push(`B1 tra danh mục sản phẩm đến dòng ${fmt(endDM, 0)}, danh mục có đến dòng ${fmt(T.DM.maxRow, 0)}: sản phẩm thêm mới bên dưới sẽ không được tra`);
    let b1Dup = 0, b1NotA2 = 0;
    const notEntered = (r) => { const k = b1Calc.get(r); return !(k && k.entered); };
    for (const [, rows] of b1By) if (rows.length > 1) b1Dup += rows.slice(1).filter(notEntered).length;
    if (A2.length) for (const r of B1) if (!a2By.has(code(r)) && notEntered(r)) b1NotA2++;
    if (b1Dup || b1NotA2) tbugs.push({ id: 'T06', sheet: 'B1', cells: 'A', count: b1Dup + b1NotA2,
      title: 'B1 không khớp một-một với A2',
      detail: [b1Dup ? `${fmt(b1Dup, 0)} dòng B1 lặp mã công việc đã có` : '', b1NotA2 ? `${fmt(b1NotA2, 0)} dòng B1 mang mã công việc không có ở A2` : ''].filter(Boolean).join('; ') + '. Nhập số liệu vào các dòng này sẽ bị tính trùng hoặc không gắn được VTVL.',
      proposal: 'Mỗi công việc ở A2 chỉ có một dòng B1; bổ sung công việc vào A2 trước, rồi mới thêm dòng B1.' });
    let jWrong = 0;
    for (const r of B1) { const k = b1Calc.get(r); if (k && !k.entered && LISTS.KIEM_CHUNG.some((x) => low(x) === low(r.v.J))) jWrong++; }
    if (jWrong) tbugs.push({ id: 'T07', sheet: 'B1', cells: 'J', count: jWrong,
      title: 'Cột J của B1 điền sẵn giá trị của danh sách khác',
      detail: `${fmt(jWrong, 0)} dòng B1 điền sẵn “${txt(B1.find((r) => LISTS.KIEM_CHUNG.some((x) => low(x) === low(r.v.J))).v.J)}” ở cột J (Trạng thái căn cứ thời gian), trong khi danh sách hợp lệ là “Có định mức” hoặc “Kiểm đếm, ước lượng thực tế”. Công thức theo Hướng dẫn chỉ lấy phút ở cột D khi J đúng danh sách, nên khi đơn vị nhập số liệu các dòng này sẽ không được tính.`,
      proposal: 'Để trống cột J hoặc dùng đúng danh sách TT_B1 (DM_THAM_SO); dùng cột riêng nếu cần theo dõi trạng thái kiểm chứng.' });
    if (rangeNotes.length) tbugs.push({ id: 'T05', sheet: 'C3', cells: 'C, D; B1 M, N, O', count: rangeNotes.length,
      title: 'Vùng công thức cố định, không còn chỗ cho dòng mới',
      detail: rangeNotes.join('; ') + '.',
      proposal: 'Mở rộng vùng tham chiếu tới sức chứa thiết kế (30.000 dòng) hoặc dùng bảng Excel (Table) để vùng tự giãn.' });

    // ---------- tổng hợp ----------
    const vtRows = [];
    const allVt = [];
    for (const r of C1) allVt.push(code(r));
    for (const r of C3) if (!c1By.has(code(r))) allVt.push(code(r));
    const issuesByVt = new Map();
    const jobVt = (j) => vtvlOfJob(j);
    for (const it of issues) {
      let k = '';
      if (it.sheet === 'C1' || it.sheet === 'C2' || it.sheet === 'C3' || it.sheet === 'D2') k = it.code;
      else if ((it.sheet === 'B1' || it.sheet === 'B2' || it.sheet === 'A2') && it.code) k = jobVt(it.code);
      if (k) issuesByVt.set(k, (issuesByVt.get(k) || 0) + 1);
    }
    for (const c of [...new Set(allVt)]) {
      const c1r = c1By.get(c) ? c1By.get(c)[0] : null;
      const c3r = c3By.get(c) ? c3By.get(c)[0] : null;
      const o = vt.get(c) || { b1Rows: 0, b1Entered: 0, b1Ok: 0, b1Hours: 0, b1HoursPrefill: 0, b1Bad: 0 };
      const net = b2Net.get(c);
      const B = c3r ? txt(c3r.v.B) : '';
      const quy = quyOf(c);
      const rong = (o.b1Hours > 0 || net) ? o.b1Hours + (net ? net.up - net.down : 0) : null;
      const pp2 = /PP2/i.test(B) && rong !== null && quy ? Math.round(rong / quy * 100) / 100 : null;
      const d1 = d1Vt.get(c);
      const J = c3r && isNum(c3r.v.J) ? c3r.v.J : null;
      const people = d1 ? d1.people.size : 0;
      vtRows.push({
        file: fileName, code: c, name: c1r ? txt(c1r.v.B) : '', method: B,
        b1Rows: o.b1Rows, b1Entered: o.b1Entered, b1Ok: o.b1Ok,
        b1Hours: o.b1Hours ? Math.round(o.b1Hours * 10) / 10 : (o.b1Entered ? 0 : null), b1HoursPrefill: Math.round(o.b1HoursPrefill * 10) / 10,
        b2Net: net ? Math.round((net.up - net.down) * 10) / 10 : null,
        netHours: rong !== null ? Math.round(rong * 10) / 10 : null, quy, pp2,
        pp1: c3r && isNum(c3r.v.H) ? c3r.v.H : null, pp3: c3r && isNum(c3r.v.I) ? c3r.v.I : null,
        need: J, d1People: d1 ? people : null, d1Fte: d1 && quy ? Math.round(d1.hours / quy * 100) / 100 : null,
        gap: J !== null && d1 ? J - people : null, c3Status: c3r ? txt(c3r.v.L) : '', issues: issuesByVt.get(c) || 0,
      });
    }
    const filled = (k) => {
      const rows = T[k].rows;
      if (k === 'B1') return rows.filter((r) => { const x = b1Calc.get(r); return x && x.entered; }).length;
      if (k === 'B2') return rows.filter((r) => (low(r.v.M) !== '' && low(r.v.M) !== 'ước lượng tham khảo') || !blank(r.v.E) || !blank(r.v.F) || !blank(r.v.G) || !blank(r.v.I)).length;
      if (k === 'C3') return rows.filter((r) => isNum(r.v.J)).length;
      if (k === 'D2') return rows.filter((r) => isNum(r.v.D) || isNum(r.v.E) || isNum(r.v.F) || isNum(r.v.G) || (!blank(r.v.H) && !isPrefill('D2.H', r.v.H))).length;
      return rows.length;
    };
    const sheets = {};
    for (const k of ORDER) sheets[k] = { name: SHEETS[k].name, title: SHEETS[k].title, found: !!pick.map[k], usable: usable[k], rows: T[k].rows.length, filled: filled(k), skipped: !!T[k].skipped };
    let b1Ok = 0, b1Prefill = 0;
    for (const r of B1) { const k = b1Calc.get(r); if (k && k.entered && k.hours !== null) { b1Ok++; if (k.pfH || k.pfI || k.pfK) b1Prefill++; } }
    const recognized = ORDER.some((k) => pick.map[k]);
    return {
      issues, tbugs,
      summary: {
        file: fileName, agency: fn.agency, placeholderAgency: fn.placeholder, recognized, quy: P.quy, sheets, vtvl: vtRows,
        b1Total: B1.length, b1Entered: sheets.B1.filled, b1Ok, b1Prefill, b1OutRangeSoft: b1Soft.outRange,
        vtvlTotal: C1.length, vtvlConcluded: concluded.size, c105Exempt, c102Exempt, b104Exempt,
      },
      keys: { d1: [...d1ByA.keys()], a1: [...a1By.keys()] },
    };
  }

  // ---------- nhiều tệp ----------
  function runChecks(workbooks) {
    const out = { version: VERSION, issues: [], templateBugs: [], summary: { files: [], counts: { fix: 0, evidence: 0, review: 0 }, byRule: {}, bySheet: {}, vtvl: [], b1Entered: 0, b1Total: 0, b1Ok: 0, b1Prefill: 0, vtvlTotal: 0, vtvlConcluded: 0, c105Exempt: 0, c102Exempt: 0, b104Exempt: 0 } };
    const keyFiles = { d1: new Map(), a1: new Map() };
    for (const w of workbooks || []) {
      let res;
      try { res = checkFile(w.name, w.wb); } catch (e) {
        out.summary.files.push({ file: w.name, error: String(e && e.message || e) });
        continue;
      }
      out.issues.push(...res.issues);
      out.templateBugs.push(...res.tbugs.map((t) => Object.assign({ file: w.name }, t)));
      const s = res.summary;
      out.summary.files.push(s);
      out.summary.vtvl.push(...s.vtvl);
      for (const k of ['b1Entered', 'b1Total', 'b1Ok', 'b1Prefill', 'vtvlTotal', 'vtvlConcluded', 'c105Exempt', 'c102Exempt', 'b104Exempt']) out.summary[k] += s[k];
      for (const [kind, list] of Object.entries(res.keys)) for (const c of list) { if (!keyFiles[kind].has(c)) keyFiles[kind].set(c, new Set()); keyFiles[kind].get(c).add(w.name); }
    }
    if ((workbooks || []).length > 1) {
      for (const [kind, m] of Object.entries(keyFiles)) for (const [c, files] of m) if (files.size > 1) {
        const f = [...files];
        out.issues.push({ file: f.join(' + '), rule: 'X01', level: L_RV, sheet: kind === 'd1' ? 'D1' : 'A1', row: null, col: 'A', code: kind === 'd1' ? '' : c,
          msg: kind === 'd1' ? `Một mã nguồn lực xuất hiện ở D1 của ${files.size} tệp.` : `Mã nhiệm vụ “${c}” có ở ${files.size} tệp.`, fix: RULE_META.X01.fix });
      }
    }
    out.issues.sort((a, b) => LEVELS[a.level].order - LEVELS[b.level].order || ORDER.indexOf(a.sheet) - ORDER.indexOf(b.sheet) || (a.row || 0) - (b.row || 0));
    for (const it of out.issues) {
      out.summary.counts[it.level]++;
      out.summary.byRule[it.rule] = (out.summary.byRule[it.rule] || 0) + 1;
      out.summary.bySheet[it.sheet] = (out.summary.bySheet[it.sheet] || 0) + 1;
    }
    return out;
  }

  // ---------- lệnh AI cho sản phẩm ghép ----------
  function buildAIPrompt(result, max, onlyGroup) {
    max = max || 60;
    const rows = result.issues.filter((i) => i.rule === 'A201' && (!onlyGroup || i.group === onlyGroup));
    const sorted = rows.slice().sort((a, b) => (b.hasB1 ? 1 : 0) - (a.hasB1 ? 1 : 0));
    const seen = new Set();
    const pickRows = [];
    for (const it of sorted) { const k = it.file + '|' + it.code; if (seen.has(k)) continue; seen.add(k); pickRows.push(it); if (pickRows.length >= max) break; }
    const cell = (s) => txt(s).replace(/\|/g, '/');
    const lines = pickRows.map((it) => `| ${cell(it.code)} | ${cell(it.jobName)} | ${cell(it.group)} | ${cell(it.unit)} |`);
    return [
      'Bạn là chuyên viên tổ chức cán bộ, hỗ trợ rà soát biểu A2 (công việc) theo Hướng dẫn 13-HD/BTCTU về vị trí việc làm.',
      'Mỗi dòng dưới đây có cột "Sản phẩm" đang ghép nhiều loại bằng dấu "/", nên không đếm được sản lượng.',
      'Với từng dòng, đề xuất:',
      '1. Sản phẩm đầu ra cụ thể: một loại duy nhất, đếm được, không dùng dấu "/".',
      '2. Đơn vị tính.',
      '3. Điều kiện đạt (tiêu chí chất lượng ngắn gọn).',
      '4. Minh chứng (sổ, hệ thống, văn bản dùng để đếm).',
      'Giữ nguyên mã công việc. Nếu một dòng thực chất gồm hai sản phẩm khác nhau, ghi rõ "tách thành 2 công việc" và đề xuất cả hai.',
      'Trả về đúng một bảng: Mã công việc | Sản phẩm đề xuất | Đơn vị tính | Điều kiện đạt | Minh chứng. Không thêm dòng ngoài danh sách.',
      '',
      '| Mã công việc | Tên công việc | Sản phẩm hiện ghi | ĐVT hiện ghi |',
      '|---|---|---|---|',
      ...lines,
    ].join('\n');
  }

  return { VERSION, SHEETS, ORDER, LISTS, LEVELS, RULES: RULE_META, PL3, isPL3Hours, pickSheets, runChecks, buildAIPrompt, isPrefill, parseFileName, kyOk };
}));
