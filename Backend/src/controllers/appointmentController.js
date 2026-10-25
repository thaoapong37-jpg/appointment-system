const {
  store,
  saveStore,
  appendLog,
  getDbState,
  calculateEndTime,
  enrichAppointment
} = require('../config/db');

exports.getAllAppointments = (req, res) => {
  const { status, search, customer_email, date } = req.query;
  let result = store.appointments.map(enrichAppointment);

  if (customer_email && customer_email.trim() !== '') {
    const emailQ = customer_email.trim().toLowerCase();
    result = result.filter(
      (a) =>
        a.customer_email.toLowerCase().includes(emailQ) ||
        a.customer_phone.toLowerCase().includes(emailQ) ||
        (a.appointment_code && a.appointment_code.toLowerCase().includes(emailQ))
    );
  }
  if (date && date.trim() !== '') {
    result = result.filter((a) => a.appointment_date === date.trim());
  }
  if (status && status !== 'ALL') {
    result = result.filter((a) => a.status === status);
  }
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (a) =>
        a.customer_name.toLowerCase().includes(q) ||
        a.customer_phone.toLowerCase().includes(q) ||
        a.customer_email.toLowerCase().includes(q) ||
        a.service_name.toLowerCase().includes(q) ||
        a.employee_name.toLowerCase().includes(q) ||
        (a.appointment_code && a.appointment_code.toLowerCase().includes(q))
    );
  }

  res.json(result);
};

exports.createAppointment = async (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    service_id,
    employee_id,
    appointment_date,
    start_time,
    notes
  } = req.body;

  if (!customer_name || !customer_phone || !customer_email || !service_id || !appointment_date || !start_time) {
    appendLog('ERROR', 'Failed to create appointment: missing required fields');
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc (Dịch vụ, Ngày, Giờ, Họ tên, SĐT, Email)!' });
  }

  const service = store.services.find((s) => Number(s.id) === Number(service_id));
  if (!service) {
    appendLog('ERROR', `Failed to create appointment: invalid service_id (${service_id})`);
    return res.status(400).json({ error: 'Dịch vụ không hợp lệ!' });
  }

  // KIỂM TRA CHỐNG ĐẶT TRÙNG KHUNG GIỜ (NGHIỆP VỤ CỐT LÕI ĐỀ 40)
  const conflictingAppointment = store.appointments.find(
    (a) =>
      a.appointment_date === appointment_date &&
      a.start_time === start_time &&
      (a.status === 'PENDING' || a.status === 'CONFIRMED')
  );

  if (conflictingAppointment) {
    const [cy, cm, cd] = String(appointment_date).split('-');
    const vnDate = cd && cm && cy ? `${cd}/${cm}/${cy}` : appointment_date;
    appendLog(
      'ERROR',
      `DUPLICATE_BOOKING blocked: slot ${start_time} on ${appointment_date} already ${conflictingAppointment.status} (${conflictingAppointment.appointment_code})`
    );
    return res.status(409).json({
      error: `Khung giờ ${start_time} ngày ${vnDate} đã có khách đặt (${conflictingAppointment.appointment_code} - ${conflictingAppointment.status})! Vui lòng chọn khung giờ khác.`,
      code: 'DUPLICATE_BOOKING'
    });
  }

  let assignedEmpId = employee_id ? Number(employee_id) : 1;
  if (!employee_id) {
    if (Number(service_id) === 2 || Number(service_id) === 3) assignedEmpId = 2;
    else if (Number(service_id) === 4) assignedEmpId = 3;
    else assignedEmpId = 1;
  }

  const newId = store.appointments.length ? Math.max(...store.appointments.map((a) => Number(a.id))) + 1 : 1;
  const endTime = calculateEndTime(start_time, service.duration_minutes);

  const newAppointment = {
    id: newId,
    appointment_code: `APT-2025-${String(newId).padStart(3, '0')}`,
    user_id: 2,
    customer_name: customer_name.trim(),
    customer_phone: customer_phone.trim(),
    customer_email: customer_email.trim(),
    service_id: Number(service_id),
    employee_id: assignedEmpId,
    appointment_date,
    start_time,
    end_time: endTime,
    status: 'PENDING',
    notes: notes && notes.trim() ? notes.trim() : 'Không có ghi chú',
    created_at: new Date().toISOString()
  };

  const { pgConnected, pgPool } = getDbState();
  if (pgConnected && pgPool) {
    try {
      const dbRes = await pgPool.query(
        `INSERT INTO appointments (
          appointment_code, user_id, customer_name, customer_phone, customer_email,
          service_id, employee_id, appointment_date, start_time, end_time, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11) RETURNING id`,
        [
          newAppointment.appointment_code,
          newAppointment.user_id,
          newAppointment.customer_name,
          newAppointment.customer_phone,
          newAppointment.customer_email,
          newAppointment.service_id,
          newAppointment.employee_id,
          newAppointment.appointment_date,
          newAppointment.start_time,
          newAppointment.end_time,
          newAppointment.notes
        ]
      );
      newAppointment.id = dbRes.rows[0].id;
    } catch (err) {
      if (err.message && (err.message.includes('DUPLICATE_BOOKING') || err.code === '23505')) {
        appendLog('ERROR', `PostgreSQL Trigger blocked duplicate booking: ${appointment_date} ${start_time}`);
        return res.status(409).json({
          error: `Khung giờ ${start_time} ngày ${appointment_date} đã bị khóa bởi PostgreSQL Unique Index!`,
          code: 'DUPLICATE_BOOKING'
        });
      }
      appendLog('WARN', `DB insert appointment fallback: ${err.message}`);
    }
  }

  store.appointments.unshift(newAppointment);

  store.appointment_status_history.unshift({
    id: Date.now(),
    appointment_id: newAppointment.id,
    old_status: null,
    new_status: 'PENDING',
    changed_by: customer_name.trim(),
    note: 'Khách hàng đặt lịch hẹn trực tuyến',
    changed_at: new Date().toISOString()
  });

  saveStore();
  appendLog(
    'INFO',
    `Created appointment ${newAppointment.appointment_code} for ${customer_name} at ${appointment_date} ${start_time}`
  );

  res.status(201).json(enrichAppointment(newAppointment));
};

exports.updateAppointmentStatus = async (req, res) => {
  const id = Number(req.params.id);
  const { status, changed_by, note } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ!' });
  }

  const aptIndex = store.appointments.findIndex((a) => Number(a.id) === id);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy lịch hẹn!' });
  }

  const targetApt = store.appointments[aptIndex];

  if (status === 'PENDING' || status === 'CONFIRMED') {
    const conflict = store.appointments.find(
      (a) =>
        Number(a.id) !== id &&
        a.appointment_date === targetApt.appointment_date &&
        a.start_time === targetApt.start_time &&
        (a.status === 'PENDING' || a.status === 'CONFIRMED')
    );
    if (conflict) {
      return res.status(409).json({
        error: `Không thể chuyển trạng thái vì khung giờ ${targetApt.start_time} ngày ${targetApt.appointment_date} đã có lịch hẹn khác (${conflict.appointment_code}) đang giữ chỗ!`
      });
    }
  }

  const { pgConnected, pgPool } = getDbState();
  if (pgConnected && pgPool) {
    try {
      await pgPool.query('UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        status,
        id
      ]);
    } catch (err) {
      if (err.message && (err.message.includes('DUPLICATE_BOOKING') || err.code === '23505')) {
        return res.status(409).json({
          error: `Không thể chuyển trạng thái vì khung giờ ${targetApt.start_time} ngày ${targetApt.appointment_date} đã có lịch hẹn khác đang giữ chỗ!`
        });
      }
      appendLog('WARN', `DB update status fallback: ${err.message}`);
    }
  }

  const oldStatus = targetApt.status;
  targetApt.status = status;
  targetApt.updated_at = new Date().toISOString();

  store.appointment_status_history.unshift({
    id: Date.now(),
    appointment_id: id,
    old_status: oldStatus,
    new_status: status,
    changed_by: changed_by || 'ADMIN',
    note: note || `Cập nhật trạng thái từ ${oldStatus} sang ${status}`,
    changed_at: new Date().toISOString()
  });

  saveStore();
  appendLog('INFO', `Appointment ${targetApt.appointment_code} (#${id}) status changed: ${oldStatus} -> ${status}`);

  res.json(enrichAppointment(targetApt));
};

exports.getAppointmentHistory = (req, res) => {
  const id = Number(req.params.id);
  const history = store.appointment_status_history.filter((h) => Number(h.appointment_id) === id);
  res.json(history);
};
