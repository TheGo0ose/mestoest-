-- TableMint Baseline Database Schema Migration
-- Flyway Migration V1__init.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. Пользователи системы (app_user)
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(32) NOT NULL, -- CUSTOMER, OWNER, MODERATOR
    locale VARCHAR(10) NOT NULL DEFAULT 'ru',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, DISABLED
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    consent_version VARCHAR(32) NOT NULL,
    consent_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_app_user_email_lower ON app_user (lower(email));
CREATE INDEX idx_app_user_role_status ON app_user (role, status);

-- 2. Рестораны (restaurant)
CREATE TABLE restaurant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES app_user(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    time_zone VARCHAR(64) NOT NULL DEFAULT 'Asia/Bishkek',
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, HIDDEN
    sitting_minutes INT NOT NULL DEFAULT 120,
    slot_minutes INT NOT NULL DEFAULT 30,
    min_lead_minutes INT NOT NULL DEFAULT 60,
    max_advance_days INT NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restaurant_owner_id ON restaurant (owner_id);
CREATE INDEX idx_restaurant_status ON restaurant (status);

-- 3. Часы работы ресторана (opening_hours)
CREATE TABLE opening_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday .. 7=Sunday
    opens_at TIME NOT NULL,
    closes_at TIME NOT NULL,
    CONSTRAINT chk_opening_hours_order CHECK (closes_at > opens_at),
    CONSTRAINT uq_restaurant_day UNIQUE (restaurant_id, day_of_week)
);

CREATE INDEX idx_opening_hours_restaurant_id ON opening_hours (restaurant_id);

-- 4. Столики ресторана (dining_table)
CREATE TABLE dining_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    label VARCHAR(64) NOT NULL,
    seats INT NOT NULL CHECK (seats BETWEEN 1 AND 50),
    active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT uq_restaurant_table_label UNIQUE (restaurant_id, label)
);

CREATE INDEX idx_dining_table_lookup ON dining_table (restaurant_id, active, seats);

-- 5. Разделы меню (menu_section)
CREATE TABLE menu_section (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_menu_section_restaurant ON menu_section (restaurant_id, position);

-- 6. Позиции меню (menu_item)
CREATE TABLE menu_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES menu_section(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_amount NUMERIC(10, 2) NOT NULL CHECK (price_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'KGS',
    available BOOLEAN NOT NULL DEFAULT true,
    position INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_menu_item_section ON menu_item (section_id, position);

-- 7. Бронирования (booking)
CREATE TABLE booking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(32) NOT NULL UNIQUE,
    restaurant_id UUID NOT NULL REFERENCES restaurant(id),
    table_id UUID NOT NULL REFERENCES dining_table(id),
    customer_id UUID REFERENCES app_user(id),
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    telegram_user_id BIGINT,
    party_size INT NOT NULL CHECK (party_size > 0),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL, -- CONFIRMED, CANCELLED
    source VARCHAR(32) NOT NULL, -- WEB, TELEGRAM
    consent_version VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    cancelled_by VARCHAR(32), -- CUSTOMER, OWNER, SYSTEM
    CONSTRAINT chk_booking_person CHECK (
        (customer_id IS NOT NULL AND guest_name IS NULL AND guest_phone IS NULL) OR
        (customer_id IS NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL)
    ),
    CONSTRAINT chk_booking_time CHECK (ends_at > starts_at)
);

-- Исключающее ограничение: запрет двойного бронирования столика в пересекающиеся полуоткрытые интервалы
ALTER TABLE booking ADD CONSTRAINT booking_no_overlap EXCLUDE USING gist (
    table_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (status = 'CONFIRMED');

CREATE INDEX idx_booking_restaurant_dates ON booking (restaurant_id, starts_at, ends_at);
CREATE INDEX idx_booking_customer_id ON booking (customer_id, starts_at DESC);
CREATE INDEX idx_booking_table_id ON booking (table_id);

-- 8. Запросы на обратную связь (contact_request)
CREATE TABLE contact_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    message TEXT NOT NULL,
    source VARCHAR(32) NOT NULL, -- WEB, TELEGRAM
    telegram_user_id BIGINT,
    status VARCHAR(32) NOT NULL DEFAULT 'NEW', -- NEW, HANDLED
    consent_version VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    handled_at TIMESTAMPTZ,
    CONSTRAINT chk_contact_phone_or_email CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX idx_contact_request_restaurant ON contact_request (restaurant_id, status, created_at DESC);

-- 9. Таблица идемпотентности (idempotency_record)
CREATE TABLE idempotency_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(64) NOT NULL,
    idem_key VARCHAR(128) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_status INT NOT NULL,
    response_body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_idempotency_scope_key UNIQUE (scope, idem_key)
);

CREATE INDEX idx_idempotency_created_at ON idempotency_record (created_at);
