# Health Advisor Authentication Service

Authentication and Health Profile microservice for the oral health advisor research project. This handles user registration, JWT login/logout, Redis-backed sessions, authenticated health profile CRUD, and a placeholder prediction endpoint for a future n8n webhook integration.

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Redis
- JWT
- bcrypt
- Joi validation

## Folder Structure

```txt
src/
  api/
    auth/
    health-advisor/
    health-profile/
    index.ts
  config/
  middlewares/
  types/
  utils/
prisma/
  migrations/
  schema.prisma
```

## Secrets

```env
DATABASE_URL=
PORT=8000
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
N8N_WEBHOOK_URL=
```

## Setup

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Start development server:

```bash
npm run dev
```

Local base URL:

```txt
http://localhost:8000
```

Deployed base URL placeholder:

```txt
https://***
```

## Authentication

Redis stores active sessions with this key format:

```txt
auth:session:{userId}:{tokenId}
```

The session TTL follows `JWT_REFRESH_EXPIRES_IN`. Logout deletes the Redis session key, so the access token can no longer be used even if the JWT has not expired.

Other services can use this auth service by sending:

```txt
Authorization: Bearer <token>
```

They can either verify the JWT using the shared access-token secret, or call `GET /api/auth/me` to fetch the logged-in user and health profile.

## API Documentation

### POST /api/auth/register

Creates a user and health profile in one Prisma transaction.

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "role": "USER",
    "healthProfile": {
      "age": 42,
      "number_of_teeth": 23,
      "number_of_missing_teeth": 9,
      "is_primary_teeth": false,
      "smoking_status": "high",
      "alcohol_usage": "medium",
      "sugar_usage": "high",
      "brushing_frequency": 1,
      "diabetes_status": true,
      "pregnancy_status": false,
      "gum_bleeding": true,
      "tooth_sensitivity": true,
      "calcium_or_vitamin_deficiency": false,
      "number_of_filled_teeth": 4,
      "overall_oral_hygiene_level": "moderate",
      "preferred_language": "en"
    }
  }'
```

### POST /api/auth/login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'
```

Returns the user, `accessToken`, and `refreshToken`.

### POST /api/auth/logout

```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Deletes the active Redis session.

### GET /api/auth/me

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

Returns the logged-in user and `healthProfile` if available.

### GET /api/health-profile/me

```bash
curl http://localhost:8000/api/health-profile/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### POST /api/health-profile

```bash
curl -X POST http://localhost:8000/api/health-profile \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 30,
    "number_of_teeth": 28,
    "number_of_missing_teeth": 4,
    "is_primary_teeth": false,
    "smoking_status": "no",
    "alcohol_usage": "no",
    "sugar_usage": "medium",
    "brushing_frequency": 2,
    "diabetes_status": false,
    "pregnancy_status": false,
    "gum_bleeding": false,
    "tooth_sensitivity": true,
    "calcium_or_vitamin_deficiency": false,
    "number_of_filled_teeth": 2,
    "overall_oral_hygiene_level": "good",
    "preferred_language": "en"
  }'
```

### PUT /api/health-profile/me

```bash
curl -X PUT http://localhost:8000/api/health-profile/me \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"smoking_status":"medium","overall_oral_hygiene_level":"moderate"}'
```

### DELETE /api/health-profile/me

```bash
curl -X DELETE http://localhost:8000/api/health-profile/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Test Flow

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, JWT secrets, and `REDIS_URL`.
2. Run `npx prisma generate`.
3. Run `npx prisma migrate dev`.
4. Run `npm run dev`.
5. Register a user with `POST /api/auth/register`.
6. Log in with `POST /api/auth/login` and copy `data.accessToken`.
7. Call `GET /api/auth/me` with `Authorization: Bearer ACCESS_TOKEN`.
8. Call the health profile with the same bearer token.
