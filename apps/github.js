async function fetchProtectedBranchNames(context) {
  let branches = await context.octokit.repos.listBranches(context.repo({protected : false}))
  return branches.data.map(branch => branch.name)
}

async function createPr(context, from, to, title) {
  await context.octokit.pulls.create(context.repo({title: title, head: from, base: to}))
}

module.exports = {fetchProtectedBranchNames, createPr}