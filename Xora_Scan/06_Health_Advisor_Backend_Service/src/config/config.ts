//contain all the variables that are used in the project
import dotenv from "dotenv";

dotenv.config({
  path: [".env", "env"],
});

const config = {
  server: {
    port: Number(process.env.PORT) || 8081,
  },

  database: {
    url: process.env.DATABASE_URL as string,
  },

  redis: {
    url: process.env.REDIS_URL as string,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET as string,

    refreshSecret: process.env.JWT_REFRESH_SECRET as string,

    accessExpiry: process.env.JWT_ACCESS_EXPIRES_IN || "15m",

    refreshExpiry: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL,
    riskAssessmentWebhookUrl: process.env.N8N_RISK_ASSESSMENT_WEBHOOK_URL,
    riskAssessmentTimeoutMs:
      Number(process.env.N8N_RISK_ASSESSMENT_TIMEOUT_MS) || 120_000,
  },

  security: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  },
};

export default config;
