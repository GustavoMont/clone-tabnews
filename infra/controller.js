import { InternalServerError, MethodNotAllowedError } from "./errors.js";

function onErrorHandler(error, req, res) {
  let publicError = new InternalServerError({
    cause: error,
    statusCode: error.statusCode,
  });
  console.error(publicError);
  res.status(publicError.statusCode).json(publicError);
}

function onNoMatchHandler(req, res) {
  const publicError = new MethodNotAllowedError();
  res.status(publicError.statusCode).json(publicError);
}

const controller = {
  erroHandlers: {
    onError: onErrorHandler,
    onNoMatch: onNoMatchHandler,
  },
};

export default controller;
