import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.post(controller.canRequest("create:session"), postHandler);

router.delete(deleteHandler);

export default router.handler(controller.erroHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não tem permissão para realizar login.",
      action: "Contate o suporte caso acredite que isso seja um erro.",
    });
  }

  const newSession = await session.create(authenticatedUser.id);
  controller.setSessionIdCookie(res, newSession.token);

  return res.status(201).json(newSession);
}

async function deleteHandler(req, res) {
  const token = req.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(token);
  const expiredSession = await session.expireById(sessionObject.id);
  controller.clearSessionCookie(res);

  return res.status(200).json(expiredSession);
}
