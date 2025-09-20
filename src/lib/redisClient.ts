import { createClient } from "redis";

const redisClient = createClient()

redisClient.on("error", (err) => console.log("Redis client error", err));

async function connectRedis() {
  await redisClient.connect();
}

connectRedis();

export default redisClient;