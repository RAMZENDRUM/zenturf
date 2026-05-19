import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const signature = req.headers["x-zenpay-signature"];
    const timestamp = req.headers["x-zenpay-timestamp"];

    if (!signature || !timestamp) {
      console.error("Missing webhook headers:", { signature, timestamp });
      return res.status(400).json({ error: "Missing ZenPay signature or timestamp headers" });
    }

    const webhookSecret = process.env.ZENPAY_WEBHOOK_SECRET || "whsec_zenpay";
    
    // Construct the payload exact string
    const bodyStr = JSON.stringify(req.body);
    const signaturePayload = `${timestamp}.${bodyStr}`;

    const computedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signaturePayload)
      .digest("hex");

    if (computedSignature !== signature) {
      console.error("ZenPay webhook signature mismatch:", {
        received: signature,
        computed: computedSignature,
      });
      return res.status(400).json({ error: "Signature mismatch" });
    }

    console.log("ZenPay webhook signature verified successfully!");
    console.log("Webhook payload:", req.body);

    // Fulfill the booking if payment was successful
    if (req.body.type === "payment.captured" || req.body.event === "payment.captured") {
      const orderId = req.body.data?.order_id || req.body.order_id;
      const paymentId = req.body.data?.id || req.body.payment_id;

      if (orderId) {
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { error } = await supabase
            .from("zenturf_bookings_v2")
            .update({
              payment_status: "paid",
              status: "confirmed",
              payment_id: paymentId || `ZP-WH-${Date.now()}`
            })
            .eq("zenpay_order_id", orderId);
            
          if (error) {
            console.error("Webhook Supabase Update Error:", error);
          } else {
            console.log(`Successfully fulfilled bookings for order_id: ${orderId}`);
          }
        } else {
          console.error("Missing Supabase credentials in webhook environment");
        }
      }
    }

    return res.status(200).json({ verified: true });
  } catch (error) {
    console.error("Error verifying ZenPay webhook:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
