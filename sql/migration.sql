-- Kader Panel PMII Rayon Inklusif Justicia
-- Database Migration Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: users (admin and kader accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'kader' CHECK (role IN ('admin', 'kader')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: kader_profiles (detailed kader info)
-- ============================================
CREATE TABLE IF NOT EXISTS kader_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nis VARCHAR(10), -- Nomor Induk Kader
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR(10) CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    alamat TEXT,
    no_telepon VARCHAR(20),
    universitas VARCHAR(100),
    fakultas VARCHAR(100),
    jurusan VARCHAR(100),
    angkatan VARCHAR(4),
    status_kader VARCHAR(30) DEFAULT 'Aktif' CHECK (status_kader IN ('Aktif', 'Tidak Aktif', 'Alumni')),
    foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: kegiatan (activity log / history)
-- ============================================
CREATE TABLE IF NOT EXISTS kegiatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    judul VARCHAR(200) NOT NULL,
    deskripsi TEXT,
    tanggal DATE,
    jenis_kegiatan VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: sessions (for cookie-based auth)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_kader_profiles_user_id ON kader_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_kegiatan_user_id ON kegiatan(user_id);

-- ============================================
-- Function: update_updated_at_column()
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- Triggers for auto-updating updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kader_profiles_updated_at ON kader_profiles;
CREATE TRIGGER update_kader_profiles_updated_at
    BEFORE UPDATE ON kader_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Insert default admin user
-- Password: admin123 (generated with bcrypt)
-- IMPORTANT: Change this after first login!
-- ============================================
-- INSERT INTO users (username, email, password_hash, full_name, role)
-- VALUES ('admin', 'admin@pmii-justicia.or.id', '$2b$10$placeholder', 'Administrator', 'admin');

