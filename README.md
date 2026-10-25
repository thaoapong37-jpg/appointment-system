# Đề 40: Hệ Thống Đặt Lịch Hẹn Trực Tuyến (AppointFlow — Appointment System)

Dự án được thiết kế và chuẩn hóa theo yêu cầu **Đề 40: Hệ thống Đặt lịch hẹn / Appointment**:
- **Phần mềm triển khai**: Website đặt lịch hẹn trực tuyến (Dịch vụ → Khung giờ → Khách hàng → Xác nhận), Tra cứu & Hủy lịch hẹn, Quản trị & Duyệt xác nhận lịch hẹn.
- **Cơ sở dữ liệu**: **PostgreSQL 16 + pgAdmin 4** (6 bảng quan hệ + Partial Unique Index & Trigger chống đặt trùng khung giờ).
- **Yêu cầu kỹ thuật & DevOps**: **Nginx Reverse Proxy**, **Prometheus + Grafana**, **Loki + LogQL**, **Security Hardening** (Rate Limiting, Security Headers, Parameterized SQL, Container Hardening).

---

## 1. Kiến trúc thư mục dự án (Modular MVC & Component Architecture)

```text
HE THONG DAT LICH HEN/
├── Backend/                                # Node.js + Express (Kiến trúc phân tầng Modular MVC)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                       # Kết nối Pool PostgreSQL 16 + Đồng bộ dữ liệu & JSON Logger
│   │   ├── middleware/
│   │   │   └── security.js                 # Hardening Security Headers + Prometheus Metrics & Loki Log
│   │   ├── controllers/
│   │   │   ├── serviceController.js        # API quản lý Dịch vụ (CRUD)
│   │   │   ├── slotController.js           # API kiểm tra Khung giờ trống & khóa trùng lặp
│   │   │   ├── appointmentController.js    # API Đặt lịch, Chống đặt trùng (409), Xác nhận & Lịch sử
│   │   │   └── adminController.js          # API Chuyên viên, Thống kê KPI, Loki Logs & /metrics
│   │   └── routes/
│   │       └── api.js                      # Định tuyến RESTful API (/api/*)
│   ├── server.js                           # Entry point khởi chạy Backend (Port 5000)
│   └── Dockerfile
├── Frontend/                               # React + Vite (Giao diện SaaS Light Mode hiện đại)
│   ├── src/
│   │   ├── data/
│   │   │   └── mockData.js                 # Dữ liệu mẫu đồng bộ & hàm tiện ích định dạng
│   │   ├── components/
│   │   │   ├── Navbar.jsx                  # Thanh điều hướng SaaS & chỉ báo trạng thái hệ thống
│   │   │   ├── HeroLanding.jsx             # Trang chủ: Đặt lịch nhanh, Quy trình 4 bước, Dịch vụ & Bác sĩ
│   │   │   ├── BookingWizard.jsx           # Luồng Đặt lịch hẹn 4 bước (Dịch vụ -> Khung giờ -> Khách -> Xác nhận)
│   │   │   ├── CustomerPortal.jsx          # Tra cứu Mã hẹn/SĐT/Email, Xem lịch sử trạng thái & Hủy lịch
│   │   │   ├── AdminDashboard.jsx          # Quản trị: Duyệt xác nhận lịch, Quản lý Dịch vụ, Chuyên viên, Biểu đồ
│   │   │   └── DevOpsMonitor.jsx           # Trung tâm Kỹ thuật Đề 40: Nginx, Prometheus/Grafana, Loki/LogQL, DB
│   │   ├── App.jsx                         # Điều phối trạng thái ứng dụng
│   │   └── styles.css                      # Hệ thống thiết kế SaaS Light Mode (Indigo/Violet/Emerald)
│   └── Dockerfile
├── database/
│   └── init.sql                            # Schema 6 bảng PostgreSQL, Partial Unique Index & 2 Trigger
├── nginx/
│   └── nginx.conf                          # Nginx Reverse Proxy + Rate Limiting (20r/s) + Hardening Headers
├── monitoring/
│   ├── prometheus/prometheus.yml           # Cấu hình thu thập metrics từ Backend (/metrics)
│   ├── grafana/datasources.yml             # Tự động kết nối Prometheus & Loki
│   └── loki/loki-config.yml                # Cấu hình Loki lưu trữ và truy vấn LogQL
└── docker-compose.yml                      # Khởi chạy toàn bộ 7 dịch vụ với Docker Compose
```

---

## 2. Chức năng phần mềm cốt lõi

1. **Trang chủ (Hero Landing)**:
   - Thanh đặt lịch nhanh (chọn Dịch vụ, chọn Ngày), xem nhanh tình trạng khung giờ trong ngày.
   - Giới thiệu quy trình 4 bước chuẩn Đề 40, danh mục 5 gói dịch vụ và đội ngũ chuyên viên phụ trách.
2. **Đặt lịch hẹn 4 bước (`BookingWizard`)**:
   - **Bước 1 (Dịch vụ)**: Chọn dịch vụ khám/tư vấn và chuyên viên phụ trách.
   - **Bước 2 (Khung giờ)**: Chọn ngày và khung giờ (Ca sáng / Ca chiều). Hệ thống tự động tính giờ kết thúc theo thời lượng dịch vụ và khóa các khung giờ đang `PENDING` / `CONFIRMED` để chống đặt trùng (`409 Conflict`).
   - **Bước 3 (Khách hàng)**: Điền Họ tên, Số điện thoại, Email và Ghi chú (hỗ trợ điền nhanh dữ liệu mẫu để demo).
   - **Bước 4 (Xác nhận)**: Kiểm tra tóm tắt và xuất **Phiếu hẹn điện tử** kèm mã `APT-2025-XXX`.
3. **Tra cứu & Quản lý Lịch hẹn Khách hàng (`CustomerPortal`)**:
   - Tìm kiếm theo Mã lịch hẹn, Số điện thoại, Email; lọc theo trạng thái; xem **Lịch sử thay đổi trạng thái (`appointment_status_history`)** và chủ động hủy lịch (giải phóng khung giờ).
4. **Quản trị & Xác nhận Lịch hẹn (`AdminDashboard`)**:
   - Thống kê 4 chỉ số KPI, duyệt **Xác nhận (`CONFIRMED`)**, **Hoàn thành (`COMPLETED`)**, **Hủy (`CANCELLED`)**, thêm/sửa/xóa Dịch vụ và Chuyên viên.
5. **Trung tâm Kỹ thuật & Giám sát Đề 40 (`DevOpsMonitor`)**:
   - Theo dõi trực tiếp **Prometheus Metrics (`/metrics`)**, biểu đồ **Grafana**, truy vấn log bằng **Loki + LogQL**, kiểm tra **6 bảng PostgreSQL + pgAdmin** và bảng kiểm **Hardening**.

---

## 3. Hướng dẫn khởi chạy dự án

### Cách 1: Chạy trực tiếp trên môi trường phát triển (Node.js)
1. **Khởi động Backend API (Port 5000)**:
   ```bash
   cd Backend
   npm install
   npm start
   ```
2. **Khởi động Frontend React + Vite (Port 5173)**:
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```
3. Mở trình duyệt tại: `http://localhost:5173`

### Cách 2: Chạy toàn bộ Stack với Docker Compose
```bash
docker-compose up -d --build
```
- **Website qua Nginx Reverse Proxy**: `http://localhost`
- **pgAdmin 4**: `http://localhost:5050` (`admin@appointment.vn` / `password123`)
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000` (`admin` / `admin`)
