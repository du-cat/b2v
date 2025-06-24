import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { initializeApp } from "npm:firebase-admin/app";
import { getMessaging } from "npm:firebase-admin/messaging";
import { cert } from "npm:firebase-admin/app";

// CORS headers for the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Initialize Firebase Admin SDK
// The service account key should be stored as a Supabase secret
// You'll need to add this via the Supabase dashboard
try {
  const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || "{}");
  
  initializeApp({
    credential: cert(serviceAccount),
  });
  
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the request body
    const { notification_id, user_id, token } = await req.json();

    if (!notification_id || !user_id || !token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: notification_id, user_id, token",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the notification from the database
    const { data: notification, error: notificationError } = await supabaseClient
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .eq("user_id", user_id)
      .single();

    if (notificationError || !notification) {
      return new Response(
        JSON.stringify({
          success: false,
          error: notificationError?.message || "Notification not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send the push notification using Firebase Cloud Messaging
    const message = {
      notification: {
        title: getSeverityTitle(notification.severity),
        body: notification.message,
      },
      data: {
        notification_id: notification.id,
        severity: notification.severity,
        created_at: notification.created_at,
        type: notification.type || "general",
        store_id: notification.store_id || "",
      },
      token: token,
    };

    const messaging = getMessaging();
    const response = await messaging.send(message);

    // Update the notification to mark it as sent
    await supabaseClient
      .from("notifications")
      .update({ push_sent: true })
      .eq("id", notification_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Push notification sent successfully",
        fcm_response: response,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending push notification:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to get a title based on severity
function getSeverityTitle(severity: string): string {
  switch (severity) {
    case "critical":
      return "🚨 Critical Security Alert";
    case "warning":
      return "⚠️ Security Warning";
    default:
      return "ℹ️ SentinelPOS Notification";
  }
}