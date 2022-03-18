const core = require('@actions/core');
const { onPrOpen, onPrClose } = require("./handlers/pr");

/**
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  app.on("pull_request.opened", onPrOpen);
  app.on("pull_request.closed", onPrClose);
  // app.on("issues.opened", async context => {
    // For Local Dev
  // })
  app.onError(async (error) => {
    core.setFailed(error)
  })
};
