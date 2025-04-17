import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.erroHandlers);

async function getHandler(req, res) {
  const username = req.query.username;
  const userFound = await user.findOneByUsername(username);
  return res.status(200).json(userFound);
}
