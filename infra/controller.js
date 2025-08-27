import session from "models/session.js";
import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors.js";
import * as cookie from "cookie";

function onErrorHandler(error, req, res) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError
  ) {
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

const controller = {
  erroHandlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
  setSessionIdCookie: setSessionCookie,
};

export default controller;
