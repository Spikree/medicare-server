import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import checkDoctorRole from "../middleware/checkdoctor.middleware";
import User from "../models/user.model"; // ⚠️ Adjust this path to your Mongoose model

import env from "dotenv";
import path from "path";
env.config({ path: "./.env" });
const resolve = path.resolve;

import bodyParser from "body-parser";
import Stripe from "stripe";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_BACKEND_SECRET || "test", {
  apiVersion: "2023-10-16",
});

// ============================================================================
// 1. CREATE SUBSCRIPTION (WITH CONDITIONAL FREE TRIAL)
// ============================================================================
router.post(
  "/create-subscription",
  express.json(),
  // verifyToken,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { email, name, priceId, paymentMethodId } = req.body;

      const user = await User.findOne({ email: email });
      if (!user) {
        throw new Error("User not found in database.");
      }

      // they've successfully completed this process before.
      let hasHadTrial = false;
      if (
        user.subscription &&
        user.subscription.status &&
        user.subscription.status !== "incomplete"
      ) {
        hasHadTrial = true;
      }

      let customerId = req.body.customerId || user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: email,
          name: name,
          ...(paymentMethodId && { payment_method: paymentMethodId }),
        });
        customerId = customer.id;
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

      // Only add the trial if they've never had one
      if (!hasHadTrial) {
        subscriptionParams.trial_period_days = 7;
      }

      const subscription =
        await stripe.subscriptions.create(subscriptionParams);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent =
        invoice?.payment_intent as Stripe.PaymentIntent | null;
      const setupIntent =
        subscription?.pending_setup_intent as Stripe.SetupIntent | null;

      const clientSecret =
        paymentIntent?.client_secret || setupIntent?.client_secret;

      if (!clientSecret) {
        throw new Error("Could not retrieve the client secret from Stripe.");
      }

      // Save the Stripe Customer ID
      await User.findOneAndUpdate(
        { email: email },
        { $set: { stripeCustomerId: customerId } },
        { new: true },
      );

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

// ============================================================================
// 2. STRIPE WEBHOOK (DATABASE SYNC)
// ============================================================================
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req: express.Request, res: express.Response): Promise<void> => {
    let event: Stripe.Event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("No Webhook secret provided");
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"] as string,
        webhookSecret,
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`);
      res.sendStatus(400);
      return;
    }

    const data: Stripe.Event.Data = event.data;
    const eventType: string = event.type;

    switch (eventType) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = data.object as Stripe.Subscription;

        const stripeCustomerId = subscription.customer as string;
        const status = subscription.status;

        // Stop execution if they haven't actually entered a payment method yet!
        if (
          status === "incomplete" ||
          status === "incomplete_expired" ||
          (status === "trialing" && !subscription.default_payment_method)
        ) {
          console.log(
            `⏳ User is at checkout (Status: ${status}). Waiting for card...`,
          );
          break;
        }

        const currentPeriodEnd = new Date(
          subscription.current_period_end * 1000,
        );
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : undefined;

        console.log(`Officially ${status} for customer ${stripeCustomerId}`);

        await User.findOneAndUpdate(
          { stripeCustomerId: stripeCustomerId },
          {
            $set: {
              stripeSubscriptionId: subscription.id,
              "subscription.status": status,
              "subscription.plan": "premium",
              "subscription.billingCycleEndsAt": currentPeriodEnd,
              ...(trialEnd && { "subscription.trialEndsAt": trialEnd }),
            },
          },
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscriptionDeleted = data.object as Stripe.Subscription;
        const stripeCustomerId = subscriptionDeleted.customer as string;

        console.log(`Subscription canceled for customer ${stripeCustomerId}`);

        await User.findOneAndUpdate(
          { stripeCustomerId: stripeCustomerId },
          {
            $set: {
              "subscription.status": "canceled",
            },
          },
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoiceFailed = data.object as Stripe.Invoice;
        const stripeCustomerId = invoiceFailed.customer as string;

        console.log(`❌ Payment failed for customer ${stripeCustomerId}`);

        await User.findOneAndUpdate(
          { stripeCustomerId: stripeCustomerId },
          {
            $set: {
              "subscription.status": "past_due",
            },
          },
        );
        break;
      }

      default:
        break;
    }

    res.sendStatus(200);
  },
);

export default router;
