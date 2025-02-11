import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import migrator from "models/migrator.js";

const router = createRouter();

router.get(getHandler);

router.post(postHandler);

export default router.handler(controller.erroHandlers);

async function getHandler(req, res) {
  const pendingMigrations = await migrator.listPendingMigrations();

  return res.status(200).json(pendingMigrations);
}

async function postHandler(req, res) {
  const appliedMigrations = await migrator.runPendingMigrations();
  const hasAppliedMigrations = appliedMigrations.length;
  return res.status(hasAppliedMigrations ? 201 : 200).json(appliedMigrations);
}
