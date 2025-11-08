import activation from "models/activation";
import user from "models/user.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("PATCH /api/v1/activation/[token_id]", () => {
  describe("Anonymous User", () => {
    let usedToken;
    test("With nonexisting token", async () => {
      const activationTokenId = "37d035f4-e29e-452c-b928-21473184e1cd";
      const response = await fetch(
        `http://localhost:3000/api/v1/activation/${activationTokenId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        action:
          "Verifique se o token de ativação ainda é válido ou tente um novo cadastro.",
        message: "Usuário não possui token de ativação válido.",
        status_code: 404,
      });
    });
    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILISECONDS),
      });
      const createdUser = await orchestrator.createUser({
        username: "expired_activation_user",
      });
      const createdActivationToken = await orchestrator.createActivationToken(
        createdUser.id,
      );
      jest.useRealTimers();

      const response = await fetch(
        `http://localhost:3000/api/v1/activation/${createdActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        action:
          "Verifique se o token de ativação ainda é válido ou tente um novo cadastro.",
        message: "Usuário não possui token de ativação válido.",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser({
        username: "user_to_activate",
      });
      const createdActivationToken = await orchestrator.createActivationToken(
        createdUser.id,
      );
      const response = await fetch(
        `http://localhost:3000/api/v1/activation/${createdActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        created_at: createdActivationToken.created_at.toISOString(),
        updated_at: responseBody.updated_at,
        used_at: responseBody.used_at,
        id: createdActivationToken.id,
        user_id: createdUser.id,
        expires_at: createdActivationToken.expires_at.toISOString(),
      });

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
      expect(responseBody.used_at > responseBody.created_at).toBe(true);
      expect(Date.parse(responseBody.updated_at)).not.toBe(NaN);
      expect(Date.parse(responseBody.used_at)).not.toBe(NaN);

      const activatedUser = await user.findOneByUsername("user_to_activate");
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);

      usedToken = createdActivationToken.id;
    });

    test("With already activated user", async () => {
      const response = await fetch(
        `http://localhost:3000/api/v1/activation/${usedToken}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      expect(response.status).toBe(404);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        action:
          "Verifique se o token de ativação ainda é válido ou tente um novo cadastro.",
        message: "Usuário não possui token de ativação válido.",
        status_code: 404,
      });
    });
  });
  describe("Default User", () => {
    test("With user activated user with", async () => {
      const activatedUser = await orchestrator.createActivatedUser();
      const activationToken = await orchestrator.createActivationToken(
        activatedUser.id,
      );
      const sessionObject = await orchestrator.createUserSession(
        activatedUser.id,
      );
      const response = await fetch(
        `http://localhost:3000/api/v1/activation/${activationToken.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: `session_id=${sessionObject.token}`,
          },
        },
      );
      expect(response.status).toBe(403);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message: "Você não possui permissão para executar esta ação.",
        action: `Verifique se o usuário possui a feature "read:activation_token"`,
        status_code: 403,
        name: "ForbiddenError",
      });
    });
  });
});
