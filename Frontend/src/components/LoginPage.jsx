import React, { useState } from 'react';
import {
  CalendarPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Stethoscope,
  User
} from 'lucide-react';

const ROLE_PRESETS = [
  {
    id: 'admin',
    label: 'Quản trị viên',
    email: 'admin@appointment.vn',
    password: '••••••••••••',
    targetTab: 'home',
    icon: Shield
  },
  {
    id: 'doctor',
    label: 'Bác sĩ',
    email: 'bacsi.hung@appointment.vn',
    password: '••••••••••',
    targetTab: 'home',
    icon: Stethoscope
  },
  {
    id: 'receptionist',
    label: 'Nhân viên lễ tân',
    email: 'letan@appointment.vn',
    password: '••••••••••',
    targetTab: 'home',
    icon: User
  },
  {
    id: 'patient',
    label: 'Bệnh nhân',
    email: 'nguyenvana@gmail.com',
    password: '••••••••••',
    targetTab: 'home',
    icon: User
  }
];

export default function LoginPage({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSelectRole = (roleObj) => {
    setSelectedRole(roleObj.id);
    setEmail(roleObj.email);
    setPassword('Thaopong1234');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const roleObj = ROLE_PRESETS.find((r) => r.id === selectedRole) || ROLE_PRESETS[1];
    onLoginSuccess({
      roleId: roleObj.id,
      roleLabel: roleObj.label,
      email: email.trim() || roleObj.email,
      targetTab: roleObj.targetTab
    });
  };

  return (
    <div className="medical-login-viewport">
      <div
        className="medical-login-canvas"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      >
        <div className="medical-login-card-wrap">
          <div className="medical-login-card">
            {/* Top pill badge */}
            <div className="medical-login-pill">
              <CalendarPlus size={22} strokeWidth={2.2} className="medical-pill-icon" />
              <span>Hệ thống đặt lịch hẹn</span>
            </div>

            {/* Title & Subtitle */}
            <h1 className="medical-login-title">Đăng nhập tài khoản</h1>
            <p className="medical-login-subtitle">Vui lòng nhập thông tin để tiếp tục</p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="medical-login-form">
              <div className="medical-input-group">
                <Mail size={18} className="medical-input-icon" />
                <input
                  type="text"
                  placeholder="Email công ty"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="medical-input-group">
                <Lock size={18} className="medical-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="medical-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Hiện hoặc ẩn mật khẩu"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="medical-form-options">
                <label className="medical-remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a
                  href="#forgot"
                  className="medical-forgot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setEmail('admin@appointment.vn');
                    setPassword('Thaopong1234');
                  }}
                >
                  Quên mật khẩu?
                </a>
              </div>

              <button type="submit" className="medical-submit-btn">
                <ArrowRight size={18} strokeWidth={2.5} />
                <span>ĐĂNG NHẬP NGAY</span>
              </button>
            </form>

            {/* Divider */}
            <div className="medical-role-divider">
              <span>Hoặc đăng nhập nhanh với vai trò</span>
            </div>

            {/* 2x2 Role Quick Select Grid */}
            <div className="medical-role-grid">
              {ROLE_PRESETS.map((role) => {
                const IconComp = role.icon;
                const isActive = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`medical-role-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectRole(role)}
                    onDoubleClick={() =>
                      onLoginSuccess({
                        roleId: role.id,
                        roleLabel: role.label,
                        email: role.email,
                        targetTab: role.targetTab
                      })
                    }
                  >
                    <IconComp size={18} className="medical-role-icon" />
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer security note */}
            <div className="medical-security-footer">
              <Lock size={13} />
              <span>Hệ thống bảo mật thông tin theo tiêu chuẩn y tế</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
