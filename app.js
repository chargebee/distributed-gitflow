const { onPrOpen, onPrClose } = require("./handlers/pr");

/**
 * @param {import('probot').Probot} app
 */

module.exports = (app) => {
  app.on("pull_request.opened", onPrOpen);
  app.on("pull_request.closed", onPrClose);
  app.on("issues.opened", async (context) => {
    context.log.info(context.repo)
  })
  app.onError(async (error) => {
    console.error(error, 1)
  })
};
