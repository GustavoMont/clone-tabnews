export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Um erro interno não esperado aconteceu", { cause });
    this.statusCode = statusCode || 500;
    this.action = "Entre em contato com o suporte";
    this.name = "InternalServerError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ message, cause }) {
    super(message || "Serviço indisponível no momento", { cause });
    this.statusCode = 503;
    this.action = "Verifique se o serviço está disponível";
    this.name = "ServiceError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ValidationError extends Error {
  constructor({ message, action, cause }) {
    super(message || "Ocorre um erro de validação.", { cause });
    this.statusCode = 400;
    this.action = action || "Verifique se os dados informados estão corretos.";
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  constructor({ message, action, cause }) {
    super(message || "Recurso não encontrado no sistema.", { cause });
    this.statusCode = 404;
    this.action = action || "Verifique se os dados de consulta estão corretos.";
    this.name = "NotFoundError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  constructor({ message, action, cause }) {
    super(message || "Usuário não autenticado.", { cause });
    this.statusCode = 401;
    this.action = action || "Faça novamente o login para continuar.";
    this.name = "UnauthorizedError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Método não permitido para este endpoint.");
    this.statusCode = 405;
    this.action =
      "Verifique se o método HTTP enviado é válido para este endpoint.";
    this.name = "MethodNotAllowedError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
