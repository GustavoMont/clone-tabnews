import controller from "infra/controller";
import authorization from "models/authorization";
import session from "models/session";
import user from "models/user.js";
import { createRouter } from "next-connect";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.erroHandlers);

async function getHandler(request, response) {
  const { session_id: sessionToken } = request.cookies;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionIdCookie(response, renewedSessionObject.token);
  const userFound = await user.findOneById(sessionObject.user_id);
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  const requestUser = request.context.user;
  const secureOutputValues = authorization.filterOutput(
    requestUser,
    "read:user:self",
    userFound,
  );
  return response.json(secureOutputValues);
}
