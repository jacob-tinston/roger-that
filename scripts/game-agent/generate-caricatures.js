/**
 * Generate realistic caricature images for celebrities and save to storage.
 * Run by Laravel CreateDailyGame job; reads stdin for { celebrities, output_dir, prompt_variant }.
 * prompt_variant: 1 = primary prompt (attempts 1–2), 2 = alternate prompt (attempts 3–4).
 * Skips any celebrity that already has an image file (avoids dupes).
 * Processes one at a time so a single failure does not lose prior successes.
 * Outputs one JSON line: { generated: [{ name, birth_year, path }], failed: [{ name, birth_year, error }] }.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import OpenAI from 'openai';

import { getCaricaturePrompt } from './prompts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function log(message, detail = null) {
  const payload = detail != null ? ` ${JSON.stringify(detail)}` : '';
  console.error(`[caricatures] ${message}${payload}`);
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/** True if the error looks like a content/safety rejection (often flaky). */
function isSafetyRejection(err) {
  const msg = (err?.message ?? String(err)).toLowerCase();
  const status = err?.status ?? err?.code;
  return (status === 400 || msg.includes('400')) && (msg.includes('safety') || msg.includes('rejected'));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Slug for filename: "Brad Pitt" -> "brad-pitt" */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Read JSON from stdin (when piped). When run interactively, returns {}.
 */
async function readStdin() {
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

/**
 * Generate one caricature image and save to outputDir. Returns relative path (e.g. celebrities/slug.png).
 * If file already exists at outputDir/slug.png, skips generation and returns path.
 * @param {number} promptVariant - 1 = primary prompt, 2 = alternate (moderation-friendly) prompt.
 */
async function generateOne(celebrity, outputDir, client, promptVariant = 1) {
  const slug = slugify(celebrity.name);
  const filename = `${slug}.png`;
  const absolutePath = path.join(outputDir, filename);

  if (fs.existsSync(absolutePath)) {
    log('skip (exists)', { name: celebrity.name, path: filename });
    return { name: celebrity.name, birth_year: celebrity.birth_year, path: `celebrities/${filename}` };
  }

  const prompt = getCaricaturePrompt(celebrity.name, promptVariant);

  log('generating', { name: celebrity.name, prompt_variant: promptVariant });

  const imageModel = process.env.OPENAI_IMAGE_MODEL;

  const requestParams = {
    model: imageModel,
    prompt,
    n: 1,
    size: '1024x1024',
    output_format: 'png',
    quality: 'medium',
  };

  const response = await client.images.generate(requestParams);

  const b64 = response.data[0]?.b64_json;
  if (!b64) throw new Error(`No image data for ${celebrity.name}`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(absolutePath, Buffer.from(b64, 'base64'));

  log('saved', { name: celebrity.name, path: filename });
  return { name: celebrity.name, birth_year: celebrity.birth_year, path: `celebrities/${filename}` };
}

async function run() {
  log('started');

  const input = await readStdin();
  const celebrities = input.celebrities ?? [];
  const outputDir = input.output_dir ?? path.resolve(process.cwd(), 'storage', 'app', 'public', 'celebrities');
  const promptVariant = Math.max(1, Math.min(2, parseInt(input.prompt_variant, 10) || 1));

  if (celebrities.length === 0) {
    log('no celebrities to process');
    console.log(JSON.stringify({ generated: [] }));
    return;
  }

  log('prompt_variant', promptVariant);

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');

  const generated = [];
  const failed = [];

  for (const celebrity of celebrities) {
    let lastError = null;
    let attempt = 0;
    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      try {
        const result = await generateOne(celebrity, outputDir, client, promptVariant);
        generated.push(result);
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        const message = err?.message ?? String(err);
        if (attempt < MAX_ATTEMPTS && isSafetyRejection(err)) {
          log('retry after safety rejection', { name: celebrity.name, attempt, max: MAX_ATTEMPTS });
          await sleep(RETRY_DELAY_MS);
        } else {
          log('failed', { name: celebrity.name, error: message });
          failed.push({
            name: celebrity.name,
            birth_year: celebrity.birth_year,
            error: message,
          });
          break;
        }
      }
    }
  }

  log('done', { generated: generated.length, failed: failed.length });
  console.log(JSON.stringify({ generated, failed }));
}

run().catch((err) => {
  console.error('[caricatures] fatal:', err);
  process.exit(1);
});
