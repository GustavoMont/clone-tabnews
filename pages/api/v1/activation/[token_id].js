import controller from "infra/controller.js";
import activation from "models/activation.js";
import { createRouter } from "next-connect";

const router = createRouter();

router.patch(patchHandler);

async function patchHandler(request, response) {
  const tokenId = request.query.token_id;
  const usedActivationToken = await activation.markTokenAsUsed(tokenId);
  await activation.activateUserByUserId(usedActivationToken.user_id);

  return response.status(200).json(usedActivationToken);
}

export default router.handler(controller.erroHandlers);
