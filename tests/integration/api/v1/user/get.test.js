import session from "models/session";
import orchestrator from "tests/orchestrator";
import setCookieParse from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({
        username: "username",
      });
      const createdSession = await orchestrator.createUserSession(
        createdUser.id,
      );
      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);
      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate",
      );
      const body = await response.json();
      expect(body).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        username: "username",
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      const renewedSessionObject = await session.findOneValidByToken(
        createdSession.token,
      );

      expect(
        renewedSessionObject.expires_at > createdSession.expires_at,
      ).toBeTruthy();
      expect(
        renewedSessionObject.updated_at > createdSession.updated_at,
      ).toBeTruthy();

      const setCookie = setCookieParse(response, { map: true });
      expect(setCookie.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        httpOnly: true,
        path: "/",
        maxAge: session.EXPIRATION_IN_MILISECONDS / 1000, // in seconds
      });
    });
    test("With session close to expiration", async () => {
      const createdUser = await orchestrator.createUser({
        username: "close_to_expire_user",
      });
      jest.useFakeTimers({
        now: new Date(
          Date.now() - (session.EXPIRATION_IN_MILISECONDS - 60 * 1_000),
        ),
      });
      const createdSession = await orchestrator.createUserSession(
        createdUser.id,
      );

      jest.useRealTimers();
      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      const renewedSessionObject = await session.findOneValidByToken(
        createdSession.token,
      );

      expect(
        renewedSessionObject.expires_at > createdSession.expires_at,
      ).toBeTruthy();
      expect(
        renewedSessionObject.updated_at > createdSession.updated_at,
      ).toBeTruthy();

      const setCookie = setCookieParse(response, { map: true });
      expect(setCookie.session_id).toEqual({
        name: "session_id",
        value: createdSession.token,
        httpOnly: true,
        path: "/",
        maxAge: session.EXPIRATION_IN_MILISECONDS / 1000, // in seconds
      });
    });
    test("With nonexistent session", async () => {
      await orchestrator.createUser({
        username: "no_session",
      });
      const nonexistentToken =
        "16375f6d45d776a817e78d7e46cba53bc35a610d06ee92fe7918cb185fa863ee22018f8dcb1f730915369352a0c0bcd0";

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${nonexistentToken}`,
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
      const response = await fetch("http://localhost:3000/api/v1/user", {
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
    });
  });
});
