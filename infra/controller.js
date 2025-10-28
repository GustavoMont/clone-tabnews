import session from "models/session.js";
import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors.js";
import * as cookie from "cookie";
import user from "models/user.js";

function onErrorHandler(error, req, res) {
  const mappedErrors = [ValidationError, NotFoundError, ForbiddenError];

  if (mappedErrors.some((mappedError) => error instanceof mappedError)) {
    return res.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(res);
    return res.status(error.statusCode).json(error);
  }

  let publicError = new InternalServerError({
    cause: error,
  });
  console.error(publicError);
  res.status(publicError.statusCode).json(publicError);
}

function onNoMatchHandler(req, res) {
  const publicError = new MethodNotAllowedError();
  res.status(publicError.statusCode).json(publicError);
}

function setSessionCookie(response, sessionToken) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    httpOnly: true,
    maxAge: session.EXPIRATION_IN_MILISECONDS / 1000,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    httpOnly: true,
    maxAge: -1,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  response.setHeader("Set-Cookie", setCookie);
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const userTryingToRequest = request.context.user;
    if (userTryingToRequest?.features.includes(feature)) {
      return next();
    }
    throw new ForbiddenError({
      message: "Você não possui permissão para executar esta ação.",
      action: `Verifique se o usuário possui a feature "${feature}"`,
    });
  };
}

async function injectAnonymousOrUser(request, response, next) {
  const sessionId = request.cookies?.session_id;
  if (sessionId) {
    await injectAuthenticatedUser(request);
    return next();
  }
  await injectAnonymousUser(request);

  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findOneById(sessionObject.user_id);
  request.context = {
    ...request.context,
    user: userObject,
  };
}

async function injectAnonymousUser(request) {
  const anonymousUser = {
    features: ["read:activation_token", "create:session", "create:user"],
  };
  request.context = {
    ...request.context,
    user: anonymousUser,
  };
}

const controller = {
  erroHandlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
  setSessionIdCookie: setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;
