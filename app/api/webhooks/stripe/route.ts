import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Disable body parsing - we need the raw body for webhook signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Initialize Supabase with service role key for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials not configured');
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, tier } = session.metadata || {};

        if (userId && tier) {
          // Update membership with Stripe details
          await supabase
            .from('memberships')
            .update({
              status: 'active',
              stripe_subscription_id: session.subscription as string,
              stripe_customer_id: session.customer as string,
            })
            .eq('user_id', userId);

          // Update user status to active
          await supabase
            .from('users')
            .update({ status: 'active' })
            .eq('id', userId);

          console.log(`Activated membership for user ${userId} with tier ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id and update status
        const { data: membership } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (membership) {
          const newStatus = subscription.status === 'active' ? 'active' :
                           subscription.status === 'past_due' ? 'past_due' :
                           'cancelled';

          await supabase
            .from('memberships')
            .update({ status: newStatus })
            .eq('user_id', membership.user_id);

          // If subscription is not active, update user status too
          if (newStatus !== 'active') {
            await supabase
              .from('users')
              .update({ status: newStatus })
              .eq('id', membership.user_id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user and cancel their membership
        const { data: membership } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (membership) {
          await supabase
            .from('memberships')
            .update({
              status: 'cancelled',
              end_date: new Date().toISOString(),
            })
            .eq('user_id', membership.user_id);

          await supabase
            .from('users')
            .update({ status: 'cancelled' })
            .eq('id', membership.user_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user and mark as past_due
        const { data: membership } = await supabase
          .from('memberships')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (membership) {
          await supabase
            .from('memberships')
            .update({ status: 'past_due' })
            .eq('user_id', membership.user_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
