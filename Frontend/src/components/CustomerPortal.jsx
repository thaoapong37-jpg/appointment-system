import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  XCircle,
  History,
  CheckCircle2,
  CalendarPlus,
  FileText
} from 'lucide-react';
import {
  formatCurrency,
  formatDateVN,
  getStatusMeta,
  renderServiceIcon
} from '../data/mockData';

export default function CustomerPortal({
  appointments,
  filterCustomerQuery,
  setFilterCustomerQuery,
  onUpdateStatus,
  onFetchHistory,
  onNavigateBooking
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [historyModal, setHistoryModal] = useState(null);

  const filteredList = appointments.filter((apt) => {
    const matchStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    const q = (filterCustomerQuery || '').trim().toLowerCase();
    const matchQuery =
      !q ||
      apt.customer_name.toLowerCase().includes(q) ||
      apt.customer_email.toLowerCase().includes(q) ||
      apt.customer_phone.toLowerCase().includes(q) ||
      (apt.appointment_code && apt.appointment_code.toLowerCase().includes(q));
    return matchStatus && matchQuery;
  });

  const handleOpenHistory = async (apt) => {
    const items = await onFetchHistory(apt.id);
    setHistoryModal({
      appointment: apt,
      items
    });
  };

  return (
    <div className="portal-page">
      <div className="portal-header-card">
        <div>
          <span className="section-kicker">KHÁCH HÀNG & TRA CỨU</span>
          <h2>Lịch hẹn của tôi & Tra cứu trạng thái</h2>
          <p>
            Tra cứu lịch hẹn theo Mã hẹn (APT-2025-XXX), Email hoặc Số điện thoại. Khi hủy lịch, khung giờ sẽ được giải phóng
            tức thì trên PostgreSQL.
          </p>
        </div>
        <button type="button" className="btn-primary-gradient" onClick={onNavigateBooking}>
          <CalendarPlus size={17} />
          <span>+ Đặt lịch hẹn mới</span>
        </button>
      </div>

      {/* THANH TÌM KIẾM & LỌC NHANH KHÁCH HÀNG */}
      <div className="portal-controls-bar">
        <div className="portal-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo Mã hẹn (APT-2025-001), Tên, SĐT hoặc Email..."
            value={filterCustomerQuery}
            onChange={(e) => setFilterCustomerQuery(e.target.value)}
          />
          {filterCustomerQuery && (
            <button type="button" className="clear-search-btn" onClick={() => setFilterCustomerQuery('')}>
              Xóa lọc
            </button>
          )}
        </div>

        <div className="quick-customer-pills">
          <span>Xem nhanh theo khách:</span>
          <button
            type="button"
            className={`chip-filter ${filterCustomerQuery === '' ? 'active' : ''}`}
            onClick={() => setFilterCustomerQuery('')}
          >
            Tất cả ({appointments.length})
          </button>
          <button
            type="button"
            className={`chip-filter ${filterCustomerQuery === 'nguyenvana@gmail.com' ? 'active' : ''}`}
            onClick={() => setFilterCustomerQuery('nguyenvana@gmail.com')}
          >
            Nguyễn Văn A
          </button>
          <button
            type="button"
            className={`chip-filter ${filterCustomerQuery === 'tranthib@gmail.com' ? 'active' : ''}`}
            onClick={() => setFilterCustomerQuery('tranthib@gmail.com')}
          >
            Trần Thị B
          </button>
        </div>
      </div>

      {/* BỘ LỌC TRẠNG THÁI */}
      <div className="status-tabs-bar">
        {[
          { id: 'ALL', label: 'Tất cả lịch hẹn' },
          { id: 'PENDING', label: 'Chờ xác nhận' },
          { id: 'CONFIRMED', label: 'Đã xác nhận' },
          { id: 'COMPLETED', label: 'Hoàn thành' },
          { id: 'CANCELLED', label: 'Đã hủy' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`status-tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DANH SÁCH THẺ LỊCH HẸN */}
      <div className="customer-appointments-grid">
        {filteredList.length === 0 ? (
          <div className="empty-state-box">
            <Calendar size={40} />
            <h3>Không tìm thấy lịch hẹn nào phù hợp</h3>
            <p>Hãy thử đổi từ khóa tìm kiếm hoặc đặt một lịch hẹn mới ngay bây giờ.</p>
            <button type="button" className="btn-primary-gradient" onClick={onNavigateBooking}>
              Đặt lịch ngay
            </button>
          </div>
        ) : (
          filteredList.map((apt) => {
            const statusMeta = getStatusMeta(apt.status);
            const canCancel = apt.status === 'PENDING' || apt.status === 'CONFIRMED';

            return (
              <div key={apt.id} className="customer-apt-card">
                <div className="apt-card-top">
                  <div className="apt-service-head">
                    <div className={`service-icon-box theme-${apt.service_color || 'indigo'}`}>
                      {renderServiceIcon(apt.service_icon, 20)}
                    </div>
                    <div>
                      <span className="apt-code-tag">{apt.appointment_code || `APT-2025-00${apt.id}`}</span>
                      <h3>{apt.service_name}</h3>
                    </div>
                  </div>

                  <span className={`status-pill ${statusMeta.badgeClass}`}>
                    <span className="status-dot" style={{ backgroundColor: statusMeta.dotColor }} />
                    {statusMeta.label}
                  </span>
                </div>

                <div className="apt-card-body">
                  <div className="apt-info-item">
                    <Calendar size={15} />
                    <span>Ngày hẹn: <strong>{formatDateVN(apt.appointment_date)}</strong></span>
                  </div>
                  <div className="apt-info-item">
                    <Clock size={15} />
                    <span>Khung giờ: <strong>{apt.start_time} – {apt.end_time}</strong> ({apt.service_duration} phút)</span>
                  </div>
                  <div className="apt-info-item">
                    <User size={15} />
                    <span>Chuyên viên: <strong>{apt.employee_name}</strong></span>
                  </div>
                  <div className="apt-info-item">
                    <Phone size={15} />
                    <span>Khách hàng: <strong>{apt.customer_name}</strong> ({apt.customer_phone})</span>
                  </div>
                  <div className="apt-info-item full">
                    <FileText size={15} />
                    <span>Ghi chú: {apt.notes || 'Không có ghi chú'}</span>
                  </div>
                </div>

                <div className="apt-card-footer">
                  <div className="apt-price-col">
                    <span>Chi phí:</span>
                    <strong>{formatCurrency(apt.service_price)}</strong>
                  </div>

                  <div className="apt-actions-col">
                    <button
                      type="button"
                      className="btn-ghost-slate"
                      onClick={() => handleOpenHistory(apt)}
                    >
                      <History size={15} /> Lịch sử trạng thái
                    </button>

                    {canCancel && (
                      <button
                        type="button"
                        className="btn-danger-soft"
                        onClick={() =>
                          onUpdateStatus(
                            apt.id,
                            'CANCELLED',
                            apt.customer_name,
                            'Khách hàng chủ động hủy lịch hẹn trực tuyến'
                          )
                        }
                      >
                        <XCircle size={15} /> Hủy lịch hẹn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL XEM LỊCH SỬ TRẠNG THÁI (APPOINTMENT_STATUS_HISTORY) */}
      {historyModal && (
        <div className="modal-backdrop" onClick={() => setHistoryModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="section-kicker">BẢNG APPOINTMENT_STATUS_HISTORY</span>
                <h3>Lịch sử trạng thái: {historyModal.appointment.appointment_code}</h3>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setHistoryModal(null)}>
                ✕
              </button>
            </div>

            <div className="timeline-list">
              {historyModal.items && historyModal.items.length > 0 ? (
                historyModal.items.map((item) => (
                  <div key={item.id} className="timeline-row">
                    <div className="timeline-dot">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-title">
                        <strong>{item.old_status ? `${item.old_status} → ${item.new_status}` : `Khởi tạo: ${item.new_status}`}</strong>
                        <span>Bởi: {item.changed_by}</span>
                      </div>
                      <p>{item.note}</p>
                      <small>{new Date(item.changed_at).toLocaleString('vi-VN')}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">Đã ghi nhận trạng thái hiện tại: {historyModal.appointment.status}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
