# Hướng Dẫn Triển Khai Lên Ubuntu Server (Đề 40: Hệ Thống Đặt Lịch Hẹn)

Tài liệu này hướng dẫn từng bước đưa dự án từ máy Windows của bạn lên **Ubuntu Server / Máy ảo Ubuntu (VMware, VirtualBox, WSL2, VPS)** theo đúng yêu cầu kỹ thuật của **Đề 40**:
- **GitHub** (Quản lý mã nguồn)
- **PostgreSQL 16 + pgAdmin 4** (6 bảng + Unique Index & Trigger chống đặt trùng)
- **Nginx Reverse Proxy** (Định tuyến `/` và `/api/`, Rate Limiting 20r/s)
- **Prometheus + Grafana** (Thu thập và hiển thị biểu đồ `/metrics`)
- **Promtail + Loki + LogQL** (Thu thập log JSON và truy vấn LogQL)
- **Hardening** (Tường lửa UFW, Kernel sysctl, Nginx Security Headers, Rate Limiting)

---

## Bước 1: Đẩy dự án từ máy Windows lên GitHub

Mở **PowerShell / Terminal** tại thư mục dự án `c:\BÀI TAP N3\HE THONG DAT LICH HEN` và chạy:

```bash
git init
git add .
git commit -m "Hoan thien De 40: He thong Dat lich hen + PostgreSQL + Nginx + Monitoring"
git branch -M main
git remote add origin https://github.com/<TEN_GITHUB_CUA_BAN>/<TEN_REPO>.git
git push -u origin main
```

---

## Bước 2: Kéo code về Ubuntu & Chạy kịch bản tự động 1 lệnh

Đăng nhập vào máy **Ubuntu** (qua Terminal hoặc SSH), sau đó chạy 3 lệnh sau:

```bash
# 1. Tải mã nguồn từ GitHub về Ubuntu
git clone https://github.com/<TEN_GITHUB_CUA_BAN>/<TEN_REPO>.git appointment-system
cd appointment-system

# 2. Cấp quyền thực thi cho kịch bản triển khai tự động
chmod +x deploy-ubuntu.sh

# 3. Chạy kịch bản tự động cài Docker, cấu hình Hardening UFW và bật toàn bộ hệ thống
./deploy-ubuntu.sh
```

> **Lưu ý**: File `deploy-ubuntu.sh` đã được viết sẵn để tự động làm 5 việc trên Ubuntu:
> 1. Cài đặt **Docker** & **Docker Compose** (nếu máy Ubuntu chưa có).
> 2. Cấu hình **Ubuntu Hardening**: Bật tường lửa **UFW** (chỉ mở cổng `22`, `80`, `443`, `5050`, `3000`, `9090`) và cấu hình Kernel `sysctl` chống SYN Flood / IP Spoofing.
> 3. Khởi chạy 8 container trong `docker-compose.yml` (`postgres`, `pgadmin`, `backend`, `frontend`, `nginx`, `prometheus`, `loki`, `promtail`, `grafana`).
> 4. Tự động nạp file `database/init.sql` vào PostgreSQL tạo 6 bảng + 2 Trigger chống đặt trùng.
> 5. In ra danh sách đường dẫn IP của máy Ubuntu để bạn mở trình duyệt kiểm tra.

---

## Bước 3: Danh sách cổng truy cập & Cách Demo khi bảo vệ Đồ án

Giả sử địa chỉ IP máy Ubuntu của bạn là `<IP_UBUNTU>` (hoặc `localhost` nếu mở trình duyệt ngay trên Ubuntu):

| Thành phần Đề 40 | Đường dẫn truy cập | Thông tin đăng nhập / Kiểm tra |
| :--- | :--- | :--- |
| **1. Website Đặt lịch hẹn (Qua Nginx Reverse Proxy)** | `http://<IP_UBUNTU>` (Cổng `80`) | Giao diện Đặt lịch 4 bước, Tra cứu lịch, Quản trị Admin & DevOps |
| **2. Quản trị CSDL pgAdmin 4** | `http://<IP_UBUNTU>:5050` | Email: `admin@appointment.vn`<br>Pass: `Thaopong1234`<br>Khi Add New Server trong pgAdmin: Hostname điền `postgres`, Port `5432`, User `postgres`, Pass `Thaopong1234` |
| **3. Prometheus Server** | `http://<IP_UBUNTU>:9090` | Vào mục **Status → Targets** sẽ thấy target `appointment-backend (http://backend:5000/metrics)` trạng thái **UP** |
| **4. Grafana + Loki LogQL** | `http://<IP_UBUNTU>:3000` | Tài khoản: `admin` / `admin` (Đã gắn sẵn 2 datasource Prometheus & Loki tự động) |

---

## Bước 4: Các câu lệnh kiểm tra nhanh trên Terminal Ubuntu (Dùng khi giảng viên hỏi)

1. **Kiểm tra toàn bộ container đang chạy**:
   ```bash
   sudo docker compose ps
   ```
2. **Kiểm tra 6 bảng PostgreSQL trực tiếp bằng lệnh trên Ubuntu**:
   ```bash
   sudo docker exec -it appointment-postgres psql -U postgres -d appointment_db -c "\dt"
   ```
3. **Kiểm tra Nginx Security Headers & Hardening**:
   ```bash
   curl -I http://localhost
   ```
   *(Sẽ hiển thị `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, ẩn phiên bản Nginx)*.
4. **Kiểm tra Tường lửa UFW Hardening trên Ubuntu**:
   ```bash
   sudo ufw status verbose
   ```
5. **Truy vấn LogQL trên Grafana Explore (`http://<IP_UBUNTU>:3000/explore`)**:
   - Chọn nguồn dữ liệu **Loki** và chạy câu lệnh LogQL:
     ```logql
     {app="appointment-backend"} |= "ERROR"
     ```
     hoặc:
     ```logql
     {app="appointment-backend"} |= "DUPLICATE_BOOKING"
     ```
