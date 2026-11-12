# VTVL 360 — Nền Tảng Chuẩn Hóa Vị Trí Việc Làm 2026
### Đáp ứng 100% Tiêu Chuẩn Thẩm Định & Import Phần Mềm Ban Tổ Chức Trung Ương

> **Lưu ý:** Viết tắt **VTVL** trong toàn bộ dự án này chỉ có nghĩa **VỊ TRÍ VIỆC LÀM** (không liên quan đến hàng không hay vertical take-off/landing).

---

## 🌟 Tổng Quan Landing Page & Nền Tảng

Dự án cung cấp giao diện Landing Page chuyên nghiệp, tích hợp bộ công cụ tự động hóa và hướng dẫn chuẩn hóa hồ sơ Đề án Vị trí việc làm (VTVL) năm 2026, bảo đảm vượt qua 58 tiêu chí kiểm tra tự động và import thành công vào phần mềm Bộ biểu VTVL v2 của Ban Tổ chức Trung ương.

### Các Tính Năng Trọng Tâm:
1. **Checklist Thông tin Đầu vào Tối thiểu**: 4 nhóm hồ sơ bắt buộc phải có từ thực tế để AI Agent và hệ thống xử lý ra kết quả đạt chuẩn thẩm định.
2. **Bộ Dynamic Prompt Đa Ngành**: Trình tạo Prompt thông minh cho AI Agent (Claude, ChatGPT, Gemini, Antigravity) tùy biến theo từng khối cơ quan:
   - 🎓 *Cơ sở Giáo dục Phổ thông & Mầm non* (THCS, Tiểu học, THPT, Mầm non)
   - 🏛️ *Cơ quan Hành chính Cấp Xã / Phường / Thị trấn* (UBND Cấp Xã)
   - 🏢 *Cơ quan Hành chính Nhà nước* (Sở, Ban, Ngành, UBND Cấp Huyện)
   - 🏥 *Đơn vị Sự nghiệp Công lập Y tế* (Bệnh viện, TTYT, Trạm Y tế)
   - 🎭 *Đơn vị Sự nghiệp Văn hóa, Thể thao, Du lịch & Sự nghiệp khác*
   - 🏭 *Doanh nghiệp Nhà nước / Công ty TNHH MTV Nhà nước*
3. **Quy Trình 6 Chặng Khép Kín (P0 $\rightarrow$ P5)**: Từ rà soát OCR dữ liệu, chuẩn hóa danh mục, lập phiếu đo thời gian, tính định mức C3, phân bổ D1/D2 đến can thiệp trực tiếp cấu trúc XML (51 files) và kiểm thử 58 tiêu chí tự động.
4. **Bộ 06 Sản Phẩm Đầu Ra Tiêu Chuẩn**: Quy chuẩn đóng gói tại thư mục `06_KET_QUA/` phục vụ nộp và thẩm định chính thức.
5. **Công Cụ Preflight Validator Trực Tuyến**: Kiểm tra cấu trúc ZIP, chữ ký số SHA-256, format kỳ báo cáo và phát hiện lỗi lệch mã ngay trên trình duyệt (client-side 100%, bảo mật tuyệt đối).
6. **Mục Liên Hệ Chuyên Gia & Hỗ Trợ 24/7**: Kênh tư vấn trực tiếp, giải quyết lỗi import phần mềm BTC Trung ương và cân đối biên chế.

---

## 📋 4 Nhóm Thông Tin Đầu Vào Tối Thiểu Bắt Buộc

Để một hồ sơ VTVL chạy tự động và được hệ thống Trung ương phê duyệt pass 100%, đơn vị cần chuẩn bị tối thiểu 4 nhóm dữ liệu sau:

| Nhóm Hồ Sơ | Tài Liệu Thực Tế Cần Cung Cấp | Yêu Cầu Kỹ Thuật Bắt Buộc |
| :--- | :--- | :--- |
| **1. Pháp lý & Tổ chức** | QĐ thành lập/sáp nhập trường/đơn vị; QĐ phê duyệt Đề án VTVL gần nhất; QĐ giao chỉ tiêu biên chế; QĐ bổ nhiệm CBQL và phòng/tổ chuyên môn. | Xác định tư cách pháp nhân, cấp quản lý trực tiếp và trần biên chế tối đa. |
| **2. Nhân sự & Lương (30/09/2026)** | Bảng thanh toán tiền lương tháng 09/2026 (đầy đủ mã ngạch, HSL, phụ cấp, mã QHNS); Danh sách trích ngang nhân sự; Danh sách nghỉ hưu/biến động 2027–2031. | **Tuyệt đối loại bỏ HĐ 111 (HTPV)** khỏi biểu C1, D1; mã hóa nhân sự ẩn danh dạng `[MA_DV].001..xxx`. |
| **3. Khối lượng & Thời gian** | Sản lượng thực tế hoàn thành kỳ `01/10/2025 – 30/09/2026`; Phiếu đo thời gian thực tế (PP2); Danh mục ứng dụng CNTT/số hóa (B2_CT). | Chuỗi kỳ bắt buộc ghi đúng `01/10/2025 – 30/09/2026` (có khoảng trắng 2 bên gạch ngang). |
| **4. Phân công & Quỹ giờ** | Bảng phân công nhiệm vụ/tiết dạy chi tiết; Căn cứ chế độ làm việc (Phổ biến 1.904h theo HD 07-HD/BTCTW; Đặc thù 1.680h cho GV theo TT 05/2025). | Phân bổ giờ làm việc chính (E) và giờ việc khác (F) đảm bảo: **$E + F \le D$**. |

---

## ⚡ Dynamic Prompt Đa Ngành

Landing page tích hợp trình tạo Prompt động tại mục **"Dynamic Prompt đa ngành"**:
- Người dùng chỉ cần chọn Khối ngành $\rightarrow$ Nhập Tên cơ quan, Mã định danh, Kỳ số liệu, Số lượng nhân sự $\rightarrow$ Nhấn **"Sao chép Prompt"**.
- Mang prompt nạp vào AI Agent để tự động thực thi trọn vẹn quy trình rà soát từ P0 đến P5.

---

## 📦 Bộ 06 Sản Phẩm Đầu Ra Tiêu Chuẩn

Mọi lần chạy hoàn chỉnh đều kết xuất đủ 06 tệp tiêu chuẩn tại `06_KET_QUA/`:
1. `DATAVTVL_[MA_DV].xlsx`: File dữ liệu lõi 15 sheet, đầy đủ công thức, 100% cột trạng thái đạt "ĐẠT", 0 lỗi công thức.
2. `IMPORT_Bo_bieu_VTVL_v2_[MA_DV].xlsx`: File nạp trực tiếp vào phần mềm BTC Trung ương, can thiệp XML trực tiếp, giữ nguyên 51 tệp thành phần.
3. `PHIEU_DO_THOI_GIAN_[MA_DV].xlsx`: Phiếu đo 04 sheet gọn gàng, tự động phân màu Đỏ/Vàng/Xanh, phát hiện ngoại lai Robust Z-score.
4. `PHU_LUC_TINH_TOAN_[MA_DV].xlsx`: 09 biểu phân tích chuyên đề phục vụ giải trình hội đồng thẩm định.
5. `BAO_CAO_VTVL_[MA_DV].docx`: Báo cáo thuyết minh Đề án VTVL hoàn chỉnh 8 phần theo thể thức hành chính.
6. `BIEN_BAN_TU_KIEM_TRA_[MA_DV].txt`: Biên bản ghi nhận kết quả kiểm tra độc lập 58 tiêu chí tự động.

---

## 🚀 Hướng Dẫn Chạy Thử Nghiệm

Mở trực tiếp `public/index.html` trên trình duyệt:
```bash
# Hoặc khởi chạy local web server:
cd vtvl-2026/public
python3 -m http.server 8080
```
Truy cập: `http://localhost:8080`

### Kiểm thử tự động (Unit Test):
```bash
cd vtvl-2026
node tests/validation.test.mjs
```

## 🧩 Bản web “Vị trí việc làm 360” (clone)

`public/vtvl360/` là bản chạy hoàn toàn trên máy, gồm:

- **Tạo tệp đơn vị**: chọn khối, xã/phường, tạo workbook và phiếu thu số liệu; tách phiếu từng vị trí; nạp phiếu đã điền.
- **Bấm giờ**: mở phiếu, chọn vị trí, ghi số sản phẩm, đo giờ và xuất phiếu một người.
- **Rà soát 9 biểu**: đọc XLSX, đối chiếu chéo, phân loại lỗi và xuất Excel kết quả.

Chạy:

```bash
cd vtvl-2026
python3 -m http.server 8080 --directory public
```

Mở `http://localhost:8080/vtvl360/`.

Bản clone không gọi Supabase/máy chủ gốc, không tải mã từ CDN; nhật ký sử dụng đã tắt trong `js/cau-hinh.js`. Để dựng lại từ nguồn công khai:

```bash
python3 scripts/mirror_vtvl360.py
```

Tệp Excel mẫu từ các thư mục HD07 đã tải về `04_LAM_VIEC/du_lieu_drive_hd07/` (50 tệp, 144 MiB); danh sách kèm SHA-256 ở `tai_nguyen.json`.
Muốn tải lại: `python3 scripts/download_drive_assets.py`.

## ☁️ Triển khai Cloudflare Pages

Production: **https://vtvl.captain-solution.tech/**

Thư mục build là `public/`. Bật **Git integration** của Cloudflare Pages với repo `bangnt188/vtvl-2026`, nhánh `main`, build command để trống, output directory `public`; mỗi lần push `main` sẽ tự deploy.

Hoặc deploy bằng Wrangler:

```bash
npx wrangler pages deploy public --project-name vtvl-2026 --branch main
```

Icon/PWA/social image nằm ở `public/` (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.png`, `site.webmanifest`). Tạo lại bằng:

```bash
python3 scripts/make_icons.py
```

Headers cache/bảo mật và redirect ngắn có ở `public/_headers`, `public/_redirects`.

---

## 📞 Liên Hệ Hỗ Trợ & Tư Vấn Triển Khai
- **Đơn vị phát triển**: Captain Solution — Nền tảng VTVL 360
- **Hotline / Zalo hỗ trợ**: `0907.xxx.xxx` (Hỗ trợ 24/7 toàn quốc)
- **Email tiếp nhận hồ sơ**: `contact@captain-solution.tech`
- **Địa bàn trọng điểm**: Cần Thơ, TP. Hồ Chí Minh và hỗ trợ từ xa toàn quốc.
