import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Represents a POS event payload.
 */
type EventPayload = {
  id: string;
  store_id: string;
  event_type: string;
  timestamp: string; // ISO format
  device_id: string;
  employee_id?: string;
  amount?: number;
  metadata?: Record<string, any>;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the incoming event
    const event: EventPayload = await req.json()
    
    // Validate required fields
    if (!event || !event.id || !event.store_id || !event.event_type || !event.timestamp || !event.device_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid event payload. Required fields: id, store_id, event_type, timestamp, device_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 1: Save the event to the events table
    const eventData = {
      id: event.id,
      store_id: event.store_id,
      device_id: event.device_id,
      event_type: event.event_type,
      severity: 'info', // Default severity, will be updated by rules if needed
      payload: {
        employee_id: event.employee_id,
        amount: event.amount,
        metadata: event.metadata,
        description: `${event.event_type} event from device ${event.device_id}`,
        ...event.metadata
      },
      captured_at: event.timestamp
    }

    const { data: savedEvent, error: saveError } = await supabaseClient
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (saveError) {
      // Handle duplicate ID error gracefully
      if (saveError.code === '23505') { // PostgreSQL unique violation
        console.log(`Event ${event.id} already exists, skipping save but proceeding with evaluation`)
        
        // Get the existing event for evaluation
        const { data: existingEvent, error: fetchError } = await supabaseClient
          .from('events')
          .select('*')
          .eq('id', event.id)
          .single()

        if (fetchError) {
          throw new Error(`Failed to fetch existing event: ${fetchError.message}`)
        }

        // Proceed with evaluation using existing event
        await evaluateEvent(event, supabaseClient)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            event_id: event.id,
            message: 'Event already exists, evaluation completed'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        throw new Error(`Failed to save event: ${saveError.message}`)
      }
    }

    console.log(`Event ${event.id} saved successfully`)

    // Step 2: Evaluate the event for rule violations
    await evaluateEvent(event, supabaseClient)

    // Step 3: Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: event.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[EVENT ERROR]:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Evaluates an event for suspicious activity based on defined rules.
 */
async function evaluateEvent(event: EventPayload, supabaseClient: any) {
  const eventTime = new Date(event.timestamp);

  // Check 1: Drawer opened without transaction within ±10 seconds
  if (event.event_type === 'drawer_open') {
    const fromTime = new Date(eventTime.getTime() - 10_000).toISOString();
    const toTime = new Date(eventTime.getTime() + 10_000).toISOString();

    const { data: txns, error } = await supabaseClient
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
        message: 'Drawer opened without a transaction within 10 seconds.',
        supabaseClient
      });
    }
  }

  // Check 2: High-value void transaction
  if (event.event_type === 'void' && event.amount && event.amount > 100) {
    await createAlert({
      event,
      rule: 'high_void',
      severity: 'suspicious',
      message: `Void transaction exceeds $100: $${event.amount}`,
      supabaseClient
    });
  }

  // Check 3: Manual price override
  if (event.event_type === 'price_override') {
    await createAlert({
      event,
      rule: 'manual_price_override',
      severity: 'warn',
      message: 'Manual price override detected.',
      supabaseClient
    });
  }

  // Check 4: Refund processed
  if (event.event_type === 'refund' && event.amount && event.amount > 50) {
    await createAlert({
      event,
      rule: 'large_refund',
      severity: 'warn',
      message: `Large refund issued: $${event.amount}`,
      supabaseClient
    });
  }

  // Check 5: Event after hours (between 11PM and 5AM)
  const hour = eventTime.getHours();
  if (hour >= 23 || hour < 5) {
    await createAlert({
      event,
      rule: 'after_hours_activity',
      severity: 'info',
      message: 'Event occurred outside of normal operating hours.',
      supabaseClient
    });
  }

  // Check 6: Multiple failed logins
  if (event.event_type === 'login_failure') {
    const oneHourAgo = new Date(eventTime.getTime() - 3600_000).toISOString();
    
    const { data: failedLogins, error } = await supabaseClient
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
        message: `Multiple failed login attempts detected: ${failedLogins.length} in the last hour.`,
        supabaseClient
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
        message: `High value transaction: $${event.amount}`,
        supabaseClient
      });
    }
    
    // Check for round number transactions (potential fraud indicator)
    if (event.amount % 100 === 0 && event.amount >= 500) {
      await createAlert({
        event,
        rule: 'round_number_transaction',
        severity: 'info',
        message: `Round number transaction detected: $${event.amount}`,
        supabaseClient
      });
    }
  }

  console.log(`Event evaluation completed for ${event.id}`)
}

/**
 * Creates an alert and stores it in the database.
 */
async function createAlert({ event, rule, severity, message, supabaseClient }: {
  event: EventPayload;
  rule: string;
  severity: 'info' | 'warn' | 'suspicious';
  message: string;
  supabaseClient: any;
}) {
  try {
    // First, update the event severity if it's more severe than current
    const severityOrder = { 'info': 1, 'warn': 2, 'suspicious': 3 };
    
    const { data: currentEvent, error: eventError } = await supabaseClient
      .from('events')
      .select('severity')
      .eq('id', event.id)
      .single();

    if (!eventError && currentEvent) {
      const currentSeverityLevel = severityOrder[currentEvent.severity as keyof typeof severityOrder] || 1;
      const newSeverityLevel = severityOrder[severity];
      
      if (newSeverityLevel > currentSeverityLevel) {
        await supabaseClient
          .from('events')
          .update({ 
            severity,
            payload: {
              ...currentEvent.payload,
              alert_rule: rule,
              alert_message: message
            }
          })
          .eq('id', event.id);
      }
    }

    // Get the event database ID
    const { data: eventData, error: fetchError } = await supabaseClient
      .from('events')
      .select('id')
      .eq('id', event.id)
      .single();

    if (fetchError || !eventData) {
      console.error(`[ALERT ERROR]: Could not find event in database for rule "${rule}"`, fetchError);
      return;
    }

    // Create the alert
    const { error: alertError } = await supabaseClient
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