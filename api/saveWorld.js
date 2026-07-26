// /api/saveWorld — stores a generated world in Redis so everyone can see it.
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { world } = req.body;
    if (!world || !world.name || !Array.isArray(world.portals)) {
      return res.status(400).json({ error: "Invalid world data." });
    }

    const db = await getClient();

    // Give it a short public id
    const id = "w_" + Math.random().toString(36).slice(2, 9);
    const record = {
      id,
      name: String(world.name).slice(0, 60),
      icon: String(world.icon || "🌍").slice(0, 8),
      desc: String(world.desc || "").slice(0, 200),
      portals: world.portals.slice(0, 8),
      created: Date.now(),
    };

    // Store the world (as JSON string) and add its id to the public index
    await db.set("world:" + id, JSON.stringify(record));
    await db.lPush("world_index", id);
    await db.lTrim("world_index", 0, 199); // keep the most recent 200

    return res.status(200).json({ id, world: record });
  } catch (err) {
    return res.status(500).json({ error: String(err.message || err) });
  }
}
