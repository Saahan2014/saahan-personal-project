// /api/listWorlds — returns every public world so anyone can browse them.
import { createClient } from "redis";

let client;
async function getClient() {
  if (client && client.isOpen) return client;
  client = createClient({ url: process.env.REDIS_URL });
  client.on("error", () => {});
  await client.connect();
  return client;
}

export default async function handler(req, res) {
  try {
    const db = await getClient();

    // Get all world ids from the index (newest first)
    const ids = (await db.lRange("world_index", 0, 199)) || [];
    if (!ids.length) return res.status(200).json({ worlds: [] });

    // Fetch each world record
    const keys = ids.map((id) => "world:" + id);
    const raw = await db.mGet(keys);
    const worlds = raw
      .filter(Boolean)
      .map((s) => {
        try { return JSON.parse(s); } catch (e) { return null; }
      })
      .filter(Boolean);

    return res.status(200).json({ worlds });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
