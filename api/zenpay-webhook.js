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

    return res.status(200).json({ verified: true });
  } catch (error) {
    console.error("Error verifying ZenPay webhook:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
