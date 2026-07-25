// Vercel Serverless Function — /api/generate
// This runs on Vercel's SERVER, not in the visitor's browser.
// The Anthropic key is read from an environment variable and never sent to the browser.

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Read the secret key from Vercel's environment variables (server-side only)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY is not set in Vercel environment variables.",
    });
  }

  try {
    // The browser sends the prompt; we forward it to Anthropic with the secret key
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt in request body." });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 2000,
        system:
          "You output only valid JSON. No markdown, no backticks, no commentary.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return res
        .status(anthropicRes.status)
        .json({ error: "Anthropic error: " + errText.slice(0, 200) });
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || "";

    // Return only the generated text to the browser — never the key
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
