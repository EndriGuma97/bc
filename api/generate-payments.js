// api/generate-payment.js
const crypto = require("crypto");

module.exports = (req, res) => {
  // 1. Enable CORS (So your website can talk to this backend)
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // 2. Handle Browser Pre-check
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // 3. Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, name, email } = req.body;

    // Credentials from Vercel Settings
    const projectid = process.env.PAYSERA_PROJECT_ID;
    const sign_password = process.env.PAYSERA_PASSWORD;

    if (!projectid || !sign_password) {
      console.error("Missing Environment Variables");
      return res.status(500).json({ error: "Server Error: Missing Config" });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    const orderid = "BC-" + Date.now();
    const domain = "https://www.bitcryptics.online";

    const params = {
      projectid: projectid,
      orderid: orderid,
      accepturl: `${domain}/success.html`,
      cancelurl: `${domain}/payments.html`,
      version: "1.6",
      test: "0",
      p_firstname: name,
      p_email: email,
      amount: amountInCents,
      currency: "EUR",
      country: "AL",
      payment: "",
    };

    const queryString = new URLSearchParams(params).toString();
    const data = Buffer.from(queryString).toString("base64");
    const sign = crypto
      .createHash("md5")
      .update(data + sign_password)
      .digest("hex");

    const redirectUrl = `https://www.paysera.com/pay/?data=${data}&sign=${sign}`;

    res.status(200).json({ url: redirectUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
