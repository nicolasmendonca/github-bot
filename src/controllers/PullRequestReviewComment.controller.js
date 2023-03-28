import { z } from "zod";
import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { OpenAIApi, Configuration } from "openai";
import { environment } from "../environment.js";

export class PullRequestReviewCommentController {
  static ACTIVATION_COMMAND = "gitgpt please review";

  /**
   * @param {import('@octokit/webhooks').EmitterWebhookEvent<'pull_request_review_comment'>} request
   * @returns {Promise<void>}
   */
  static async handleCreated(request) {
    if (
      !request.payload.comment.body.includes(
        PullRequestReviewCommentController.ACTIVATION_COMMAND
      )
    )
      return;

    const installationId = z.number().parse(request.payload.installation?.id);
    const octokitService = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: environment.GITHUB_APP_ID,
        privateKey: environment.GITHUB_PRIVATE_KEY,
        installationId,
      },
    });

    const openAiService = new OpenAIApi(
      new Configuration({
        apiKey: environment.OPEN_AI_API_KEY,
      })
    );

    console.log("received instructions", request.payload.comment.body);

    const prompt = [
      "Please help me review the following pull request diff in a GitHub repository. I need assistance in identifying any bugs, proposing improvements in legibility, code cleanliness, performance, or brevity, and suggesting lightweight solutions. The code is written in an unknown programming language and the overall context of the repo is not available. We only want to analyze the pull request diff provided.",
      "",
      "```diff",
      request.payload.comment.diff_hunk,
      "```",
      "",
      "Please provide your suggestions and feedback in markdown format using rich text. For example, use **bold** for emphasis, `inline code` for code snippets, and bullet points for lists.",
    ].join("\n");

    const completion = await openAiService.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "assistant",
          content: prompt,
        },
      ],
      max_tokens: 3000,
    });
    const comment = completion.data.choices[0].message?.content ?? "";

    console.log("replying with comment", comment);

    await octokitService.rest.pulls.createReplyForReviewComment({
      body: comment,
      comment_id: request.payload.comment.id,
      owner: request.payload.repository.owner.login,
      pull_number: request.payload.pull_request.number,
      repo: request.payload.repository.name,
    });

    console.log("replied with comment");
  }
}
