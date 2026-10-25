import React from 'react';
import {
  Calendar,
  CalendarPlus,
  CalendarCheck,
  ShieldCheck,
  Server,
  Home,
  LayoutDashboard,
  Sparkles,
  LogOut,
  UserCheck,
  ChevronRight
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, pendingCount, onStartBooking, currentUser, onLogout }) {
  const navItems = [
    {
      id: 'home',
      label: 'Trang chủ',
      desc: 'Tổng quan & Dịch vụ khám',
      icon: <Home size={19} />
    },
    {
      id: 'booking',
      label: 'Đặt lịch hẹn',
      desc: 'Đặt lịch khám 4 bước',
      icon: <CalendarPlus size={19} />
    },
    {
      id: 'my-appointments',
      label: 'Lịch hẹn & Tra cứu',
      desc: 'Tra cứu SĐT, Email, Mã hẹn',
      icon: <CalendarCheck size={19} />
    },
    {
      id: 'admin',
      label: 'Quản trị & Xác nhận',
      desc: 'Duyệt lịch, Bác sĩ & Dịch vụ',
      icon: <LayoutDashboard size={19} />,
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      id: 'devops',
      label: 'DevOps & CSDL (Đề 40)',
      desc: 'PostgreSQL, Nginx, Loki, Grafana',
      icon: <Server size={19} />
    }
  ];

  return (
    <aside className="saas-sidebar">
      {/* Brand Header */}
      <div className="saas-sidebar-brand" onClick={() => setActiveTab('home')}>
        <div className="saas-brand-logo">
          <Calendar size={22} />
        </div>
        <div>
          <div className="saas-brand-title">
            Appoint<span>Flow</span>
            <span className="saas-topic-pill">ĐỀ 40</span>
          </div>
          <div className="saas-brand-subtitle">Hệ thống Đặt lịch hẹn Y tế</div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="saas-sidebar-cta">
        <button
          type="button"
          className="btn-primary-gradient saas-sidebar-book-btn"
          onClick={() => onStartBooking()}
        >
          <Sparkles size={16} />
          <span>+ Đặt lịch khám ngay</span>
        </button>
      </div>

      {/* Vertical Menu List */}
      <div className="saas-sidebar-section-title">DANH MỤC CHỨC NĂNG</div>
      <nav className="saas-sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`saas-sidebar-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="saas-sidebar-btn-icon">{item.icon}</div>
              <div className="saas-sidebar-btn-text">
                <div className="saas-sidebar-btn-label">
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="saas-nav-badge">{item.badge}</span>
                  )}
                </div>
                <div className="saas-sidebar-btn-desc">{item.desc}</div>
              </div>
              <ChevronRight size={15} className="saas-sidebar-arrow" />
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer of Sidebar: Status & User Account */}
      <div className="saas-sidebar-footer">
        <div
          className="saas-status-chip saas-sidebar-status"
          onClick={() => setActiveTab('devops')}
          title="Xem trạng thái PostgreSQL, Nginx, Prometheus, Grafana, Loki"
        >
          <span className="status-dot-pulse" />
          <ShieldCheck size={15} />
          <span>PostgreSQL + Nginx Ready</span>
        </div>

        {currentUser && (
          <div className="saas-sidebar-user-card">
            <div className="saas-sidebar-user-info">
              <div className="saas-sidebar-avatar">
                <UserCheck size={17} />
              </div>
              <div className="saas-sidebar-user-meta">
                <strong>{currentUser.roleLabel}</strong>
                <span>{currentUser.email}</span>
              </div>
            </div>
            {onLogout && (
              <button
                type="button"
                className="saas-sidebar-logout-btn"
                onClick={onLogout}
                title="Đăng xuất về màn hình Đăng nhập"
              >
                <LogOut size={15} />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
