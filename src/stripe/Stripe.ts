import Stripe from "stripe";

const calculateTax = false;
const stripe = new Stripe("stripe test key", {
  typescript: true,
});

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

const createPaymentIntent = async ({
  currency,
  paymentMethodType,
  paymentMethodOptions,
  customerId,
}: {
  currency: string;
  paymentMethodType: string;
  paymentMethodOptions?: object;
  customerId: string;
}) => {
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
      customerId || (await stripe.customers.create().then((data) => data.id));

    if (paymentMethodOptions) {
      params.payment_method_options = paymentMethodOptions;
    }

    try {
      const paymentIntent: Stripe.PaymentIntent =
        await stripe.paymentIntents.create(params);

      return {
        clientSecret: paymentIntent.client_secret,
        nextAction: paymentIntent.next_action,
      };
    } catch (e: any) {
      throw new Error(e.message);
    }
  }
};
