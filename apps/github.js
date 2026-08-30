async function fetchProtectedBranchNames(context) {
  // Avoid REST GET /branches?protected=true: on large repos GitHub evaluates protection
  // across every branch and can 504. Instead:
  // 1) GraphQL lists staging/* ref names (no Administration-gated fields)
  // 2) REST GET /branches/{branch} checks `protected` for classic rules and rulesets
  const stagingBranchNames = await listStagingBranchNames(context)
  const protectedBranchNames = []

  for (const branchName of stagingBranchNames) {
    const branch = await context.octokit.repos.getBranch(context.repo({ branch: branchName }))
    if (branch.data.protected) {
      protectedBranchNames.push(branchName)
    }
  }

  return protectedBranchNames
}

async function listStagingBranchNames(context) {
  const { owner, repo } = context.repo()
  const branchNames = []
  let cursor = null
  const query = `query($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      refs(refPrefix: "refs/heads/", query: "staging/", first: 100, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
        }
      }
    }
  }`

  while (true) {
    const response = await context.octokit.request("POST /graphql", {
      query,
      variables: { owner, name: repo, cursor }
    })
    const repository = response.data && response.data.data && response.data.data.repository
    if (!repository || !repository.refs) {
      const messages = ((response.data && response.data.errors) || [])
        .map((error) => error.message)
        .join("; ")
      throw new Error(`Failed to list staging refs via GraphQL: ${messages || "unknown error"}`)
    }

    for (const ref of repository.refs.nodes) {
      if (ref && ref.name && ref.name.startsWith("staging/")) {
        branchNames.push(ref.name)
      }
    }

    if (!repository.refs.pageInfo.hasNextPage) {
      break
    }
    cursor = repository.refs.pageInfo.endCursor
  }

  return branchNames
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

async function resolveAllComments(context, prNumber) {
  try {
    const { data: comments } = await context.octokit.request(
      'GET /repos/{owner}/{repo}/pulls/{pull_number}/comments', 
      context.repo({pull_number: prNumber})
    )

    for (const comment of comments) {
        if (!comment.user.login.endsWith("[bot]")) continue;
        console.log("deleting comment : " + comment.id);
        await context.octokit.request(
          'DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}', 
          context.repo({comment_id: comment.id})
        );
    }
  } catch(err) {
    console.error(err);
  }
}

async function mergePr(context, pr, onMergeFailure) {
  const maxRetries = 5
  let i = 0
  let isMerged = false
  while (i++ < maxRetries) {
    try {
      await context.octokit.pulls.merge(context.repo({pull_number : pr.number, commit_message : "\r\n\r\n skip-checks: true"}))
      isMerged = true
      break;
    } catch (e) {
      console.log(`Unable to merge the PR ${pr.number} due to ${e.message}.`);
      ifFailure=e.message.include("failing")
      if (i < maxRetries && ifFailure === false) {
        console.log(` Retrying... sleeping for ${(i + 1)} minute(s)`)
        await timeout(60 * (i + 1) * 1000);
      }
      else if (ifFailure === true) {
        console.log(` Failed to merge the PR. Please check the Pull Request`)
      }
    }
  }
  if (!isMerged) {
    await onMergeFailure(context, pr);
  }
}

async function deleteBranch(context, branchName) {
  await context.octokit.git.deleteRef(context.repo({ref : `heads/${branchName}`}))
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function isMergeable (context, prNumber) {
  const maxRetries = 5
  let i = 0
  while (i++ < maxRetries) {
    await resolveAllComments(context, prNumber);
    const pr = await context.octokit.pulls.get(context.repo({pull_number: prNumber}))
    console.log(`PR Details of ${prNumber}`)
    console.log(JSON.stringify(pr.data, null, 2));
    // Merge Statuses: https://docs.github.com/en/graphql/reference/enums#mergestatestatus
    if (typeof pr.data.mergeable === 'boolean' && pr.data.mergeable_state !== 'unknown') {
      return pr.data.mergeable &&
              (pr.data.mergeable_state === 'clean' || pr.data.mergeable_state === 'behind' || pr.data.mergeable_state === 'unstable' || pr.data.mergeable_state === 'blocked')
    }
    console.log(`sleeping for a minute`)
    await timeout(60 * 1000)
  }
  return null
}

async function closePr(context, prNumber) {
  await context.octokit.pulls.update(context.repo({pull_number: prNumber, state : "closed"}))
}

module.exports = {fetchProtectedBranchNames, createPr, setLabels, mergePr, deleteBranch, isMergeable, closePr, fetchOpenPr}
