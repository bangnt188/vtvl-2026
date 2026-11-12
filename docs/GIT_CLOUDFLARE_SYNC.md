# Đồng bộ GitHub → Cloudflare Pages

- Repository: `bangnt188/vtvl-2026`
- Branch production: `main`
- Cloudflare Pages project: `vtvl-2026`
- Website: `https://vtvl.captain-solution.tech`
- Build command: *(trống, website HTML tĩnh)*
- Root: `/`
- Output: `public`
- Automatic deployments: **enabled** cho production `main`

## Kiểm tra lỗi

1. `git remote -v` → repository phải là `bangnt188/vtvl-2026`.
2. `git branch --show-current` → phải là `main` để lên production.
3. `git push origin main`.
4. Mở Cloudflare → Workers & Pages → `vtvl-2026` → Deployments; tìm commit SHA mới nhất.
5. Nếu không xuất hiện deployment nào, kiểm tra trong GitHub Settings → Applications → **Cloudflare Workers and Pages** có quyền truy cập repository `vtvl-2026`, không bị suspended.
6. Trong Cloudflare, Settings → Builds → Git Repository (Manage), và Branch control → Enable automatic production deployments.
7. Không nên xoá và tạo lại Pages project đang gắn tên miền production nếu chưa có kế hoạch chuyển domain.

Tài liệu này được thêm chỉ để kiểm tra sự kiện Git push. Không phải bằng chứng ứng dụng đã được triển khai tự động.
