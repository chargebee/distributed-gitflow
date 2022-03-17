const notifications = require("./../notifications/pr");
const github = require("./../apps/github");
const core = require('@actions/core');

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

function isPrFromMasterToStagingBranch(pr) {
  return pr.from === "master" && pr.to.startsWith("staging/")
}

function isPrFromStagingToDevelopBranch(pr) {
  return pr.from.replace(/staging/g, "develop") === pr.to
}

function isPrFromDevelopToStagingBranch(pr) {
  return pr.from.replace(/develop/g, "staging") === pr.to
}

function isPrToMasterBranch(pr) {
  return pr.to === "master";
}

function isPrFromMasterBranch(pr) {
  return pr.from === "master";
}

function isPrToStagingBranch(pr) {
  return pr.to.startsWith("staging/");
}

function isPrFromStagingBranch(pr) {
  return pr.from.startsWith("staging/");
}

function isPrToDevelopBranch(pr) {
  return pr.to.startsWith("develop/");
}

function isPrFromDevelopBranch(pr) {
  return pr.from.startsWith("develop/");
}

function isPrFromOtherStagingBranchToDevelop(pr) {
  if (isPrFromStagingBranch(pr) && isPrToDevelopBranch(pr)) {
    return !isPrFromStagingToDevelopBranch(pr)
  }
  return false
}

function isPrFromOtherDevelopBranchToStaging(pr) {
  if (isPrFromDevelopBranch(pr) && isPrToStagingBranch(pr)) {
    return !isPrFromDevelopToStagingBranch(pr)
  }
  return false
}

async function onPrOpen(context) {
  let pr = toPr(context)
  
  if (isPrToDevelopBranch(pr)) {
    if (isPrFromMasterBranch(pr) || isPrFromDevelopBranch(pr) || isPrFromOtherStagingBranchToDevelop(pr)) {
      core.setFailed(`PR from ${pr.from} to ${pr.to} is not supported`)
      return
    }
  }

  if (isPrToStagingBranch(pr)) {
    if (isPrFromStagingBranch(pr) || isPrFromOtherDevelopBranchToStaging(pr)) {
      core.setFailed(`PR from ${pr.from} to ${pr.to} is not supported`)
      return
    }
  }

  let promises = [
    notifications.prOpened(pr),
    github.setLabels(context, pr.number, [pr.to])
  ]
  if (isPrFromMasterToStagingBranch(pr) || isPrFromStagingToDevelopBranch(pr)) {
    promises.push(github.mergePr(context, pr.number))
  }
  await Promise.all(promises)
}

async function raisePrToAllStagingBranches(context) {
  let stagingBranchNames = await fetchingStagingBranchNames(context)
  let promises = stagingBranchNames.map(async (branchName) => {
    await github.createPr(context, "master", branchName, "Syncing with latest master")
  })
  return Promise.all(promises)
}

async function raisePrToCorrespondingDevelopBranch(context, pr) {
  return github.createPr(context, pr.to, pr.to.replace(/staging/g, "develop"), "Syncing with latest " + pr.to)
}

async function notifyIfPrIsNotMergable(context, pr, createPrPromise) {
  const createdPr = await createPrPromise;
  const prNumber = createdPr.data.number
  const isMergeable = await github.isMergeable(context, prNumber)
  if (isMergeable === false) {
    await notifications.prHasConflicts(pr)
  }
}

async function onPrClose(context) {
  let {merged, merged_by, user} = context.payload.pull_request
  let pr = toPr(context)
  
  if (!merged) {
    await notifications.prClosed(pr, user.login)
    return
  }
  
  let promises = [notifications.prMerged(pr, merged_by.login)]
  
  if (isPrToMasterBranch(pr)) {
    promises.push(raisePrToAllStagingBranches(context))
  }
  
  if (isPrToStagingBranch(pr)) {
    promises.push(raisePrToCorrespondingDevelopBranch(context, pr))
    if (!isPrFromDevelopToStagingBranch(pr) && !isPrFromMasterBranch(pr)) {
      promises.push(github.deleteBranch(context, pr.from))
    }
  }

  if (isPrToDevelopBranch(pr) && !isPrFromStagingToDevelopBranch(pr)) {
    promises.push(github.deleteBranch(context, pr.from))
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