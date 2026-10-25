import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Database,
  Lock,
  Activity,
  Star,
  UserCheck
} from 'lucide-react';
import { formatCurrency, renderServiceIcon } from '../data/mockData';

export default function HeroLanding({
  services,
  employees,
  appointments,
  onSelectServiceForBooking,
  onNavigate
}) {
  const [quickServiceId, setQuickServiceId] = useState(services[0]?.id || 1);
  const [quickDate, setQuickDate] = useState('2025-04-15');

  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length;
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;

  const handleQuickBook = (e) => {
    e.preventDefault();
    const chosen = services.find((s) => Number(s.id) === Number(quickServiceId)) || services[0];
    onSelectServiceForBooking(chosen, quickDate);
  };

  return (
    <div className="landing-container">
      {/* HERO BANNER */}
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-left">
            <div className="hero-eyebrow">
              <Sparkles size={15} />
              <span>Đề tài 40: Website Đặt lịch hẹn (Dịch vụ • Khung giờ • Khách hàng • Xác nhận)</span>
            </div>

            <h1 className="hero-heading">
              Đặt lịch hẹn thông minh, <br />
              <span className="text-gradient">chống trùng khung giờ</span> tuyệt đối.
            </h1>

            <p className="hero-description">
              Trải nghiệm quy trình đặt lịch 4 bước chuẩn SaaS hiện đại. Tích hợp kiểm tra khung giờ trống thời gian thực,
              khóa trùng lặp bằng <strong>PostgreSQL Partial Unique Index</strong> và giám sát toàn diện với{' '}
              <strong>Nginx, Prometheus, Grafana & Loki</strong>.
            </p>

            {/* Thanh đặt lịch nhanh */}
            <form className="quick-booking-bar" onSubmit={handleQuickBook}>
              <div className="quick-field">
                <label>Dịch vụ cần đặt</label>
                <select
                  value={quickServiceId}
                  onChange={(e) => setQuickServiceId(Number(e.target.value))}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} phút - {formatCurrency(s.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="quick-field">
                <label>Ngày hẹn mong muốn</label>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary-gradient quick-submit-btn">
                <span>Tiếp tục chọn giờ</span>
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="hero-trust-row">
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <span>Xác nhận tức thì</span>
              </div>
              <div className="trust-item">
                <Lock size={16} className="text-indigo" />
                <span>Chống đặt trùng 409 Conflict</span>
              </div>
              <div className="trust-item">
                <Database size={16} className="text-violet" />
                <span>PostgreSQL 16 + pgAdmin 4</span>
              </div>
            </div>
          </div>

          {/* HERO RIGHT: PREVIEW CARD */}
          <div className="hero-right">
            <div className="hero-showcase-card">
              <div className="showcase-header">
                <div>
                  <span className="showcase-tag">Trạng thái Khung giờ Hôm nay</span>
                  <h3>Lịch trực & Khung giờ 15/04/2025</h3>
                </div>
                <span className="live-pill">
                  <span className="status-dot-pulse" /> Live Sync
                </span>
              </div>

              <div className="showcase-slot-preview">
                {['08:00', '08:30', '09:00', '09:30', '10:00', '14:00', '14:30', '15:00'].map((slot) => {
                  const isBooked = appointments.some(
                    (a) =>
                      a.appointment_date === '2025-04-15' &&
                      a.start_time === slot &&
                      (a.status === 'PENDING' || a.status === 'CONFIRMED')
                  );
                  return (
                    <div
                      key={slot}
                      className={`mini-slot-chip ${isBooked ? 'booked' : 'available'}`}
                      onClick={() => {
                        if (!isBooked) onSelectServiceForBooking(services[0], '2025-04-15', slot);
                      }}
                    >
                      <Clock size={14} />
                      <span>{slot}</span>
                      <small>{isBooked ? 'Đã đặt' : 'Trống'}</small>
                    </div>
                  );
                })}
              </div>

              <div className="showcase-metrics-grid">
                <div className="showcase-metric-box">
                  <span className="metric-label">Đã xác nhận</span>
                  <strong className="metric-val text-emerald">{confirmedCount} lịch</strong>
                </div>
                <div className="showcase-metric-box">
                  <span className="metric-label">Đang chờ duyệt</span>
                  <strong className="metric-val text-amber">{pendingCount} lịch</strong>
                </div>
                <div className="showcase-metric-box">
                  <span className="metric-label">Dịch vụ hoạt động</span>
                  <strong className="metric-val text-indigo">{services.length} gói</strong>
                </div>
              </div>

              <div className="showcase-footer">
                <div className="showcase-arch-note">
                  <ShieldCheck size={16} />
                  <span>Bảo vệ bởi Nginx Reverse Proxy + Rate Limit 20r/s</span>
                </div>
                <button
                  type="button"
                  className="btn-link-subtle"
                  onClick={() => onNavigate('devops')}
                >
                  Xem kiến trúc →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUY TRÌNH 4 BƯỚC CHUẨN ĐỀ 40 */}
      <section className="section-block">
        <div className="section-header-Row">
          <div>
            <span className="section-kicker">QUY TRÌNH CHUẨN HÓA</span>
            <h2 className="section-title">4 Bước Đặt Lịch Hẹn Trực Tuyến</h2>
          </div>
          <p className="section-subtitle">
            Thiết kế tối ưu theo đúng yêu cầu phần mềm Đề 40: Dịch vụ → Khung giờ → Khách hàng → Xác nhận
          </p>
        </div>

        <div className="steps-feature-grid">
          <div className="step-feature-card">
            <div className="step-number-badge">01</div>
            <h3>Chọn Dịch vụ & Chuyên viên</h3>
            <p>Xem chi tiết bảng giá, thời lượng dự kiến (15 – 45 phút) và chuyên viên phụ trách từng dịch vụ.</p>
          </div>
          <div className="step-feature-card">
            <div className="step-number-badge">02</div>
            <h3>Chọn Ngày & Khung giờ trống</h3>
            <p>Hệ thống tự động kiểm tra và khóa các khung giờ đã có người đặt (PENDING / CONFIRMED).</p>
          </div>
          <div className="step-feature-card">
            <div className="step-number-badge">03</div>
            <h3>Thông tin Khách hàng</h3>
            <p>Điền họ tên, số điện thoại, email nhận phiếu hẹn và ghi chú yêu cầu riêng cho buổi hẹn.</p>
          </div>
          <div className="step-feature-card">
            <div className="step-number-badge">04</div>
            <h3>Xác nhận & Nhận Mã hẹn</h3>
            <p>Cấp mã định danh APT-2025-XXX, lưu vết lịch sử trạng thái và đồng bộ tức thì lên Dashboard.</p>
          </div>
        </div>
      </section>

      {/* DANH SÁCH DỊCH VỤ NỔI BẬT */}
      <section className="section-block">
        <div className="section-header-Row">
          <div>
            <span className="section-kicker">DANH MỤC DỊCH VỤ</span>
            <h2 className="section-title">Chọn dịch vụ phù hợp với bạn</h2>
          </div>
          <button
            type="button"
            className="btn-outline-indigo"
            onClick={() => onNavigate('booking')}
          >
            Xem tất cả & Đặt lịch →
          </button>
        </div>

        <div className="services-catalog-grid">
          {services.map((service) => (
            <div key={service.id} className="service-modern-card">
              <div className="service-card-top">
                <div className={`service-icon-box theme-${service.color_theme || 'indigo'}`}>
                  {renderServiceIcon(service.icon_type, 24)}
                </div>
                <span className="service-duration-pill">
                  <Clock size={13} /> {service.duration_minutes} phút
                </span>
              </div>

              <h3 className="service-card-title">{service.name}</h3>
              <p className="service-card-desc">{service.description}</p>

              <div className="service-card-bottom">
                <div>
                  <span className="price-caption">Chi phí dịch vụ</span>
                  <div className="service-price-tag">{formatCurrency(service.price)}</div>
                </div>
                <button
                  type="button"
                  className="btn-service-select"
                  onClick={() => onSelectServiceForBooking(service, quickDate)}
                >
                  <span>Đặt lịch</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ĐỘI NGŨ CHUYÊN VIÊN PHỤ TRÁCH */}
      <section className="section-block">
        <div className="section-header-Row">
          <div>
            <span className="section-kicker">ĐỘI NGŨ CHUYÊN GIA</span>
            <h2 className="section-title">Bác sĩ & Chuyên viên phụ trách</h2>
          </div>
        </div>

        <div className="specialist-grid">
          {employees.map((emp) => (
            <div key={emp.id} className="specialist-card">
              <div className="specialist-avatar">
                <UserCheck size={24} />
              </div>
              <div className="specialist-info">
                <h4>{emp.full_name}</h4>
                <p>{emp.specialty}</p>
                <div className="specialist-meta">
                  <span className="rating-pill">
                    <Star size={13} fill="#f59e0b" color="#f59e0b" /> {emp.rating || '4.9'}
                  </span>
                  <span>{emp.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
