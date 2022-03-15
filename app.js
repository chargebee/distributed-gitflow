/**
 * @param {import('probot').Probot} app
 */
 module.exports = (app) => {
  app.on("pull_request.opened", async (context) => {
    context.log.info(JSON.stringify(context.payload.pull_request, null, 2))
  });
  app.on("pull_request.closed", async (context) => {
    context.log.info(JSON.stringify(context.payload.pull_request, null, 2))
  });
};
