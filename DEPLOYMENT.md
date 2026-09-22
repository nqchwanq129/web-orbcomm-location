# Cấu hình ứng dụng khi chuyển máy

Ứng dụng dùng ASP.NET Core 8 và `Microsoft.Data.SqlClient`. Phiên bản SQL Server không được ghi cứng trong code. Máy mới vẫn cần địa chỉ SQL Server, tên database và thông tin đăng nhập hợp lệ; ứng dụng không thể tự tìm những thông tin này.

1. Publish ứng dụng rồi tạo `appsettings.Local.json` cạnh file `appsettings.json` trong thư mục chạy ứng dụng. Sao chép mẫu từ `appsettings.Local.example.json` và điền thông tin của máy mới. Không đưa file chứa mật khẩu vào Git.
2. Đặt `ConnectionStrings:TrackingDatabase` trỏ tới database có đúng schema (`AspNetUsers`, `DeviceLastPosition`, `MessageLog`, `CommandQueue`). Nếu SQL Server dùng Windows Authentication, thay `User Id=...;Password=...` bằng `Integrated Security=True` và cấp quyền cho tài khoản chạy ứng dụng.
3. Có thể cấu hình qua biến môi trường `ConnectionStrings__TrackingDatabase` thay cho file. Biến môi trường được ưu tiên hơn file local. Tương tự, dùng `Ogws__ServerUrl`, `Ogws__AccessId`, `Ogws__Password` cho OGWS.
4. Khởi động ứng dụng và gọi `/api/health/database` để xác nhận kết nối và tên database. Sau đó thử đăng nhập, xem vị trí và gửi lệnh.

Nếu SQL Server dùng chứng chỉ TLS được tin cậy, đặt `TrustServerCertificate=False` trong chuỗi kết nối. Cần bảo đảm máy chạy ứng dụng kết nối được đến cổng SQL Server và tài khoản có quyền đọc/ghi các bảng mà ứng dụng dùng.
