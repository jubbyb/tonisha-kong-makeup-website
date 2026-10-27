-- Failed admin login attempts, used to throttle brute-forcing /api/admin/login.
CREATE TABLE IF NOT EXISTS admin_login_failures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_login_failures_ip ON admin_login_failures (ip, attempted_at);
