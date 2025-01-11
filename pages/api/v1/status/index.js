import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

async function status(req, res) {
  try {
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

    res.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          max_connections: parseInt(databaseMaxConnections),
          version: databaseVersion,
          opened_connections: databaseOpenedConnections,
        },
      },
    });
  } catch (error) {
    const publicError = new InternalServerError({ cause: error });
    console.log("\n Erro no controller");
    console.error(publicError);

    res.status(500).json(publicError);
  }
}

export default status;
