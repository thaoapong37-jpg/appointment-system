-- ============================================================================
-- HỆ THỐNG ĐẶT LỊCH HẸN (APPOINTMENT BOOKING SYSTEM)
-- File: database/init.sql
-- Thiết kế CSDL PostgreSQL chuẩn hóa, bao gồm Ràng buộc & Trigger chống đặt trùng
-- ============================================================================

-- Xóa các bảng nếu đã tồn tại để khởi tạo sạch
DROP TABLE IF EXISTS appointment_status_history CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Bảng users: tài khoản và thông tin khách hàng, nhân viên, quản trị
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'EMPLOYEE', 'ADMIN')),
    avatar_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng services: tên dịch vụ, giá tiền, thời lượng, trạng thái hoạt động
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12, 0) NOT NULL DEFAULT 0 CHECK (price >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    icon_type VARCHAR(50) DEFAULT 'shield',
    color_theme VARCHAR(30) DEFAULT 'blue',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng employees: thông tin nhân viên cung cấp dịch vụ
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(120) NOT NULL,
    specialty VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng time_slots: ngày, giờ bắt đầu, giờ kết thúc và nhân viên phụ trách
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_time_order CHECK (end_time > start_time),
    CONSTRAINT uq_employee_slot UNIQUE (employee_id, slot_date, start_time)
);

-- 5. Bảng appointments: khách hàng, dịch vụ, khung giờ, trạng thái và ghi chú
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    appointment_code VARCHAR(30) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    time_slot_id INTEGER REFERENCES time_slots(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RÀNG BUỘC CỐT LÕI (PARTIAL UNIQUE INDEX):
-- Khung giờ đã được đặt (PENDING) hoặc xác nhận (CONFIRMED) KHÔNG ĐƯỢC tiếp tục cho khách khác đặt trùng!
-- Khi lịch bị CANCELLED, khung giờ được giải phóng để người khác có thể đặt lại.
CREATE UNIQUE INDEX idx_unique_active_timeslot
ON appointments (time_slot_id)
WHERE status IN ('PENDING', 'CONFIRMED') AND time_slot_id IS NOT NULL;

CREATE UNIQUE INDEX idx_unique_active_date_time
ON appointments (appointment_date, start_time)
WHERE status IN ('PENDING', 'CONFIRMED');

-- 6. Bảng appointment_status_history: lịch sử thay đổi trạng thái
CREATE TABLE appointment_status_history (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL CHECK (new_status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    changed_by VARCHAR(100) DEFAULT 'SYSTEM',
    note TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TRIGGER 1: KIỂM TRA CHỐNG ĐẶT TRÙNG & CẬP NHẬT TRẠNG THÁI TIME_SLOT
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_check_and_sync_time_slot()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    -- Nếu lịch hẹn ở trạng thái PENDING hoặc CONFIRMED, kiểm tra xem đã có ai giữ chỗ chưa
    IF NEW.status IN ('PENDING', 'CONFIRMED') THEN
        SELECT COUNT(*) INTO v_conflict_count
        FROM appointments
        WHERE appointment_date = NEW.appointment_date
          AND start_time = NEW.start_time
          AND status IN ('PENDING', 'CONFIRMED')
          AND (TG_OP = 'INSERT' OR id <> NEW.id);

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'DUPLICATE_BOOKING: Khung giờ % ngày % đã có khách đặt hoặc đã được xác nhận!', NEW.start_time, NEW.appointment_date;
        END IF;

        -- Đánh dấu khung giờ đã được đặt
        IF NEW.time_slot_id IS NOT NULL THEN
            UPDATE time_slots SET is_booked = TRUE WHERE id = NEW.time_slot_id;
        END IF;
    ELSIF NEW.status = 'CANCELLED' THEN
        -- Giải phóng khung giờ nếu lịch hẹn bị hủy
        IF NEW.time_slot_id IS NOT NULL THEN
            UPDATE time_slots SET is_booked = FALSE WHERE id = NEW.time_slot_id;
        END IF;
    END IF;

    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_and_sync_time_slot
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION fn_check_and_sync_time_slot();

-- ============================================================================
-- TRIGGER 2: TỰ ĐỘNG GHI LỊCH SỬ THAY ĐỔI TRẠNG THÁI LỊCH HẸN
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_log_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, note)
        VALUES (NEW.id, NULL, NEW.status, COALESCE(NEW.customer_name, 'CUSTOMER'), 'Khởi tạo lịch hẹn mới');
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO appointment_status_history (appointment_id, old_status, new_status, changed_by, note)
        VALUES (NEW.id, OLD.status, NEW.status, 'ADMIN_OR_USER', 'Cập nhật trạng thái từ ' || OLD.status || ' sang ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_appointment_status
AFTER INSERT OR UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION fn_log_appointment_status();

-- ============================================================================
-- DỮ LIỆU MẪU (SEED DATA) CHUẨN THEO GIAO DIỆN ĐỀ TÀI
-- ============================================================================

-- Thêm người dùng mẫu (Khách hàng, Nhân viên, Admin)
INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES
(1, 'Admin Quản Trị', 'admin@appointment.vn', '0901000001', '$2b$10$dummyhashadmin', 'ADMIN'),
(2, 'Nguyễn Văn A', 'nguyenvana@gmail.com', '0987654321', '$2b$10$dummyhashuser1', 'CUSTOMER'),
(3, 'Trần Thị B', 'tranthib@gmail.com', '0912345678', '$2b$10$dummyhashuser2', 'CUSTOMER'),
(4, 'Lê Văn C', 'levanc@gmail.com', '0933445566', '$2b$10$dummyhashuser3', 'CUSTOMER'),
(5, 'Phạm Thị D', 'phamthid@gmail.com', '0977889900', '$2b$10$dummyhashuser4', 'CUSTOMER'),
(6, 'Nguyễn Thị Mai', 'mai.nguyen@appointment.vn', '0902111222', '$2b$10$dummyhashemp1', 'EMPLOYEE'),
(7, 'Trần Văn Hùng', 'hung.tran@appointment.vn', '0902333444', '$2b$10$dummyhashemp2', 'EMPLOYEE'),
(8, 'Lê Thị Hoa', 'hoa.le@appointment.vn', '0902555666', '$2b$10$dummyhashemp3', 'EMPLOYEE');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Thêm 5 dịch vụ nổi bật giống hệt giao diện thiết kế
INSERT INTO services (id, name, description, price, duration_minutes, icon_type, color_theme, is_active) VALUES
(1, 'Tư vấn sức khỏe', 'Tư vấn trực tiếp cùng bác sĩ về chế độ sinh hoạt và phòng ngừa bệnh lý.', 0, 15, 'shield', 'blue', TRUE),
(2, 'Khám tổng quát', 'Kiểm tra sức khỏe toàn diện định kỳ, đo huyết áp, tim mạch và lâm sàng.', 200000, 30, 'medical', 'green', TRUE),
(3, 'Khám chuyên khoa', 'Khám chuyên sâu Nội khoa, Ngoại khoa, Tai Mũi Họng, Tim mạch với bác sĩ đầu ngành.', 300000, 45, 'doctor', 'pink', TRUE),
(4, 'Xét nghiệm', 'Xét nghiệm máu, sinh hóa, huyết học và tầm soát chỉ số sức khỏe nhanh chóng.', 150000, 20, 'flask', 'amber', TRUE),
(5, 'Tư vấn dinh dưỡng', 'Xây dựng thực đơn khoa học, cân bằng dinh dưỡng cá nhân hóa theo thể trạng.', 100000, 30, 'heart', 'rose', TRUE);

SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));

-- Thêm nhân viên phụ trách
INSERT INTO employees (id, user_id, full_name, specialty, phone, email, is_active) VALUES
(1, 6, 'Nguyễn Thị Mai', 'Tư vấn sức khỏe & Dinh dưỡng', '0902111222', 'mai.nguyen@appointment.vn', TRUE),
(2, 7, 'Trần Văn Hùng', 'Bác sĩ Khám tổng quát & Chuyên khoa', '0902333444', 'hung.tran@appointment.vn', TRUE),
(3, 8, 'Lê Thị Hoa', 'Chuyên viên Xét nghiệm & Chẩn đoán', '0902555666', 'hoa.le@appointment.vn', TRUE);

SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));

-- Thêm các khung giờ mẫu cho ngày 15/04/2025, 20/04/2025, 25/04/2025, 28/04/2025
INSERT INTO time_slots (id, employee_id, slot_date, start_time, end_time, is_booked) VALUES
(1, 1, '2025-04-15', '08:00', '08:30', FALSE),
(2, 1, '2025-04-15', '08:30', '09:00', FALSE),
(3, 1, '2025-04-15', '09:00', '09:15', TRUE),
(4, 1, '2025-04-15', '09:30', '10:00', FALSE),
(5, 1, '2025-04-15', '10:00', '10:30', FALSE),
(6, 1, '2025-04-15', '10:30', '11:00', FALSE),
(7, 2, '2025-04-15', '14:00', '14:30', FALSE),
(8, 2, '2025-04-15', '14:30', '15:00', FALSE),
(9, 2, '2025-04-15', '15:00', '15:30', FALSE),
(10, 2, '2025-04-15', '15:30', '16:00', FALSE),
(11, 2, '2025-04-15', '16:00', '16:30', FALSE),
(12, 2, '2025-04-20', '14:00', '14:30', TRUE),
(13, 3, '2025-04-25', '10:00', '10:20', TRUE),
(14, 1, '2025-04-28', '15:00', '15:30', FALSE);

SELECT setval('time_slots_id_seq', (SELECT MAX(id) FROM time_slots));

-- Thêm lịch hẹn mẫu khớp với giao diện
INSERT INTO appointments (
    id, appointment_code, user_id, customer_name, customer_phone, customer_email,
    service_id, employee_id, time_slot_id, appointment_date, start_time, end_time, status, notes
) VALUES
(1, 'APT-2025-001', 2, 'Nguyễn Văn A', '0987654321', 'nguyenvana@gmail.com', 1, 1, 3, '2025-04-15', '09:00', '09:15', 'CONFIRMED', 'Không'),
(2, 'APT-2025-002', 2, 'Nguyễn Văn A', '0987654321', 'nguyenvana@gmail.com', 2, 2, 12, '2025-04-20', '14:00', '14:30', 'PENDING', 'Khám sức khỏe tổng quát định kỳ'),
(3, 'APT-2025-003', 2, 'Nguyễn Văn A', '0987654321', 'nguyenvana@gmail.com', 4, 3, 13, '2025-04-25', '10:00', '10:20', 'CONFIRMED', 'Xét nghiệm máu tổng quát'),
(4, 'APT-2025-004', 3, 'Trần Thị B', '0912345678', 'tranthib@gmail.com', 2, 2, NULL, '2025-04-20', '09:30', '10:00', 'PENDING', 'Tư vấn thêm về huyết áp'),
(5, 'APT-2025-005', 4, 'Lê Văn C', '0933445566', 'levanc@gmail.com', 4, 3, NULL, '2025-04-25', '08:30', '08:50', 'CONFIRMED', 'Không'),
(6, 'APT-2025-006', 5, 'Phạm Thị D', '0977889900', 'phamthid@gmail.com', 5, 1, 14, '2025-04-28', '15:00', '15:30', 'CANCELLED', 'Bận việc đột xuất');

SELECT setval('appointments_id_seq', (SELECT MAX(id) FROM appointments));
