#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HELP = `dall-e - Generate images via OpenAI Images API

Usage:
  dall-e -p "a red fox in a snowy forest" [options]

Options:
  -p, --prompt <text>   Prompt to generate
  -o, --out <dir>       Output directory (default: outputs)
  -n, --count <number>  Number of images (default: 1)
  --size <size>         Image size (default: 1024x1024)
  --model <name>        Model name (default: gpt-image-1.5)
  --name <prefix>       Output filename prefix
  --json                Print raw JSON response
  -h, --help            Show help

Env:
  OPENAI_API_KEY        API key (required)
`;

function parseArgs(argv) {
  const args = {
    prompt: "",
    out: "outputs",
    count: 1,
    size: "1024x1024",
    model: "gpt-image-1.5",
    name: "image",
    json: false
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      console.log(HELP);
      process.exit(0);
    }
    if (a === "-p" || a === "--prompt") {
      args.prompt = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (a === "-o" || a === "--out") {
      args.out = argv[i + 1] || args.out;
      i += 1;
      continue;
    }
    if (a === "-n" || a === "--count") {
      const v = Number(argv[i + 1]);
      args.count = Number.isFinite(v) && v > 0 ? v : args.count;
      i += 1;
      continue;
    }
    if (a === "--size") {
      args.size = argv[i + 1] || args.size;
      i += 1;
      continue;
    }
    if (a === "--model") {
      args.model = argv[i + 1] || args.model;
      i += 1;
      continue;
    }
    if (a === "--name") {
      args.name = argv[i + 1] || args.name;
      i += 1;
      continue;
    }
    if (a === "--json") {
      args.json = true;
      continue;
    }
  }

  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function requireApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("Missing OPENAI_API_KEY in environment.");
    process.exit(1);
  }
  return key;
}

async function generateImages({ prompt, model, size, count }) {
  const key = requireApiKey();
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      n: count
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${errText}`);
  }

  return res.json();
}

function extFromContentType(contentType) {
  if (!contentType) return ".png";
  const type = contentType.split(";")[0].trim().toLowerCase();
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  return ".png";
}

async function saveImages(data, outDir, namePrefix) {
  if (!data || !Array.isArray(data.data)) {
    throw new Error("Unexpected API response format");
  }

  const saved = [];
  const stamp = safeTimestamp();

  for (let idx = 0; idx < data.data.length; idx += 1) {
    const item = data.data[idx];
    const index = String(idx + 1).padStart(2, "0");
    if (item.b64_json) {
      const filename = `${namePrefix}-${stamp}-${index}.png`;
      const outPath = path.join(outDir, filename);
      fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
      saved.push(outPath);
      continue;
    }

    if (item.url) {
      const res = await fetch(item.url);
      if (!res.ok) {
        throw new Error(`Image download failed: ${res.status}`);
      }
      const ext = extFromContentType(res.headers.get("content-type"));
      const filename = `${namePrefix}-${stamp}-${index}${ext}`;
      const outPath = path.join(outDir, filename);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      saved.push(outPath);
    }
  }

  return saved;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.prompt) {
    console.error("Prompt is required. Use -p or --prompt.\n");
    console.log(HELP);
    process.exit(1);
  }

  ensureDir(args.out);

  const data = await generateImages({
    prompt: args.prompt,
    model: args.model,
    size: args.size,
    count: args.count
  });

  if (args.json) {
    console.log(JSON.stringify(data, null, 2));
  }

  const saved = await saveImages(data, args.out, args.name);
  for (const p of saved) {
    console.log(`Saved: ${p}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
