const express = require('express');
const router = express.Router();

const serviceController = require('../controllers/serviceController');
const slotController = require('../controllers/slotController');
const appointmentController = require('../controllers/appointmentController');
const adminController = require('../controllers/adminController');

// 1. Dịch vụ (Services)
router.get('/services', serviceController.getAllServices);
router.post('/services', serviceController.createService);
router.put('/services/:id', serviceController.updateService);
router.delete('/services/:id', serviceController.deleteService);

// 2. Khung giờ trống & Kiểm tra chống trùng (Time Slots)
router.get('/slots', slotController.getSlotsByDate);

// 3. Đặt lịch hẹn & Xác nhận / Hủy lịch (Appointments)
router.get('/appointments', appointmentController.getAllAppointments);
router.post('/appointments', appointmentController.createAppointment);
router.patch('/appointments/:id/status', appointmentController.updateAppointmentStatus);
router.get('/appointments/:id/history', appointmentController.getAppointmentHistory);

// 4. Quản trị Chuyên viên, Người dùng, Thống kê & Giám sát DevOps (Admin & Monitoring)
router.get('/employees', adminController.getAllEmployees);
router.post('/employees', adminController.createEmployee);
router.delete('/employees/:id', adminController.deleteEmployee);
router.get('/users', adminController.getAllUsers);
router.get('/stats', adminController.getDashboardStats);
router.get('/logs', adminController.getLogs);
router.post('/logs/test', adminController.createTestLog);
router.get('/system-health', adminController.getSystemHealth);
router.post('/database/connect', adminController.connectDatabase);

module.exports = router;
