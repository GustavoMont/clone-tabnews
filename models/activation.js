import database from "infra/database.js";
import email from "infra/email.js";
import { NotFoundError } from "infra/errors.js";
import webserver from "infra/webserver.js";
import user from "./user.js";

const EXPIRATION_IN_MILISECONDS = 60 * 60 * 15; // 15 minutos

async function sendEmailToUser(user, activationToken) {
  await email.send({
    to: user.email,
    from: "MusicNews <contato@musicnews.com.br>",
    subject: "Ative seu cadastro no MusicNews!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro
    
${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosament,
Equipe MusicNews
    `,
  });
}

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILISECONDS);
  const activationToken = await runInsertQuery(userId, expiresAt);

  return activationToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO
      user_activation_tokens
        (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
      ;`,
      values: [userId, expiresAt],
    });
    return results.rows[0];
  }
}

async function findOneValidById(tokenId) {
  const activationToken = await runSelectQuery(tokenId);

  return activationToken;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT 
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
        AND
          expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [tokenId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        action:
          "Verifique se o token de ativação ainda é válido ou tente um novo cadastro.",
        message: "Usuário não possui token de ativação válido.",
      });
    }

    return results.rows[0];
  }
}

async function markTokenAsUsed(tokenId) {
  const usedToken = await runUpdateQuery(tokenId);
  return usedToken;

  async function runUpdateQuery(tokenId) {
    const results = await database.query({
      text: `
      UPDATE
        user_activation_tokens
      SET 
        used_at = timezone('utc', NOW())
      WHERE
        id = $1
      RETURNING
        *
      ;`,
      values: [tokenId],
    });
    if (results.rowCount === 0) {
      throw new NotFoundError({
        action:
          "Verifique se o token de ativação ainda é válido ou tente um novo cadastro.",
        message: "Usuário não possui token de ativação válido.",
      });
    }
    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, [
    "create:session",
    "read:session",
  ]);
  return activatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  findOneValidById,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;
