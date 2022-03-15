async function prOpened(pr) {
  console.log(pr)
}

async function prClosed(pr, closedBy) {
  console.log(pr)
  console.log("Closed By " + closedBy)
}

async function prMerged(pr, mergedBy) {
  console.log(pr)
  console.log("Merged By " + mergedBy)
}

module.exports = {prOpened, prClosed, prMerged}