// /api/saveWorld — stores a generated world in Vercel KV so everyone can see it.
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { world } = req.body;
    if (!world || !world.name || !Array.isArray(world.portals)) {
      return res.status(400).json({ error: "Invalid world data." });
    }

    // Give it a short public id
    const id = "w_" + Math.random().toString(36).slice(2, 9);
    const record = {
      id,
      name: String(world.name).slice(0, 60),
      icon: String(world.icon || "🌍").slice(0, 8),
      desc: String(world.desc || "").slice(0, 200),
      portals: world.portals.slice(0, 8), // cap size
      created: Date.now(),
    };

    // Store the world itself
    await kv.set("world:" + id, record);
    // Add its id to the public index (a list of all world ids)
    await kv.lpush("world_index", id);
    // Keep the index from growing without bound (most recent 200)
    await kv.ltrim("world_index", 0, 199);

    return res.status(200).json({ id, world: record });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
