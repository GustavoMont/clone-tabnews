import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user";
import activation from "models/activation.js";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.erroHandlers);

async function postHandler(req, res) {
  const userInputValues = req.body;
  const newUser = await user.create(userInputValues);
  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken);

  return res.status(201).json(newUser);
}
