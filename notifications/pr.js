const slack = require("./slack")

function isNotAgainstDevelopOrStaging(pr) {
  return !(pr.to.startsWith("staging") || pr.to.startsWith("develop"))
}

async function prOpened(pr) {
  if (isNotAgainstDevelopOrStaging(pr)) {
    return
  }
  await slack.notifyNewPR(pr)
}

async function prClosed(pr, closedBy) {
  if (isNotAgainstDevelopOrStaging(pr)) {
    return
  }
  await slack.notifyClosedPR(pr, closedBy)
}

async function prMerged(pr, mergedBy) {
  await slack.notifyMergedPR(pr, mergedBy)
}

async function prHasConflicts(pr) {
  await slack.notifyPrHasConflicts(pr)
}
async function prMergeFailed(pr) {
  await slack.notifyPrMergeFailed(pr)
}

module.exports = {prOpened, prClosed, prMerged, prHasConflicts, prMergeFailed}