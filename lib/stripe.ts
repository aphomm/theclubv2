import Stripe from 'stripe';

// Initialize Stripe with secret key
// In test mode, use test key; in production, use live key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Create Stripe instance only if key is available
// This allows the app to build without Stripe configured
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-10-29.clover' })
  : null;

// Tier pricing configuration
// When ready to go live, create these products/prices in Stripe Dashboard
// and update with real price IDs
export const TIER_PRICES: Record<string, {
  monthly: number;
  stripePriceId: string | null;
  name: string;
  description: string;
}> = {
  'Creator': {
    monthly: 500,
    stripePriceId: process.env.STRIPE_PRICE_CREATOR || null,
    name: 'Creator Membership',
    description: 'For emerging artists and producers',
  },
  'Professional': {
    monthly: 1200,
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL || null,
    name: 'Professional Membership',
    description: 'For established professionals - includes 10 studio hours/month',
  },
  'Executive': {
    monthly: 2500,
    stripePriceId: process.env.STRIPE_PRICE_EXECUTIVE || null,
    name: 'Executive Membership',
    description: 'For industry executives - includes 20 studio hours/month',
  },
};

// Check if Stripe is configured and ready for payments
export const isStripeConfigured = (): boolean => {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
};

// Check if payment should be bypassed (for testing)
// Set BYPASS_PAYMENT=true in .env.local to skip payment during development
export const shouldBypassPayment = (): boolean => {
  return process.env.BYPASS_PAYMENT === 'true';
};
