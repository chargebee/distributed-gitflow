const notifications = require("./../notifications/pr");
const github = require("./../app/github");

function toPr(context) {
  let { base, body, user, html_url, title, number, head, id} = context.payload.pull_request
  return {
    description: body,
    authorHandle: user.login,
    title: title, 
    url: html_url,
    number: number, 
    from: head.ref, 
    to: base.ref,
    id: id,
    typeOfChange: head.ref.split('/')[0]
  }
}

async function fetchingStagingBranchNames(octokit) {
  let branchNames = await github.fetchProtectedBranchNames(octokit, process.env.REPO_OWNER, process.env.REPO_NAME)
  return branchNames.filter(branchName => branchName.startsWith("staging/"))
}

async function onPrOpen(context) {
  console.log(JSON.stringify(context.payload.pull_request, null, 2))
  await notifications.prOpened(toPr(context))
}

async function raisePrToAllStagingBranches(octokit) {
  let stagingBranchNames = await fetchingStagingBranchNames(octokit)
  let promises = stagingBranchNames.map(async (branchName) => {
    await github.createPr(octokit, process.env.REPO_OWNER, process.env.REPO_NAME, "master", branchName, "Syncing with latest Master")
  })
  return Promise.all(promises)
}

async function raisePrToCorrespondingDevelopBranch(octokit, pr) {
  await github.createPr(octokit, process.env.REPO_OWNER, process.env.REPO_NAME, pr.to, pr.to.replace(/staging/g, "develop"), "Syncing with latest " + pr.to)
}

async function onPrClose(context) {
  let {merged, merged_by, user} = context.payload.pull_request
  let pr = toPr(context)
  if (!merged) {
    await notifications.prClosed(pr, user.login)
    return
  }
  let promises = [notifications.prMerged(pr, merged_by.login)]
  if (pr.to === "master") {
    promises.push(raisePrToAllStagingBranches(context.octokit))
  }
  if (pr.to.startsWith("staging/")) {
    promises.push(raisePrToCorrespondingDevelopBranch(context.octokit, pr))
  }
  await Promise.all(promises)
}

module.exports = { onPrOpen, onPrClose }

// .load pr.js 
// await test()
async function test() {
  var fs = require('fs');
  
  var openPr = JSON.parse(fs.readFileSync('./../ops/dev/fakes/pr/open.json', 'utf8'));
  await onPrOpen({ payload: { pull_request: openPr } })

  // var squashAndMergedPr = JSON.parse(fs.readFileSync('./../ops/dev/fakes/pr/squash_and_merge.json', 'utf8'));
  // await onPrClose({ payload: { pull_request: squashAndMergedPr } })
  
  // var closedPr = JSON.parse(fs.readFileSync('./../ops/dev/fakes/pr/close.json', 'utf8'));
  // await onPrClose({ payload: { pull_request: closedPr } })
}