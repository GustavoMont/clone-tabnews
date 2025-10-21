import database from "infra/database.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";

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

async function findOneByUserId(userId) {
  const activationToken = await runSelectQuery(userId);
  return activationToken;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
      ;`,
      values: [userId],
    });
    return results.rows[0];
  }
}

const activation = {
  sendEmailToUser,
  create,
  findOneByUserId,
};

export default activation;
