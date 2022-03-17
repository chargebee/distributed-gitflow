const notifications = require("./../notifications/pr");
const github = require("./../apps/github");

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

async function fetchingStagingBranchNames(context) {
  let branchNames = await github.fetchProtectedBranchNames(context)
  return branchNames.filter(branchName => branchName.startsWith("staging/"))
}

async function onPrOpen(context) {
  await notifications.prOpened(toPr(context))
}

async function raisePrToAllStagingBranches(context) {
  let stagingBranchNames = await fetchingStagingBranchNames(context)
  let promises = stagingBranchNames.map(async (branchName) => {
    await github.createPr(context, "master", branchName, "Syncing with latest Master")
  })
  return Promise.all(promises)
}

async function raisePrToCorrespondingDevelopBranch(context, pr) {
  await github.createPr(context, pr.to, pr.to.replace(/staging/g, "develop"), "Syncing with latest " + pr.to)
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
    promises.push(raisePrToAllStagingBranches(context))
  }
  if (pr.to.startsWith("staging/")) {
    promises.push(raisePrToCorrespondingDevelopBranch(context, pr))
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