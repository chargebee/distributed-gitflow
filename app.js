const { onPrOpen, onPrClose } = require("./handlers/pr");
const github = require("./apps/github")

/**
 * @param {import('probot').Probot} app
 */

async function fetchingStagingBranchNames(octokit) {
  let branchNames = await github.fetchProtectedBranchNames(octokit, process.env.REPO_OWNER, process.env.REPO_NAME)
  return branchNames.filter(branchName => branchName.startsWith("staging/"))
}

module.exports = (app) => {
  app.on("pull_request.opened", onPrOpen);
  app.on("pull_request.closed", onPrClose);
  app.on("issues.opened", async (context) => {
    let stagingBranchNames = await fetchingStagingBranchNames(context.octokit)
    stagingBranchNames.forEach(console.log)
    let promises = stagingBranchNames.map(async (branchName) => {
      await github.createPr(context.octokit, process.env.REPO_OWNER, process.env.REPO_NAME, "master", branchName, "Syncing with Upstream Branch")
    })
    await Promise.all(promises)
  })
  app.onError(async (error) => {
    console.error(error, 1)
  })
};
