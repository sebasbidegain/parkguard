import initSqlJs from 'sql.js';

let db = null;

const DB_KEY = 'parking_tickets_db';

export async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm'
  });

  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT NOT NULL,
      offense_type TEXT NOT NULL,
      description TEXT,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      status TEXT DEFAULT 'issued',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ticket_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS offense_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      fine REAL NOT NULL DEFAULT 50,
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  const countResult = db.exec('SELECT COUNT(*) FROM offense_types');
  if (countResult[0].values[0][0] === 0) {
    const defaults = [
      ['double_parking', 'Double Parking', 75],
      ['no_parking_zone', 'No Parking Zone', 100],
      ['fire_hydrant', 'Blocking Fire Hydrant', 150],
      ['handicap_zone', 'Handicap Zone Violation', 250],
      ['expired_meter', 'Expired Meter', 50],
      ['sidewalk', 'Parking on Sidewalk', 85],
      ['crosswalk', 'Blocking Crosswalk', 120],
      ['bus_stop', 'Parking at Bus Stop', 100],
      ['driveway', 'Blocking Driveway', 90],
      ['wrong_direction', 'Parked Wrong Direction', 65],
      ['too_close_intersection', 'Too Close to Intersection', 80],
      ['overtime', 'Overtime Parking', 55],
      ['no_permit', 'No Parking Permit', 70],
      ['loading_zone', 'Loading Zone Violation', 90],
      ['other', 'Other', 50],
    ];
    defaults.forEach(([key, label, fine], i) => {
      db.run('INSERT INTO offense_types (key, label, fine, sort_order) VALUES (?, ?, ?, ?)', [key, label, fine, i]);
    });
  }

  saveDatabase();
  return db;
}

export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(DB_KEY, base64);
}

export function createTicket({ plateNumber, offenseType, description, locationLat, locationLng, locationAddress, notes }) {
  db.run(
    `INSERT INTO tickets (plate_number, offense_type, description, location_lat, location_lng, location_address, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [plateNumber, offenseType, description || '', locationLat || null, locationLng || null, locationAddress || '', notes || '']
  );
  const result = db.exec('SELECT last_insert_rowid() as id');
  saveDatabase();
  return result[0].values[0][0];
}

export function addMedia(ticketId, type, data) {
  db.run(
    'INSERT INTO ticket_media (ticket_id, type, data) VALUES (?, ?, ?)',
    [ticketId, type, data]
  );
  saveDatabase();
}

export function getTickets({ search, offenseType, status, limit = 50, offset = 0 } = {}) {
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (plate_number LIKE ? OR location_address LIKE ? OR description LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (offenseType) {
    query += ' AND offense_type = ?';
    params.push(offenseType);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = db.exec(query, params);
  if (!result.length) return [];

  return result[0].values.map(row => {
    const obj = {};
    result[0].columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

export function getTicketById(id) {
  const result = db.exec('SELECT * FROM tickets WHERE id = ?', [id]);
  if (!result.length || !result[0].values.length) return null;

  const ticket = {};
  result[0].columns.forEach((col, i) => ticket[col] = result[0].values[0][i]);

  const mediaResult = db.exec('SELECT * FROM ticket_media WHERE ticket_id = ? ORDER BY created_at', [id]);
  ticket.media = [];
  if (mediaResult.length) {
    ticket.media = mediaResult[0].values.map(row => {
      const obj = {};
      mediaResult[0].columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  }

  return ticket;
}

export function updateTicketStatus(id, status) {
  db.run("UPDATE tickets SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?", [status, id]);
  saveDatabase();
}

export function deleteTicket(id) {
  db.run('DELETE FROM ticket_media WHERE ticket_id = ?', [id]);
  db.run('DELETE FROM tickets WHERE id = ?', [id]);
  saveDatabase();
}

export function getStats() {
  const total = db.exec('SELECT COUNT(*) FROM tickets');
  const byStatus = db.exec('SELECT status, COUNT(*) as count FROM tickets GROUP BY status');
  const byOffense = db.exec('SELECT offense_type, COUNT(*) as count FROM tickets GROUP BY offense_type ORDER BY count DESC LIMIT 10');
  const repeatOffenders = db.exec(`
    SELECT plate_number, COUNT(*) as count
    FROM tickets
    GROUP BY plate_number
    HAVING count > 1
    ORDER BY count DESC
    LIMIT 10
  `);

  return {
    total: total[0]?.values[0]?.[0] || 0,
    byStatus: byStatus[0]?.values.map(r => ({ status: r[0], count: r[1] })) || [],
    byOffense: byOffense[0]?.values.map(r => ({ type: r[0], count: r[1] })) || [],
    repeatOffenders: repeatOffenders[0]?.values.map(r => ({ plate: r[0], count: r[1] })) || []
  };
}

export function getPlateHistory(plateNumber) {
  return getTickets({ search: plateNumber, limit: 100 });
}

export function getOffenseTypes(includeInactive = false) {
  const query = includeInactive
    ? 'SELECT * FROM offense_types ORDER BY sort_order, label'
    : 'SELECT * FROM offense_types WHERE active = 1 ORDER BY sort_order, label';
  const result = db.exec(query);
  if (!result.length) return [];
  return result[0].values.map(row => {
    const obj = {};
    result[0].columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

export function addOffenseType(key, label, fine) {
  db.run(
    'INSERT INTO offense_types (key, label, fine, sort_order) VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM offense_types))',
    [key, label, fine]
  );
  saveDatabase();
}

export function updateOffenseType(id, label, fine) {
  db.run('UPDATE offense_types SET label = ?, fine = ? WHERE id = ?', [label, fine, id]);
  saveDatabase();
}

export function toggleOffenseType(id, active) {
  db.run('UPDATE offense_types SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
  saveDatabase();
}

export function deleteOffenseType(id) {
  const used = db.exec('SELECT COUNT(*) FROM tickets WHERE offense_type = (SELECT key FROM offense_types WHERE id = ?)', [id]);
  if (used[0]?.values[0]?.[0] > 0) {
    return false;
  }
  db.run('DELETE FROM offense_types WHERE id = ?', [id]);
  saveDatabase();
  return true;
}

export function reorderOffenseTypes(orderedIds) {
  orderedIds.forEach((id, i) => {
    db.run('UPDATE offense_types SET sort_order = ? WHERE id = ?', [i, id]);
  });
  saveDatabase();
}
