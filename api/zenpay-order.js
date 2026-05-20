export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { amount, receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Missing required amount parameter" });
    }

    // Amount should be in paise
    const amountInPaise = Math.round(amount);

    const secretKey = process.env.ZENPAY_SECRET_KEY;
    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    console.log(`Creating ZenPay order for amount: ${amountInPaise} paise...`);

    const response = await fetch("https://zenwalletcore-engine-production.up.railway.app/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Idempotency-Key": idempotencyKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt || `rec-${Date.now()}`,
      }),
    });

    const data = await response.json();
    console.log("ZenPay Core Engine response status:", response.status, data);

    if (!response.ok || data.status !== "success") {
      return res.status(response.status === 200 ? 500 : (response.status || 500)).json({
        error: "Failed to create order on ZenPay Core Engine",
        details: data,
      });
    }

    // Return the order ID ("id" from the nested "data" object of the response)
    const orderId = data.data.id;
    return res.status(200).json({ orderId });
  } catch (error) {
    console.error("Error creating ZenPay order:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
