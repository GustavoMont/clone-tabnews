import webserver from "infra/webserver.js";
import activation from "models/activation.js";
import user from "models/user.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all succesful)", () => {
  let createdUser;
  let sessionCookie;
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
    createdUser = await response.json();
    expect(createdUser).toEqual({
      id: createdUser.id,
      email: "email@email.com",
      username: "username",
      features: ["read:activation_token"],
      password: createdUser.password,
      created_at: createdUser.created_at,
      updated_at: createdUser.updated_at,
    });
  });
  let activationTokenId;
  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@musicnews.com.br>");
    expect(lastEmail.recipients[0]).toBe("<email@email.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro no MusicNews!");
    expect(lastEmail.text).toContain("username");
    expect(lastEmail.text).toContain(webserver.origin);

    activationTokenId = orchestrator.extractUUID(lastEmail.text);
    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
    );

    // Token validation
    const activationToken =
      await activation.findOneValidById(activationTokenId);
    expect(activationToken.user_id).toBe(createdUser.id);
    expect(activationToken.used_at).toBe(null);
  });
  test("Activate account", async () => {
    const response = await fetch(
      `http://localhost:3000/api/v1/activation/${activationTokenId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    expect(response.status).toBe(200);
    const activationToken = await response.json();
    expect(Date.parse(activationToken.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername("username");
    expect(activatedUser.features).toEqual(["create:session", "read:session"]);
  });
  test("Login", async () => {
    const response = await fetch(`http://localhost:3000/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "email@email.com",
        password: "senha123",
      }),
    });
    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody.user_id).toBe(createdUser.id);
    sessionCookie = response.headers.getSetCookie()[0];
  });
  test("Get user information", async () => {
    const response = await fetch("http://localhost:3000/api/v1/user", {
      headers: {
        cookie: sessionCookie,
      },
    });
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      id: createdUser.id,
      email: createdUser.email,
      username: "username",
      password: createdUser.password,
      features: ["create:session", "read:session"],
      created_at: createdUser.created_at,
      updated_at: responseBody.updated_at,
    });
  });
});
