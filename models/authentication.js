import user from "models/user.js";
import password from "models/password";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        cause: error,
        message: "Dados de autenticação não conferem",
        action: "Verifique se os dados de autenticação estão corretos",
      });
    }
    throw error;
  }

  async function findUserByEmail(providedEmail) {
    try {
      return await user.findOneByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          cause: error,
          message: "E-mail incorreto",
          action: "Confira de o e-mail foi digitado corretamente.",
        });
      }
      throw error;
    }
  }

  async function validatePassword(providedPassword, storedUser) {
    const isPasswordCorrect = await password.compare(
      providedPassword,
      storedUser,
    );
    if (!isPasswordCorrect) {
      throw new UnauthorizedError({
        message: "Senha incorreta.",
        action: "Confira se a senha foi digitada corretamente",
      });
    }
  }
}

const authentication = { getAuthenticatedUser };

export default authentication;
