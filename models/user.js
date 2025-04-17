import database from "infra/database";
import { ValidationError } from "infra/errors.js";

async function create(userInputValues) {
  await validateUserEmail(userInputValues.email);
  await validateUsername(userInputValues.username);

  const newUser = await runInsertQuery(userInputValues);

  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
        INSERT INTO
          users
          (username, email, password)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
        ;
      `,
      values: [
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
      ],
    });

    return results.rows[0];
  }

  async function validateUserEmail(email) {
    const result = await database.query({
      text: `
        SELECT
          email
        FROM 
          users
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT 1
        ;
      `,
      values: [email],
    });
    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "E-mail já cadastrado no sistema.",
        action: "Cadastre um novo e-mail.",
      });
    }
  }
  async function validateUsername(username) {
    const result = await database.query({
      text: `
        SELECT
          username
        FROM 
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT 1
        ;
      `,
      values: [username],
    });
    if (result.rowCount > 0) {
      throw new ValidationError({
        message: "Username já cadastrado no sistema.",
        action: "Cadastre um novo username.",
      });
    }
  }
}

const user = { create };

export default user;
