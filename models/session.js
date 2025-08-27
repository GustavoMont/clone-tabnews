import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors";
import crypto from "node:crypto";

const EXPIRATION_IN_MILISECONDS = 60 * 60 * 24 * 30 * 1_000; // 30 Days

function calculateExpireAt() {
  return new Date(Date.now() + EXPIRATION_IN_MILISECONDS);
}

async function create(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = calculateExpireAt();
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

async function renew(sessionId) {
  const expiresAt = calculateExpireAt();
  const renewedSession = await runUpdateQuery(sessionId, expiresAt);

  return renewedSession;

  async function runUpdateQuery(sessionId, expiresAt) {
    const result = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId, expiresAt],
    });
    return result.rows[0];
  }
}

async function findOneValidByToken(sessionToken) {
  const sessionFound = await runSelect(sessionToken);

  return sessionFound;

  async function runSelect(sessionToken) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM
          sessions
        WHERE
          token = $1
        AND
          expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [sessionToken],
    });

    if (results.rowCount === 0) {
      throw new UnauthorizedError({
        action: "Verifique se este usuário está logado e tente novamente.",
        message: "Usuário não possui sessão ativa.",
      });
    }

    return results.rows[0];
  }
}

const session = {
  EXPIRATION_IN_MILISECONDS,
  create,
  findOneValidByToken,
  renew,
};

export default session;
