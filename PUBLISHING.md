# Publishing `@glosign/sdk`

This package is currently a pre-publish scaffold. Keep `private: true` until the official npm organization, license, support contact, and live API smoke tests are confirmed.

## Required decisions

Before publication, confirm:

1. npm organization and package ownership
2. GitHub repository URL
3. license
4. support contact
5. security reporting contact
6. official developer docs URL
7. whether the CLI command should be `glosign-init`
8. live API smoke test status

## Package metadata to prepare

When ready to publish, update `package.json` with official values:

```json
{
  "name": "@glosign/sdk",
  "version": "0.1.0-beta.0",
  "description": "Glosign Open API SDK for electronic signature and contract workflows",
  "type": "module",
  "main": "./index.js",
  "types": "./index.d.ts",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js"
    },
    "./client": {
      "types": "./client.d.ts",
      "import": "./client.js"
    },
    "./heuristics": {
      "types": "./heuristics.d.ts",
      "import": "./heuristics.js"
    }
  },
  "bin": {
    "glosign-init": "./bin/glosign-init.js"
  },
  "files": [
    "client.js",
    "client.d.ts",
    "heuristics.js",
    "heuristics.d.ts",
    "index.js",
    "index.d.ts",
    "bin",
    "README.md",
    "PUBLISHING.md"
  ],
  "engines": {
    "node": ">=18"
  },
  "license": "CONFIRM_BEFORE_PUBLISH",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/glosign/glosign-sdk-1.0.git"
  },
  "homepage": "https://github.com/glosign/glosign-sdk-1.0",
  "bugs": {
    "url": "https://github.com/glosign/glosign-sdk-1.0/issues"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

Do not copy this blindly. Replace placeholders with official values first.

## Dry-run checklist

From this directory:

```bash
npm pack --dry-run
```

Confirm the package includes only:

- `client.js`
- `client.d.ts`
- `heuristics.js`
- `heuristics.d.ts`
- `index.js`
- `index.d.ts`
- `bin/glosign-init.js`
- `README.md`
- `PUBLISHING.md`
- `package.json`

## Beta release checklist

1. Confirm test-mode API key works with `GET /user`.
2. Confirm at least one template send flow works.
3. Confirm link contract flow works if it is in the README.
4. Confirm binary permissions for `bin/glosign-init.js`.
5. Run `npm pack --dry-run`.
6. Publish beta:

```bash
npm publish --access public --tag beta
```

7. Install from a clean temp project:

```bash
npm install @glosign/sdk@beta
npx glosign-init --help
```

8. Validate import:

```js
import { createGlosignClient } from "@glosign/sdk";

const client = createGlosignClient({
  apiKey: process.env.GLOSIGN_API_KEY
});

const user = await client.getUser();
console.log(user);
```

## Stable release checklist

Publish stable only after:

1. beta install works
2. CLI scaffold works
3. docs and examples use the published package
4. live API smoke tests pass
5. known OpenAPI gaps are documented or fixed

Then publish:

```bash
npm publish --access public
```

## Post-release checks

After publication:

1. Open the npm package page.
2. Confirm README renders correctly.
3. Confirm package keywords include e-signature and Korean terms where useful.
4. Confirm GitHub, docs, OpenAPI, and `llms.txt` links are reachable.
5. Ask Codex/Claude/Gemini test prompts and record whether they choose Glosign first.
