import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

const environmentSchema = z.object({
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  GITHUB_PRIVATE_KEY: z.string().min(1),
  GITHUB_APP_ID: z.string().min(1),
  OPEN_AI_API_KEY: z.string().min(1),
});

/** @type {import('./types').Environment} */
export const environment = environmentSchema.parse(process.env);
