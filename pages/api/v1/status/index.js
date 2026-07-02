import controller from "infra/controller.js";
import database from "infra/database.js";
import authorization from "models/authorization";
import { createRouter } from "next-connect";

const router = createRouter();

router.use(controller.injectAnonymousOrUser).get(getHandler);

export default router.handler(controller.erroHandlers);

async function getHandler(req, res) {
  const updatedAt = new Date().toISOString();
  const databaseMaxConnectionsQuery = await database.query(
    "SHOW max_connections;",
  );
  const databaseMaxConnections =
    databaseMaxConnectionsQuery.rows[0].max_connections;
  const databaseVersionQuery = await database.query("SHOW server_version;");
  const databaseVersion = databaseVersionQuery.rows[0].server_version;
  const databaseName = process.env.POSTGRES_DB;
  const databaseOpenedConnectionsQuery = await database.query({
    text: `SELECT COUNT(*)::int as opened_connections FROM pg_stat_activity WHERE datname = $1;`,
    values: [databaseName],
  });
  const databaseOpenedConnections =
    databaseOpenedConnectionsQuery.rows[0].opened_connections;

  const output = {
    updated_at: updatedAt,
    dependencies: {
      database: {
        max_connections: parseInt(databaseMaxConnections),
        version: databaseVersion,
        opened_connections: databaseOpenedConnections,
      },
    },
  };
  const userTryingToRequest = req.context.user;
  const secureOutputValues = authorization.filterOutput(
    userTryingToRequest,
    "read:database",
    output,
  );
  res.status(200).json(secureOutputValues);
}
