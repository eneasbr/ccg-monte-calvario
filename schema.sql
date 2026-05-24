-- ============================================================
-- CCG MONTE CALVÁRIO — FOUNDING PARTNERS
-- Schema SQL completo para Supabase
-- Versão: 1.0
-- ============================================================


-- ============================================================
-- 1. CAMPANHA
-- Dados gerais da campanha de arrecadação
-- ============================================================
CREATE TABLE campaigns (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL DEFAULT 'Founding Partners — CCG Monte Calvário',
  goal          NUMERIC(12,2) NOT NULL DEFAULT 200000,
  partner_goal  INTEGER NOT NULL DEFAULT 100,
  start_date    DATE NOT NULL DEFAULT '2025-06-01',
  end_date      DATE NOT NULL DEFAULT '2025-09-30',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,

  -- Textos multilíngue
  title_pt      TEXT DEFAULT 'Construindo um lugar sagrado para todos.',
  title_en      TEXT DEFAULT 'Building a sacred place for all.',
  title_es      TEXT DEFAULT 'Construyendo un lugar sagrado para todos.',
  desc_pt       TEXT DEFAULT 'Cada contribuição é um tijolo nessa história.',
  desc_en       TEXT DEFAULT 'Every contribution is a brick in this story.',
  desc_es       TEXT DEFAULT 'Cada contribución es un ladrillo en esta historia.',

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: campanha inicial
INSERT INTO campaigns (name) VALUES ('Founding Partners — CCG Monte Calvário');


-- ============================================================
-- 2. METAS MENSAIS
-- Meta e valor arrecadado por mês
-- ============================================================
CREATE TABLE monthly_goals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  month_key     TEXT NOT NULL, -- 'junho', 'julho', 'agosto', 'setembro'
  month_name_pt TEXT NOT NULL,
  month_name_en TEXT NOT NULL,
  month_name_es TEXT NOT NULL,
  month_order   INTEGER NOT NULL, -- 1, 2, 3, 4
  target        NUMERIC(12,2) NOT NULL DEFAULT 50000,
  raised        NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, month_key)
);

-- Seed: meses da campanha
INSERT INTO monthly_goals (campaign_id, month_key, month_name_pt, month_name_en, month_name_es, month_order, target)
SELECT id, 'junho',    'Junho',    'June',      'Junio',      1, 50000 FROM campaigns LIMIT 1;
INSERT INTO monthly_goals (campaign_id, month_key, month_name_pt, month_name_en, month_name_es, month_order, target)
SELECT id, 'julho',    'Julho',    'July',      'Julio',      2, 50000 FROM campaigns LIMIT 1;
INSERT INTO monthly_goals (campaign_id, month_key, month_name_pt, month_name_en, month_name_es, month_order, target)
SELECT id, 'agosto',   'Agosto',   'August',    'Agosto',     3, 50000 FROM campaigns LIMIT 1;
INSERT INTO monthly_goals (campaign_id, month_key, month_name_pt, month_name_en, month_name_es, month_order, target)
SELECT id, 'setembro', 'Setembro', 'September', 'Septiembre', 4, 50000 FROM campaigns LIMIT 1;


-- ============================================================
-- 3. PARCEIROS / DOADORES
-- Cada parceiro fundador da campanha
-- ============================================================
CREATE TABLE donors (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Dados pessoais
  name          TEXT NOT NULL,
  initials      TEXT NOT NULL, -- ex: 'FS'
  phone         TEXT,          -- WhatsApp
  email         TEXT,

  -- Nível / Badge
  badge         TEXT NOT NULL DEFAULT 'Bronze'
                CHECK (badge IN ('Diamante', 'Ouro', 'Prata', 'Bronze')),

  -- Total calculado (soma de todas contribuições)
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Mural dos fundadores
  mural_name    TEXT,          -- nome como aparece na placa
  mural_status  TEXT NOT NULL DEFAULT 'pending'
                CHECK (mural_status IN ('approved', 'pending', 'rejected')),

  -- Visibilidade no dashboard público
  is_visible    BOOLEAN NOT NULL DEFAULT TRUE,

  -- Notas internas (admin only)
  notes         TEXT,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 4. CONTRIBUIÇÕES
-- Cada pagamento mensal de cada parceiro
-- ============================================================
CREATE TABLE contributions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_id      UUID REFERENCES donors(id) ON DELETE CASCADE,
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  month_key     TEXT NOT NULL, -- 'junho', 'julho', etc.
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_at       DATE,          -- data do pagamento
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(donor_id, month_key)
);


-- ============================================================
-- 5. MARCOS / MILESTONES
-- Marcos gamificados da campanha
-- ============================================================
CREATE TABLE milestones (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  emoji         TEXT NOT NULL,
  value         NUMERIC(12,2) NOT NULL,
  value_label   TEXT NOT NULL,  -- ex: 'R$ 50k'
  desc_pt       TEXT NOT NULL,
  desc_en       TEXT NOT NULL,
  desc_es       TEXT NOT NULL,
  reached       BOOLEAN NOT NULL DEFAULT FALSE,
  reached_at    TIMESTAMPTZ,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: marcos iniciais
INSERT INTO milestones (campaign_id, emoji, value, value_label, desc_pt, desc_en, desc_es, sort_order)
SELECT id, '🌱', 10000,  'R$ 10k',  'Primeira semente',     'First seed',            'Primera semilla',       1 FROM campaigns LIMIT 1;
INSERT INTO milestones (campaign_id, emoji, value, value_label, desc_pt, desc_en, desc_es, sort_order)
SELECT id, '🏗️', 25000,  'R$ 25k',  'Fundação lançada',     'Foundation laid',       'Fundación lanzada',     2 FROM campaigns LIMIT 1;
INSERT INTO milestones (campaign_id, emoji, value, value_label, desc_pt, desc_en, desc_es, sort_order)
SELECT id, '🧱', 50000,  'R$ 50k',  'Primeiro mês completo','First month complete',  'Primer mes completo',   3 FROM campaigns LIMIT 1;
INSERT INTO milestones (campaign_id, emoji, value, value_label, desc_pt, desc_en, desc_es, sort_order)
SELECT id, '⛪', 100000, 'R$ 100k', 'Metade da meta!',      'Halfway there!',        '¡Mitad de la meta!',    4 FROM campaigns LIMIT 1;
INSERT INTO milestones (campaign_id, emoji, value, value_label, desc_pt, desc_en, desc_es, sort_order)
SELECT id, '🔔', 150000, 'R$ 150k', 'Sino dobrado',         'Bells ringing',         'Campanas sonando',      5 FROM campaigns LIMIT 1;
INSERT INTO milestones (campaign_id, emoji, value, value_label, desc_pt, desc_en, desc_es, sort_order)
SELECT id, '🎉', 200000, 'R$ 200k', 'Meta atingida!',       'Goal reached!',         '¡Meta alcanzada!',      6 FROM campaigns LIMIT 1;


-- ============================================================
-- 6. UPDATES / PUBLICAÇÕES
-- Novidades publicadas pelos admins
-- ============================================================
CREATE TABLE updates (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'update'
                CHECK (type IN ('milestone', 'update', 'thanks', 'urgent')),
  visibility    TEXT NOT NULL DEFAULT 'public'
                CHECK (visibility IN ('public', 'partners')),
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: update inicial
INSERT INTO updates (campaign_id, title, body, type, visibility)
SELECT id,
  'Campanha lançada! 🚀',
  'Hoje iniciamos oficialmente a campanha Founding Partners. Juntos chegaremos à meta!',
  'milestone',
  'public'
FROM campaigns LIMIT 1;


-- ============================================================
-- 7. FEED DE ATIVIDADE
-- Log público de ações relevantes
-- ============================================================
CREATE TABLE activity_feed (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  donor_id      UUID REFERENCES donors(id) ON DELETE SET NULL,
  donor_name    TEXT NOT NULL,
  donor_initials TEXT NOT NULL,
  action_pt     TEXT NOT NULL,
  action_en     TEXT NOT NULL,
  action_es     TEXT NOT NULL,
  amount        TEXT,           -- ex: 'R$ 2.000' ou '✅ Meta!'
  is_visible    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 8. PERFIS DE ADMIN
-- Extensão da tabela auth.users do Supabase
-- ============================================================
CREATE TABLE admin_profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('superadmin', 'admin', 'viewer')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 9. AUDIT LOG
-- Histórico de todas as ações dos admins
-- ============================================================
CREATE TABLE audit_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email    TEXT,
  action        TEXT NOT NULL,   -- ex: 'donor.created', 'goal.updated'
  entity        TEXT,            -- ex: 'donors', 'monthly_goals'
  entity_id     UUID,
  old_data      JSONB,           -- valor antes da mudança
  new_data      JSONB,           -- valor depois da mudança
  ip_address    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 10. CONFIGURAÇÕES DO SISTEMA
-- Thresholds de badge e outras configs
-- ============================================================
CREATE TABLE settings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id     UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  badge_diamante  NUMERIC(12,2) NOT NULL DEFAULT 5000,
  badge_ouro      NUMERIC(12,2) NOT NULL DEFAULT 2000,
  badge_prata     NUMERIC(12,2) NOT NULL DEFAULT 1000,
  badge_bronze    NUMERIC(12,2) NOT NULL DEFAULT 1,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: configurações padrão
INSERT INTO settings (campaign_id)
SELECT id FROM campaigns LIMIT 1;


-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- View: total arrecadado e progresso da campanha
CREATE VIEW campaign_summary AS
SELECT
  c.id,
  c.name,
  c.goal,
  c.partner_goal,
  c.start_date,
  c.end_date,
  COUNT(DISTINCT d.id) AS total_partners,
  COALESCE(SUM(d.total), 0) AS total_raised,
  ROUND(COALESCE(SUM(d.total), 0) / c.goal * 100, 1) AS pct_complete,
  c.goal - COALESCE(SUM(d.total), 0) AS remaining
FROM campaigns c
LEFT JOIN donors d ON d.campaign_id = c.id AND d.is_visible = TRUE
GROUP BY c.id;

-- View: ranking de doadores
CREATE VIEW donor_ranking AS
SELECT
  d.*,
  RANK() OVER (ORDER BY d.total DESC) AS rank_position
FROM donors d
WHERE d.is_visible = TRUE
ORDER BY d.total DESC;

-- View: progresso mensal completo
CREATE VIEW monthly_summary AS
SELECT
  mg.*,
  ROUND(mg.raised / NULLIF(mg.target, 0) * 100, 1) AS pct_complete,
  mg.target - mg.raised AS remaining
FROM monthly_goals mg
ORDER BY mg.month_order;


-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Função: atualiza o total do doador ao salvar contribuição
CREATE OR REPLACE FUNCTION update_donor_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE donors
  SET
    total = (
      SELECT COALESCE(SUM(amount), 0)
      FROM contributions
      WHERE donor_id = NEW.donor_id
    ),
    badge = CASE
      WHEN (SELECT COALESCE(SUM(amount),0) FROM contributions WHERE donor_id = NEW.donor_id) >= (SELECT badge_diamante FROM settings LIMIT 1) THEN 'Diamante'
      WHEN (SELECT COALESCE(SUM(amount),0) FROM contributions WHERE donor_id = NEW.donor_id) >= (SELECT badge_ouro FROM settings LIMIT 1)     THEN 'Ouro'
      WHEN (SELECT COALESCE(SUM(amount),0) FROM contributions WHERE donor_id = NEW.donor_id) >= (SELECT badge_prata FROM settings LIMIT 1)    THEN 'Prata'
      ELSE 'Bronze'
    END,
    updated_at = NOW()
  WHERE id = NEW.donor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: dispara ao inserir/atualizar contribuição
CREATE TRIGGER trg_update_donor_total
AFTER INSERT OR UPDATE ON contributions
FOR EACH ROW EXECUTE FUNCTION update_donor_total();


-- Função: atualiza raised da meta mensal ao salvar contribuição
CREATE OR REPLACE FUNCTION update_monthly_raised()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE monthly_goals
  SET
    raised = (
      SELECT COALESCE(SUM(amount), 0)
      FROM contributions
      WHERE campaign_id = NEW.campaign_id
        AND month_key = NEW.month_key
    ),
    updated_at = NOW()
  WHERE campaign_id = NEW.campaign_id
    AND month_key = NEW.month_key;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: dispara ao inserir/atualizar contribuição
CREATE TRIGGER trg_update_monthly_raised
AFTER INSERT OR UPDATE ON contributions
FOR EACH ROW EXECUTE FUNCTION update_monthly_raised();


-- Função: verifica e atualiza marcos atingidos
CREATE OR REPLACE FUNCTION check_milestones()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO v_total
  FROM donors
  WHERE campaign_id = NEW.campaign_id;

  UPDATE milestones
  SET
    reached = TRUE,
    reached_at = NOW()
  WHERE campaign_id = NEW.campaign_id
    AND value <= v_total
    AND reached = FALSE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: dispara ao atualizar doador
CREATE TRIGGER trg_check_milestones
AFTER UPDATE ON donors
FOR EACH ROW EXECUTE FUNCTION check_milestones();


-- Função: updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at em todas as tabelas
CREATE TRIGGER trg_campaigns_updated_at       BEFORE UPDATE ON campaigns      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_monthly_goals_updated_at   BEFORE UPDATE ON monthly_goals  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_donors_updated_at          BEFORE UPDATE ON donors         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contributions_updated_at   BEFORE UPDATE ON contributions  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_updates_updated_at         BEFORE UPDATE ON updates        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_admin_profiles_updated_at  BEFORE UPDATE ON admin_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Controle de acesso por linha
-- ============================================================

-- Ativa RLS em todas as tabelas
ALTER TABLE campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_goals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed  ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PÚBLICAS (dashboard público pode ler)
CREATE POLICY "public_read_campaigns"     ON campaigns     FOR SELECT USING (TRUE);
CREATE POLICY "public_read_monthly_goals" ON monthly_goals FOR SELECT USING (TRUE);
CREATE POLICY "public_read_donors"        ON donors        FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "public_read_milestones"    ON milestones    FOR SELECT USING (TRUE);
CREATE POLICY "public_read_updates"       ON updates       FOR SELECT USING (is_published = TRUE AND visibility = 'public');
CREATE POLICY "public_read_activity"      ON activity_feed FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "public_read_contributions" ON contributions FOR SELECT USING (TRUE);

-- POLÍTICAS DE ADMIN (só usuários autenticados podem escrever)
CREATE POLICY "admin_all_campaigns"     ON campaigns     FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_monthly_goals" ON monthly_goals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_donors"        ON donors        FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_contributions" ON contributions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_milestones"    ON milestones    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_updates"       ON updates       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_activity"      ON activity_feed FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_settings"      ON settings      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_read_profiles"     ON admin_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_own_profile"       ON admin_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "admin_read_logs"         ON audit_logs    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admin_insert_logs"       ON audit_logs    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX idx_donors_campaign      ON donors(campaign_id);
CREATE INDEX idx_donors_badge         ON donors(badge);
CREATE INDEX idx_donors_total         ON donors(total DESC);
CREATE INDEX idx_contributions_donor  ON contributions(donor_id);
CREATE INDEX idx_contributions_month  ON contributions(month_key);
CREATE INDEX idx_monthly_goals_order  ON monthly_goals(month_order);
CREATE INDEX idx_activity_created     ON activity_feed(created_at DESC);
CREATE INDEX idx_audit_user           ON audit_logs(user_id);
CREATE INDEX idx_audit_created        ON audit_logs(created_at DESC);
CREATE INDEX idx_updates_published    ON updates(is_published, published_at DESC);


-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
