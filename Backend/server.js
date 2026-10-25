const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initPostgres } = require('./src/config/db');
const { securityAndMetricsMiddleware } = require('./src/middleware/security');
const apiRoutes = require('./src/routes/api');
const { getPrometheusMetrics } = require('./src/controllers/adminController');

const app = express();
const PORT = process.env.PORT || 5000;

// Khởi tạo kết nối PostgreSQL 16 (nếu có DB chạy)
initPostgres();

// Middleware cơ bản & Hardening + Prometheus/Loki Telemetry
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(securityAndMetricsMiddleware);

// Định tuyến API chính (/api/*)
app.use('/api', apiRoutes);

// Endpoint xuất Prometheus Metrics (/metrics)
app.get('/metrics', getPrometheusMetrics);

// Healthcheck endpoint cho Docker & Nginx
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'appointment-backend', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Appointment Backend Server (Modular MVC) running at http://localhost:${PORT}`);
});
