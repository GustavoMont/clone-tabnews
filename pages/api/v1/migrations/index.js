import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database.js";

export default async function migrations(req, res) {
  const allowedMethos = ["GET", "POST"];
  if (!allowedMethos.includes(req.method)) {
    return res.status(405).end();
  }
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const defaultMigrationOptions = {
      dbClient,
      dryRun: true,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };
    if (req.method === "GET") {
      const pendingMigrations = await migrationRunner(defaultMigrationOptions);
      return res.status(200).json(pendingMigrations);
    }
    if (req.method === "POST") {
      const appliedMigrations = await migrationRunner({
        ...defaultMigrationOptions,
        dryRun: false,
      });
      const hasAppliedMigrations = appliedMigrations.length;
      return res
        .status(hasAppliedMigrations ? 201 : 200)
        .json(appliedMigrations);
    }
  } catch (error) {
    return res.status(500).end();
  } finally {
    await dbClient.end();
  }
}
