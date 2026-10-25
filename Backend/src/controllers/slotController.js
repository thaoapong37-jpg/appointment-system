const { store, calculateEndTime } = require('../config/db');

exports.getSlotsByDate = (req, res) => {
  const date = req.query.date || '2025-04-15';
  const duration = Number(req.query.duration || 30);

  const activeAppointmentsOnDate = store.appointments.filter(
    (a) => a.appointment_date === date && (a.status === 'PENDING' || a.status === 'CONFIRMED')
  );

  const slots = store.standardSlots.map((time, index) => {
    const bookedApt = activeAppointmentsOnDate.find((a) => a.start_time === time);
    const period = Number(time.split(':')[0]) < 12 ? 'MORNING' : 'AFTERNOON';
    return {
      id: index + 1,
      slot_date: date,
      start_time: time,
      end_time: calculateEndTime(time, duration),
      period,
      is_booked: Boolean(bookedApt),
      booked_status: bookedApt ? bookedApt.status : null,
      booked_by: bookedApt ? bookedApt.customer_name : null,
      appointment_code: bookedApt ? bookedApt.appointment_code : null
    };
  });

  res.json({
    date,
    total_slots: slots.length,
    available_slots: slots.filter((s) => !s.is_booked).length,
    booked_slots: slots.filter((s) => s.is_booked).length,
    slots
  });
};
