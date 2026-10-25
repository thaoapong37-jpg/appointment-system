import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Plus,
  Trash2,
  Edit3,
  BarChart3,
  Users,
  Briefcase,
  CalendarCheck,
  TrendingUp,
  Check,
  RefreshCw
} from 'lucide-react';
import {
  formatCurrency,
  formatDateVN,
  getStatusMeta,
  renderServiceIcon
} from '../data/mockData';

export default function AdminDashboard({
  appointments,
  services,
  employees,
  stats,
  onUpdateStatus,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddEmployee,
  onDeleteEmployee
}) {
  const [subTab, setSubTab] = useState('appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionAlert, setActionAlert] = useState('');

  // Form thêm/sửa dịch vụ
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: 150000,
    duration_minutes: 30,
    icon_type: 'shield',
    color_theme: 'indigo'
  });

  // Form thêm chuyên viên
  const [empForm, setEmpForm] = useState({
    full_name: '',
    specialty: '',
    phone: '',
    email: ''
  });

  const totalCount = appointments.length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length;
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
  const revenue = appointments
    .filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED')
    .reduce((acc, a) => acc + Number(a.service_price || 0), 0);

  const filteredAppointments = appointments.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      a.customer_name.toLowerCase().includes(q) ||
      a.customer_phone.toLowerCase().includes(q) ||
      a.service_name.toLowerCase().includes(q) ||
      a.employee_name.toLowerCase().includes(q) ||
      (a.appointment_code && a.appointment_code.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const handleStatusChange = async (id, newStatus, label) => {
    setActionAlert('');
    const res = await onUpdateStatus(id, newStatus, 'ADMIN', label);
    if (res && res.error) {
      setActionAlert(res.error);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) return;
    if (editingService) {
      await onUpdateService(editingService.id, serviceForm);
      setEditingService(null);
    } else {
      await onAddService(serviceForm);
    }
    setServiceForm({
      name: '',
      description: '',
      price: 150000,
      duration_minutes: 30,
      icon_type: 'shield',
      color_theme: 'indigo'
    });
  };

  const handleStartEditService = (srv) => {
    setEditingService(srv);
    setServiceForm({
      name: srv.name,
      description: srv.description || '',
      price: srv.price,
      duration_minutes: srv.duration_minutes,
      icon_type: srv.icon_type || 'shield',
      color_theme: srv.color_theme || 'indigo'
    });
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.full_name.trim()) return;
    await onAddEmployee(empForm);
    setEmpForm({ full_name: '', specialty: '', phone: '', email: '' });
  };

  return (
    <div className="admin-page">
      {/* KPI CARDS */}
      <div className="admin-kpi-grid">
        <div className="kpi-card-modern">
          <div className="kpi-icon-wrap indigo">
            <CalendarCheck size={22} />
          </div>
          <div>
            <span>Tổng số lịch hẹn</span>
            <strong>{totalCount} lịch</strong>
            <small>Đang lưu trữ trên PostgreSQL</small>
          </div>
        </div>

        <div className="kpi-card-modern">
          <div className="kpi-icon-wrap amber">
            <Clock size={22} />
          </div>
          <div>
            <span>Chờ duyệt xác nhận</span>
            <strong>{pendingCount} lịch</strong>
            <small>Cần Admin xác nhận</small>
          </div>
        </div>

        <div className="kpi-card-modern">
          <div className="kpi-icon-wrap emerald">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span>Đã xác nhận & Hoàn tất</span>
            <strong>{confirmedCount} lịch</strong>
            <small>Đã khóa khung giờ cố định</small>
          </div>
        </div>

        <div className="kpi-card-modern">
          <div className="kpi-icon-wrap violet">
            <TrendingUp size={22} />
          </div>
          <div>
            <span>Doanh thu dịch vụ</span>
            <strong>{formatCurrency(revenue)}</strong>
            <small>Đã hủy: {cancelledCount} lịch</small>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION */}
      <div className="admin-subnav">
        <button
          type="button"
          className={`subnav-btn ${subTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setSubTab('appointments')}
        >
          <CalendarCheck size={16} />
          <span>Duyệt & Quản lý Lịch hẹn ({appointments.length})</span>
        </button>
        <button
          type="button"
          className={`subnav-btn ${subTab === 'services' ? 'active' : ''}`}
          onClick={() => setSubTab('services')}
        >
          <Briefcase size={16} />
          <span>Quản lý Dịch vụ ({services.length})</span>
        </button>
        <button
          type="button"
          className={`subnav-btn ${subTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setSubTab('analytics')}
        >
          <BarChart3 size={16} />
          <span>Chuyên viên & Biểu đồ Thống kê</span>
        </button>
      </div>

      {actionAlert && (
        <div className="alert-banner-error">
          <span>{actionAlert}</span>
          <button type="button" onClick={() => setActionAlert('')}>Đóng</button>
        </div>
      )}

      {/* TAB 1: QUẢN LÝ & XÁC NHẬN LỊCH HẸN */}
      {subTab === 'appointments' && (
        <div className="admin-panel-card">
          <div className="admin-table-toolbar">
            <div className="portal-search-box">
              <Search size={17} />
              <input
                type="text"
                placeholder="Tìm theo mã hẹn, tên khách, SĐT, dịch vụ, chuyên viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="status-filter-pills">
              {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`chip-filter ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'ALL' ? 'Tất cả' : getStatusMeta(st).label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="modern-data-table">
              <thead>
                <tr>
                  <th>Mã hẹn</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ & Chi phí</th>
                  <th>Chuyên viên</th>
                  <th>Ngày & Khung giờ</th>
                  <th>Trạng thái</th>
                  <th>Thao tác Xác nhận / Xử lý</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((apt) => {
                  const meta = getStatusMeta(apt.status);
                  return (
                    <tr key={apt.id}>
                      <td>
                        <span className="code-badge">{apt.appointment_code || `APT-00${apt.id}`}</span>
                      </td>
                      <td>
                        <div className="cell-primary">{apt.customer_name}</div>
                        <div className="cell-sub">{apt.customer_phone} • {apt.customer_email}</div>
                      </td>
                      <td>
                        <div className="cell-primary">{apt.service_name}</div>
                        <div className="cell-sub text-indigo">
                          {formatCurrency(apt.service_price)} ({apt.service_duration} phút)
                        </div>
                      </td>
                      <td>
                        <div className="cell-primary">{apt.employee_name}</div>
                      </td>
                      <td>
                        <div className="cell-primary">{formatDateVN(apt.appointment_date)}</div>
                        <div className="cell-sub">{apt.start_time} – {apt.end_time}</div>
                      </td>
                      <td>
                        <span className={`status-pill ${meta.badgeClass}`}>
                          <span className="status-dot" style={{ backgroundColor: meta.dotColor }} />
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <div className="table-action-buttons">
                          {apt.status === 'PENDING' && (
                            <button
                              type="button"
                              className="btn-action-confirm"
                              onClick={() =>
                                handleStatusChange(apt.id, 'CONFIRMED', 'Admin duyệt xác nhận lịch hẹn')
                              }
                            >
                              <Check size={14} /> Xác nhận
                            </button>
                          )}
                          {apt.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              className="btn-action-complete"
                              onClick={() =>
                                handleStatusChange(apt.id, 'COMPLETED', 'Khách hàng đã hoàn thành dịch vụ')
                              }
                            >
                              <CheckCircle2 size={14} /> Hoàn thành
                            </button>
                          )}
                          {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                            <button
                              type="button"
                              className="btn-action-cancel"
                              onClick={() =>
                                handleStatusChange(apt.id, 'CANCELLED', 'Admin hủy lịch & giải phóng khung giờ')
                              }
                            >
                              <XCircle size={14} /> Hủy
                            </button>
                          )}
                          {apt.status === 'CANCELLED' && (
                            <button
                              type="button"
                              className="btn-action-restore"
                              onClick={() =>
                                handleStatusChange(apt.id, 'PENDING', 'Khôi phục lịch hẹn (kiểm tra trống)')
                              }
                            >
                              <RefreshCw size={13} /> Đặt lại
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ DỊCH VỤ */}
      {subTab === 'services' && (
        <div className="admin-two-col-grid">
          <div className="admin-panel-card">
            <h3>{editingService ? `Cập nhật Dịch vụ #${editingService.id}` : 'Thêm Dịch vụ mới'}</h3>
            <p className="panel-sub">Cấu hình tên dịch vụ, chi phí và thời lượng (phút) để tự động chia khung giờ.</p>

            <form className="admin-form-stack" onSubmit={handleSaveService}>
              <div className="form-field-group">
                <label>Tên dịch vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khám Răng Hàm Mặt..."
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-field-group">
                  <label>Giá tiền (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                  />
                </div>
                <div className="form-field-group">
                  <label>Thời lượng (phút) *</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    step="5"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label>Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả quyền lợi và nội dung dịch vụ..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                />
              </div>

              <div className="form-actions-row">
                {editingService && (
                  <button
                    type="button"
                    className="btn-secondary-back"
                    onClick={() => {
                      setEditingService(null);
                      setServiceForm({
                        name: '',
                        description: '',
                        price: 150000,
                        duration_minutes: 30,
                        icon_type: 'shield',
                        color_theme: 'indigo'
                      });
                    }}
                  >
                    Hủy sửa
                  </button>
                )}
                <button type="submit" className="btn-primary-gradient">
                  <Plus size={16} />
                  <span>{editingService ? 'Lưu thay đổi' : 'Thêm dịch vụ'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="admin-panel-card">
            <h3>Danh mục Dịch vụ hiện có ({services.length})</h3>
            <div className="admin-service-list">
              {services.map((srv) => (
                <div key={srv.id} className="admin-service-row">
                  <div className={`service-icon-box theme-${srv.color_theme || 'indigo'}`}>
                    {renderServiceIcon(srv.icon_type, 20)}
                  </div>
                  <div className="admin-service-meta">
                    <h4>{srv.name}</h4>
                    <p>{srv.description}</p>
                    <div className="meta-pills">
                      <span className="text-indigo"><strong>{formatCurrency(srv.price)}</strong></span>
                      <span>• Thời lượng: {srv.duration_minutes} phút</span>
                    </div>
                  </div>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Chỉnh sửa"
                      onClick={() => handleStartEditService(srv)}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      title="Xóa dịch vụ"
                      onClick={() => onDeleteService(srv.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHUYÊN VIÊN & BIỂU ĐỒ THỐNG KÊ */}
      {subTab === 'analytics' && (
        <div className="admin-two-col-grid">
          <div className="admin-panel-card">
            <h3>Biểu đồ Lịch hẹn 7 ngày gần nhất</h3>
            <p className="panel-sub">Thống kê lưu lượng đặt lịch và tỷ lệ xác nhận theo ngày</p>

            <div className="bar-chart-box">
              {(stats?.weeklyChart || [
                { date: '10/04', count: 18 },
                { date: '11/04', count: 24 },
                { date: '12/04', count: 19 },
                { date: '13/04', count: 31 },
                { date: '14/04', count: 27 },
                { date: '15/04', count: 35 },
                { date: '16/04', count: 22 }
              ]).map((d) => {
                const heightPct = Math.min(100, Math.round((d.count / 40) * 100));
                return (
                  <div key={d.date} className="bar-col">
                    <span className="bar-val">{d.count}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: `${heightPct}%` }} />
                    </div>
                    <span className="bar-label">{d.date}</span>
                  </div>
                );
              })}
            </div>

            <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>Tỷ trọng theo gói Dịch vụ</h4>
            <div className="distribution-list">
              {(stats?.serviceDistribution || []).map((item) => (
                <div key={item.name} className="dist-row">
                  <div className="dist-head">
                    <span>{item.name}</span>
                    <strong>{item.percent}%</strong>
                  </div>
                  <div className="dist-bar-bg">
                    <div
                      className="dist-bar-fill"
                      style={{ width: `${Math.max(8, item.percent)}%`, backgroundColor: item.color || '#4f46e5' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-panel-card">
            <h3>Đội ngũ Chuyên viên / Bác sĩ ({employees.length})</h3>
            <form className="emp-inline-form" onSubmit={handleSaveEmployee}>
              <input
                type="text"
                placeholder="Họ tên chuyên viên..."
                required
                value={empForm.full_name}
                onChange={(e) => setEmpForm({ ...empForm, full_name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Chuyên khoa phụ trách..."
                value={empForm.specialty}
                onChange={(e) => setEmpForm({ ...empForm, specialty: e.target.value })}
              />
              <button type="submit" className="btn-primary-gradient">
                <Plus size={16} /> Thêm
              </button>
            </form>

            <div className="admin-service-list" style={{ marginTop: '16px' }}>
              {employees.map((emp) => (
                <div key={emp.id} className="admin-service-row">
                  <div className="service-icon-box theme-indigo">
                    <Users size={18} />
                  </div>
                  <div className="admin-service-meta">
                    <h4>{emp.full_name}</h4>
                    <p>{emp.specialty}</p>
                    <small className="text-muted">{emp.email || 'staff@appointment.vn'} • {emp.phone || '0902xxxxxx'}</small>
                  </div>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => onDeleteEmployee(emp.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
