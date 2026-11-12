/* Vị trí việc làm 360 · bản web 1.3.0 (02/11/2026). Tệp dựng tự động bằng build-web.js; sửa ở nguồn rồi dựng lại. */
/* Khung chung: dòng tác giả (TAC_GIA, WEBSITE) và dòng liên hệ (LIEN_HE) lấy từ js/cau-hinh.js; để rỗng thì ẩn. */
(function () {
  'use strict';
  var c = window.VTVL_CAU_HINH || {};
  var chu = function (v) { return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''; };
  var el = document.getElementById('v360LienHe'), lh = chu(c.LIEN_HE);
  if (el && lh) { el.textContent = 'Liên hệ: ' + lh; el.hidden = false; }
  // dòng tác giả: chân trang (v360TacGia) và trang chủ, dưới dòng phụ (v360TacGiaDau)
  var ten = chu(c.TAC_GIA), web = chu(c.WEBSITE).replace(/\s/g, '');
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([\/:?#]|$)/i.test(web)) web = 'https://' + web; // ghi thiếu https:// thì thêm
  if (!/^https?:\/\/[^\s"'<>\\]+$/i.test(web)) web = ''; // chỉ nhận liên kết http(s)
  var nhan = web.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '');
  ['v360TacGia', 'v360TacGiaDau'].forEach(function (id) {
    var e = document.getElementById(id);
    if (!e) return;
    e.textContent = '';
    if (!ten) { e.hidden = true; return; }
    e.appendChild(document.createTextNode('Tác giả: ' + ten));
    if (web && nhan) {
      var a = document.createElement('a');
      a.setAttribute('href', web); a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer');
      a.textContent = nhan;
      e.appendChild(document.createTextNode(' · '));
      e.appendChild(a);
    }
    e.hidden = false;
  });
  // nhật ký sử dụng (bản web 1.3.0): đang ghi thì báo ở chân trang (v360NhatKy) và ở thẻ an toàn của trang chủ (v360NhatKyDau)
  var nk = !!(window.V360NhatKy && window.V360NhatKy.bat());
  ['v360NhatKy', 'v360NhatKyDau'].forEach(function (id) { var e = document.getElementById(id); if (e) e.hidden = !nk; });
})();
