import { faker } from "@faker-js/faker/.";
import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import session from "models/session";
import user from "models/user";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatus, {
      retries: 100,
      maxTimeout: 1_000,
      minTimeout: 250,
    });

    async function fetchStatus() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (!response.ok) {
        throw Error();
      }
    }
  }
  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1_000,
      minTimeout: 250,
    });

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl);
      if (!response.ok) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade ; create schema public");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

function createUser(userObject) {
  return user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[._-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || "validPassword",
  });
}

async function createUserSession(userId) {
  return await session.create(userId);
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();
  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailTextResponse.text();

  lastEmailItem.text = emailTextBody;
  return lastEmailItem;
}

async function deleteAllEmails() {
  const url = `${emailHttpUrl}/messages`;
  await fetch(url, { method: "DELETE" });
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createUserSession,
  deleteAllEmails,
  getLastEmail,
};

export default orchestrator;
