import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("⏭️  POSTGRES_URL not defined, skipping migrations");
    process.exit(0);
  }

  // Skip migrations during Vercel build or when SKIP_MIGRATIONS is set
  // Tables are managed via `pnpm db:push` locally
  if (process.env.VERCEL || process.env.SKIP_MIGRATIONS) {
    console.log("⏭️  Skipping migrations (use `pnpm db:push` to sync schema)");
    process.exit(0);
  }

  // Also skip if this is likely a production build (not explicit dev mode)
  if (process.env.NODE_ENV === "production") {
    console.log("⏭️  Skipping migrations in production build");
    process.exit(0);
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log("⏳ Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
