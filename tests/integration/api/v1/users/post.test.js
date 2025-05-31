import password from "models/password.js";
import user from "models/user.js";
import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email@email.com",
          username: "username",
          password: "senha123",
        }),
      });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        id: body.id,
        email: "email@email.com",
        username: "username",
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("username");
      const isPasswordCorrect = await password.compare(
        "senha123",
        userInDatabase.password,
      );
      expect(isPasswordCorrect).toBeTruthy();
      const isPasswordIncorrect = !(await password.compare(
        "senha123aamlaml",
        userInDatabase.password,
      ));
      expect(isPasswordIncorrect).toBeTruthy();
    });
    test("With duplicated 'email'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email_duplicado@email.com",
          username: "username_1",
          password: "senha123",
        }),
      });
      expect(response1.status).toBe(201);
      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "Email_duplicado@email.com",
          username: "username_2",
          password: "senha123",
        }),
      });
      expect(response2.status).toBe(400);
      const body = await response2.json();
      expect(body).toEqual({
        name: "ValidationError",
        message: "E-mail já cadastrado no sistema.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With duplicated 'uername'", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "username_duplicado@email.com",
          username: "username_duplicado",
          password: "senha123",
        }),
      });
      expect(response1.status).toBe(201);
      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "username_duplicado2@email.com",
          username: "username_Duplicado",
          password: "senha123",
        }),
      });
      expect(response2.status).toBe(400);
      const body = await response2.json();
      expect(body).toEqual({
        name: "ValidationError",
        message: "Username já cadastrado no sistema.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
  });
});
