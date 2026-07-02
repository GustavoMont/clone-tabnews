import controller from "infra/controller.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";
import { createRouter } from "next-connect";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);

router.patch(controller.canRequest("read:activation_token"), patchHandler);

async function patchHandler(request, response) {
  const tokenId = request.query.token_id;
  const usedActivationToken = await activation.markTokenAsUsed(tokenId);
  await activation.activateUserByUserId(usedActivationToken.user_id);

  const requestUser = request.context.user;
  const secureOutputValues = authorization.filterOutput(
    requestUser,
    "read:activation_token",
    usedActivationToken,
  );
  return response.status(200).json(secureOutputValues);
}

export default router.handler(controller.erroHandlers);
