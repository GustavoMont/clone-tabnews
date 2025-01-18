import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("PUT /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Running migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "PUT",
      });
      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        status_code: 405,
        message: "Método não permitido para este endpoint.",
        name: "MethodNotAllowedError",
        action:
          "Verifique se o método HTTP enviado é válido para este endpoint.",
      });
    });
  });
});
