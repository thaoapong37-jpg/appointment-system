const { store, saveStore, appendLog, getDbState } = require('../config/db');

exports.getAllServices = (req, res) => {
  res.json(store.services);
};

exports.createService = async (req, res) => {
  const { name, category, description, price, duration_minutes, icon_type, color_theme } = req.body;
  if (!name || duration_minutes === undefined) {
    return res.status(400).json({ error: 'Vui lòng nhập tên dịch vụ và thời lượng (phút)!' });
  }

  const newId = store.services.length ? Math.max(...store.services.map((s) => Number(s.id))) + 1 : 1;
  const newService = {
    id: newId,
    name: name.trim(),
    category: category ? category.trim() : 'Dịch vụ chung',
    description: description || '',
    price: Number(price || 0),
    duration_minutes: Number(duration_minutes || 30),
    icon_type: icon_type || 'shield',
    color_theme: color_theme || 'indigo',
    is_active: true
  };

  const { pgConnected, pgPool } = getDbState();
  if (pgConnected && pgPool) {
    try {
      const dbRes = await pgPool.query(
        `INSERT INTO services (name, description, price, duration_minutes, icon_type, color_theme, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id`,
        [
          newService.name,
          newService.description,
          newService.price,
          newService.duration_minutes,
          newService.icon_type,
          newService.color_theme
        ]
      );
      newService.id = dbRes.rows[0].id;
    } catch (err) {
      appendLog('WARN', `DB insert service fallback: ${err.message}`);
    }
  }

  store.services.push(newService);
  saveStore();
  appendLog('INFO', `Created new service: ${newService.name} (${newService.duration_minutes} mins)`);
  res.status(201).json(newService);
};

exports.updateService = async (req, res) => {
  const id = Number(req.params.id);
  const idx = store.services.findIndex((s) => Number(s.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy dịch vụ!' });

  store.services[idx] = {
    ...store.services[idx],
    ...req.body,
    id,
    price: req.body.price !== undefined ? Number(req.body.price) : store.services[idx].price,
    duration_minutes:
      req.body.duration_minutes !== undefined ? Number(req.body.duration_minutes) : store.services[idx].duration_minutes
  };

  const { pgConnected, pgPool } = getDbState();
  if (pgConnected && pgPool) {
    try {
      const s = store.services[idx];
      await pgPool.query(
        `UPDATE services SET name = $1, description = $2, price = $3, duration_minutes = $4, icon_type = $5, color_theme = $6 WHERE id = $7`,
        [s.name, s.description, s.price, s.duration_minutes, s.icon_type, s.color_theme, id]
      );
    } catch (err) {
      appendLog('WARN', `DB update service fallback: ${err.message}`);
    }
  }

  saveStore();
  res.json(store.services[idx]);
};

exports.deleteService = async (req, res) => {
  const id = Number(req.params.id);
  const { pgConnected, pgPool } = getDbState();
  if (pgConnected && pgPool) {
    try {
      await pgPool.query('DELETE FROM services WHERE id = $1', [id]);
    } catch (err) {
      return res.status(409).json({ error: 'Không thể xóa dịch vụ đang có lịch hẹn liên kết!' });
    }
  }
  store.services = store.services.filter((s) => Number(s.id) !== id);
  saveStore();
  res.json({ message: 'Đã xóa dịch vụ thành công!' });
};
