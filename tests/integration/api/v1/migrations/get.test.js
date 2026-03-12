import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("GET /api/v1/migrations", () => {
  describe("With Empty Database", () => {
    test("Anonymous user retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);

      expect(responseBody.length).toBeGreaterThan(0);
      responseBody.forEach((migration) => {
        expect(migration.name).toBeDefined();
        expect(migration.timestamp).toBeDefined();
        expect(migration.path).toBeUndefined();
      });
    });
  });
  describe("With Database with migrations", () => {
    beforeAll(orchestrator.runPendingMigrations);
    test("Anonymous user retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        action:
          "Verifique se usuário possui a feature 'read:migration', para continuar",
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
    test("Default user retrieving pending migrations", async () => {
      const user = await orchestrator.createActivatedUser();
      const userSession = await orchestrator.createUserSession(user.id);
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        action:
          "Verifique se usuário possui a feature 'read:migration', para continuar",
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
    test("Privilleged user retrieving pending migrations", async () => {
      const privillegedUser = await orchestrator.createActivatedUser();
      await orchestrator.addFeatures(privillegedUser, ["read:migration"]);
      const privillegedUserSession = await orchestrator.createUserSession(
        privillegedUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          cookie: `session_id=${privillegedUserSession.token}`,
        },
      });
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
