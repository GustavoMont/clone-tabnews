import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system health", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
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
