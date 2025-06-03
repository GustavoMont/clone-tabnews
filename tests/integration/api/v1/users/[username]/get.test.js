import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  let user;
  beforeAll(async () => {
    user = await orchestrator.createUser({
      username: "username",
    });
  });
  describe("Anonymous user", () => {
    test("With exact case", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/username",
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: body.id,
        email: user.email,
        username: "username",
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
    });
    test("With different case", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/Username",
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: body.id,
        email: user.email,
        username: "username",
        password: body.password,
        created_at: body.created_at,
        updated_at: body.updated_at,
      });
      expect(uuidVersion(body.id)).toBe(4);
      expect(Date.parse(body.created_at)).not.toBeNaN();
      expect(Date.parse(body.updated_at)).not.toBeNaN();
    });
    test("With nonexisting username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexisting",
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
  });
});
