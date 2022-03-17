const { WebClient } = require('@slack/web-api');
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

async function sendMessage(channel, message, blocks) {
  await slack.chat.postMessage({channel : channel, text: message, blocks: blocks})
}

function markdown(text) {
  return {type : "section", text : { type : "mrkdwn", text : text}}
}

function emptyline() {
  return {type : "section", text : { type : "mrkdwn", text : "\n"}}
}

function header(text) {
  return {
    "type": "header",
    "text": {
      "type": "plain_text",
      "text": text,
      "emoji": true
    }
  }
}

function divider() {
  return {type: "divider"}
}

async function test() {
  await sendMessage("develop-subscriptions", [
    header(":sparkles: New PR :sparkles:"),
    markdown("An awesome PR title"), 
    emptyline(),
    markdown("*From:* feat/inv-123"),
    markdown("*Author:* cb-tamizhvendansembiyan"),
    markdown("*URL:* https://github.com/cb-tamizhvendansembiyan/fake-cb-app/pull/7"),
  ])
}

module.exports = {sendMessage, header, markdown, emptyline}