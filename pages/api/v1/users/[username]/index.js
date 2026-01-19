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
  const userFound = await user.findOneByUsername(username);
  return res.status(200).json(userFound);
}

async function patchHandler(req, res) {
  const username = req.query.username;
  const requestUser = req.context.user;
  const userToUpdate = await user.findOneByUsername(username);
  if (!authorization.can(requestUser, "update:user", userToUpdate)){
    throw new ForbiddenError({
        message: "Você não tem permissão para atualizar outro usuário.",
        action: "Verifique se você possui a feature necessária para atualizar outros usuários.",
      })
  }
  const userInputValues = req.body;
  const updatedUser = await user.update(username, userInputValues);
  return res.status(200).json(updatedUser);
}
