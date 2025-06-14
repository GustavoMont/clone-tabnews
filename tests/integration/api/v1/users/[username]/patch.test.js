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
    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "email1@email.com",
      });
      const { username } = await orchestrator.createUser({
        email: "email2@email.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
      await orchestrator.createUser({
        username: "user2",
      });

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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
      await orchestrator.createUser({
        username: "userCase",
      });
      const response = await fetch(
        "http://localhost:3000/api/v1/users/userCase",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "usercase",
          }),
        },
      );
      expect(response.status).toBe(200);
    });
    test("With nonexisting username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexisting",
        {
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
      const { email } = await orchestrator.createUser({
        username: "uniqueUsername1",
      });

      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueUsername1",
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
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: body.id,
        email,
        username: "uniqueUsername2",
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
      expect(body.updated_at > body.created_at).toBe(true);
    });
    test('With unique "email"', async () => {
      const { username } = await orchestrator.createUser({
        email: "uniqueEmail1@email.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
      expect(body.updated_at > body.created_at).toBe(true);
    });
    test('With new "password"', async () => {
      const { username, email } = await orchestrator.createUser();

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
