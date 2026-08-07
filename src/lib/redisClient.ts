import { createClient } from "redis";

let isRedisConnected = false;

const redisClient = createClient({
  username: process.env.USER_NAME,
  password: process.env.REDIS_PASS,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT, 10)
      : undefined,
  },
});

redisClient.on('error', () => { isRedisConnected = false });
redisClient.on('connect', () => { isRedisConnected = true });

// For testing in developement
// const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis client error", err));

async function connectRedis() {
  try {
    await redisClient.connect();
    console.log("Redis connected");
  } catch (error) {
    console.error("Redis failed to connect, but the app is still running!");
  }
}

connectRedis();

export const isRedisAvailable = (): boolean => isRedisConnected;

export default redisClient;
