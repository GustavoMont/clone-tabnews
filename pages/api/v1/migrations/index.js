import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import migrator from "models/migrator.js";
import authorization from "models/authorization.js";
import database from "infra/database.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(getHandler);

router.post(postHandler);

export default router.handler(controller.erroHandlers);

async function getHandler(req, res) {
  const hasUserAndSessionTable = await isPossibleToAuthenticate();
  const requestUser = req.context.user;
  if (
    hasUserAndSessionTable &&
    !authorization.can(requestUser, "read:migration")
  ) {
    throw new ForbiddenError({
      message: "Você não possui permissão para executar esta ação.",
      action:
        "Verifique se usuário possui a feature 'read:migration', para continuar",
    });
  }

  const pendingMigrations = await migrator.listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    requestUser,
    "read:migration",
    pendingMigrations,
  );

  return res.status(200).json(secureOutputValues);
}

async function postHandler(req, res) {
  const hasUserAndSessionTable = await isPossibleToAuthenticate();
  const requestUser = req.context.user;
  if (
    hasUserAndSessionTable &&
    !authorization.can(requestUser, "create:migration")
  ) {
    throw new ForbiddenError({
      message: "Você não possui permissão para executar esta ação.",
      action:
        "Verifique se usuário possui a feature 'create:migration', para continuar",
    });
  }
  const appliedMigrations = await migrator.runPendingMigrations();
  const hasAppliedMigrations = appliedMigrations.length;
  const secureOutputValues = authorization.filterOutput(
    requestUser,
    "create:migration",
    appliedMigrations,
  );

  return res.status(hasAppliedMigrations ? 201 : 200).json(secureOutputValues);
}

async function isPossibleToAuthenticate() {
  const { rows } = await database.query(`SELECT EXISTS(
  SELECT * FROM pg_catalog.pg_tables
  WHERE
    tablename in ('users', 'session')
  AND
    schemaname = 'public'
  );`);
  const [{ exists: hasUserAndSessionTable }] = rows;

  return hasUserAndSessionTable;
}
