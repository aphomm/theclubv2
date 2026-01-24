import { NextRequest, NextResponse } from 'next/server';
import { stripe, TIER_PRICES, isStripeConfigured, shouldBypassPayment } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, tier, email } = await request.json();

    if (!userId || !tier || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, tier, email' },
        { status: 400 }
      );
    }

    const tierConfig = TIER_PRICES[tier];
    if (!tierConfig) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // If payment bypass is enabled, skip Stripe and activate membership directly
    if (shouldBypassPayment()) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Update membership status to active
        await supabase
          .from('memberships')
          .update({ status: 'active' })
          .eq('user_id', userId);

        // Update user status to active
        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('id', userId);
      }

      return NextResponse.json({
        bypassed: true,
        message: 'Payment bypassed - membership activated'
      });
    }

    // Check if Stripe is configured
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.' },
        { status: 500 }
      );
    }

    // Check if we have a Stripe price ID for this tier
    if (!tierConfig.stripePriceId) {
      // Fall back to creating a one-time price if no subscription price exists
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: tierConfig.name,
                description: tierConfig.description,
              },
              unit_amount: tierConfig.monthly * 100, // Stripe uses cents
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          tier,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?tier=${tier}&cancelled=true`,
      });

      return NextResponse.json({ url: session.url });
    }

    // Use existing Stripe price ID
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: tierConfig.stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        tier,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?tier=${tier}&cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
