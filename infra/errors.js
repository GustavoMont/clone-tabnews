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
