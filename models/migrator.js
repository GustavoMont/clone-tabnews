import migrationRunner from "node-pg-migrate";
import database from "infra/database";
import { resolve } from "node:path";
import { ServiceError } from "infra/errors";

async function migrate(options = {}) {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationOptions = {
      dryRun: true,
      dir: resolve("infra", "migrations"),
      direction: "up",
      log: () => {},
      migrationsTable: "pgmigrations",
      ...options,
      dbClient,
    };

    const pendingMigrations = await migrationRunner(migrationOptions);
    return pendingMigrations;
  } catch (error) {
    const serviceError = new ServiceError({
      message: "Erro ao rodar as migrações",
      cause: error,
    });
    throw serviceError;
  } finally {
    await dbClient?.end();
  }
}

async function listPendingMigrations() {
  return await migrate();
}

async function runPendingMigrations() {
  return await migrate({ dryRun: false });
}

const migrator = { listPendingMigrations, runPendingMigrations };

export default migrator;
