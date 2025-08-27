import { faker } from "@faker-js/faker/.";
import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import session from "models/session";
import user from "models/user";

async function waitForAllServices() {
  await waitForWebServer();

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

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createUserSession,
};

export default orchestrator;
