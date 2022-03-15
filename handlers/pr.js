const {prClosed, prMerged, prOpened} = require("./../notifications/pr");

function toPr(context) {
  let { base, body, user, html_url, title, number, head, id} = context.payload.pull_request
  return {
    description: body,
    authorHandle: user.login,
    title: title, 
    url: html_url,
    number: number, 
    from: head.ref, 
    to: base.ref,
    id: id,
    typeOfChange: head.ref.split('/')[0]
  }
}

async function onPrOpen(context) {
  await prOpened(toPr(context))
}

async function onPrClose(context) {
  let {merged, merged_by, user} = context.payload.pull_request
  if (!merged) {
    await prClosed(toPr(context), user.login)
    return
  }
  await prMerged(toPr(context), merged_by.login)
}

module.exports = { onPrOpen, onPrClose }

// .load pr.js 
// await test()
async function test() {
  var fs = require('fs');
  
  var openPr = JSON.parse(fs.readFileSync('./../ops/dev/fakes/pr/open.json', 'utf8'));
  await onPrOpen({ payload: { pull_request: openPr } })

  // var squashAndMergedPr = JSON.parse(fs.readFileSync('./../ops/dev/fakes/pr/squash_and_merge.json', 'utf8'));
  // await onPrClose({ payload: { pull_request: squashAndMergedPr } })
  
  // var closedPr = JSON.parse(fs.readFileSync('./../ops/dev/fakes/pr/close.json', 'utf8'));
  // await onPrClose({ payload: { pull_request: closedPr } })
}