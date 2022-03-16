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

function channelName(pr) {
  console.log(pr.to)
  console.log(typeof(pr.to))
  return pr.to.replaceAll("/","-")
}

function header(pr, text) {
  let emoji = typeOfChangeEmoji[pr.typeOfChange]
  return emoji ? slack.header(`${emoji} ${text} ${emoji}`) : slack.header(text)
}

function entry(label, value) {
  return slack.markdown(`*${label}:* ${value}`)
}

async function notifyNewPR(pr) {
  await slack.sendBlocks(channelName(pr), [
    header(pr, "New PR"),
    slack.markdown(pr.title),
    slack.emptyline(),
    entry("Created By", pr.authorHandle),
    entry("From", pr.from),
    entry("URL", pr.url),
    slack.emptyline(),
  ])
}

async function notifyMergedPR(pr, mergedBy) {
  await slack.sendBlocks(channelName(pr), [
    slack.header(":checkered_flag: PR Merged :checkered_flag:"),
    slack.markdown(pr.title),
    slack.emptyline(),
    entry("Merged By", mergedBy),
    entry("URL", pr.url),
    slack.emptyline(),
  ])
}

async function notifyClosedPR(pr, closedBy) {
  await slack.sendBlocks(channelName(pr), [
    slack.header(":negative_squared_cross_mark: PR Closed :negative_squared_cross_mark:"),
    slack.markdown(pr.title),
    slack.emptyline(),
    entry("Closed By", closedBy),
    entry("URL", pr.url),
    slack.emptyline(),
  ])
}

module.exports = {notifyNewPR, notifyMergedPR, notifyClosedPR}