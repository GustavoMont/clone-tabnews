import retry from "async-retry";
import database from "infra/database";

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

const orchestrator = {
  waitForAllServices,
  clearDatabase,
};

export default orchestrator;
