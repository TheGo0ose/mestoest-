-- Development and Demo Seed Data for TableMint
-- Moderator: moderator@tablemint.local / Password123!
-- Owner:     owner1@tablemint.local / Password123!
-- Customer:  customer1@tablemint.local / Password123!
-- Note: Passwords are BCrypt hash of 'Password123!' ($2a$10$wE9a3e6h... or set at startup)

INSERT INTO app_user (id, email, password_hash, display_name, phone, role, locale, status, must_change_password, consent_version, consent_at)
VALUES 
('11111111-1111-1111-1111-111111111111', 'moderator@tablemint.local', '$2a$10$7zBvyjK7lZ3sYg6Xg3uPqu/dK3f0wYvQW9t9Q1E0F5gYv9mR.0u2m', 'System Moderator', '+996555000001', 'MODERATOR', 'ru', 'ACTIVE', false, '1.0', now()),
('22222222-2222-2222-2222-222222222222', 'owner1@tablemint.local', '$2a$10$7zBvyjK7lZ3sYg6Xg3uPqu/dK3f0wYvQW9t9Q1E0F5gYv9mR.0u2m', 'Restaurant Owner', '+996555000002', 'OWNER', 'ru', 'ACTIVE', false, '1.0', now()),
('33333333-3333-3333-3333-333333333333', 'customer1@tablemint.local', '$2a$10$7zBvyjK7lZ3sYg6Xg3uPqu/dK3f0wYvQW9t9Q1E0F5gYv9mR.0u2m', 'Regular Customer', '+996555000003', 'CUSTOMER', 'ru', 'ACTIVE', false, '1.0', now())
ON CONFLICT (lower(email)) DO NOTHING;

-- Seed Restaurant
INSERT INTO restaurant (id, owner_id, name, description, address, phone, time_zone, status, sitting_minutes, slot_minutes, min_lead_minutes, max_advance_days)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'TableMint Bistro Bishkek', 'Уютный ресторан европейской и национальной кухни в центре Бишкека', 'ул. Киевская, 120, Бишкек', '+996312123456', 'Asia/Bishkek', 'PUBLISHED', 120, 30, 60, 60)
ON CONFLICT (id) DO NOTHING;

-- Seed Opening Hours (Monday - Sunday: 11:00 to 23:00)
INSERT INTO opening_hours (restaurant_id, day_of_week, opens_at, closes_at)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '11:00:00', '23:00:00'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, '11:00:00', '23:00:00'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '11:00:00', '23:00:00'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, '11:00:00', '23:00:00'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, '11:00:00', '23:00:00'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6, '11:00:00', '23:00:00'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 7, '11:00:00', '23:00:00')
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;

-- Seed Dining Tables: A1 (2 seats), B1 (4 seats), B2 (4 seats), C1 (6 seats)
INSERT INTO dining_table (restaurant_id, label, seats, active)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A1', 2, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B1', 4, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B2', 4, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'C1', 6, true)
ON CONFLICT (restaurant_id, label) DO NOTHING;

-- Seed Menu Sections
INSERT INTO menu_section (id, restaurant_id, name, position)
VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Горячие блюда', 1),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Напитки', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed Menu Items
INSERT INTO menu_item (section_id, name, description, price_amount, currency, available, position)
VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Фирменный стейк', 'Сочный рибай с запеченными овощами', 1450.00, 'KGS', true, 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Бешбармак классический', 'Традиционное блюдо с отварной кониной и тонким тестом', 850.00, 'KGS', true, 2),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Горный чай с травами', 'Чайник ароматного чая с чабрецом и мятой', 280.00, 'KGS', true, 1),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Свежевыжатый сок', 'Апельсиновый сок 300мл', 320.00, 'KGS', true, 2);
