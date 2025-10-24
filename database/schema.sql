-- DIENGUIX Database Schema for PostgreSQL

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    country VARCHAR(2) NOT NULL, -- Code pays ISO (GA, RU, etc.)
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    avatar_url TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_name VARCHAR(200) NOT NULL,
    sender_phone VARCHAR(20),
    sender_country VARCHAR(2) NOT NULL,
    recipient_name VARCHAR(200) NOT NULL,
    recipient_phone VARCHAR(20),
    recipient_country VARCHAR(2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL, -- XAF, RUB, etc.
    exchange_rate DECIMAL(10,6),
    amount_received DECIMAL(15,2),
    received_currency VARCHAR(3),
    fees DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method VARCHAR(50),
    operator VARCHAR(100),
    transaction_type VARCHAR(20) DEFAULT 'transfer' CHECK (transaction_type IN ('transfer', 'topup', 'withdrawal')),
    reason TEXT,
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des taux de change
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    buy_rate DECIMAL(10,6),
    sell_rate DECIMAL(10,6),
    margin DECIMAL(5,4) DEFAULT 0.02, -- 2% margin par défaut
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_currency, to_currency, valid_from)
);

-- Table des logs d'audit
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('auth', 'transaction', 'user_management', 'system', 'settings')),
    resource_type VARCHAR(50), -- 'user', 'transaction', 'rate', etc.
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paramètres système
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false, -- Visible côté client
    is_editable BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des opérateurs de paiement
CREATE TABLE payment_operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    country VARCHAR(2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('mobile_money', 'bank', 'card', 'crypto')),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    min_amount DECIMAL(10,2) DEFAULT 0,
    max_amount DECIMAL(10,2),
    fees_structure JSONB, -- Structure des frais
    supported_currencies TEXT[], -- Array des devises supportées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions utilisateur (optionnel pour tracking)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_transactions_sender_id ON transactions(sender_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_country ON transactions(sender_country, recipient_country);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_valid ON exchange_rates(valid_from, valid_until);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour logs d'audit automatiques
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        category,
        resource_type,
        resource_id,
        old_values,
        new_values
    ) VALUES (
        COALESCE(current_setting('audit.user_id', true)::UUID, NULL),
        TG_OP,
        'system',
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Appliquer l'audit aux tables critiques
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Données initiales
INSERT INTO system_settings (key, value, description, category) VALUES
('app_name', '"DIENGUIX"', 'Nom de l''application', 'general'),
('default_currency', '"XAF"', 'Devise par défaut', 'financial'),
('max_transaction_amount', '10000000', 'Montant maximum par transaction', 'financial'),
('min_transaction_amount', '1000', 'Montant minimum par transaction', 'financial'),
('maintenance_mode', 'false', 'Mode maintenance', 'system'),
('supported_countries', '["GA", "RU"]', 'Pays supportés', 'general'),
('email_notifications', 'true', 'Notifications email activées', 'notifications'),
('sms_notifications', 'true', 'Notifications SMS activées', 'notifications');

-- Opérateurs par défaut
INSERT INTO payment_operators (name, code, country, type, supported_currencies) VALUES
('Orange Money', 'ORANGE_GA', 'GA', 'mobile_money', ARRAY['XAF']),
('Airtel Money', 'AIRTEL_GA', 'GA', 'mobile_money', ARRAY['XAF']),
('Moov Money', 'MOOV_GA', 'GA', 'mobile_money', ARRAY['XAF']),
('Sberbank', 'SBER_RU', 'RU', 'bank', ARRAY['RUB']),
('Qiwi', 'QIWI_RU', 'RU', 'mobile_money', ARRAY['RUB']),
('YooMoney', 'YOOMONEY_RU', 'RU', 'mobile_money', ARRAY['RUB']);

-- Taux de change par défaut
INSERT INTO exchange_rates (from_currency, to_currency, rate, buy_rate, sell_rate) VALUES
('XAF', 'RUB', 0.12, 0.118, 0.122),
('RUB', 'XAF', 8.33, 8.20, 8.46),
('XAF', 'EUR', 0.00152, 0.00150, 0.00154),
('EUR', 'XAF', 656.0, 649.0, 663.0);