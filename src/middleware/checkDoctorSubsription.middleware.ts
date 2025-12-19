import { NextFunction, Request, Response } from "express";

const checkDoctorSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  if (user?.role === "patient") return next();

  const now = new Date();

  if (user?.role === "doctor") {
    if (user.subscription?.status === "active") return next();

    if (user.subscription?.status === "trialing") {
      if (user.subscription.trialEndsAt < now) {
        return res.status(300).json({
          message: "Trial period has ended, please update card info",
        });
      } else {
        return next();
      }
    }

    return res.status(300).json({
      message: "Subscription ended please update payment method",
    });
  }
  return res.status(401).json({
    message: "Unauthorized",
  });
};

export default checkDoctorSubscription;
