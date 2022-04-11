async function fetchProtectedBranchNames(context) {
  let branches = await context.octokit.repos.listBranches(context.repo({protected : false}))
  return branches.data.map(branch => branch.name)
}

async function createPr(context, from, to, title) {
  let pr = await context.octokit.pulls.create(context.repo({title: title, head: from, base: to}))
  return pr
}

async function fetchOpenPr(context, from, to) {
  let req = context.repo({base: to, state: "open"})
  req.head = `${req.owner}:${from}`
  let pr = await context.octokit.pulls.list(req)
  if (pr.data.length == 1) {
    return pr.data[0];
  }
  return null
}

async function setLabels(context, issueNumber, labels) {
  await context.octokit.issues.setLabels(context.repo({issue_number: issueNumber, labels: labels}))
}

async function mergePr(context, prNumber) {
  await context.octokit.pulls.merge(context.repo({pull_number : prNumber}))
}

async function deleteBranch(context, branchName) {
  await context.octokit.git.deleteRef(context.repo({ref : `heads/${branchName}`}))
}

function timeout(ms) {
  new Promise((resolve) => setTimeout(resolve, ms))
}

async function isMergeable (context, prNumber) {
  const maxRetries = 3
  let i = 0
  while (i++ < maxRetries) {
    const pr = await context.octokit.pulls.get(context.repo({pull_number: prNumber}))
    if (typeof pr.data.mergeable === 'boolean' && pr.data.mergeable_state !== 'unknown') {
      return pr.data.mergeable && (pr.data.mergeable_state === 'clean' || pr.data.mergeable_state === 'unstable')
    }
    await timeout(4500)
  }
  return null
}

async function closePr(context, prNumber) {
  await context.octokit.pulls.update(context.repo({pull_number: prNumber, state : "closed"}))
}

module.exports = {fetchProtectedBranchNames, createPr, setLabels, mergePr, deleteBranch, isMergeable, closePr, fetchOpenPr}