const slack = require("./slack")

async function prOpened(pr) {
  await slack.notifyNewPR(pr)
}

async function prClosed(pr, closedBy) {
  await slack.notifyClosedPR(pr, closedBy)
}

async function prMerged(pr, mergedBy) {
  await slack.notifyMergedPR(pr, mergedBy)
}

module.exports = {prOpened, prClosed, prMerged}