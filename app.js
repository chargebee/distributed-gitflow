const { onPrOpen, onPrClose } = require("./handlers/pr");

/**
 * @param {import('probot').Probot} app
 */

module.exports = (app) => {
  app.on("pull_request.opened", onPrOpen);
  app.on("pull_request.closed", onPrClose);
  app.onError(async (error) => {
    console.error(error)
  })
};
