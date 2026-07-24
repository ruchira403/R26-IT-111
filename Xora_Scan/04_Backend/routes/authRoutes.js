const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { createClient } = require('redis');

const router = express.Router();

const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : null;

if (redisClient) {
  redisClient.connect().catch((error) => {
    console.warn('Redis not available for auth sessions:', error.message);
  });
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'USER',
      health_profile JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS health_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      age INTEGER,
      sugar_usage VARCHAR(50),
      gum_bleeding BOOLEAN,
      alcohol_usage VARCHAR(50),
      smoking_status VARCHAR(50),
      diabetes_status BOOLEAN,
      number_of_teeth INTEGER,
      is_primary_teeth BOOLEAN,
      pregnancy_status BOOLEAN,
      tooth_sensitivity BOOLEAN,
      brushing_frequency INTEGER,
      preferred_language VARCHAR(50),
      number_of_filled_teeth INTEGER,
      number_of_missing_teeth INTEGER,
      overall_oral_hygiene_level VARCHAR(50),
      calcium_or_vitamin_deficiency BOOLEAN,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE dental_records ADD COLUMN IF NOT EXISTS user_id INTEGER`);
  await pool.query(`ALTER TABLE dental_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
  await pool.query(`ALTER TABLE detected_diseases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);

  await pool.query(`
    INSERT INTO health_profiles (
      user_id,
      age,
      sugar_usage,
      gum_bleeding,
      alcohol_usage,
      smoking_status,
      diabetes_status,
      number_of_teeth,
      is_primary_teeth,
      pregnancy_status,
      tooth_sensitivity,
      brushing_frequency,
      preferred_language,
      number_of_filled_teeth,
      number_of_missing_teeth,
      overall_oral_hygiene_level,
      calcium_or_vitamin_deficiency,
      created_at,
      updated_at
    )
    SELECT
      u.id,
      (u.health_profile->>'age')::INTEGER,
      u.health_profile->>'sugar_usage',
      (u.health_profile->>'gum_bleeding')::BOOLEAN,
      u.health_profile->>'alcohol_usage',
      u.health_profile->>'smoking_status',
      (u.health_profile->>'diabetes_status')::BOOLEAN,
      (u.health_profile->>'number_of_teeth')::INTEGER,
      (u.health_profile->>'is_primary_teeth')::BOOLEAN,
      (u.health_profile->>'pregnancy_status')::BOOLEAN,
      (u.health_profile->>'tooth_sensitivity')::BOOLEAN,
      (u.health_profile->>'brushing_frequency')::INTEGER,
      u.health_profile->>'preferred_language',
      (u.health_profile->>'number_of_filled_teeth')::INTEGER,
      (u.health_profile->>'number_of_missing_teeth')::INTEGER,
      u.health_profile->>'overall_oral_hygiene_level',
      (u.health_profile->>'calcium_or_vitamin_deficiency')::BOOLEAN,
      COALESCE(u.created_at, NOW()),
      COALESCE(u.updated_at, NOW())
    FROM users u
    WHERE u.health_profile IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM health_profiles hp WHERE hp.user_id = u.id)
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS health_profile JSONB`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);

  // Ensure timestamps on health_profiles have defaults to avoid NULL insert failures
  await pool.query(`ALTER TABLE health_profiles ALTER COLUMN created_at SET DEFAULT NOW()`);
  await pool.query(`ALTER TABLE health_profiles ALTER COLUMN updated_at SET DEFAULT NOW()`);
  await pool.query(`ALTER TABLE health_profiles ALTER COLUMN created_at SET NOT NULL`);
  await pool.query(`ALTER TABLE health_profiles ALTER COLUMN updated_at SET NOT NULL`);

  console.log('✅ Auth database tables initialized');
}

initializeDatabase().catch((error) => {
  console.error('❌ Failed to initialize auth database tables:', error);
  if (error && error.stack) {
    console.error(error.stack);
  }
});

function signToken(payload, type = 'access') {
  const secret = type === 'refresh'
    ? process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET
    : process.env.JWT_ACCESS_SECRET;

  const expiresIn = type === 'refresh' ? '7d' : '15m';
  return jwt.sign(payload, secret, { expiresIn });
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7);
}

async function authenticate(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    healthProfile: row.health_profile || null,
    createdAt: row.created_at,
  };
}

function mapHealthProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    age: row.age,
    sugarUsage: row.sugar_usage,
    gumBleeding: row.gum_bleeding,
    alcoholUsage: row.alcohol_usage,
    smokingStatus: row.smoking_status,
    diabetesStatus: row.diabetes_status,
    numberOfTeeth: row.number_of_teeth,
    isPrimaryTeeth: row.is_primary_teeth,
    pregnancyStatus: row.pregnancy_status,
    toothSensitivity: row.tooth_sensitivity,
    brushingFrequency: row.brushing_frequency,
    preferredLanguage: row.preferred_language,
    numberOfFilledTeeth: row.number_of_filled_teeth,
    numberOfMissingTeeth: row.number_of_missing_teeth,
    overallOralHygieneLevel: row.overall_oral_hygiene_level,
    calciumOrVitaminDeficiency: row.calcium_or_vitamin_deficiency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createHealthProfile(userId, healthProfile) {
  if (!healthProfile) {
    return null;
  }

  const result = await pool.query(
    `INSERT INTO health_profiles (
      user_id,
      age,
      sugar_usage,
      gum_bleeding,
      alcohol_usage,
      smoking_status,
      diabetes_status,
      number_of_teeth,
      is_primary_teeth,
      pregnancy_status,
      tooth_sensitivity,
      brushing_frequency,
      preferred_language,
      number_of_filled_teeth,
      number_of_missing_teeth,
      overall_oral_hygiene_level,
      calcium_or_vitamin_deficiency
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *;
    `,
    [
      userId,
      healthProfile.age ?? null,
      healthProfile.sugar_usage ?? null,
      healthProfile.gum_bleeding ?? false,
      healthProfile.alcohol_usage ?? null,
      healthProfile.smoking_status ?? null,
      healthProfile.diabetes_status ?? false,
      healthProfile.number_of_teeth ?? null,
      healthProfile.is_primary_teeth ?? false,
      healthProfile.pregnancy_status ?? false,
      healthProfile.tooth_sensitivity ?? false,
      healthProfile.brushing_frequency ?? null,
      healthProfile.preferred_language ?? null,
      healthProfile.number_of_filled_teeth ?? null,
      healthProfile.number_of_missing_teeth ?? null,
      healthProfile.overall_oral_hygiene_level ?? null,
      healthProfile.calcium_or_vitamin_deficiency ?? false,
    ]
  );
  return mapHealthProfileRow(result.rows[0]);
}

async function getUserHealthProfiles(userId) {
  const result = await pool.query(
    `SELECT * FROM health_profiles WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map(mapHealthProfileRow);
}

async function getUserDentalHistory(userId) {
  const result = await pool.query(
    `SELECT
       dr.id,
       dr.user_id,
       dr.image_path,
       dr.quality_score,
       dr.confidence_score,
       dr.exposure,
       dr.is_blurred,
       dr.created_at,
       COALESCE(json_agg(json_build_object(
         'id', dd.id,
         'disease_type', dd.disease_type,
         'severity_level', dd.severity_level,
         'confidence', dd.confidence,
         'created_at', dd.created_at
       ) ORDER BY dd.id) FILTER (WHERE dd.id IS NOT NULL), '[]') AS diseases
     FROM dental_records dr
     LEFT JOIN detected_diseases dd ON dr.id = dd.record_id
     WHERE dr.user_id = $1
     GROUP BY dr.id
     ORDER BY dr.created_at DESC;
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    imagePath: row.image_path,
    qualityScore: row.quality_score,
    confidenceScore: row.confidence_score,
    exposure: row.exposure,
    isBlurred: row.is_blurred,
    createdAt: row.created_at,
    diseases: row.diseases || [],
  }));
}

router.post('/register', async (req, res) => {
  console.log('📝 Register request received');
  const { email, password, role = 'USER', healthProfile } = req.body || {};
  console.log('Email:', email, 'Role:', role);

  if (!email || !password) {
    console.log('❌ Missing email or password');
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const insertResult = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email, passwordHash, role]
    );

    const user = insertResult.rows[0];
    const accessToken = signToken({ sub: user.id, userId: user.id, role: user.role });
    const refreshToken = signToken({ sub: user.id, userId: user.id, role: user.role }, 'refresh');

    if (healthProfile) {
      await createHealthProfile(user.id, healthProfile);
    }

    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(`auth:${user.id}:refresh`, 60 * 60 * 24 * 7, refreshToken);
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: mapUserRow(user),
      data: {
        user: mapUserRow(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('❌ Register error:', error.message || error);
    return res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const accessToken = signToken({ sub: user.id, userId: user.id, role: user.role });
    const refreshToken = signToken({ sub: user.id, userId: user.id, role: user.role }, 'refresh');

    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(`auth:${user.id}:refresh`, 60 * 60 * 24 * 7, refreshToken);
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: mapUserRow(user),
      data: {
        user: mapUserRow(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error.message || error);
    return res.status(500).json({ success: false, message: error.message || 'Login failed.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: mapUserRow(result.rows[0]),
        latestHealthProfile: await getUserHealthProfiles(req.user.userId).then((rows) => rows[0] || null),
        healthProfiles: await getUserHealthProfiles(req.user.userId),
        dentalHistory: await getUserDentalHistory(req.user.userId),
      },
    });
  } catch (error) {
    console.error('❌ Me error:', error.message || error);
    return res.status(500).json({ success: false, message: error.message || 'Unable to load user profile.' });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.del(`auth:${req.user.userId}:refresh`);
  }

  return res.status(200).json({ success: true, message: 'Logout successful' });
});

module.exports = router;
