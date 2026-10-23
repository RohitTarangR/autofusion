-- AutoFusion PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT '',
    last_name VARCHAR(100) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) DEFAULT '',
    shop_name VARCHAR(200) NOT NULL,
    phone_number VARCHAR(20) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    shop_address TEXT DEFAULT '',
    opening_time TIME DEFAULT '10:00:00',
    closing_time TIME DEFAULT '19:00:00',
    lunch_start_time TIME DEFAULT '13:00:00',
    lunch_end_time TIME DEFAULT '14:00:00',
    max_concurrent_bookings INTEGER DEFAULT 3,
    slot_duration_minutes INTEGER DEFAULT 120,
    closed_days VARCHAR(100) DEFAULT 'Sunday',
    latitude NUMERIC(10, 6) DEFAULT 23.0225,
    longitude NUMERIC(10, 6) DEFAULT 72.5714,
    base_towing_fee NUMERIC(10, 2) DEFAULT 500.00,
    per_km_towing_rate NUMERIC(10, 2) DEFAULT 50.00,
    max_towing_radius_km NUMERIC(10, 2) DEFAULT 50.00,
    towing_service_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_vehicles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(50) NOT NULL,
    vin VARCHAR(50) DEFAULT '',
    fuel_type VARCHAR(50) DEFAULT 'Petrol',
    odometer_km INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS select_shops (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    select_shop_id INTEGER REFERENCES admin_profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS service_offerings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES admin_profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    icon_class VARCHAR(100) DEFAULT 'fas fa-wrench',
    price_starts_at NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    author VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES admin_profiles(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS towing_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES admin_profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    vehicle_details VARCHAR(200) NOT NULL,
    pickup_address TEXT NOT NULL,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    status VARCHAR(20) DEFAULT 'pending',
    otp VARCHAR(10) DEFAULT '',
    otp_verified BOOLEAN DEFAULT FALSE,
    distance_km NUMERIC(10, 2) DEFAULT 0.00,
    base_fee NUMERIC(10, 2) DEFAULT 0.00,
    per_km_rate NUMERIC(10, 2) DEFAULT 0.00,
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES admin_profiles(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    vehicle_info VARCHAR(200) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    additional_notes TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending',
    otp VARCHAR(10) DEFAULT '',
    otp_verified BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(20) DEFAULT 'cash',
    stripe_payment_intent_id VARCHAR(200) DEFAULT NULL,
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    vehicle_id INTEGER REFERENCES client_vehicles(id) ON DELETE SET NULL,
    odometer_at_service INTEGER DEFAULT NULL,
    service_report_summary TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_booking_items (
    booking_id INTEGER REFERENCES service_bookings(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES service_offerings(id) ON DELETE CASCADE,
    price_at_booking NUMERIC(10, 2) DEFAULT 0.00,
    PRIMARY KEY (booking_id, service_id)
);

CREATE TABLE IF NOT EXISTS workshop_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shop_id INTEGER REFERENCES admin_profiles(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES service_bookings(id) ON DELETE SET NULL UNIQUE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


