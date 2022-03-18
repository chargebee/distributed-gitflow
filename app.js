const core = require('@actions/core');
const { onPrOpen, onPrClose } = require("./handlers/pr");

/**
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  app.on("pull_request.opened", onPrOpen);
  app.on("pull_request.closed", onPrClose);
  app.on("issues.opened", async context => {
    let pulls = await context.octokit.pulls.list(context.repo({state: "open", base : "chore/c-123", head: "master"}))
    console.log(JSON.stringify(pulls, null, 2))
  })
  app.onError(async (error) => {
    core.setFailed(error)
  })
};
