import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system health", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      const dependencies = responseBody.dependencies;
      const database = dependencies.database;

      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(database.max_connections).toBeDefined();
      expect(database.max_connections).toEqual(100);

      expect(database.version).toBeUndefined();

      expect(database.opened_connections).toBeDefined();
      expect(database.opened_connections).toEqual(1);
    });
  });
  describe("Privilled user", () => {
    test("Retrieving current system health", async () => {
      const privillegedUser = await orchestrator.createActivatedUser();
      await orchestrator.addFeatures(privillegedUser, [
        "read:database:complete",
      ]);
      const privillegedUserSession = await orchestrator.createUserSession(
        privillegedUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          cookie: `session_id=${privillegedUserSession.token}`,
        },
      });
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      const dependencies = responseBody.dependencies;
      const database = dependencies.database;

      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(database.max_connections).toBeDefined();
      expect(database.max_connections).toEqual(100);

      expect(database.version).toBeDefined();
      expect(database.version).toEqual("16.1");

      expect(database.opened_connections).toBeDefined();
      expect(database.opened_connections).toEqual(1);
    });
  });
});
