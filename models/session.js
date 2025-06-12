import database from "infra/database.js";
import crypto from "node:crypto";

const EXPIRATION_IN_MILISECONDS = 60 * 60 * 24 * 30 * 1_000; // 30 Days

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);
  const newSession = await runIsertQuery(token, userId, expiresAt);
  return newSession;

  async function runIsertQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      ;`,
      values: [token, userId, expiresAt],
    });
    return results.rows[0];
  }
}

const session = { EXPIRATION_IN_MILISECONDS, create };

export default session;
