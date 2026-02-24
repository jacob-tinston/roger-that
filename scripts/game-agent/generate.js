/**
 * Game generation agent. Run via: npm run game-agent
 * Laravel CreateDailyGame job will invoke this script and parse the JSON output.
 * Step logs go to stderr so stdout stays a single JSON line for Laravel.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { z } from 'zod';
import { ChatOpenAI, tools } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

import { getAnswerWithRelationshipsPrompt } from './prompts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Log to stderr so stdout remains only the final JSON line for Laravel to parse
function logStep(step, message, detail = null) {
  const payload = detail != null ? ` ${JSON.stringify(detail)}` : '';
  console.error(`[game-agent] ${step}: ${message}${payload}`);
}

// Load .env from project root (when run via npm run game-agent, cwd is project root)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Read JSON context from stdin when piped (e.g. by Laravel). When run interactively, returns {}.
 * Expected shape: { excluded_answer_names?: string[] }
 */
async function readContextFromStdin() {
  if (process.stdin.isTTY) return {};
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  const trimmed = data.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    return {};
  }
}

const AnswerSchema = z.object({
  name: z.string().describe('Full legal or stage name'),
  birth_year: z.number().int().min(1900).max(2010).describe('Four-digit birth year'),
  gender: z.enum(['male', 'female']).describe('Gender'),
  tagline: z.string().describe('Short, witty, cheeky tagline (2–7 words)'),
});

const RelationshipSchema = z.object({
  name: z.string().describe('Full legal or stage name'),
  birth_year: z.number().int().min(1900).max(2010).describe('Four-digit birth year'),
  gender: z.enum(['male', 'female']).describe('Gender'),
  tagline: z.string().describe('Short, witty tagline (2–7 words)'),
  citation: z.string().url().describe('URL to article proving this relationship (Avoid Wikipedia if possible)'),
});

const AnswerWithRelationshipsSchema = z.object({
  answer: AnswerSchema,
  relationships: z.array(RelationshipSchema).length(4).describe('Exactly 4 celebrities the answer was in a relationship with'),
});

/** Extract plain text from AIMessage content (string or array of parts). */
function getMessageText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.text ?? ''))
      .join('');
  }
  return '';
}

/** Extract JSON from model output, optionally inside markdown code block. */
function parseJsonFromResponse(text) {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  return JSON.parse(raw);
}

/**
 * Pick the answer celebrity and 4 relationship partners with citation URLs.
 * Uses OpenAI web search tool for up-to-date relationship info and real citation URLs.
 * @param {{ excluded_answer_names?: string[] }} context - Optional context (e.g. from stdin); excluded names must not be chosen as the answer.
 * @returns {Promise<z.infer<typeof AnswerWithRelationshipsSchema>>}
 */
async function pickAnswerAndRelationships(context = {}) {
  const excludedAnswerNames = context.excluded_answer_names ?? [];
  logStep('pickAnswerAndRelationships', 'starting');
  logStep('pickAnswerAndRelationships', 'excluded answer names', { count: excludedAnswerNames.length });
  logStep('pickAnswerAndRelationships', 'using OpenAI web search tool for up-to-date relationships');

  const examplePath = path.join(__dirname, 'templates', 'answer-with-relationships.example.json');
  const example = fs.existsSync(examplePath)
    ? JSON.stringify(JSON.parse(fs.readFileSync(examplePath, 'utf8')), null, 2)
    : '{}';

  logStep('pickAnswerAndRelationships', 'loaded example template', { path: examplePath });

  const model = new ChatOpenAI({
    model: process.env.OPENAI_MODEL,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = getAnswerWithRelationshipsPrompt(example, excludedAnswerNames);

  logStep('pickAnswerAndRelationships', 'calling OpenAI with web search');

  const response = await model.invoke([new HumanMessage(prompt)], {
    tools: [
      tools.webSearch({
        search_context_size: 'high',
      }),
    ],
  });

  const text = getMessageText(response.content);
  if (!text) {
    throw new Error('Model returned empty content');
  }

  let parsed;
  try {
    parsed = parseJsonFromResponse(text);
  } catch (e) {
    logStep('pickAnswerAndRelationships', 'failed to parse JSON', { raw: text.slice(0, 200) });
    throw e;
  }

  const result = AnswerWithRelationshipsSchema.parse(parsed);

  logStep('pickAnswerAndRelationships', 'done', {
    answer: result.answer?.name,
    relationshipCount: result.relationships?.length ?? 0,
  });

  return result;
}

/**
 * Main flow: chained steps for game generation.
 * When stdin is piped (e.g. by Laravel), reads JSON context with excluded_answer_names.
 * Output is printed as a single JSON line to stdout so Laravel can parse it.
 */
async function run() {
  logStep('run', 'game-agent started');

  const context = await readContextFromStdin();
  if ((context.excluded_answer_names ?? []).length > 0) {
    logStep('run', 'context loaded from stdin', { excludedCount: context.excluded_answer_names.length });
  }

  const { answer, relationships } = await pickAnswerAndRelationships(context);

  const output = { answer, relationships };
  logStep('run', 'output ready, writing to stdout');
  // Single JSON line for Laravel to parse
  console.log(JSON.stringify(output));
}

run().catch((err) => {
  console.error('[game-agent] fatal:', err);
  process.exit(1);
});
