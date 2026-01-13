import password from "models/password";
import user from "models/user";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test('With unique "username"', async () => {
      await orchestrator.createUser({
        username: "nouser",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/nouser",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueUsername2",
          }),
        },
      );
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        action: 'Verifique se o usuário possui a feature "update:user"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
  describe("Default User", () => {
    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@email.com",
      });
      const { username, id: userId } = await orchestrator.createActivatedUser({
        email: "email2@email.com",
      });
      const sessionObject = await orchestrator.createUserSession(userId);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "email2@email.com",
          }),
        },
      );
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        name: "ValidationError",
        message: "E-mail já cadastrado no sistema.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });
      const activatedUser2 = await orchestrator.createActivatedUser({
        username: "user2",
      });
      const sessionObject2 = await orchestrator.createUserSession(
        activatedUser2.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject2.token}`,
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({
        name: "ValidationError",
        message: "Username já cadastrado no sistema.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With change 'username' case", async () => {
      const activatedUser = await orchestrator.createActivatedUser({
        username: "userCase",
      });
      const sessionObject = await orchestrator.createUserSession(
        activatedUser.id,
      );
      const response = await fetch(
        "http://localhost:3000/api/v1/users/userCase",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "usercase",
          }),
        },
      );
      expect(response.status).toBe(200);
    });
    test("With nonexisting username", async () => {
      const activatedUser = await orchestrator.createActivatedUser();
      const sessionObject = await orchestrator.createUserSession(
        activatedUser.id,
      );
      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexisting",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
          method: "PATCH",
          body: JSON.stringify({
            username: "novo",
          }),
        },
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        name: "NotFoundError",
        message: "Usuário não encontrado no sistema.",
        action: "Verifique se o username foi digitado corretamente.",
        status_code: 404,
      });
    });
    test('With unique "username"', async () => {
      const { email, id: userId } = await orchestrator.createActivatedUser({
        username: "uniqueUsername1",
      });
      const sessionObject = await orchestrator.createUserSession(userId);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUsername1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            username: "uniqueUsername2",
          }),
        },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: body.id,
        email,
        username: "uniqueUsername2",
        password: body.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
      expect(body.updated_at > body.created_at).toBe(true);
    });
    test('With unique "email"', async () => {
      const { username, id: userId } = await orchestrator.createActivatedUser({
        email: "uniqueEmail1@email.com",
      });
      const sessionObject = await orchestrator.createUserSession(userId);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            email: "uniqueEmail2@email.com",
          }),
        },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: body.id,
        email: "uniqueEmail2@email.com",
        username,
        password: body.password,
        features: ["create:session", "read:session", "update:user"],
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
      expect(body.updated_at > body.created_at).toBe(true);
    });
    test('With new "password"', async () => {
      const {
        username,
        email,
        id: userId,
      } = await orchestrator.createActivatedUser();
      const sessionObject = await orchestrator.createUserSession(userId);

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            password: "newPassword2",
          }),
        },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: body.id,
        email,
        username,
        password: body.password,
        features: ["create:session", "read:session", "update:user"],

        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
      expect(body.updated_at > body.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(username);
      const isPasswordCorrect = await password.compare(
        "newPassword2",
        userInDatabase.password,
      );
      expect(isPasswordCorrect).toBeTruthy();
      const isPasswordIncorrect = !(await password.compare(
        "senha123aamlaml",
        userInDatabase.password,
      ));
      expect(isPasswordIncorrect).toBeTruthy();
    });
  });
});
