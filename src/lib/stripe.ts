import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key
  ? new Stripe(key, {
      typescript: true,
    })
  : null;

export function requireStripe() {
  if (!stripe) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
  }
  return stripe;
}
