// Vercel Serverless Function — /api/generate
// This runs on Vercel's SERVER, not in the visitor's browser.
// The OpenAI key is read from an environment variable and never sent to the browser.

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Read the secret key from Vercel's environment variables (server-side only)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not set in Vercel environment variables.",
    });
  }

  try {
    // The browser sends the prompt; we forward it to OpenAI with the secret key
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt in request body." });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content:
              "You output only valid JSON. No markdown, no backticks, no commentary.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return res
        .status(openaiRes.status)
        .json({ error: "OpenAI error: " + errText.slice(0, 200) });
    }

    const data = await openaiRes.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Return only the generated text to the browser — never the key
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
