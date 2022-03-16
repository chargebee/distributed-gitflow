const { onPrOpen, onPrClose } = require("./handlers/pr");

/**
 * @param {import('probot').Probot} app
 */

module.exports = (app) => {
  app.on("pull_request.opened", onPrOpen);
  app.on("pull_request.closed", onPrClose);
  app.on("issues.opened", async (context) => {
    let branches = await context.octokit.repos.listBranches({owner: process.env.REPO_OWNER, repo: process.env.REPO_NAME, protected : false})
    branches.data.forEach(branch => {console.log(branch.name)})
  })
  app.onError(async (error) => {
    console.error(error, 1)
  })
};
