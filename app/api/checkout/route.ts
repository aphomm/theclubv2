import { NextRequest, NextResponse } from 'next/server';
import { stripe, TIER_PRICES, isStripeConfigured, shouldBypassPayment } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Verify the authenticated user matches the userId being checked out
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authUser || authUser.id !== userId || !authUser.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Charge for the tier on file, not whatever the client sends
    const { data: profile } = await authClient
      .from('users')
      .select('tier')
      .eq('id', userId)
      .maybeSingle();
    const tier = profile?.tier as string | undefined;
    const tierConfig = tier ? TIER_PRICES[tier] : undefined;
    if (!tier || !tierConfig) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }
    const email = authUser.email;

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
