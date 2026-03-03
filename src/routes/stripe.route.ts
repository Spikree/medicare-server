import express from "express";
import verifyToken from "../middleware/verifytoken.middleware";
import checkDoctorRole from "../middleware/checkdoctor.middleware";

import env from "dotenv";
import path from "path";
env.config({ path: "./.env" });
const resolve = path.resolve;

import bodyParser from "body-parser";

const router = express.Router();

import Stripe from "stripe";

const calculateTax = false;
const stripe = new Stripe(
  "sk_test_51PV697Rqw2rIoaiH6m45bAM5Cb1NkF296Fj6kbhUFKRMjrZ4GNdFPX0hXAxnOKW5ituX2FqMN7aGMcB6puJClSgn00SCfaYHm0",
  {
    typescript: true,
  },
);

const calculate_tax = async (orderAmount: number, currency: string) => {
  const taxCalculation = await stripe.tax.calculations.create({
    currency,
    customer_details: {
      address: {
        line1: "10709 Cleary Blvd",
        city: "Plantation",
        state: "FL",
        postal_code: "33322",
        country: "US",
      },
      address_source: "shipping",
    },
    line_items: [
      {
        amount: orderAmount,
        reference: "ProductRef",
        tax_behavior: "exclusive",
        tax_code: "txcd_30011000",
      },
    ],
  });

  return taxCalculation;
};

router.post(
  "/create-payment-intent",
  express.json(),
  async (req: express.Request, res: express.Response): Promise<void> => {
    const {
      currency,
      paymentMethodType,
      paymentMethodOptions,
    }: {
      currency: string;
      paymentMethodType: string;
      paymentMethodOptions?: object;
    } = req.body;

    let orderAmount = 5999;
    let params: Stripe.PaymentIntentCreateParams;

    if (calculateTax) {
      let taxCalculation = await calculate_tax(orderAmount, currency);
      params = {
        payment_method_types:
          paymentMethodType === "link" ? ["link", "card"] : [paymentMethodType],
        amount: taxCalculation.amount_total,
        currency: currency,
        metadata: { tax_calculation: taxCalculation.id },
      };
    } else {
      params = {
        payment_method_types:
          paymentMethodType === "link" ? ["link", "card"] : [paymentMethodType],
        amount: orderAmount,
        currency: currency,
      };
    }

    // If this is for an ACSS payment, we add payment_method_options to create
    // the Mandate.
    if (paymentMethodType === "acss_debit") {
      params.payment_method_options = {
        acss_debit: {
          mandate_options: {
            payment_schedule: "sporadic",
            transaction_type: "personal",
          },
        },
      };
    } else if (paymentMethodType === "customer_balance") {
      params.payment_method_data = {
        type: "customer_balance",
      } as any;
      params.confirm = true;
      params.customer =
        req.body.customerId ||
        (await stripe.customers.create().then((data) => data.id));
    }

    /**
     * If API given this data, we can overwride it
     */
    if (paymentMethodOptions) {
      params.payment_method_options = paymentMethodOptions;
    }

    try {
      const paymentIntent: Stripe.PaymentIntent =
        await stripe.paymentIntents.create(params);

      // Send publishable key and PaymentIntent client_secret to client.
      res.send({
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action,
      });
    } catch (e: any) {
      res.status(400).send({
        error: {
          message: e.message,
        },
      });
    }
  },
);

// router.get("/payment/next", async (req, res) => {
//   const paymentIntent: any = req.query.payment_intent;
//   const intent = await stripe.paymentIntents.retrieve(paymentIntent, {
//     expand: ["payment_method"],
//   });

//   res.redirect(
//     `/stripe/success?payment_intent_client_secret=${intent.client_secret}`,
//   );
// });

// router.get("/success", async (req, res) => {
//   const path = resolve(process.env.STATIC_DIR + "/success.html");
//   res.sendFile(path);
// });

router.post(
  "/webhook",
  // Use body-parser to retrieve the raw body as a buffer.
  bodyParser.raw({ type: "application/json" }),
  async (req: express.Request, res: express.Response): Promise<void> => {
    // Retrieve the event by verifying the signature using the raw body and secret.
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
      console.log(`⚠️  Webhook signature verification failed.`);
      res.sendStatus(400);
      return;
    }

    const data: Stripe.Event.Data = event.data;
    const eventType: string = event.type;

    if (eventType === "payment_intent.succeeded") {
      const pi: Stripe.PaymentIntent = data.object as Stripe.PaymentIntent;
      console.log(`🔔  Webhook received: ${pi.object} ${pi.status}!`);
      console.log("💰 Payment captured!");
    } else if (eventType === "payment_intent.payment_failed") {
      const pi: Stripe.PaymentIntent = data.object as Stripe.PaymentIntent;
      console.log(`🔔  Webhook received: ${pi.object} ${pi.status}!`);
      console.log("❌ Payment failed.");
    }
    res.sendStatus(200);
  },
);

export default router;
