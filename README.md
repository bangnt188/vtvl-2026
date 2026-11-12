# VTVL 360 — Captain Solution

Nền tảng hỗ trợ **rà soát vị trí việc làm (VTVL)** trong các đơn vị sự nghiệp công lập và trường học tại Việt Nam, ưu tiên hỗ trợ trực tiếp tại Cần Thơ.

> **Không liên quan đến vận tải, hàng không hay VTVL (vertical take-off/vertical landing).** Từ viết tắt VTVL trong dự án này chỉ có nghĩa **VỊ TRÍ VIỆC LÀM**.

## Trạng thái

Đây là bản **giao diện thử nghiệm độc lập** đã thiết kế lại theo nguyên tắc Impeccable (tập trung vào tính rõ ràng, tiếp cận và luồng thao tác thực tế). **Không phải mã nguồn được clone từ vtvl.tranghoaivu.vn**, vì không có quyền truy cập repository gốc. Đừng coi đây là ứng dụng xử lý hồ sơ pháp lý hay Excel v2 đạt chứng nhận.

Đã có:
- Dashboard định hướng nghiệp vụ;
- Quy trình 8 bước rà soát;
- Kiểm tra dấu ZIP của tệp XLSX và tính SHA-256 cục bộ;
- Đối chiếu số học B1, xuất JSON kết quả;
- Điểm dẫn tới cổng tra cứu căn cứ pháp lý.

Chưa có:
- AI đọc và đối chiếu chứng cứ;
- Đọc/ghi đầy đủ cấu trúc Excel VTVL v2, xác nhận hợp lệ cho phần mềm import;
- Quản lý hồ sơ và phân quyền, ghi nhật ký, trích dẫn ô/trang;
- Kiểm thử định dạng bằng tệp mẫu gốc và bản nhập thành công.

## Phạm vi VTVL

- **A1, A2, B1, B2, C1, C2, C3, D1, D2**, dự báo và đối chiếu chéo.
- Số liệu có nguồn, đơn vị, kỳ và phạm vi, phân biệt đã chốt và chờ xác nhận.
- Tách dữ liệu trước và sau sáp nhập; tính nhu cầu theo từng cấp học.
- Tuyệt đối không thêm sheet, cột, hàng, ghi đè công thức hay làm biến dạng file mẫu Bộ biểu VTVL v2.

## Chạy thử

Mở `public/index.html` trực tiếp trên trình duyệt. Website tĩnh không yêu cầu Node hay backend. Chức năng SHA-256 qua Web Crypto cần HTTPS hoặc localhost.

## Cloudflare

Dự án Pages: `vtvl-2026` — deployment từ nhánh `main`; thư mục xuất bản `public`. Tên miền mục tiêu: `vtvl.captain-solution.tech`.

**Lưu ý:** Chỉ triển khai demo public. Không tải hồ sơ nhân sự thật lên trước khi có xác thực, phân quyền, chính sách bảo mật và hệ thống kiểm chứng.

## Tác giả và nguồn

Captain Solution. Mã nguồn hiện tại là triển khai mới, không sao chép code nội bộ từ bất kỳ website nào. Các văn bản pháp lý cần được kiểm tra hiệu lực tại thời điểm sử dụng.
