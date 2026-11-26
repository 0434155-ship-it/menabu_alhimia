CREATE TABLE IF NOT EXISTS partner_accounts (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, company TEXT NOT NULL,
  salt TEXT NOT NULL, password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS partner_sessions (
  token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES partner_accounts(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS partner_favorites (
  account_id TEXT NOT NULL REFERENCES partner_accounts(id) ON DELETE CASCADE,
  item TEXT NOT NULL, PRIMARY KEY (account_id, item)
);
CREATE TABLE IF NOT EXISTS partner_orders (
  id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES partner_accounts(id) ON DELETE CASCADE,
  created INTEGER NOT NULL, items TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS partner_order_history ON partner_orders(account_id, created DESC);
CREATE INDEX IF NOT EXISTS partner_session_expiry ON partner_sessions(expires);
CREATE TABLE IF NOT EXISTS partner_attempts (
  scope TEXT NOT NULL, minute INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(scope, minute)
);
