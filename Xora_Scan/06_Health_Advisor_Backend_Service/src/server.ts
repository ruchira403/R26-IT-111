import app from "./app";
import config from "./config/config";
import { connectRedis } from "./config/redis";
import { connectDatabase } from "./config/database";

async function bootstrap() {
  try {
    console.log("🔄 Starting Health Advisor Auth Service...");

    await connectRedis();
    await connectDatabase();

    app.listen(config.server.port, () => {
      console.log(`🚀 Health Advisor Auth Service running on port ${config.server.port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start Health Advisor Auth Service:", error);

    process.exit(1);
  }
}

bootstrap();
