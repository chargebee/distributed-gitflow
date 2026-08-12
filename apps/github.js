async function fetchProtectedBranchNames(context) {
  // Prefer GraphQL over REST GET /branches?protected=true. On large repos the REST
  // filter evaluates protection across every branch and can 504 (~10s gateway limit).
  // Query staging/* refs and treat as protected if classic branchProtectionRule or
  // any active repo/org ruleset rule (Ref.rules) applies.
  const { owner, repo } = context.repo()
  const branchNames = []
  let cursor = null

  while (true) {
    const { repository } = await context.octokit.graphql(
      `query($owner: String!, $name: String!, $cursor: String) {
        repository(owner: $owner, name: $name) {
          refs(refPrefix: "refs/heads/", query: "staging/", first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              branchProtectionRule {
                id
              }
              rules(first: 1) {
                totalCount
              }
            }
          }
        }
      }`,
      { owner, name: repo, cursor }
    )

    for (const ref of repository.refs.nodes) {
      if (ref.branchProtectionRule || ref.rules.totalCount > 0) {
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
      if (i < maxRetries) {
        console.log(` Retrying... sleeping for ${(i + 2)} minute(s)`)
        await timeout(60 * (i + 1) * 1000);
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
