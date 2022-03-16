async function fetchProtectedBranchNames(octokit, repoOwner, repoName) {
  let branches = await octokit.repos.listBranches({owner: repoOwner, repo: repoName, protected : false})
  return branches.data.map(branch => branch.name)
}

async function createPr(octokit, repoOwner, repoName, from, to, title) {
  await octokit.pulls.create({
    owner: repoOwner,
    repo: repoName,
    title: title,
    head: from,
    base: to
  })
}

module.exports = {fetchProtectedBranchNames, createPr}