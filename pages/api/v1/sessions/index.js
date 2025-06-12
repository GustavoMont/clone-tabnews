import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import authentication from "models/authentication.js";
import session from "models/session.js";
import * as cookie from "cookie";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.erroHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize("session_id", newSession.token, {
    httpOnly: true,
    maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  res.setHeader("Set-Cookie", setCookie);

  return res.status(201).json(newSession);
}
