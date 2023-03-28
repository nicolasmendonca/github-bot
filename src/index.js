import http from "http";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { PullRequestReviewCommentController } from "./controllers/PullRequestReviewComment.controller.js";
import { environment } from "./environment.js";

const webhooks = new Webhooks({
  secret: environment.GITHUB_WEBHOOK_SECRET,
  log: console,
});

webhooks.on(
  "pull_request_review_comment",
  PullRequestReviewCommentController.handleCreated
);

webhooks.onAny((event) => {
  console.log(event.name);
});

http
  .createServer(
    createNodeMiddleware(webhooks, {
      path: "/webhooks",
    })
  )
  .listen(8080, () => {
    console.log("server is running");
  });
