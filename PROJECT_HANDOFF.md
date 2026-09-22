# Tổng quan ứng dụng theo dõi thiết bị

Tài liệu này dành cho người tiếp nhận mã nguồn và đưa ứng dụng lên server. Đây là ứng dụng web **ASP.NET Core 8** độc lập với thư mục `GIS/`; giao diện viết bằng HTML, CSS, JavaScript và gọi API của chính ứng dụng. Cơ sở dữ liệu là SQL Server có sẵn, ứng dụng không tự tạo schema.

## Chức năng chính

- Đăng nhập bằng tài khoản trong bảng `AspNetUsers` và duy trì phiên bằng cookie.
- Xem vị trí mới nhất, trạng thái thiết bị và cảm biến trên bản đồ. Trang theo dõi tự tải lại dữ liệu mỗi 15 giây.
- Tra cứu lịch sử bản tin, chi tiết bản tin và hành trình thiết bị.
- Gửi lệnh SC1000 tới OGWS, lưu kết quả gửi vào `CommandQueue`. Tác vụ nền hỏi trạng thái lệnh mỗi phút và cập nhật kết quả cuối.

## Đường đi của dữ liệu

```text
Trình duyệt → API ASP.NET Core → DeviceRepository → SQL Server
                                     │
Gửi lệnh: trình duyệt → API → OgwsClient → OGWS
                            └───────────────→ CommandQueue
Tác vụ nền: CommandStatusWorker → OGWS → CommandQueue
```

`DeviceLastPosition` là nguồn vị trí mới nhất. `MessageLog` chứa lịch sử bản tin và dữ liệu cảm biến; API dùng `OPENJSON` để đọc cảm biến. `CommandQueue` lưu lịch sử lệnh. Ứng dụng đọc các bảng này, ghi/cập nhật `CommandQueue`, nhưng không thay thế tiến trình bên ngoài đang thu thập bản tin và cập nhật vị trí mới nhất.

## Vị trí mã nguồn

| Đường dẫn | Vai trò |
| --- | --- |
| `Program.cs` | Cấu hình ứng dụng, đăng nhập, các route và tác vụ nền. |
| `Controllers/DevicesController.cs` | API thiết bị, lịch sử và lệnh. |
| `Repositories/DeviceRepository.cs` | Truy vấn SQL bằng Dapper. |
| `Models/` | Kiểu dữ liệu trả về từ API và yêu cầu gửi lệnh. |
| `Services/Ogws/` | Gọi OGWS, quản lý giới hạn hỏi trạng thái và cập nhật lệnh. |
| `Services/UtcDateTimeJsonConverter.cs` | Gắn UTC cho thời gian từ SQL khi trả JSON. |
| `wwwroot/` | HTML, CSS, JavaScript và tài nguyên trình duyệt. `wwwroot/js/pages/` chia theo từng trang. |
| `tests/` | Trang kiểm tra thủ công. |

`GIS/` và `OGWS Documents/` là tài liệu/tham chiếu tại máy phát triển, không thuộc project được build.

## Cấu hình cần có trên máy chạy

- `.NET 8` để chạy bản publish phụ thuộc runtime.
- Kết nối từ máy chạy ứng dụng tới SQL Server và database có đúng các bảng/cột mà code truy vấn: `AspNetUsers`, `DeviceLastPosition`, `MessageLog`, `CommandQueue`. Database cần hỗ trợ `OPENJSON` cho truy vấn cảm biến.
- Tài khoản SQL có quyền đọc các bảng cần thiết và quyền ghi/cập nhật `CommandQueue`.
- Kết nối ra OGWS nếu cần gửi lệnh hoặc cập nhật trạng thái. Trình duyệt cũng cần tải được thư viện bản đồ và dữ liệu bản đồ từ các địa chỉ ngoài được dùng trong `wwwroot/`.

Tạo `appsettings.Local.json` cạnh `appsettings.json` trong thư mục chạy ứng dụng, dựa trên `appsettings.Local.example.json`. Điền `ConnectionStrings:TrackingDatabase` và, nếu dùng lệnh thiết bị, `Ogws:ServerUrl`, `Ogws:AccessId`, `Ogws:Password`. Có thể dùng biến môi trường `ConnectionStrings__TrackingDatabase`, `Ogws__ServerUrl`, `Ogws__AccessId`, `Ogws__Password`; biến môi trường được ưu tiên hơn file local. Không đưa file chứa mật khẩu vào Git.

`appsettings.Development.json` và `appsettings.Development.local.json` chỉ áp dụng khi chạy ở môi trường Development; file `.local` được ưu tiên hơn `appsettings.Local.json` trong môi trường này. Khi đưa lên server Production, không dựa vào cấu hình trong hai file Development. Xem các bước chi tiết ở [DEPLOYMENT.md](DEPLOYMENT.md).

## Đưa lên server và kiểm tra

1. Từ thư mục project, chạy `dotnet publish WebsitesOrbcommLocations.csproj -c Release -o publish`.
2. Chép nội dung thư mục `publish` lên server và cấu hình `appsettings.Local.json` hoặc biến môi trường trên server.
3. Cấu hình host/IIS cho ứng dụng ASP.NET Core 8 và HTTPS, rồi khởi động ứng dụng.
4. Gọi `/api/health/database` để kiểm tra tên database được kết nối.
5. Thử đăng nhập, xem vị trí, lọc lịch sử và xem hành trình. Nếu dùng OGWS, gửi một lệnh thử và kiểm tra trạng thái trong lịch sử lệnh.

Các route giao diện là `/tracking`, `/devices`, `/history`, `/journey`. API dữ liệu nằm dưới `/api/devices`; API đăng nhập nằm dưới `/api/auth`. Swagger chỉ bật trong môi trường Development.

## Quy ước và giới hạn hiện tại

- Thời gian trong database được xem là **UTC**. API trả thời gian UTC; giao diện hiển thị giờ Việt Nam (UTC+7). Bộ lọc thời gian người dùng nhập được đổi sang UTC trước khi gửi API.
- Code đăng nhập dùng `AspNetUsers` nhưng hiện chưa áp dụng phân quyền theo vai trò/menu của GIS. Người đăng nhập có thể gọi các API thiết bị đang được bảo vệ bằng `[Authorize]`, gồm API gửi lệnh.
- Tên connection string của ứng dụng này là `TrackingDatabase`; tên `Default` của GIS không được dùng tự động.
- Nếu màn hình bản đồ không có vị trí mới, kiểm tra thêm tiến trình bên ngoài đang ghi `MessageLog` và `DeviceLastPosition`.
