import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
} from "./errors.js";

function onErrorHandler(error, req, res) {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json(error);
  }
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
