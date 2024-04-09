import database from "infra/database";

async function cleanDatabase() {
  await database.query("drop schema public cascade ; create schema public");
}

beforeAll(cleanDatabase);

test("GET to /api/v1/migrations should return 200", async () => {
  let response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response.status).toBe(201);

  let responseBody = await response.json();

  expect(Array.isArray(responseBody)).toBe(true);
  expect(responseBody.length).toBeGreaterThan(0);

  response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });

  expect(response.status).toBe(200);
  responseBody = await response.json();

  expect(responseBody.length).toBe(0);
});
