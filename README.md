# dall-e-cli

Generate images from prompts using OpenAI's Images API.

![quick_brown_fox_jumps](https://github.com/user-attachments/assets/1d25d98a-6856-4a8d-9175-21b47f15fdee)


## Install (npm)

```bash
npm install -g @storbeck/dall-e
```

Package: https://www.npmjs.com/package/@storbeck/dall-e

## Install (local)

```bash
npm link
```

## Usage

```bash
OPENAI_API_KEY=... dall-e -p "a red fox in a snowy forest"
```

Run without installing:

```bash
OPENAI_API_KEY=... npx @storbeck/dall-e -p "a red fox in a snowy forest"
```

Options:

- `-p, --prompt <text>` prompt to generate (required)
- `-o, --out <dir>` output directory (default: `outputs`)
- `-n, --count <number>` number of images (default: `1`)
- `--size <size>` image size (default: `1024x1024`)
- `--model <name>` model name (default: `gpt-image-1.5`)
- `--name <prefix>` output filename prefix (default: `image`)
- `--json` print raw JSON response

## Example

```bash
OPENAI_API_KEY=... dall-e -p "a coral reef in the style of a woodblock print" \
  --size 1024x1024 \
  --count 2 \
  --out ./outputs \
  --name reef
```

## Notes

- The API key is read from `OPENAI_API_KEY`.
- Images are saved as PNG files using base64 data returned by the API.
