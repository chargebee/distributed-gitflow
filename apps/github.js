async function fetchProtectedBranchNames(context) {
  let branches = await context.octokit.repos.listBranches(context.repo({protected : false}))
  return branches.data.map(branch => branch.name)
}

async function createPr(context, from, to, title) {
  await context.octokit.pulls.create(context.repo({title: title, head: from, base: to}))
}

async function setLabels(context, issueNumber, labels) {
  await context.octokit.issues.setLabels(context.repo({issue_number: issueNumber, labels: labels}))
}


async function mergePr(context, prNumber) {
  await context.octokit.pulls.merge(context.repo({pull_number : prNumber}))
}

module.exports = {fetchProtectedBranchNames, createPr, setLabels, mergePr}