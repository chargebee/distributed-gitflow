const slack = require("./../apps/slack")

const typeOfChangeEmoji = {
  "feat" : ":sparkles:",
  "fix": ":bug:",
  "docs" : ":books:",
  "style" : ":gem:",
  "refactor" : ":hammer:",
  "perf" : ":rocket:",
  "test" : ":mag:",
  "build" : ":package:",
  "chore" : ":wrench:",
  "ci" : ":construction_worker:",
  "develop" : ":heavy_check_mark:",
  "staging" : ":white_check_mark:",
  "master" : ":bookmark:",
}

function isAuthoredByBot(authorHandle) {
  return authorHandle === "distributed-gitflow-app[bot]"
}

function channelName(pr) {
  let chnName = pr.to.replace(/\//g, "-")
  if (process.env.SLACK_CHANNEL_PREFIX) {
    return process.env.SLACK_CHANNEL_PREFIX + "-" + chnName;
  }
  return chnName;
}

function header(pr, text) {
  let emoji = typeOfChangeEmoji[pr.typeOfChange]
  return emoji ? slack.header(`${emoji} ${text} ${emoji}`) : slack.header(text)
}

function entry(label, value) {
  return slack.markdown(`*${label}:* ${value}`)
}

async function notifyNewPR(pr) {
  if (isAuthoredByBot(pr.authorHandle)) {
    return;
  }
  let textMessage = `${pr.authorHandle} has raised a PR, ${pr.title}(${pr.url}), from ${pr.from}`
  await slack.sendMessage(channelName(pr), textMessage, [
    header(pr, "New PR"),
    slack.markdown(pr.title),
    slack.emptyline(),
    entry("From", `${pr.authorHandle} (${pr.from})`),
    entry("URL", pr.url),
    slack.emptyline(),
  ])
}

async function notifyMergedPR(pr, mergedBy) {
  let textMessage = `${mergedBy} has merged a PR ${pr.title}(${pr.url})`
  if (isAuthoredByBot(mergedBy)) {
    await slack.sendMessage(channelName(pr), textMessage, [
      slack.markdown(pr.title + " - completed")
    ]);
    return
  }
  await slack.sendMessage(channelName(pr), textMessage, [
    slack.header(":checkered_flag: PR Merged :checkered_flag:"),
    slack.markdown(pr.title),
    slack.emptyline(),
    entry("Merged By", mergedBy),
    entry("URL", pr.url),
    slack.emptyline(),
  ])
}

async function notifyClosedPR(pr, closedBy) {
  if (isAuthoredByBot(closedBy)) {
    return;
  }
  let textMessage = `${closedBy} has closed a PR ${pr.title}(${pr.url})`
  await slack.sendMessage(channelName(pr), textMessage, [
    slack.header(":negative_squared_cross_mark: PR Closed :negative_squared_cross_mark:"),
    slack.markdown(pr.title),
    slack.emptyline(),
    entry("Closed By", closedBy),
    entry("URL", pr.url),
    slack.emptyline(),
  ])
}

async function notifyPrHasConflicts(pr) {
  let textMessage = `MERGE CONFLICT - ${pr.title}(${pr.url})`
  await slack.sendMessage(channelName(pr), textMessage, [
    slack.header(":alert: MERGE CONFLICT :alert:"),
    slack.markdown(pr.title),
    slack.emptyline(),
    entry("URL", pr.url),
    slack.emptyline(),
    slack.markdown("Team <!here>, fix it at the earliest.")
  ])
}

module.exports = {notifyNewPR, notifyMergedPR, notifyClosedPR, notifyPrHasConflicts}