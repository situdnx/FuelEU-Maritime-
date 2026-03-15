import pool from './pool';

const migrations = `
-- Drop tables if exist (for fresh migration)
DROP TABLE IF EXISTS pool_members CASCADE;
DROP TABLE IF EXISTS pools CASCADE;
DROP TABLE IF EXISTS bank_entries CASCADE;
DROP TABLE IF EXISTS ship_compliance CASCADE;
DROP TABLE IF EXISTS routes CASCADE;

-- Routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id VARCHAR(20) UNIQUE NOT NULL,
  vessel_type VARCHAR(50) NOT NULL,
  fuel_type VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  ghg_intensity DECIMAL(10,4) NOT NULL,
  fuel_consumption DECIMAL(12,2) NOT NULL,
  distance DECIMAL(12,2) NOT NULL,
  total_emissions DECIMAL(12,2) NOT NULL,
  is_baseline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ship compliance records
CREATE TABLE ship_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  cb_gco2eq DECIMAL(20,4) NOT NULL,
  energy_in_scope DECIMAL(20,4) NOT NULL,
  target_intensity DECIMAL(10,4) NOT NULL,
  actual_intensity DECIMAL(10,4) NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ship_id, year)
);

-- Bank entries (Article 20)
CREATE TABLE bank_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  amount_gco2eq DECIMAL(20,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pools (Article 21)
CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool members
CREATE TABLE pool_members (
  pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
  ship_id VARCHAR(20) NOT NULL,
  cb_before DECIMAL(20,4) NOT NULL,
  cb_after DECIMAL(20,4) NOT NULL,
  PRIMARY KEY (pool_id, ship_id)
);

-- Indexes
CREATE INDEX idx_routes_year ON routes(year);
CREATE INDEX idx_routes_baseline ON routes(is_baseline);
CREATE INDEX idx_bank_entries_ship_year ON bank_entries(ship_id, year);
CREATE INDEX idx_ship_compliance_ship_year ON ship_compliance(ship_id, year);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔧 Running migrations...');
    await client.query(migrations);
    console.log('✅ Migrations complete');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
