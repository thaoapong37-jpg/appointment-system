const fs = require('fs');
const path = require('path');
const { Pool, Client } = require('pg');

const DATA_DIR = path.join(__dirname, '../../data');
const LOGS_DIR = path.join(__dirname, '../../logs');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const LOG_FILE = path.join(LOGS_DIR, 'app.log');
const INIT_SQL_FILE = path.join(__dirname, '../../../database/init.sql');
const ENV_FILE = path.join(__dirname, '../../.env');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

const defaultLogs = [
  {
    id: 1,
    timestamp: '2025-04-15 09:12:31',
    level: 'ERROR',
    app: 'appointment-backend',
    endpoint: 'POST /api/appointments',
    status: 400,
    message: 'Failed to create appointment: invalid service_id'
  },
  {
    id: 2,
    timestamp: '2025-04-15 09:11:02',
    level: 'INFO',
    app: 'appointment-backend',
    endpoint: 'POST /api/auth/login',
    status: 200,
    message: 'User logged in successfully (nguyenvana@gmail.com)'
  },
  {
    id: 3,
    timestamp: '2025-04-15 09:10:45',
    level: 'INFO',
    app: 'appointment-backend',
    endpoint: 'GET /api/appointments',
    status: 200,
    message: 'GET /api/appointments 200 - 18ms'
  },
  {
    id: 4,
    timestamp: '2025-04-15 09:09:12',
    level: 'WARN',
    app: 'appointment-backend',
    endpoint: 'GET /api/slots',
    status: 200,
    message: 'Slow query detected: 342ms on time_slots lock check'
  },
  {
    id: 5,
    timestamp: '2025-04-15 09:08:17',
    level: 'INFO',
    app: 'appointment-backend',
    endpoint: 'SYSTEM',
    status: 200,
    message: 'Database connection pool initialized (PostgreSQL + pgAdmin ready)'
  },
  {
    id: 6,
    timestamp: '2025-04-15 09:05:40',
    level: 'ERROR',
    app: 'appointment-backend',
    endpoint: 'POST /api/appointments',
    status: 409,
    message: 'DUPLICATE_BOOKING blocked: slot 09:00 on 2025-04-15 already CONFIRMED'
  }
];

const initialStore = {
  users: [
    { id: 1, full_name: 'Quản trị viên Hệ thống', email: 'admin@appointment.vn', phone: '0901000001', role: 'ADMIN', is_active: true },
    { id: 2, full_name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', phone: '0987654321', role: 'CUSTOMER', is_active: true },
    { id: 3, full_name: 'Trần Thị B', email: 'tranthib@gmail.com', phone: '0912345678', role: 'CUSTOMER', is_active: true },
    { id: 4, full_name: 'Lê Văn C', email: 'levanc@gmail.com', phone: '0933445566', role: 'CUSTOMER', is_active: true },
    { id: 5, full_name: 'Phạm Thị D', email: 'phamthid@gmail.com', phone: '0977889900', role: 'CUSTOMER', is_active: true },
    { id: 6, full_name: 'ThS. BS. Nguyễn Thị Mai', email: 'mai.nguyen@appointment.vn', phone: '0902111222', role: 'EMPLOYEE', is_active: true },
    { id: 7, full_name: 'TS. BS. Trần Văn Hùng', email: 'hung.tran@appointment.vn', phone: '0902333444', role: 'EMPLOYEE', is_active: true },
    { id: 8, full_name: 'CKI. Lê Thị Hoa', email: 'hoa.le@appointment.vn', phone: '0902555666', role: 'EMPLOYEE', is_active: true }
  ],
  services: [
    {
      id: 1,
      name: 'Tư vấn sức khỏe',
      category: 'Tư vấn',
      description: 'Tư vấn trực tiếp 1-1 cùng chuyên gia về chế độ sinh hoạt, tầm soát triệu chứng và phòng ngừa bệnh lý.',
      price: 0,
      duration_minutes: 15,
      icon_type: 'shield',
      color_theme: 'indigo',
      is_active: true
    },
    {
      id: 2,
      name: 'Khám tổng quát',
      category: 'Khám lâm sàng',
      description: 'Kiểm tra sức khỏe toàn diện định kỳ, đo huyết áp, tim mạch, hô hấp và đánh giá chỉ số cơ thể.',
      price: 200000,
      duration_minutes: 30,
      icon_type: 'medical',
      color_theme: 'emerald',
      is_active: true
    },
    {
      id: 3,
      name: 'Khám chuyên khoa',
      category: 'Chuyên sâu',
      description: 'Khám chuyên sâu Nội khoa, Ngoại khoa, Tai Mũi Họng, Tim mạch cùng đội ngũ bác sĩ đầu ngành.',
      price: 300000,
      duration_minutes: 45,
      icon_type: 'doctor',
      color_theme: 'violet',
      is_active: true
    },
    {
      id: 4,
      name: 'Xét nghiệm',
      category: 'Cận lâm sàng',
      description: 'Xét nghiệm máu, sinh hóa, huyết học và tầm soát chỉ số sức khỏe nhanh chóng, trả kết quả số hóa.',
      price: 150000,
      duration_minutes: 20,
      icon_type: 'flask',
      color_theme: 'amber',
      is_active: true
    },
    {
      id: 5,
      name: 'Tư vấn dinh dưỡng',
      category: 'Chăm sóc',
      description: 'Xây dựng thực đơn khoa học, cân bằng dinh dưỡng cá nhân hóa theo thể trạng và mục tiêu sức khỏe.',
      price: 100000,
      duration_minutes: 30,
      icon_type: 'heart',
      color_theme: 'rose',
      is_active: true
    }
  ],
  employees: [
    {
      id: 1,
      user_id: 6,
      full_name: 'ThS. BS. Nguyễn Thị Mai',
      specialty: 'Tư vấn sức khỏe & Dinh dưỡng',
      phone: '0902111222',
      email: 'mai.nguyen@appointment.vn',
      rating: 4.9,
      is_active: true
    },
    {
      id: 2,
      user_id: 7,
      full_name: 'TS. BS. Trần Văn Hùng',
      specialty: 'Khám tổng quát & Nội Chuyên khoa',
      phone: '0902333444',
      email: 'hung.tran@appointment.vn',
      rating: 5.0,
      is_active: true
    },
    {
      id: 3,
      user_id: 8,
      full_name: 'CKI. Lê Thị Hoa',
      specialty: 'Xét nghiệm & Chẩn đoán hình ảnh',
      phone: '0902555666',
      email: 'hoa.le@appointment.vn',
      rating: 4.8,
      is_active: true
    }
  ],
  standardSlots: [
    '08:00', '08:30', '09:00',
    '09:30', '10:00', '10:30',
    '14:00', '14:30', '15:00',
    '15:30', '16:00'
  ],
  appointments: [
    {
      id: 1,
      appointment_code: 'APT-2025-001',
      user_id: 2,
      customer_name: 'Nguyễn Văn A',
      customer_phone: '0987654321',
      customer_email: 'nguyenvana@gmail.com',
      service_id: 1,
      employee_id: 1,
      appointment_date: '2025-04-15',
      start_time: '09:00',
      end_time: '09:15',
      status: 'CONFIRMED',
      notes: 'Tư vấn chế độ vận động và giấc ngủ',
      created_at: '2025-04-14T08:30:00Z'
    },
    {
      id: 2,
      appointment_code: 'APT-2025-002',
      user_id: 2,
      customer_name: 'Nguyễn Văn A',
      customer_phone: '0987654321',
      customer_email: 'nguyenvana@gmail.com',
      service_id: 2,
      employee_id: 2,
      appointment_date: '2025-04-20',
      start_time: '14:00',
      end_time: '14:30',
      status: 'PENDING',
      notes: 'Khám tổng quát định kỳ 6 tháng',
      created_at: '2025-04-14T10:15:00Z'
    },
    {
      id: 3,
      appointment_code: 'APT-2025-003',
      user_id: 2,
      customer_name: 'Nguyễn Văn A',
      customer_phone: '0987654321',
      customer_email: 'nguyenvana@gmail.com',
      service_id: 4,
      employee_id: 3,
      appointment_date: '2025-04-25',
      start_time: '10:00',
      end_time: '10:20',
      status: 'CONFIRMED',
      notes: 'Xét nghiệm máu tổng quát (nhịn ăn sáng)',
      created_at: '2025-04-14T11:00:00Z'
    },
    {
      id: 4,
      appointment_code: 'APT-2025-004',
      user_id: 3,
      customer_name: 'Trần Thị B',
      customer_phone: '0912345678',
      customer_email: 'tranthib@gmail.com',
      service_id: 2,
      employee_id: 2,
      appointment_date: '2025-04-15',
      start_time: '10:00',
      end_time: '10:30',
      status: 'PENDING',
      notes: 'Kiểm tra huyết áp và tim mạch',
      created_at: '2025-04-14T14:20:00Z'
    },
    {
      id: 5,
      appointment_code: 'APT-2025-005',
      user_id: 4,
      customer_name: 'Lê Văn C',
      customer_phone: '0933445566',
      customer_email: 'levanc@gmail.com',
      service_id: 3,
      employee_id: 2,
      appointment_date: '2025-04-15',
      start_time: '14:30',
      end_time: '15:15',
      status: 'CONFIRMED',
      notes: 'Khám chuyên khoa Nội tổng hợp',
      created_at: '2025-04-14T15:10:00Z'
    },
    {
      id: 6,
      appointment_code: 'APT-2025-006',
      user_id: 5,
      customer_name: 'Phạm Thị D',
      customer_phone: '0977889900',
      customer_email: 'phamthid@gmail.com',
      service_id: 5,
      employee_id: 1,
      appointment_date: '2025-04-28',
      start_time: '15:00',
      end_time: '15:30',
      status: 'CANCELLED',
      notes: 'Bận lịch công tác đột xuất',
      created_at: '2025-04-14T16:05:00Z'
    }
  ],
  appointment_status_history: [
    { id: 1, appointment_id: 1, old_status: null, new_status: 'CONFIRMED', changed_by: 'SYSTEM', note: 'Khởi tạo và xác nhận lịch hẹn', changed_at: '2025-04-14T08:30:00Z' },
    { id: 2, appointment_id: 2, old_status: null, new_status: 'PENDING', changed_by: 'Nguyễn Văn A', note: 'Khách hàng đặt lịch mới', changed_at: '2025-04-14T10:15:00Z' },
    { id: 3, appointment_id: 6, old_status: 'PENDING', new_status: 'CANCELLED', changed_by: 'Phạm Thị D', note: 'Khách hàng hủy lịch hẹn', changed_at: '2025-04-14T16:30:00Z' }
  ],
  logs: defaultLogs
};

let store = { ...initialStore };
if (fs.existsSync(STORE_FILE)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    store = {
      ...initialStore,
      ...loaded,
      standardSlots: initialStore.standardSlots
    };
  } catch (e) {
    store = { ...initialStore };
  }
} else {
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function saveStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    // ignore write error
  }
}

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function appendLog(level, message, extra = {}) {
  const entry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    timestamp: formatNow(),
    level,
    app: 'appointment-backend',
    endpoint: extra.endpoint || 'SYSTEM',
    status: extra.status || (level === 'ERROR' ? 400 : 200),
    message
  };
  store.logs.unshift(entry);
  if (store.logs.length > 250) store.logs.pop();

  const jsonLine = JSON.stringify(entry);
  console.log(jsonLine);
  try {
    fs.appendFileSync(LOG_FILE, jsonLine + '\n', 'utf8');
  } catch (e) {
    // ignore file append errors
  }
  return entry;
}

let pgPool = null;
let pgConnected = false;
let pgLastError = null;
let pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Thaopong1234',
  database: process.env.DB_NAME || 'appointment_db'
};

function normalizeDateStr(val) {
  if (!val) return '2025-04-15';
  if (val instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())}`;
  }
  return String(val).slice(0, 10);
}

function normalizeTimeStr(val) {
  if (!val) return '09:00';
  return String(val).slice(0, 5);
}

async function syncFromPostgres() {
  if (!pgConnected || !pgPool) return;
  try {
    const [usersRes, srvRes, empRes, aptRes, histRes] = await Promise.all([
      pgPool.query('SELECT id, full_name, email, phone, role, is_active FROM users ORDER BY id ASC'),
      pgPool.query('SELECT id, name, description, price, duration_minutes, icon_type, color_theme, is_active FROM services ORDER BY id ASC'),
      pgPool.query('SELECT id, user_id, full_name, specialty, phone, email, is_active FROM employees ORDER BY id ASC'),
      pgPool.query('SELECT * FROM appointments ORDER BY id DESC'),
      pgPool.query('SELECT * FROM appointment_status_history ORDER BY id DESC')
    ]);

    if (usersRes.rows.length) store.users = usersRes.rows;
    if (srvRes.rows.length) {
      store.services = srvRes.rows.map((s) => ({
        ...s,
        price: Number(s.price),
        duration_minutes: Number(s.duration_minutes)
      }));
    }
    if (empRes.rows.length) store.employees = empRes.rows;
    if (aptRes.rows.length) {
      store.appointments = aptRes.rows.map((a) => ({
        ...a,
        appointment_date: normalizeDateStr(a.appointment_date),
        start_time: normalizeTimeStr(a.start_time),
        end_time: normalizeTimeStr(a.end_time)
      }));
    }
    if (histRes.rows.length) store.appointment_status_history = histRes.rows;
    saveStore();
  } catch (err) {
    appendLog('WARN', `PostgreSQL sync skipped: ${err.message}`);
  }
}

async function ensureDatabaseAndSchema(cfg) {
  // 1. Kết nối vào DB mặc định 'postgres' để kiểm tra và tạo 'appointment_db' nếu chưa có
  const adminClient = new Client({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: 'postgres',
    connectionTimeoutMillis: 3000
  });

  await adminClient.connect();
  const dbCheck = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [cfg.database]);
  if (dbCheck.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE ${cfg.database}`);
    appendLog('INFO', `Created PostgreSQL database: ${cfg.database}`);
  }
  await adminClient.end();

  // 2. Kết nối vào 'appointment_db' và kiểm tra bảng 'appointments'
  const pool = new Pool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    connectionTimeoutMillis: 3000
  });

  const tableCheck = await pool.query(`
    SELECT COUNT(*) AS cnt
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'appointments'
  `);

  if (Number(tableCheck.rows[0].cnt) === 0 && fs.existsSync(INIT_SQL_FILE)) {
    const sqlContent = fs.readFileSync(INIT_SQL_FILE, 'utf8');
    await pool.query(sqlContent);
    appendLog('INFO', 'Initialized 6 tables, Unique Indexes, Triggers & Seed Data from database/init.sql');
  }

  return pool;
}

async function initPostgres(customConfig = null) {
  if (customConfig) {
    pgConfig = {
      host: customConfig.host || pgConfig.host,
      port: Number(customConfig.port || pgConfig.port),
      user: customConfig.user || pgConfig.user,
      password: customConfig.password !== undefined ? customConfig.password : pgConfig.password,
      database: customConfig.database || pgConfig.database
    };
  }

  try {
    if (pgPool) {
      try { await pgPool.end(); } catch (e) {}
    }
    pgPool = await ensureDatabaseAndSchema(pgConfig);
    pgConnected = true;
    pgLastError = null;
    appendLog('INFO', `Connected to PostgreSQL (${pgConfig.user}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database})`);
    await syncFromPostgres();

    // Lưu cấu hình vào Backend/.env nếu kết nối thành công
    if (customConfig) {
      const envContent = [
        `PORT=${process.env.PORT || 5000}`,
        `DB_HOST=${pgConfig.host}`,
        `DB_PORT=${pgConfig.port}`,
        `DB_USER=${pgConfig.user}`,
        `DB_PASSWORD=${pgConfig.password}`,
        `DB_NAME=${pgConfig.database}`,
        `JWT_SECRET=appointment_super_secret_key_2025`
      ].join('\n');
      try {
        fs.writeFileSync(ENV_FILE, envContent + '\n', 'utf8');
      } catch (e) {}
    }

    return { connected: true, config: { ...pgConfig, password: '***' } };
  } catch (err) {
    pgConnected = false;
    pgLastError = err.message;
    appendLog('WARN', `PostgreSQL connection pending (${err.message}) - running with local store fallback`);
    return { connected: false, error: err.message, config: { ...pgConfig, password: '***' } };
  }
}

function getDbState() {
  return {
    pgPool,
    pgConnected,
    pgLastError,
    pgConfig: {
      host: pgConfig.host,
      port: pgConfig.port,
      user: pgConfig.user,
      database: pgConfig.database
    }
  };
}

function calculateEndTime(startTime, durationMinutes) {
  const [hh, mm] = String(startTime || '09:00').split(':').map(Number);
  const totalMinutes = (hh || 9) * 60 + (mm || 0) + Number(durationMinutes || 30);
  const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
  const endM = String(totalMinutes % 60).padStart(2, '0');
  return `${endH}:${endM}`;
}

function enrichAppointment(apt) {
  const service = store.services.find((s) => Number(s.id) === Number(apt.service_id)) || store.services[0];
  const employee = store.employees.find((e) => Number(e.id) === Number(apt.employee_id)) || store.employees[0];
  return {
    ...apt,
    service_name: service ? service.name : 'Dịch vụ khám',
    service_price: service ? Number(service.price) : 0,
    service_duration: service ? Number(service.duration_minutes) : 30,
    service_icon: service ? service.icon_type : 'shield',
    service_color: service ? service.color_theme : 'indigo',
    employee_name: employee ? employee.full_name : 'ThS. BS. Nguyễn Thị Mai',
    employee_specialty: employee ? employee.specialty : ''
  };
}

module.exports = {
  store,
  saveStore,
  appendLog,
  initPostgres,
  getDbState,
  calculateEndTime,
  enrichAppointment
};
