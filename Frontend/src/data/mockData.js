import React from 'react';
import {
  Shield,
  Stethoscope,
  Heart,
  FlaskConical,
  Activity,
  Sparkles
} from 'lucide-react';

export const FALLBACK_SERVICES = [
  {
    id: 1,
    name: 'Tư vấn sức khỏe',
    category: 'Tư vấn',
    description: 'Tư vấn trực tiếp 1-1 cùng chuyên gia về chế độ sinh hoạt, tầm soát triệu chứng và phòng ngừa bệnh lý.',
    price: 0,
    duration_minutes: 15,
    icon_type: 'shield',
    color_theme: 'indigo',
    is_active: true
  },
  {
    id: 2,
    name: 'Khám tổng quát',
    category: 'Khám lâm sàng',
    description: 'Kiểm tra sức khỏe toàn diện định kỳ, đo huyết áp, tim mạch, hô hấp và đánh giá chỉ số cơ thể.',
    price: 200000,
    duration_minutes: 30,
    icon_type: 'medical',
    color_theme: 'emerald',
    is_active: true
  },
  {
    id: 3,
    name: 'Khám chuyên khoa',
    category: 'Chuyên sâu',
    description: 'Khám chuyên sâu Nội khoa, Ngoại khoa, Tai Mũi Họng, Tim mạch cùng đội ngũ bác sĩ đầu ngành.',
    price: 300000,
    duration_minutes: 45,
    icon_type: 'doctor',
    color_theme: 'violet',
    is_active: true
  },
  {
    id: 4,
    name: 'Xét nghiệm',
    category: 'Cận lâm sàng',
    description: 'Xét nghiệm máu, sinh hóa, huyết học và tầm soát chỉ số sức khỏe nhanh chóng, trả kết quả số hóa.',
    price: 150000,
    duration_minutes: 20,
    icon_type: 'flask',
    color_theme: 'amber',
    is_active: true
  },
  {
    id: 5,
    name: 'Tư vấn dinh dưỡng',
    category: 'Chăm sóc',
    description: 'Xây dựng thực đơn khoa học, cân bằng dinh dưỡng cá nhân hóa theo thể trạng và mục tiêu sức khỏe.',
    price: 100000,
    duration_minutes: 30,
    icon_type: 'heart',
    color_theme: 'rose',
    is_active: true
  }
];

export const FALLBACK_EMPLOYEES = [
  {
    id: 1,
    full_name: 'ThS. BS. Nguyễn Thị Mai',
    specialty: 'Tư vấn sức khỏe & Dinh dưỡng',
    phone: '0902111222',
    email: 'mai.nguyen@appointment.vn',
    rating: 4.9
  },
  {
    id: 2,
    full_name: 'TS. BS. Trần Văn Hùng',
    specialty: 'Khám tổng quát & Nội Chuyên khoa',
    phone: '0902333444',
    email: 'hung.tran@appointment.vn',
    rating: 5.0
  },
  {
    id: 3,
    full_name: 'CKI. Lê Thị Hoa',
    specialty: 'Xét nghiệm & Chẩn đoán hình ảnh',
    phone: '0902555666',
    email: 'hoa.le@appointment.vn',
    rating: 4.8
  }
];

export const STANDARD_SLOTS = [
  '08:00', '08:30', '09:00',
  '09:30', '10:00', '10:30',
  '14:00', '14:30', '15:00',
  '15:30', '16:00'
];

export const SAMPLE_CUSTOMERS = [
  {
    name: 'Nguyễn Văn A',
    phone: '0987654321',
    email: 'nguyenvana@gmail.com',
    notes: 'Khám và kiểm tra sức khỏe định kỳ'
  },
  {
    name: 'Trần Thị B',
    phone: '0912345678',
    email: 'tranthib@gmail.com',
    notes: 'Tư vấn chỉ số huyết áp và chế độ ăn'
  },
  {
    name: 'Lê Văn C',
    phone: '0933445566',
    email: 'levanc@gmail.com',
    notes: 'Đặt lịch xét nghiệm máu buổi sáng'
  }
];

export function formatCurrency(amount) {
  const num = Number(amount || 0);
  if (num === 0) return 'Miễn phí';
  return num.toLocaleString('vi-VN') + ' đ';
}

export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).slice(0, 10).split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function calculateEndTime(startTime, durationMinutes = 30) {
  const [hh, mm] = String(startTime || '09:00').split(':').map(Number);
  const total = (hh || 9) * 60 + (mm || 0) + Number(durationMinutes || 30);
  const endH = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const endM = String(total % 60).padStart(2, '0');
  return `${endH}:${endM}`;
}

export function getStatusMeta(status) {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'Đã xác nhận', badgeClass: 'badge-confirmed', dotColor: '#10b981' };
    case 'PENDING':
      return { label: 'Chờ xác nhận', badgeClass: 'badge-pending', dotColor: '#f59e0b' };
    case 'COMPLETED':
      return { label: 'Hoàn thành', badgeClass: 'badge-completed', dotColor: '#4f46e5' };
    case 'CANCELLED':
      return { label: 'Đã hủy', badgeClass: 'badge-cancelled', dotColor: '#ef4444' };
    default:
      return { label: status, badgeClass: 'badge-pending', dotColor: '#64748b' };
  }
}

export function renderServiceIcon(iconType, size = 22) {
  switch (iconType) {
    case 'shield':
      return React.createElement(Shield, { size });
    case 'medical':
      return React.createElement(Activity, { size });
    case 'doctor':
      return React.createElement(Stethoscope, { size });
    case 'flask':
      return React.createElement(FlaskConical, { size });
    case 'heart':
      return React.createElement(Heart, { size });
    default:
      return React.createElement(Sparkles, { size });
  }
}
