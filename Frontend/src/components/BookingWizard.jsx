import React, { useState, useEffect } from 'react';
import {
  Check,
  Clock,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  ArrowLeft,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import {
  STANDARD_SLOTS,
  SAMPLE_CUSTOMERS,
  formatCurrency,
  formatDateVN,
  calculateEndTime,
  renderServiceIcon
} from '../data/mockData';

export default function BookingWizard({
  services,
  employees,
  appointments,
  initialService,
  initialDate,
  initialSlot,
  onCreateAppointment,
  onNavigateMyAppointments
}) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(initialService || services[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(1);
  const [selectedDate, setSelectedDate] = useState(initialDate || '2025-04-15');
  const [selectedSlot, setSelectedSlot] = useState(initialSlot || '');
  const [slotsData, setSlotsData] = useState([]);
  const [customerForm, setCustomerForm] = useState({
    name: 'Nguyễn Văn A',
    phone: '0987654321',
    email: 'nguyenvana@gmail.com',
    notes: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
    }
  }, [initialService]);

  // Tự động chọn chuyên viên phù hợp với dịch vụ
  useEffect(() => {
    if (!selectedService) return;
    if (selectedService.id === 2 || selectedService.id === 3) setSelectedEmployeeId(2);
    else if (selectedService.id === 4) setSelectedEmployeeId(3);
    else setSelectedEmployeeId(1);
  }, [selectedService]);

  // Tính toán trạng thái khung giờ theo ngày đã chọn
  useEffect(() => {
    const duration = selectedService ? selectedService.duration_minutes : 30;
    const activeOnDate = appointments.filter(
      (a) =>
        a.appointment_date === selectedDate &&
        (a.status === 'PENDING' || a.status === 'CONFIRMED')
    );

    const computedSlots = STANDARD_SLOTS.map((time) => {
      const bookedApt = activeOnDate.find((a) => a.start_time === time);
      return {
        start_time: time,
        end_time: calculateEndTime(time, duration),
        period: Number(time.split(':')[0]) < 12 ? 'MORNING' : 'AFTERNOON',
        is_booked: Boolean(bookedApt),
        booked_status: bookedApt ? bookedApt.status : null,
        booked_by: bookedApt ? bookedApt.customer_name : null,
        appointment_code: bookedApt ? bookedApt.appointment_code : null
      };
    });

    setSlotsData(computedSlots);

    // Nếu khung giờ đang chọn bị người khác đặt trên ngày mới, bỏ chọn hoặc giữ để test
    if (!selectedSlot) {
      const firstFree = computedSlots.find((s) => !s.is_booked);
      if (firstFree) setSelectedSlot(firstFree.start_time);
    }
  }, [selectedDate, selectedService, appointments]);

  const selectedEmployee =
    employees.find((e) => Number(e.id) === Number(selectedEmployeeId)) || employees[0];

  const quickDates = [
    { date: '2025-04-15', label: 'Thứ Ba, 15/04' },
    { date: '2025-04-16', label: 'Thứ Tư, 16/04' },
    { date: '2025-04-20', label: 'Chủ Nhật, 20/04' },
    { date: '2025-04-25', label: 'Thứ Sáu, 25/04' },
    { date: '2025-04-28', label: 'Thứ Hai, 28/04' }
  ];

  const handleTestConflictSlot = () => {
    const bookedOne = slotsData.find((s) => s.is_booked);
    if (!bookedOne) {
      setBookingError('Ngày hiện tại chưa có khung giờ nào đã đặt để thử nghiệm xung đột.');
      return;
    }
    setBookingError(
      `[CHỐNG ĐẶT TRÙNG KHUNG GIỜ - 409 CONFLICT]: Khung giờ ${bookedOne.start_time} ngày ${formatDateVN(
        selectedDate
      )} đã được giữ chỗ bởi mã hẹn ${bookedOne.appointment_code || 'APT-2025-001'} (${
        bookedOne.booked_status
      }). PostgreSQL Unique Index & Backend đã khóa khung giờ này!`
    );
  };

  const handleConfirmBooking = async () => {
    setBookingError('');
    if (!selectedService || !selectedDate || !selectedSlot) {
      setBookingError('Vui lòng chọn đầy đủ dịch vụ, ngày hẹn và khung giờ!');
      return;
    }
    if (!customerForm.name.trim() || !customerForm.phone.trim() || !customerForm.email.trim()) {
      setBookingError('Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Email khách hàng!');
      setStep(3);
      return;
    }

    setSubmitting(true);
    const res = await onCreateAppointment({
      customer_name: customerForm.name,
      customer_phone: customerForm.phone,
      customer_email: customerForm.email,
      service_id: selectedService.id,
      employee_id: selectedEmployeeId,
      appointment_date: selectedDate,
      start_time: selectedSlot,
      notes: customerForm.notes || 'Không có ghi chú'
    });
    setSubmitting(false);

    if (res.error) {
      setBookingError(res.error);
      return;
    }

    setCreatedResult(res.data);
  };

  const morningSlots = slotsData.filter((s) => s.period === 'MORNING');
  const afternoonSlots = slotsData.filter((s) => s.period === 'AFTERNOON');

  return (
    <div className="wizard-page">
      {/* THANH TIẾN TRÌNH 4 BƯỚC */}
      <div className="wizard-stepper-bar">
        {[
          { num: 1, title: 'Chọn Dịch vụ', desc: 'Dịch vụ & Chuyên viên' },
          { num: 2, title: 'Chọn Khung giờ', desc: 'Ngày & Giờ còn trống' },
          { num: 3, title: 'Khách hàng', desc: 'Thông tin liên hệ' },
          { num: 4, title: 'Xác nhận hẹn', desc: 'Kiểm tra & Hoàn tất' }
        ].map((item) => {
          const isDone = step > item.num || Boolean(createdResult);
          const isCurrent = step === item.num && !createdResult;
          return (
            <div
              key={item.num}
              className={`stepper-item ${isCurrent ? 'active' : ''} ${isDone ? 'completed' : ''}`}
              onClick={() => {
                if (!createdResult && item.num <= step) setStep(item.num);
              }}
            >
              <div className="stepper-circle">
                {isDone ? <Check size={16} /> : item.num}
              </div>
              <div className="stepper-text">
                <strong>Bước {item.num}: {item.title}</strong>
                <span>{item.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* THÔNG BÁO LỖI CHỐNG TRÙNG / VALIDATION */}
      {bookingError && (
        <div className="alert-banner-error">
          <AlertTriangle size={20} />
          <div className="alert-content">
            <strong>Thông báo kiểm tra ràng buộc đặt lịch</strong>
            <p>{bookingError}</p>
          </div>
          <button type="button" onClick={() => setBookingError('')}>Đóng</button>
        </div>
      )}

      {/* NẾU ĐÃ ĐẶT LỊCH THÀNH CÔNG -> HIỂN THỊ PHIẾU HẸN */}
      {createdResult ? (
        <div className="booking-success-ticket">
          <div className="ticket-badge-icon">
            <CheckCircle2 size={42} />
          </div>
          <span className="ticket-code-pill">MÃ LỊCH HẸN: {createdResult.appointment_code}</span>
          <h2>Đặt lịch hẹn thành công!</h2>
          <p>
            Yêu cầu đặt lịch của <strong>{createdResult.customer_name}</strong> đã được ghi nhận vào Cơ sở dữ liệu PostgreSQL
            và khóa khung giờ <strong>{createdResult.start_time} - {createdResult.end_time}</strong> ngày{' '}
            <strong>{formatDateVN(createdResult.appointment_date)}</strong>.
          </p>

          <div className="ticket-details-grid">
            <div className="ticket-detail-item">
              <span>Dịch vụ đã chọn</span>
              <strong>{createdResult.service_name}</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Chuyên viên phụ trách</span>
              <strong>{createdResult.employee_name}</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Thời gian hẹn</span>
              <strong>{createdResult.start_time} – {createdResult.end_time} ({formatDateVN(createdResult.appointment_date)})</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Chi phí dịch vụ</span>
              <strong className="text-indigo">{formatCurrency(createdResult.service_price)}</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Khách hàng</span>
              <strong>{createdResult.customer_name} ({createdResult.customer_phone})</strong>
            </div>
            <div className="ticket-detail-item">
              <span>Trạng thái hiện tại</span>
              <strong className="text-amber">PENDING (Chờ xác nhận)</strong>
            </div>
          </div>

          <div className="ticket-actions">
            <button
              type="button"
              className="btn-outline-indigo"
              onClick={() => {
                setCreatedResult(null);
                setStep(1);
              }}
            >
              + Đặt thêm lịch hẹn khác
            </button>
            <button
              type="button"
              className="btn-primary-gradient"
              onClick={() => onNavigateMyAppointments(createdResult.customer_email)}
            >
              Xem trong Lịch hẹn của tôi →
            </button>
          </div>
        </div>
      ) : (
        <div className="wizard-main-grid">
          {/* CỘT TRÁI: NỘI DUNG TỪNG BƯỚC */}
          <div className="wizard-step-panel">
            {/* BƯỚC 1: CHỌN DỊCH VỤ & CHUYÊN VIÊN */}
            {step === 1 && (
              <div className="step-content-box">
                <div className="step-box-header">
                  <h2>Bước 1: Chọn Dịch vụ & Chuyên viên phụ trách</h2>
                  <p>Lựa chọn gói dịch vụ phù hợp. Thời lượng của từng dịch vụ sẽ tự động tính khung giờ kết thúc.</p>
                </div>

                <div className="wizard-services-list">
                  {services.map((srv) => {
                    const isSelected = Number(selectedService?.id) === Number(srv.id);
                    return (
                      <div
                        key={srv.id}
                        className={`wizard-service-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedService(srv)}
                      >
                        <div className={`service-icon-box theme-${srv.color_theme || 'indigo'}`}>
                          {renderServiceIcon(srv.icon_type, 22)}
                        </div>
                        <div className="wizard-service-info">
                          <div className="wizard-service-title-row">
                            <h4>{srv.name}</h4>
                            <span className="wizard-service-price">{formatCurrency(srv.price)}</span>
                          </div>
                          <p>{srv.description}</p>
                          <div className="wizard-service-tags">
                            <span><Clock size={13} /> Thời lượng: {srv.duration_minutes} phút</span>
                            <span>• Xác nhận tự động</span>
                          </div>
                        </div>
                        <div className="wizard-radio-check">
                          {isSelected && <Check size={16} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="specialist-selector-block">
                  <label className="block-label">
                    <UserCheck size={16} /> Chọn Chuyên viên / Bác sĩ phụ trách:
                  </label>
                  <div className="specialist-pills-row">
                    {employees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        className={`specialist-pill-btn ${Number(selectedEmployeeId) === Number(emp.id) ? 'active' : ''}`}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                      >
                        <strong>{emp.full_name}</strong>
                        <span>{emp.specialty}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="step-footer-nav">
                  <div />
                  <button
                    type="button"
                    className="btn-primary-gradient"
                    onClick={() => setStep(2)}
                  >
                    <span>Tiếp theo: Chọn Ngày & Khung giờ</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: CHỌN NGÀY & KHUNG GIỜ (CHỐNG ĐẶT TRÙNG) */}
            {step === 2 && (
              <div className="step-content-box">
                <div className="step-box-header">
                  <h2>Bước 2: Chọn Ngày & Khung giờ còn trống</h2>
                  <p>
                    Các khung giờ đang ở trạng thái <strong>PENDING</strong> hoặc <strong>CONFIRMED</strong> sẽ bị khóa
                    để chống đặt trùng theo đúng ràng buộc CSDL PostgreSQL.
                  </p>
                </div>

                <div className="date-picker-strip">
                  <div className="date-quick-buttons">
                    {quickDates.map((d) => (
                      <button
                        key={d.date}
                        type="button"
                        className={`date-chip-btn ${selectedDate === d.date ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedDate(d.date);
                          setBookingError('');
                        }}
                      >
                        <Calendar size={14} />
                        <span>{d.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="custom-date-input">
                    <label>Hoặc chọn ngày khác:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setBookingError('');
                      }}
                    />
                  </div>
                </div>

                <div className="slots-legend-bar">
                  <div className="legend-items">
                    <span className="legend-dot available" /> Còn trống ({slotsData.filter((s) => !s.is_booked).length})
                    <span className="legend-dot booked" /> Đã đặt / Khóa chống trùng ({slotsData.filter((s) => s.is_booked).length})
                    <span className="legend-dot selected" /> Đang chọn
                  </div>
                  <button
                    type="button"
                    className="btn-conflict-demo"
                    onClick={handleTestConflictSlot}
                  >
                    <ShieldAlert size={14} /> Thử bấm khung giờ đã khóa (Test 409)
                  </button>
                </div>

                <div className="slots-period-group">
                  <h4>Ca Sáng (08:00 – 11:30)</h4>
                  <div className="slots-grid-modern">
                    {morningSlots.map((slot) => {
                      const isSelected = selectedSlot === slot.start_time && !slot.is_booked;
                      return (
                        <button
                          key={slot.start_time}
                          type="button"
                          className={`slot-card-btn ${slot.is_booked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (slot.is_booked) {
                              setBookingError(
                                `Khung giờ ${slot.start_time} ngày ${formatDateVN(selectedDate)} đã có khách đặt (${
                                  slot.appointment_code
                                } - ${slot.booked_status})! Hệ thống chặn đặt trùng (409 Conflict).`
                              );
                              return;
                            }
                            setBookingError('');
                            setSelectedSlot(slot.start_time);
                          }}
                        >
                          <div className="slot-time-main">
                            {slot.is_booked ? <Lock size={14} /> : <Clock size={14} />}
                            <strong>{slot.start_time} - {slot.end_time}</strong>
                          </div>
                          <span className="slot-sub-status">
                            {slot.is_booked ? `Đã khóa (${slot.booked_status})` : 'Còn trống'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="slots-period-group">
                  <h4>Ca Chiều (14:00 – 17:00)</h4>
                  <div className="slots-grid-modern">
                    {afternoonSlots.map((slot) => {
                      const isSelected = selectedSlot === slot.start_time && !slot.is_booked;
                      return (
                        <button
                          key={slot.start_time}
                          type="button"
                          className={`slot-card-btn ${slot.is_booked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (slot.is_booked) {
                              setBookingError(
                                `Khung giờ ${slot.start_time} ngày ${formatDateVN(selectedDate)} đã có khách đặt (${
                                  slot.appointment_code
                                } - ${slot.booked_status})! Hệ thống chặn đặt trùng (409 Conflict).`
                              );
                              return;
                            }
                            setBookingError('');
                            setSelectedSlot(slot.start_time);
                          }}
                        >
                          <div className="slot-time-main">
                            {slot.is_booked ? <Lock size={14} /> : <Clock size={14} />}
                            <strong>{slot.start_time} - {slot.end_time}</strong>
                          </div>
                          <span className="slot-sub-status">
                            {slot.is_booked ? `Đã khóa (${slot.booked_status})` : 'Còn trống'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="step-footer-nav">
                  <button type="button" className="btn-secondary-back" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} /> Quay lại Bước 1
                  </button>
                  <button
                    type="button"
                    className="btn-primary-gradient"
                    onClick={() => {
                      if (!selectedSlot) {
                        setBookingError('Vui lòng chọn một khung giờ còn trống để tiếp tục!');
                        return;
                      }
                      setStep(3);
                    }}
                  >
                    <span>Tiếp theo: Thông tin Khách hàng</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: THÔNG TIN KHÁCH HÀNG */}
            {step === 3 && (
              <div className="step-content-box">
                <div className="step-box-header">
                  <h2>Bước 3: Nhập Thông tin Khách hàng</h2>
                  <p>Điền thông tin liên hệ để nhận mã phiếu hẹn và tra cứu trạng thái xác nhận.</p>
                </div>

                <div className="sample-autofill-bar">
                  <span>Điền nhanh khách hàng mẫu:</span>
                  {SAMPLE_CUSTOMERS.map((cust, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn-autofill-chip"
                      onClick={() => setCustomerForm(cust)}
                    >
                      <Sparkles size={12} /> {cust.name}
                    </button>
                  ))}
                </div>

                <div className="customer-form-grid">
                  <div className="form-field-group">
                    <label><User size={15} /> Họ và tên khách hàng *</label>
                    <input
                      type="text"
                      placeholder="Nhập họ và tên..."
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label><Phone size={15} /> Số điện thoại liên hệ *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 0987654321"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group full-width">
                    <label><Mail size={15} /> Địa chỉ Email nhận xác nhận *</label>
                    <input
                      type="email"
                      placeholder="Ví dụ: nguyenvana@gmail.com"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group full-width">
                    <label><FileText size={15} /> Ghi chú hoặc Triệu chứng / Yêu cầu thêm</label>
                    <textarea
                      rows={3}
                      placeholder="Nhập ghi chú cho bác sĩ / chuyên viên phụ trách..."
                      value={customerForm.notes}
                      onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="step-footer-nav">
                  <button type="button" className="btn-secondary-back" onClick={() => setStep(2)}>
                    <ArrowLeft size={16} /> Quay lại Bước 2
                  </button>
                  <button
                    type="button"
                    className="btn-primary-gradient"
                    onClick={() => {
                      if (!customerForm.name.trim() || !customerForm.phone.trim() || !customerForm.email.trim()) {
                        setBookingError('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email!');
                        return;
                      }
                      setBookingError('');
                      setStep(4);
                    }}
                  >
                    <span>Tiếp theo: Kiểm tra & Xác nhận</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 4: XÁC NHẬN ĐẶT LỊCH */}
            {step === 4 && (
              <div className="step-content-box">
                <div className="step-box-header">
                  <h2>Bước 4: Kiểm tra & Xác nhận Đặt lịch hẹn</h2>
                  <p>Vui lòng kiểm tra kỹ thông tin dịch vụ, khung giờ và thông tin liên hệ trước khi hoàn tất.</p>
                </div>

                <div className="confirm-review-card">
                  <div className="confirm-section">
                    <h4>1. Thông tin Dịch vụ & Thời gian</h4>
                    <div className="confirm-two-col">
                      <div>
                        <span>Tên dịch vụ:</span>
                        <strong>{selectedService?.name}</strong>
                      </div>
                      <div>
                        <span>Chuyên viên phụ trách:</span>
                        <strong>{selectedEmployee?.full_name}</strong>
                      </div>
                      <div>
                        <span>Ngày hẹn:</span>
                        <strong>{formatDateVN(selectedDate)}</strong>
                      </div>
                      <div>
                        <span>Khung giờ khóa chỗ:</span>
                        <strong className="text-indigo">
                          {selectedSlot} – {calculateEndTime(selectedSlot, selectedService?.duration_minutes)} ({selectedService?.duration_minutes} phút)
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="confirm-section">
                    <h4>2. Thông tin Khách hàng</h4>
                    <div className="confirm-two-col">
                      <div>
                        <span>Họ và tên:</span>
                        <strong>{customerForm.name}</strong>
                      </div>
                      <div>
                        <span>Số điện thoại:</span>
                        <strong>{customerForm.phone}</strong>
                      </div>
                      <div>
                        <span>Email:</span>
                        <strong>{customerForm.email}</strong>
                      </div>
                      <div>
                        <span>Ghi chú:</span>
                        <strong>{customerForm.notes || 'Không có ghi chú'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="confirm-total-row">
                    <span>Tổng chi phí thanh toán tại quầy:</span>
                    <strong>{formatCurrency(selectedService?.price)}</strong>
                  </div>
                </div>

                <div className="step-footer-nav">
                  <button type="button" className="btn-secondary-back" onClick={() => setStep(3)}>
                    <ArrowLeft size={16} /> Chỉnh sửa thông tin
                  </button>
                  <button
                    type="button"
                    className="btn-primary-gradient btn-confirm-large"
                    disabled={submitting}
                    onClick={handleConfirmBooking}
                  >
                    <CheckCircle2 size={18} />
                    <span>{submitting ? 'Đang xử lý lưu CSDL...' : 'Xác nhận Đặt lịch ngay'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: TÓM TẮT PHIẾU HẸN TRỰC TIẾP (STICKY SUMMARY) */}
          <aside className="wizard-summary-sidebar">
            <div className="summary-sticky-card">
              <div className="summary-card-head">
                <span className="summary-badge">PHIẾU TÓM TẮT LỊCH HẸN</span>
                <h3>Thông tin đang chọn</h3>
              </div>

              <div className="summary-item-list">
                <div className="summary-row">
                  <span>Dịch vụ</span>
                  <strong>{selectedService?.name || 'Chưa chọn'}</strong>
                </div>
                <div className="summary-row">
                  <span>Thời lượng</span>
                  <strong>{selectedService?.duration_minutes || 30} phút</strong>
                </div>
                <div className="summary-row">
                  <span>Chuyên viên</span>
                  <strong>{selectedEmployee?.full_name}</strong>
                </div>
                <div className="summary-row">
                  <span>Ngày hẹn</span>
                  <strong>{formatDateVN(selectedDate)}</strong>
                </div>
                <div className="summary-row">
                  <span>Khung giờ</span>
                  <strong className="text-indigo">
                    {selectedSlot
                      ? `${selectedSlot} - ${calculateEndTime(selectedSlot, selectedService?.duration_minutes)}`
                      : 'Chưa chọn giờ'}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Khách hàng</span>
                  <strong>{customerForm.name || '---'}</strong>
                </div>
              </div>

              <div className="summary-price-box">
                <span>Chi phí dự kiến</span>
                <strong>{formatCurrency(selectedService?.price)}</strong>
              </div>

              <div className="summary-security-note">
                <Lock size={14} />
                <span>
                  Bảo vệ chống trùng lặp bởi <strong>idx_unique_active_date_time</strong> trên PostgreSQL 16.
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
