import webserver from "infra/webserver.js";
import activation from "models/activation.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all succesful)", () => {
  let createdUser;
  test("Create user account", async () => {
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
    createdUser = body;
    expect(body).toEqual({
      id: body.id,
      email: "email@email.com",
      username: "username",
      features: ["read:activation_token"],
      password: body.password,
      created_at: body.created_at,
      updated_at: body.updated_at,
    });
  });
  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@musicnews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<email@email.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no MusicNews!");
    expect(lastEmail.text).toContain("username");
    const userActivationToken = await activation.findOneByUserId(
      createdUser.id,
    );
    expect(lastEmail.text).toContain(userActivationToken.id);
    expect(lastEmail.text).toContain(webserver.origin);
  });
  test("Activate account", async () => {});
  test("Login", async () => {});
});
