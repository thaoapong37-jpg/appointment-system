import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroLanding from './components/HeroLanding';
import BookingWizard from './components/BookingWizard';
import CustomerPortal from './components/CustomerPortal';
import AdminDashboard from './components/AdminDashboard';
import DevOpsMonitor from './components/DevOpsMonitor';
import LoginPage from './components/LoginPage';
import {
  FALLBACK_SERVICES,
  FALLBACK_EMPLOYEES,
  calculateEndTime
} from './data/mockData';
import './styles.css';

const INITIAL_APPOINTMENTS = [
  {
    id: 1,
    appointment_code: 'APT-2025-001',
    customer_name: 'Nguyễn Văn A',
    customer_phone: '0987654321',
    customer_email: 'nguyenvana@gmail.com',
    service_id: 1,
    service_name: 'Tư vấn sức khỏe',
    service_price: 0,
    service_duration: 15,
    service_icon: 'shield',
    service_color: 'indigo',
    employee_id: 1,
    employee_name: 'ThS. BS. Nguyễn Thị Mai',
    appointment_date: '2025-04-15',
    start_time: '09:00',
    end_time: '09:15',
    status: 'CONFIRMED',
    notes: 'Tư vấn chế độ vận động và giấc ngủ'
  },
  {
    id: 2,
    appointment_code: 'APT-2025-002',
    customer_name: 'Nguyễn Văn A',
    customer_phone: '0987654321',
    customer_email: 'nguyenvana@gmail.com',
    service_id: 2,
    service_name: 'Khám tổng quát',
    service_price: 200000,
    service_duration: 30,
    service_icon: 'medical',
    service_color: 'emerald',
    employee_id: 2,
    employee_name: 'TS. BS. Trần Văn Hùng',
    appointment_date: '2025-04-20',
    start_time: '14:00',
    end_time: '14:30',
    status: 'PENDING',
    notes: 'Khám tổng quát định kỳ 6 tháng'
  },
  {
    id: 3,
    appointment_code: 'APT-2025-003',
    customer_name: 'Nguyễn Văn A',
    customer_phone: '0987654321',
    customer_email: 'nguyenvana@gmail.com',
    service_id: 4,
    service_name: 'Xét nghiệm',
    service_price: 150000,
    service_duration: 20,
    service_icon: 'flask',
    service_color: 'amber',
    employee_id: 3,
    employee_name: 'CKI. Lê Thị Hoa',
    appointment_date: '2025-04-25',
    start_time: '10:00',
    end_time: '10:20',
    status: 'CONFIRMED',
    notes: 'Xét nghiệm máu tổng quát'
  },
  {
    id: 4,
    appointment_code: 'APT-2025-004',
    customer_name: 'Trần Thị B',
    customer_phone: '0912345678',
    customer_email: 'tranthib@gmail.com',
    service_id: 2,
    service_name: 'Khám tổng quát',
    service_price: 200000,
    service_duration: 30,
    service_icon: 'medical',
    service_color: 'emerald',
    employee_id: 2,
    employee_name: 'TS. BS. Trần Văn Hùng',
    appointment_date: '2025-04-15',
    start_time: '10:00',
    end_time: '10:30',
    status: 'PENDING',
    notes: 'Kiểm tra huyết áp và tim mạch'
  },
  {
    id: 5,
    appointment_code: 'APT-2025-005',
    customer_name: 'Lê Văn C',
    customer_phone: '0933445566',
    customer_email: 'levanc@gmail.com',
    service_id: 3,
    service_name: 'Khám chuyên khoa',
    service_price: 300000,
    service_duration: 45,
    service_icon: 'doctor',
    service_color: 'violet',
    employee_id: 2,
    employee_name: 'TS. BS. Trần Văn Hùng',
    appointment_date: '2025-04-15',
    start_time: '14:30',
    end_time: '15:15',
    status: 'CONFIRMED',
    notes: 'Khám chuyên khoa Nội tổng hợp'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [employees, setEmployees] = useState(FALLBACK_EMPLOYEES);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // State hỗ trợ chuyển nhanh từ Trang chủ sang Đặt lịch
  const [bookingPresetService, setBookingPresetService] = useState(FALLBACK_SERVICES[0]);
  const [bookingPresetDate, setBookingPresetDate] = useState('2025-04-15');
  const [bookingPresetSlot, setBookingPresetSlot] = useState('');
  const [filterCustomerQuery, setFilterCustomerQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3800);
  };

  const fetchAllData = useCallback(async () => {
    try {
      const [srvRes, empRes, aptRes, stRes, logRes, healthRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/employees'),
        fetch('/api/appointments'),
        fetch('/api/stats'),
        fetch('/api/logs'),
        fetch('/api/system-health')
      ]);

      if (srvRes.ok) setServices(await srvRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (aptRes.ok) setAppointments(await aptRes.json());
      if (stRes.ok) setStats(await stRes.json());
      if (logRes.ok) setLogs(await logRes.json());
      if (healthRes.ok) setSystemHealth(await healthRes.json());
    } catch (err) {
      // Nếu chạy độc lập chưa bật backend, sử dụng dữ liệu local mượt mà
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSelectServiceForBooking = (service, date = '2025-04-15', slot = '') => {
    if (service) setBookingPresetService(service);
    if (date) setBookingPresetDate(date);
    setBookingPresetSlot(slot || '');
    setActiveTab('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateAppointment = async (payload) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Khung giờ đã có khách đặt!' };
      }
      await fetchAllData();
      showToast(`Đã tạo lịch hẹn ${data.appointment_code} thành công!`);
      return { data };
    } catch (err) {
      // Fallback local nếu không kết nối backend
      const conflict = appointments.find(
        (a) =>
          a.appointment_date === payload.appointment_date &&
          a.start_time === payload.start_time &&
          (a.status === 'PENDING' || a.status === 'CONFIRMED')
      );
      if (conflict) {
        return {
          error: `Khung giờ ${payload.start_time} ngày ${payload.appointment_date} đã có khách đặt (${conflict.appointment_code})!`
        };
      }
      const srv = services.find((s) => Number(s.id) === Number(payload.service_id)) || services[0];
      const emp = employees.find((e) => Number(e.id) === Number(payload.employee_id)) || employees[0];
      const newId = appointments.length ? Math.max(...appointments.map((a) => Number(a.id))) + 1 : 1;
      const newApt = {
        id: newId,
        appointment_code: `APT-2025-${String(newId).padStart(3, '0')}`,
        ...payload,
        service_name: srv.name,
        service_price: srv.price,
        service_duration: srv.duration_minutes,
        service_icon: srv.icon_type,
        service_color: srv.color_theme,
        employee_name: emp.full_name,
        end_time: calculateEndTime(payload.start_time, srv.duration_minutes),
        status: 'PENDING'
      };
      setAppointments([newApt, ...appointments]);
      showToast(`Đã tạo lịch hẹn ${newApt.appointment_code} thành công!`);
      return { data: newApt };
    }
  };

  const handleUpdateStatus = async (id, status, changed_by, note) => {
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, changed_by, note })
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Không thể cập nhật trạng thái!' };
      }
      await fetchAllData();
      showToast(`Đã cập nhật trạng thái lịch hẹn #${id} sang ${status}!`);
      return { data };
    } catch (err) {
      setAppointments((prev) =>
        prev.map((a) => (Number(a.id) === Number(id) ? { ...a, status } : a))
      );
      showToast(`Đã cập nhật trạng thái lịch hẹn #${id} sang ${status}!`);
      return { data: true };
    }
  };

  const handleFetchHistory = async (id) => {
    try {
      const res = await fetch(`/api/appointments/${id}/history`);
      if (res.ok) return await res.json();
    } catch (err) {}
    return [];
  };

  const handleAddService = async (srvData) => {
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(srvData)
      });
      if (res.ok) {
        await fetchAllData();
        showToast('Đã thêm dịch vụ mới thành công!');
        return;
      }
    } catch (err) {}
    const newId = services.length ? Math.max(...services.map((s) => Number(s.id))) + 1 : 1;
    setServices([...services, { id: newId, ...srvData }]);
    showToast('Đã thêm dịch vụ mới thành công!');
  };

  const handleUpdateService = async (id, srvData) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(srvData)
      });
      if (res.ok) {
        await fetchAllData();
        showToast('Đã cập nhật dịch vụ thành công!');
        return;
      }
    } catch (err) {}
    setServices((prev) => prev.map((s) => (Number(s.id) === Number(id) ? { ...s, ...srvData } : s)));
    showToast('Đã cập nhật dịch vụ thành công!');
  };

  const handleDeleteService = async (id) => {
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAllData();
        showToast('Đã xóa dịch vụ!');
        return;
      }
    } catch (err) {}
    setServices((prev) => prev.filter((s) => Number(s.id) !== Number(id)));
    showToast('Đã xóa dịch vụ!');
  };

  const handleAddEmployee = async (empData) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData)
      });
      if (res.ok) {
        await fetchAllData();
        showToast('Đã thêm chuyên viên mới!');
        return;
      }
    } catch (err) {}
    const newId = employees.length ? Math.max(...employees.map((e) => Number(e.id))) + 1 : 1;
    setEmployees([...employees, { id: newId, ...empData, rating: 4.9 }]);
    showToast('Đã thêm chuyên viên mới!');
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      await fetchAllData();
      showToast('Đã xóa chuyên viên!');
    } catch (err) {
      setEmployees((prev) => prev.filter((e) => Number(e.id) !== Number(id)));
    }
  };

  const handleQueryLogs = async (query) => {
    try {
      const res = await fetch(`/api/logs?query=${encodeURIComponent(query)}`);
      if (res.ok) setLogs(await res.json());
    } catch (err) {}
  };

  const handleTriggerTestLog = async (level, message) => {
    try {
      await fetch('/api/logs/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, message })
      });
      await fetchAllData();
      showToast(`Đã ghi log [${level}] vào Loki stream!`);
    } catch (err) {}
  };

  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(userObj) => {
          setCurrentUser(userObj);
          setActiveTab(userObj.targetTab || 'home');
          showToast(`Đăng nhập thành công với vai trò: ${userObj.roleLabel}`);
        }}
      />
    );
  }

  return (
    <div className="saas-app-shell">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        onStartBooking={() => handleSelectServiceForBooking(services[0], '2025-04-15')}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
      />

      {toastMsg && (
        <div className="floating-toast">
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="saas-workspace">
        <main className="saas-main-container">
        {activeTab === 'home' && (
          <HeroLanding
            services={services}
            employees={employees}
            appointments={appointments}
            onSelectServiceForBooking={handleSelectServiceForBooking}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'booking' && (
          <BookingWizard
            services={services}
            employees={employees}
            appointments={appointments}
            initialService={bookingPresetService}
            initialDate={bookingPresetDate}
            initialSlot={bookingPresetSlot}
            onCreateAppointment={handleCreateAppointment}
            onNavigateMyAppointments={(email) => {
              setFilterCustomerQuery(email || '');
              setActiveTab('my-appointments');
            }}
          />
        )}

        {activeTab === 'my-appointments' && (
          <CustomerPortal
            appointments={appointments}
            filterCustomerQuery={filterCustomerQuery}
            setFilterCustomerQuery={setFilterCustomerQuery}
            onUpdateStatus={handleUpdateStatus}
            onFetchHistory={handleFetchHistory}
            onNavigateBooking={() => setActiveTab('booking')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            appointments={appointments}
            services={services}
            employees={employees}
            stats={stats}
            onUpdateStatus={handleUpdateStatus}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {activeTab === 'devops' && (
          <DevOpsMonitor
            logs={logs}
            systemHealth={systemHealth}
            onQueryLogs={handleQueryLogs}
            onTriggerTestLog={handleTriggerTestLog}
            onRefreshHealth={fetchAllData}
          />
        )}
      </main>

      <footer className="saas-footer">
        <div className="saas-footer-inner">
          <div>
            <strong>AppointFlow — Đề 40: Hệ thống Đặt lịch hẹn / Appointment</strong>
            <p>
              Stack triển khai: Node.js (Express) • React (Vite) • PostgreSQL 16 + pgAdmin 4 • Nginx Reverse Proxy • Prometheus • Grafana • Loki (LogQL)
            </p>
          </div>
          <div className="footer-links">
            <button type="button" onClick={() => setActiveTab('booking')}>Đặt lịch hẹn</button>
            <button type="button" onClick={() => setActiveTab('my-appointments')}>Tra cứu lịch</button>
            <button type="button" onClick={() => setActiveTab('admin')}>Quản trị Admin</button>
            <button type="button" onClick={() => setActiveTab('devops')}>Kiến trúc & DevOps</button>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
