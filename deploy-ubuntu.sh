#!/usr/bin/env bash
# ============================================================================
# KỊCH BẢN TRIỂN KHAI TỰ ĐỘNG & HARDENING TRÊN UBUNTU SERVER (ĐỀ 40)
# Hệ thống Đặt lịch hẹn: Node.js + React + PostgreSQL + pgAdmin + Nginx + Prometheus + Grafana + Loki
# ============================================================================
set -e

echo "=================================================================="
echo "  BẮT ĐẦU TRIỂN KHAI ĐỀ 40: HỆ THỐNG ĐẶT LỊCH HẸN TRÊN UBUNTU"
echo "=================================================================="

# 1. Cập nhật hệ thống & cài đặt các gói cơ bản
echo "[1/5] Cập nhật gói hệ thống Ubuntu..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg ufw git

# 2. Cài đặt Docker & Docker Compose (nếu chưa có)
if ! command -v docker &> /dev/null; then
  echo "[2/5] Đang cài đặt Docker Engine & Docker Compose..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
  sudo systemctl enable docker
  sudo systemctl start docker
else
  echo "[2/5] Docker đã được cài đặt: $(docker --version)"
fi

# 3. Cấu hình Hardening Hệ điều hành Ubuntu (UFW Firewall & Sysctl)
echo "[3/5] Thiết lập Ubuntu Hardening (Tường lửa UFW & Bảo mật mạng)..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH Default'
sudo ufw allow 2849/tcp comment 'SSH Hardened Port'
sudo ufw allow 80/tcp comment 'Nginx Reverse Proxy HTTP'
sudo ufw allow 443/tcp comment 'Nginx Reverse Proxy HTTPS'
sudo ufw allow 5000/tcp comment 'Backend API'
sudo ufw allow 5173/tcp comment 'Frontend Vite'
sudo ufw allow 5050/tcp comment 'pgAdmin 4 Web UI'
sudo ufw allow 3000/tcp comment 'Grafana Monitoring'
sudo ufw allow 9090/tcp comment 'Prometheus Server'
sudo ufw allow 3100/tcp comment 'Loki LogQL'
sudo ufw --force enable

# Chống SYN Flood & IP Spoofing ở tầng Kernel Ubuntu
sudo tee /etc/sysctl.d/99-appointment-hardening.conf > /dev/null <<EOF
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
EOF
sudo sysctl --system > /dev/null || true

# 4. Khởi chạy toàn bộ 8 container bằng Docker Compose
echo "[4/5] Đang build và khởi chạy toàn bộ cụm container Đề 40..."
if docker compose version &> /dev/null; then
  sudo docker compose down --remove-orphans || true
  sudo docker compose up -d --build
else
  sudo docker-compose down --remove-orphans || true
  sudo docker-compose up -d --build
fi

# 5. Kiểm tra trạng thái hoạt động
echo "[5/5] Đang kiểm tra trạng thái các container..."
sleep 6
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "=================================================================="
echo "  TRIỂN KHAI THÀNH CÔNG LÊN UBUNTU!"
echo "=================================================================="
echo "1. Website Đặt lịch hẹn (qua Nginx Port 80): http://${SERVER_IP}"
echo "2. Backend API Healthcheck & Metrics       : http://${SERVER_IP}/metrics"
echo "3. Quản trị CSDL pgAdmin 4                 : http://${SERVER_IP}:5050"
echo "   - Email đăng nhập pgAdmin               : admin@appointment.vn"
echo "   - Mật khẩu đăng nhập pgAdmin            : Thaopong1234"
echo "   - Host kết nối PostgreSQL trong pgAdmin : postgres (Port 5432, User: postgres, Pass: Thaopong1234)"
echo "4. Prometheus UI                           : http://${SERVER_IP}:9090"
echo "5. Grafana Dashboard & Loki LogQL          : http://${SERVER_IP}:3000 (admin / admin)"
echo "=================================================================="
