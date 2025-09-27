import session from "models/session";
import orchestrator from "tests/orchestrator.js";
import setCookieParse from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Default User", () => {
    test("With nonexistent session", async () => {
      const nonexistentToken =
        "408cb3efd0dfdc0ee40d5bb56141ec8c1b2bd086bced1245d11c65f89d080627af351d2b191100fa86450b1943439810";
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          cookie: `session_id=${nonexistentToken}`,
        },
      });
      expect(response.status).toBe(401);
      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
      // Set-Cookie assertions
      const parsedSetCookie = setCookieParse(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });
    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILISECONDS),
      });
      const createdUser = await orchestrator.createUser({
        username: "user_with_expired_session",
      });
      const createdSession = await orchestrator.createUserSession(
        createdUser.id,
      );
      jest.useRealTimers();
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParse(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "username",
      });
      const createdSession = await orchestrator.createUserSession(
        createdUser.id,
      );
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        user_id: createdUser.id,
        token: createdSession.token,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(
        responseBody.expires_at < createdSession.expires_at.toISOString(),
      ).toBe(true);
      expect(
        responseBody.updated_at > createdSession.updated_at.toISOString(),
      ).toBe(true);

      const setCookie = setCookieParse(response, { map: true });
      expect(setCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        httpOnly: true,
        path: "/",
        maxAge: -1,
      });
    });
  });
});
