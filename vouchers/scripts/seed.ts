import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import Cafe from "../models/Cafe";
import { offersByCafe } from "../lib/offers";

async function main() {
  await connectDB();

  const slug = "kasa-cafe";
  const cfg = offersByCafe[slug];
  if (!cfg) throw new Error("Missing offers config for " + slug);

  const pinHash = cfg.pin ? await bcrypt.hash(cfg.pin, 10) : undefined;

  await Cafe.updateOne(
    { slug },
    { $set: { slug, name: cfg.name, ...(pinHash ? { pinHash } : {}) } },
    { upsert: true }
  );

  console.log("Seeded cafe:", slug);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});