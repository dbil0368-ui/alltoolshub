-- SYNORA Revenue Center: free-first D1 foundation
-- Migration 0001. No payment processing, billing, contracts, or live customer onboarding.

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 120),
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','closed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS offerings (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  offering_type TEXT NOT NULL CHECK(offering_type IN (
    'one_time_license','white_label','reseller','api_access',
    'template_store','business_plan','developer_tools','setup_training'
  )),
  availability TEXT NOT NULL DEFAULT 'planned' CHECK(availability IN ('planned','pilot','available','paused')),
  description TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS api_clients (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK(length(label) BETWEEN 1 AND 80),
  key_prefix TEXT NOT NULL CHECK(length(key_prefix) BETWEEN 4 AND 16),
  key_hash TEXT NOT NULL UNIQUE CHECK(length(key_hash) = 64),
  status TEXT NOT NULL DEFAULT 'disabled' CHECK(status IN ('disabled','active','revoked')),
  daily_limit INTEGER NOT NULL DEFAULT 0 CHECK(daily_limit >= 0 AND daily_limit <= 100000),
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_api_clients_org_status ON api_clients(organization_id, status);

CREATE TABLE IF NOT EXISTS api_usage_daily (
  api_client_id TEXT NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
  usage_date TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK(request_count >= 0),
  input_characters INTEGER NOT NULL DEFAULT 0 CHECK(input_characters >= 0),
  output_characters INTEGER NOT NULL DEFAULT 0 CHECK(output_characters >= 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY(api_client_id, usage_date)
);

CREATE TABLE IF NOT EXISTS license_records (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  offering_code TEXT NOT NULL DEFAULT 'one_time_license' REFERENCES offerings(code),
  product_version TEXT NOT NULL,
  scope_summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','approved','revoked','expired')),
  starts_at INTEGER,
  ends_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_licenses_org_status ON license_records(organization_id, status);

CREATE TABLE IF NOT EXISTS reseller_applications (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  applicant_name TEXT NOT NULL CHECK(length(applicant_name) BETWEEN 1 AND 120),
  contact_email TEXT NOT NULL,
  region TEXT,
  experience_summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','review','accepted','declined','withdrawn')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  creator_organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 140),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','review','published','archived')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_templates_visibility_category ON templates(visibility, category);

CREATE TABLE IF NOT EXISTS business_plan_requests (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  requested_plan TEXT NOT NULL,
  team_size INTEGER CHECK(team_size IS NULL OR (team_size BETWEEN 1 AND 10000)),
  requirements TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','review','approved','declined','closed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS developer_projects (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL CHECK(length(project_name) BETWEEN 1 AND 120),
  environment TEXT NOT NULL DEFAULT 'test' CHECK(environment IN ('test','production')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','closed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS service_requests (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK(service_type IN ('setup','training','integration','support')),
  request_summary TEXT NOT NULL,
  preferred_contact TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','review','scheduled','completed','closed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS revenue_audit_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('system','organization_admin','operator')),
  event_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revenue_audit_created ON revenue_audit_events(created_at);

INSERT OR IGNORE INTO offerings (code, title, offering_type, availability, description, updated_at) VALUES
('one_time_license', 'One-time License', 'one_time_license', 'planned', 'Version-scoped licence record; commercial terms are not active.', unixepoch()),
('white_label', 'White-label', 'white_label', 'planned', 'Branding and deployment request workflow.', unixepoch()),
('reseller', 'Reseller Program', 'reseller', 'planned', 'Reseller application and review workflow.', unixepoch()),
('api_access', 'API Access', 'api_access', 'planned', 'Test API client registration and usage tracking; access remains disabled by default.', unixepoch()),
('template_store', 'Template Store', 'template_store', 'planned', 'Template submission and review workflow.', unixepoch()),
('business_plan', 'Business Plans', 'business_plan', 'planned', 'Business plan enquiry and review workflow.', unixepoch()),
('developer_tools', 'Developer Tools', 'developer_tools', 'planned', 'Developer project workspace metadata.', unixepoch()),
('setup_training', 'Setup & Training', 'setup_training', 'planned', 'Setup, training, integration, and support request workflow.', unixepoch());
