import redisClient from "../lib/redisClient";
import { Request, Response, NextFunction } from "express";

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const userIp = req.ip;
  const currentTime = Date.now();
  const rateLimitKey = `rate-limit:${userIp}`;

  const limit = 100;
  const windowTime = 4 * 60;

  const requests = await redisClient.INCR(rateLimitKey);

  if (requests === 1) {
    await redisClient.EXPIRE(rateLimitKey, windowTime);
  }

  if (requests > limit) {
    return res.status(429).json({
      message: "Too many requests, please try again",
    });
  }

  next();
};

export default rateLimiter;
