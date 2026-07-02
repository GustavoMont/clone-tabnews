import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.erroHandlers);

async function getHandler(req, res) {
  const username = req.query.username;
  const requestUser = req.context.user;
  const userFound = await user.findOneByUsername(username);
  const secureOutputValues = authorization.filterOutput(
    requestUser,
    "read:user",
    userFound,
  );
  return res.status(200).json(secureOutputValues);
}

async function patchHandler(req, res) {
  const username = req.query.username;
  const requestUser = req.context.user;
  const userToUpdate = await user.findOneByUsername(username);
  if (!authorization.can(requestUser, "update:user", userToUpdate)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para atualizar outro usuário.",
      action:
        "Verifique se você possui a feature necessária para atualizar outros usuários.",
    });
  }
  const userInputValues = req.body;
  const updatedUser = await user.update(username, userInputValues);
  const secureOutputValues = authorization.filterOutput(
    requestUser,
    "read:user",
    updatedUser,
  );
  return res.status(200).json(secureOutputValues);
}
