import session from "models/session";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParse from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/session", () => {
  describe("Anonymous user", () => {
    test("With incorrect `email` and correct `password`", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.errado@email.com",
          password: "senha123",
        }),
      });
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        status_code: 401,
        message: "Dados de autenticação não conferem",
        action: "Verifique se os dados de autenticação estão corretos",
      });
    });
    test("With correct `email` and incorrect `password`", async () => {
      await orchestrator.createUser({
        email: "email.correto@email.com",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto@email.com",
          password: "senha-errada",
        }),
      });
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        status_code: 401,
        message: "Dados de autenticação não conferem",
        action: "Verifique se os dados de autenticação estão corretos",
      });
    });
    test("With incorrect `email` and incorrect `password`", async () => {
      await orchestrator.createUser();
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.incorreto@email.com",
          password: "senha-errada",
        }),
      });
      expect(response.status).toBe(401);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        status_code: 401,
        message: "Dados de autenticação não conferem",
        action: "Verifique se os dados de autenticação estão corretos",
      });
    });
    test("With correct `email` and correct `password`", async () => {
      const createdUser = await orchestrator.createUser({
        email: "tudo.correto@email.com",
        password: "tudocorreto",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "tudo.correto@email.com",
          password: "tudocorreto",
        }),
      });
      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        user_id: createdUser.id,
        token: responseBody.token,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);
      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);
      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILISECONDS);

      const setCookie = setCookieParse(response, { map: true });
      expect(setCookie.session_id).toEqual({
        name: "session_id",
        value: responseBody.token,
        httpOnly: true,
        path: "/",
        maxAge: session.EXPIRATION_IN_MILISECONDS / 1000, // in seconds
      });
    });
  });
});
