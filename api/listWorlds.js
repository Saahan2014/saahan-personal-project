// /api/listWorlds — returns every public world so anyone can browse them.
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  try {
    // Get all world ids from the index (newest first)
    const ids = (await kv.lrange("world_index", 0, 199)) || [];
    if (!ids.length) return res.status(200).json({ worlds: [] });

    // Fetch each world record
    const keys = ids.map((id) => "world:" + id);
    const records = await kv.mget(...keys);
    const worlds = records.filter(Boolean);

    return res.status(200).json({ worlds });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
