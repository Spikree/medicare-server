import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import checkDoctorRole from "../middleware/checkdoctor.middleware";
import User from "../models/user.model";

import env from "dotenv";
import path from "path";
env.config({ path: "./.env" });

import bodyParser from "body-parser";
import Stripe from "stripe";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_BACKEND_SECRET || "test", {
  apiVersion: "2026-02-25.clover",
});

const getPeriodEnd = (subscription: any): Date | undefined => {
  const raw =
    subscription?.items?.data?.[0]?.current_period_end ??
    subscription?.current_period_end;
  return raw ? new Date(raw * 1000) : undefined;
};

router.post(
  "/create-subscription",
  express.json(),
  verifyToken,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { priceId, paymentMethodId } = req.body;

      const userId = req?.user?._id;
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found in database.");
      }

      let hasHadTrial = Boolean(user.stripeSubscriptionId);

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          ...(paymentMethodId && { payment_method: paymentMethodId }),
        });
        customerId = customer.id;

        await User.findByIdAndUpdate(user._id, {
          $set: { stripeCustomerId: customerId },
        });
      }

      if (paymentMethodId) {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
      };

      if (!hasHadTrial) {
        subscriptionParams.trial_period_days = 7;
      }

      const subscription =
        await stripe.subscriptions.create(subscriptionParams);

      const invoice = subscription.latest_invoice as any;
      const paymentIntent =
        invoice?.payment_intent as Stripe.PaymentIntent | null;
      const setupIntent =
        subscription?.pending_setup_intent as Stripe.SetupIntent | null;

      const clientSecret =
        paymentIntent?.client_secret || setupIntent?.client_secret;

      if (!clientSecret) {
        throw new Error("Could not retrieve the client secret from Stripe.");
      }

      res.send({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        customerId: customerId,
        hasHadTrial: hasHadTrial,
      });
    } catch (error: any) {
      console.error("Stripe Checkout Error:", error);
      res.status(400).send({
        error: {
          message: error.message,
        },
      });
    }
  },
);

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req: express.Request, res: express.Response): Promise<void> => {
    let event: Stripe.Event;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("No webhook secret provided");
      res.sendStatus(500);
      return;
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"] as string,
        webhookSecret,
      );
    } catch (err) {
      console.log("Webhook signature verification failed.");
      res.sendStatus(400);
      return;
    }

    try {
      const data: Stripe.Event.Data = event.data;
      const eventType: string = event.type;

      switch (eventType) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = data.object as any;

          const stripeCustomerId = subscription.customer as string;
          const status = subscription.status;

          if (status === "incomplete" || status === "incomplete_expired") {
            break;
          }

          const currentPeriodEnd = getPeriodEnd(subscription);
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : undefined;

          await User.findOneAndUpdate(
            { stripeCustomerId: stripeCustomerId },
            {
              $set: {
                stripeSubscriptionId: subscription.id,
                "subscription.status": status,
                "subscription.plan":
                  status === "active" || status === "trialing"
                    ? "premium"
                    : "basic",
                ...(currentPeriodEnd && {
                  "subscription.billingCycleEndsAt": currentPeriodEnd,
                }),
                ...(trialEnd && { "subscription.trialEndsAt": trialEnd }),
              },
            },
          );
          break;
        }

        case "customer.subscription.deleted": {
          const subscriptionDeleted = data.object as Stripe.Subscription;
          const stripeCustomerId = subscriptionDeleted.customer as string;

          await User.findOneAndUpdate(
            { stripeCustomerId: stripeCustomerId },
            {
              $set: {
                "subscription.status": "canceled",
                "subscription.plan": "basic",
              },
            },
          );
          break;
        }

        case "invoice.payment_failed": {
          const invoiceFailed = data.object as Stripe.Invoice;
          const stripeCustomerId = invoiceFailed.customer as string;

          await User.findOneAndUpdate(
            { stripeCustomerId: stripeCustomerId },
            {
              $set: { "subscription.status": "past_due" },
            },
          );
          break;
        }

        default:
          break;
      }

      res.sendStatus(200);
    } catch (error: any) {
      console.error("Webhook handler error", error);
      res.sendStatus(500);
    }
  },
);

export default router;
