CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    age INTEGER NOT NULL CHECK (age BETWEEN 1 AND 120),
    number_of_teeth INTEGER NOT NULL CHECK (number_of_teeth BETWEEN 0 AND 32),
    number_of_missing_teeth INTEGER NOT NULL CHECK (number_of_missing_teeth BETWEEN 0 AND 32),
    is_primary_teeth BOOLEAN NOT NULL DEFAULT FALSE,
    smoking_status VARCHAR(20) NOT NULL CHECK (smoking_status IN ('no', 'medium', 'high')),
    alcohol_usage VARCHAR(20) NOT NULL CHECK (alcohol_usage IN ('no', 'medium', 'high')),
    sugar_usage VARCHAR(20) NOT NULL CHECK (sugar_usage IN ('no', 'medium', 'high')),
    brushing_frequency INTEGER NOT NULL CHECK (brushing_frequency IN (0, 1, 2)),
    diabetes_status BOOLEAN NOT NULL DEFAULT FALSE,
    pregnancy_status BOOLEAN NOT NULL DEFAULT FALSE,
    gum_bleeding BOOLEAN NOT NULL DEFAULT FALSE,
    tooth_sensitivity BOOLEAN NOT NULL DEFAULT FALSE,
    calcium_or_vitamin_deficiency BOOLEAN NOT NULL DEFAULT FALSE,
    number_of_filled_teeth INTEGER NOT NULL DEFAULT 0 CHECK (number_of_filled_teeth BETWEEN 0 AND 32),
    overall_oral_hygiene_level VARCHAR(20) NOT NULL CHECK (overall_oral_hygiene_level IN ('good', 'moderate', 'poor')),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_health_profile_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_total_teeth
        CHECK (number_of_teeth + number_of_missing_teeth <= 32),

    CONSTRAINT chk_filled_teeth
        CHECK (number_of_filled_teeth <= number_of_teeth)
);
