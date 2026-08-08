import redisClient, { isRedisAvailable } from "../lib/redisClient";
import { Request, Response, NextFunction } from "express";

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  if (!isRedisAvailable()) {
    next();
    return;
  }

  const userIp = req.ip;
  const rateLimitKey = `rate-limit:${userIp}`;

  const limit = 100;
  const windowTime = 4 * 60;

  try {
    const requests = await redisClient.INCR(rateLimitKey);

    if (requests === 1) {
      await redisClient.EXPIRE(rateLimitKey, windowTime);
    }

    if (requests > limit) {
      res.status(429).json({
        message: "Too many requests, please try again",
      });
      return;
    }
  } catch (error) {
    console.log("error in rate limiter middleware", error);
  }

  next();
};

export default rateLimiter;
