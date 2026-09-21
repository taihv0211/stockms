# Mockup Quản lý APT — Cục Lãnh sự

Dựng lại theo bộ thiết kế khách hàng (thư mục `design/`, 14 màn hình PDF).
Mở `index.html` bằng trình duyệt là dùng được, không cần cài gì.

## Đối chiếu màn hình thiết kế → file

| Màn hình | Nội dung | File |
|---|---|---|
| 1 | Tổng quan (Admin, LĐC) | `tong-quan.html` |
| 2, 3 | Xuất kho: ngoài nước / trong nước (có duyệt VP → Cục) | `xuat-kho.html` |
| 4, 5 | Nhập kho: ngoài nước / trong nước | `nhap-kho.html` |
| 6, 7 | Báo cáo giao nhận: dự toán / đã nhận / còn nhận / % | `giao-nhan.html` |
| 8, 9 | Báo cáo sử dụng | `su-dung.html` |
| 10 | Tra cứu APT theo seri | `tra-cuu.html` |
| 11 | Điều chuyển APT | `dieu-chuyen.html` |
| 12 | *(không có trong thiết kế)* Chọn số hộ chiếu — dựng tạm | `chon-so.html` |
| 13 | Quản lý tham số → Tên ấn phẩm | `tham-so-an-pham.html` |
| 14 | Quản lý tham số → Tên đơn vị | `tham-so-don-vi.html` |
| 15 | Quản lý tài khoản | `tai-khoan.html` |

Ngoài ra `index.html` là trang chọn tài khoản để xem theo từng quyền.

## Quyền xem thử

Chọn tài khoản ở `index.html`, hoặc đổi nhanh bằng ô **"Xem thử với quyền"** ở góc phải mỗi trang.
Quyền nằm ở `APT.ROLES` trong `js/data.js` (đây là **giả định của mình**, cần khách hàng xác nhận):

| Tài khoản | Vào được | Làm được |
|---|---|---|
| admin | tất cả | mọi thứ |
| ctr, pctr (LĐC1, LĐC2) | Tổng quan, Xuất/Nhập, Báo cáo, Tra cứu, Điều chuyển | xem; duyệt bước "Lãnh đạo Cục" |
| kho | Xuất/Nhập, Báo cáo, Tra cứu, Điều chuyển | lập và xác nhận phiếu |
| vp | Xuất kho, Báo cáo, Tra cứu, Điều chuyển | duyệt bước "Lãnh đạo VP" |
| lsnn, xnc | Báo cáo sử dụng, Tra cứu, Điều chuyển, Chọn số hộ chiếu (chỉ trong nước) | lập phiếu điều chuyển |
| ant (ĐSQVN) | Giao nhận, Sử dụng, Tra cứu (chỉ ngoài nước) | chỉ xem số liệu của chính cơ quan mình |

## Thử luồng duyệt xuất kho

1. Đăng nhập **kho** → Xuất kho → chọn cơ quan nhận, nhập người nhận → **Xác nhận**.
2. Đổi quyền sang **vp** → bấm **Duyệt** (hoặc ghi ý kiến rồi **Yêu cầu điều chỉnh**).
3. Đổi quyền sang **ctr** → **Duyệt**.

Phiếu được nhớ trong trình duyệt. Nút "Xóa các phiếu và dữ liệu đã nhập thử" ở `index.html` để làm lại từ đầu.

## Ghi chú

- Số liệu là dữ liệu mẫu cố định. Danh sách 97 cơ quan lấy từ file Excel.
- Ấn phẩm: 23 loại ngoài nước, 9 loại trong nước. Thêm ấn phẩm ở màn hình 13 thì cột mới xuất hiện ở các bảng.
- Loại có seri (hộ chiếu, thị thực): nhập theo dải Từ – Đến, số lượng tự tính, báo trùng dải.
- Cấu trúc: `css/style.css` (giao diện), `js/data.js` (dữ liệu + quyền), `js/shell.js` (menu, bảng), `js/phieu.js` (phiếu).
