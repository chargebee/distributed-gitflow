/**
 * @param {import('probot').Probot} app
 */
 module.exports = (app) => {
  app.on("pull_request.opened", async (context) => {
    context.log.info(context.payload.pull_request)
  });
};
