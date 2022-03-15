function toPr(context) {
  let { base, body, user, html_url, title, number, head } = context.payload.pull_request
  return {
    description: body,
    authorHandle: user.login,
    title: title, 
    url: html_url,
    number: number, 
    from: head.ref, 
    to: base.ref
  }
}

async function onPrOpen(context) {
  console.log(toPr(context))
}

async function onPrClose(context) {
  console.log(toPr(context))
}

module.exports = { onPrOpen, onPrClose }

// .load handlers/pr.js 
// await test()
async function test() {
  var fs = require('fs');
  
  // var openPr = JSON.parse(fs.readFileSync('ops/dev/fakes/pr/open.json', 'utf8'));
  // await onPrOpen({ payload: { pull_request: openPr } })

  var squashAndMergedPr = JSON.parse(fs.readFileSync('ops/dev/fakes/pr/squash_and_merge.json', 'utf8'));
  await onPrClose({ payload: { pull_request: squashAndMergedPr } })
}