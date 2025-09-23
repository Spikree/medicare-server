import { createClient } from "redis";

// const redisClient = createClient({
//   username: "default",
//   password: process.env.REDIS_PASS,
//   socket: {
//     host: process.env.REDIS_HOST,
//     port: 16914,
//   },
// });

// For testing in developement
const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis client error", err));

async function connectRedis() {
  await redisClient.connect();
}

connectRedis();

export default redisClient;
