import { supabase } from './supabase';

/**
 * Represents a POS event payload.
 */
export type EventPayload = {
  id: string;
  store_id: string;
  event_type: string;
  timestamp: string; // ISO format
  device_id: string;
  employee_id?: string;
  amount?: number;
  metadata?: Record<string, any>;
};

/**
 * Evaluates an event for suspicious activity based on defined rules.
 */
export async function evaluateEvent(event: EventPayload) {
  const eventTime = new Date(event.timestamp);

  // Check 1: Drawer opened without transaction within ±10 seconds
  if (event.event_type === 'drawer_open') {
    const fromTime = new Date(eventTime.getTime() - 10_000).toISOString();
    const toTime = new Date(eventTime.getTime() + 10_000).toISOString();

    const { data: txns, error } = await supabase
      .from('events')
      .select('id')
      .eq('store_id', event.store_id)
      .eq('event_type', 'transaction')
      .gte('captured_at', fromTime)
      .lte('captured_at', toTime);

    if (error) {
      console.error('Error checking for transactions:', error);
      return;
    }

    if (!txns?.length) {
      await createAlert({
        event,
        rule: 'drawer_open_no_transaction',
        severity: 'warn',
        message: 'Drawer opened without a transaction within 10 seconds.'
      });
    }
  }

  // Check 2: High-value void transaction
  if (event.event_type === 'void' && event.amount && event.amount > 100) {
    await createAlert({
      event,
      rule: 'high_void',
      severity: 'suspicious',
      message: `Void transaction exceeds $100: $${event.amount}`
    });
  }

  // Check 3: Manual price override
  if (event.event_type === 'price_override') {
    await createAlert({
      event,
      rule: 'manual_price_override',
      severity: 'warn',
      message: 'Manual price override detected.'
    });
  }

  // Check 4: Refund processed
  if (event.event_type === 'refund' && event.amount && event.amount > 50) {
    await createAlert({
      event,
      rule: 'large_refund',
      severity: 'warn',
      message: `Large refund issued: $${event.amount}`
    });
  }

  // Check 5: Event after hours (between 11PM and 5AM)
  const hour = eventTime.getHours();
  if (hour >= 23 || hour < 5) {
    await createAlert({
      event,
      rule: 'after_hours_activity',
      severity: 'info',
      message: 'Event occurred outside of normal operating hours.'
    });
  }

  // Check 6: Multiple failed logins
  if (event.event_type === 'login_failure') {
    const oneHourAgo = new Date(eventTime.getTime() - 3600_000).toISOString();
    
    const { data: failedLogins, error } = await supabase
      .from('events')
      .select('id')
      .eq('store_id', event.store_id)
      .eq('event_type', 'login_failure')
      .gte('captured_at', oneHourAgo);

    if (error) {
      console.error('Error checking for failed logins:', error);
      return;
    }

    if (failedLogins && failedLogins.length >= 3) {
      await createAlert({
        event,
        rule: 'multiple_failed_logins',
        severity: 'suspicious',
        message: `Multiple failed login attempts detected: ${failedLogins.length} in the last hour.`
      });
    }
  }

  // Check 7: Unusual transaction amounts
  if (event.event_type === 'transaction' && event.amount) {
    if (event.amount > 1000) {
      await createAlert({
        event,
        rule: 'high_value_transaction',
        severity: 'warn',
        message: `High value transaction: $${event.amount}`
      });
    }
    
    // Check for round number transactions (potential fraud indicator)
    if (event.amount % 100 === 0 && event.amount >= 500) {
      await createAlert({
        event,
        rule: 'round_number_transaction',
        severity: 'info',
        message: `Round number transaction detected: $${event.amount}`
      });
    }
  }
}

/**
 * Creates an alert and stores it in the database.
 */
async function createAlert({ event, rule, severity, message }: {
  event: EventPayload;
  rule: string;
  severity: 'info' | 'warn' | 'suspicious';
  message: string;
}) {
  try {
    // First, get the event ID from our events table
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('store_id', event.store_id)
      .eq('event_type', event.event_type)
      .eq('captured_at', event.timestamp)
      .single();

    if (eventError || !eventData) {
      console.error(`[ALERT ERROR]: Could not find event in database for rule "${rule}"`, eventError);
      return;
    }

    // Create the alert
    const { error: alertError } = await supabase
      .from('alerts')
      .insert({
        event_id: eventData.id,
        channels: ['email', 'push'], // Default alert channels
      });

    if (alertError) {
      console.error(`[ALERT ERROR]: Failed to insert alert for rule "${rule}"`, alertError);
    } else {
      console.log(`[ALERT CREATED]: Rule "${rule}" triggered for event ${event.id}`);
    }
  } catch (error) {
    console.error(`[ALERT ERROR]: Unexpected error creating alert for rule "${rule}"`, error);
  }
}