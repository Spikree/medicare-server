import { createClient } from "redis";

const redisClient = createClient({
  username: process.env.USER_NAME,
  password: process.env.REDIS_PASS,
  socket: {
    host: process.env.REDIS_HOST,
    port: 16147,
  },
});

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

export default redisClient;
