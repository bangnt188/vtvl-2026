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
- **Preflight VTVL v2 ở trình duyệt**: đọc XLSX/OOXML, đối chiếu kỳ `K2526`, mã nội bộ `B1!L`, tham chiếu A1–A2–B1/C1, số lượng và phút/SP, năm dự báo; nếu người dùng chọn mẫu gốc thì so danh sách phần ZIP, sheet, địa chỉ ô, công thức, merged cells và data validations;
- Báo lỗi theo từng ô, tải báo cáo JSON; không upload XLSX và không tự sửa;
- Điểm dẫn tới cổng tra cứu căn cứ pháp lý.

Chưa có:
- AI đọc và đối chiếu chứng cứ;
- **Xuất/ghi XLSX** và xác nhận hợp lệ với phần mềm import chính thức (hiện tại chỉ ĐỌC và KIỂM TRA, CHƯA GHI);
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

## Các lỗi validation đã ghi nhận trong hồ sơ 06/11/2026

Từ biên bản tự kiểm tra dữ liệu THCS Vị Thanh: lần nạp thứ hai có **142 dòng báo lỗi trong 658 dòng kiểm tra**, nhưng nguyên nhân gốc gồm **Kỳ hồ sơ ghi sai** và **mã sản phẩm nội bộ không có trong danh mục phần mềm**. Lỗi A2/C3/D2/DU_BAO có thể là lỗi dây chuyền sau khi A1/B1 bị loại.

Kỳ hồ sơ mẫu đã ghi nhận: `01/10/2025 – 30/09/2026` (gạch dài `–`, có hai dấu cách). Kiểm tra tại `A1!E`, `B1!K`, `B2_CT!K`. `B1!L`: báo **cần đối chiếu danh mục chính thức**, không tự xóa mã có thể hợp lệ. Đây là bộ quy tắc **mô phỏng**, không phải bộ kiểm tra chính thức của cơ quan tiếp nhận.

### Giới hạn

- Với file B1 đơn lẻ, các biểu còn thiếu sẽ là cảnh báo phạm vi; không khẳng định hồ sơ thiếu dữ liệu.
- Không đưa dữ liệu Excel hay nhân sự lên backend; việc kiểm tra chạy trong trình duyệt.
- Muốn so cấu trúc, cần tải vào **đúng mẫu Bộ biểu VTVL v2 gốc** để kiểm tra ZIP, công thức, ô, cấu trúc.
- Chưa có danh mục mã sản phẩm phía hệ thống nhập; B1!L bắt buộc đối chiếu thủ công.
- Chưa kiểm tra toàn bộ định mức theo từng địa phương, phiếu đo và tính hợp lệ văn bản.
- Không tuyên bố file đã được thẩm định hay nhập thành công.
- GitHub Actions ở `.github/workflows/validation.yml` có các ca hồi quy cho lỗi từng gặp.
