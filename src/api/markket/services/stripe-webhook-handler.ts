/**
 * Stripe webhook event handling service
 *
 * Processes Stripe webhook events with clear separation of concerns
 * Makes webhook handler more testable and maintainable
 *
 * @module services/stripe-webhook-handler
 */

import { deferredFeeRetrieval } from './stripe-fees-retriever';
import { sendOrderNotification, notifyStoreOfPurchase } from './notification';
import { getStripeClient } from './stripe';

interface CheckoutSessionData {
  paymentIntent: string;
  paymentLinkId: string;
  shipping: any;
  buyerEmail: string;
  isTest: boolean;
  sessionId: string;
}

interface OrderData {
  documentId: string;
  Amount: number;
  STRIPE_PAYMENT_ID: string;
  extra: Record<string, any>;
}

/**
 * Attempt to retrieve actual Stripe fees
 *
 * @async
 * @private
 * @param {CheckoutSessionData} session - Session data
 * @returns {Promise<Record<string, any> | null>} Fee object or null
 */
async function retrieveActualFees(session: CheckoutSessionData): Promise<Record<string, any> | null> {
  if (!session.paymentIntent) {
    return null;
  }

  try {
    const stripe = getStripeClient(session.isTest);
    if (!stripe) return null;

    const balanceTxns = await stripe.balanceTransactions.list({
      source: session.paymentIntent,
      limit: 1,
    });

    if (balanceTxns.data && balanceTxns.data.length > 0) {
      const txn = balanceTxns.data[0];
      return {
        fees_cents: txn.fee,
        fees_usd: (txn.fee / 100).toFixed(2),
        net_cents: txn.net,
        net_usd: (txn.net / 100).toFixed(2),
      };
    }
  } catch (error) {
    console.error('[WEBHOOK_HANDLER] Fee retrieval failed:', error?.message);
  }

  return null;
}

/**
 * Build order from Stripe session data
 *
 * @private
 * @param {any} session - Stripe session object
 * @param {CheckoutSessionData} sessionData - Processed session data
 * @param {Record<string, any>} actualStripeFees - Actual fees or null
 * @returns {Object} Order data ready for creation
 */
function buildOrderData(
  session: any,
  sessionData: CheckoutSessionData,
  actualStripeFees: Record<string, any> | null,
  Status: string,
): any {
  return {
    data: {
      stripe_payment_id: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase() || 'USD',
      status: Status || 'paid',
      store: session.metadata?.store_id || null,
      shipping_Address: {
        name: sessionData.shipping?.name || session.customer_details?.name,
        email: sessionData.buyerEmail,
        street: sessionData.shipping?.address?.line1 || sessionData.shipping?.line1,
        street_2: sessionData.shipping?.address?.line2 || sessionData.shipping?.line2,
        city: sessionData.shipping?.address?.city || sessionData.shipping?.city,
        state: sessionData.shipping?.address?.state || sessionData.shipping?.state,
        zipcode: sessionData.shipping?.address?.postal_code || sessionData.shipping?.postal_code,
        country: sessionData.shipping?.address?.country || sessionData.shipping?.country,
      },
      payment_attempts: [{
        timestampt: new Date(),
        buyer_email: sessionData.buyerEmail,
        status: 'Succeeded',
        reason: '',
        session_id: session.id,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency?.toUpperCase() || 'USD'
      }],
      details: session.line_items?.data?.map((item: any) => ({
        price: (item.amount_total || 0) / 100,
        product: item.price?.product || null,
        quantity: item.quantity || 1,
        name: item.description || item.price?.product?.name || '',
        metadata: item.price?.metadata || {}
      })) || [],
      extra: {
        stripe_session_id: session.id,
        stripe_payment_link: sessionData.paymentLinkId,
        stripe_payment_intent: sessionData.paymentIntent,
        stripe_customer: session.customer,
        stripe_customer_details: session.customer_details,
        stripe_payment_status: session.payment_status,
        stripe_mode: session.mode,
        created_from: 'webhook_fallback',
        created_at: new Date().toISOString(),
        is_test: session.id.startsWith('cs_test_'),
        session_metadata: session.metadata || {},
        stripe_actual_fees: actualStripeFees,
      }
    }
  };
}

/**
 * Handle Stripe checkout.session.completed webhook
 *
 * Main entry point for processing completed checkout sessions
 *
 * @async
 * @param {any} session - Stripe session from event
 * @param {boolean} isTest - Whether this is a test mode session
 * @returns {Promise<OrderData>} Updated order data
 */
export async function handleCheckoutSessionCompleted(
  session: any,
  isTest: boolean
): Promise<OrderData> {
  const sessionData: CheckoutSessionData = {
    paymentIntent: session.payment_intent,
    paymentLinkId: session.payment_link,
    shipping: session.shipping_details || session.customer_details || session?.shipping,
    buyerEmail: session.customer_details?.email,
    isTest,
    sessionId: session.id,
  };

  // Attempt immediate fee retrieval
  const actualStripeFees = await retrieveActualFees(sessionData);

  // Find existing order by payment link
  let order = sessionData.paymentLinkId ? await strapi.db.query('api::order.order').findOne({
    where: { stripe_payment_id: sessionData.paymentLinkId },
    populate: ['store.users', 'store.settings', 'shipping_Address', 'buyer', 'details', 'payment_attempts']
  }) : null;

  if (!order) {
    console.log('[WEBHOOK_HANDLER] Creating new order from session');
    const orderData = buildOrderData(session, sessionData, actualStripeFees, 'paid');
    order = await strapi.service('api::order.order').create(orderData);
  } else {
    console.log('[WEBHOOK_HANDLER] Updating existing order');

    const prevAttempts = Array.isArray(order.Payment_attempts) ? order.Payment_attempts : [];
    const newAttempt = {
      timestampt: new Date(),
      buyer_email: sessionData.buyerEmail,
      status: 'Succeeded',
      reason: '',
      session_id: session.id,
    };

    order = await strapi.service('api::order.order').update(order.documentId, {
      populate: ['shipping_address', 'store', 'Details'],
      data: {
        status: 'paid',
        payment_attempts: [...prevAttempts, newAttempt],
        shipping_Address: {
          name: sessionData.shipping?.name || session.customer_details?.name || order.shipping_address?.name,
          email: sessionData.buyerEmail || order.shipping_address?.email,
          street: sessionData.shipping?.address?.line1 || sessionData.shipping?.line1,
          street_2: sessionData.shipping?.address?.line2 || sessionData.shipping?.line2,
          city: sessionData.shipping?.address?.city || sessionData.shipping?.city,
          state: sessionData.shipping?.address?.state || sessionData.shipping?.state,
          zipcode: sessionData.shipping?.address?.postal_code || sessionData.shipping?.postal_code,
          country: sessionData.shipping?.address?.country || sessionData.shipping?.country,
        },
        extra: {
          ...(order.extra as Record<string, any>),
          stripe_session_id: session.id,
          stripe_payment_intent: sessionData.paymentIntent,
          stripe_actual_fees: actualStripeFees,
        },
      }
    });
  }

  // Schedule deferred fee retrieval if needed
  if (sessionData.paymentIntent && !actualStripeFees) {
    deferredFeeRetrieval(
      order.documentId,
      sessionData.paymentIntent,
      isTest,
      2000
    );
  }

  // Notify store of purchase
  if (order?.store?.documentId) {
    const storeUsers = order?.store?.users || [];
    const emails = new Set(storeUsers.filter((user: any) => user.confirmed).map((user: any) => user.email));
    const storeSettingsEmail = order.store?.settings?.support_email || order.store?.settings?.reply_to_email;

    if (storeSettingsEmail) {
      emails.add(storeSettingsEmail);
    }

    if (emails.size > 0) {
      // ✅ FIXED: Cast Set to string array
      await notifyStoreOfPurchase({
        strapi,
        order,
        emails: Array.from(emails) as string[],
        store: order.store as any
      });
    }
  }

  // Send order notification to buyer
  await sendOrderNotification({ strapi, order, store: order.store });

  return order;
}
