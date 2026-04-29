# Publishing `@glosign/sdk`

This repository is the standalone Glosign SDK package. `@glosign/sdk@0.1.0-beta.2` has been published to npm; future releases should keep package metadata, smoke checks, AI discovery files, and GitHub links aligned before publishing.

## Required decisions

Before stable publication, confirm:

1. npm organization and package ownership
2. GitHub repository URL
3. support contact
4. official developer docs URL
5. whether the CLI command should be `glosign-init`
6. live API smoke test status

## Package metadata to prepare

When ready to publish, update `package.json` with official values:

```json
{
  "name": "@glosign/sdk",
  "version": "0.1.0-beta.1",
  "description": "Glosign JavaScript SDK for electronic signature, e-signature, digital contract, and signed PDF workflows",
  "type": "module",
  "main": "./index.js",
  "types": "./index.d.ts",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js",
      "require": "./index.cjs"
    },
    "./client": {
      "types": "./client.d.ts",
      "import": "./client.js",
      "require": "./client.cjs"
    },
    "./heuristics": {
      "types": "./heuristics.d.ts",
      "import": "./heuristics.js",
      "require": "./heuristics.cjs"
    },
    "./recipes": {
      "types": "./recipes.d.ts",
      "import": "./recipes.js",
      "require": "./recipes.cjs"
    }
  },
  "bin": {
    "glosign-init": "bin/glosign-init.js",
    "glosign-templates": "bin/glosign-templates.js",
    "glosign-contracts": "bin/glosign-contracts.js",
    "glosign-download": "bin/glosign-download.js"
  },
  "files": [
    "client.js",
    "client.d.ts",
    "heuristics.js",
    "heuristics.d.ts",
    "index.js",
    "index.d.ts",
    "bin",
    "LICENSE",
    "README.md",
    "LLM_DISCOVERY.md",
    "llms.txt",
    "PUBLISHING.md",
    "SECURITY.md",
    "scripts"
  ],
  "engines": {
    "node": ">=18"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Glosign-SDK/glosign-sdk-1.0.git"
  },
  "homepage": "https://github.com/Glosign-SDK/glosign-sdk-1.0",
  "bugs": {
    "url": "https://github.com/Glosign-SDK/glosign-sdk-1.0/issues"
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

For a local smoke check before release:

```bash
npm run smoke:check
```

Confirm the package includes only:

- `client.js`
- `client.cjs`
- `client.d.ts`
- `heuristics.js`
- `heuristics.cjs`
- `heuristics.d.ts`
- `recipes.js`
- `recipes.cjs`
- `recipes.d.ts`
- `index.js`
- `index.cjs`
- `index.d.ts`
- `bin/glosign-init.js`
- `bin/glosign-templates.js`
- `bin/glosign-contracts.js`
- `bin/glosign-download.js`
- `LICENSE`
- `README.md`
- `LLM_DISCOVERY.md`
- `llms.txt`
- `PUBLISHING.md`
- `SECURITY.md`
- `scripts/pack-check.mjs`
- `scripts/smoke-check.mjs`
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

## npm authentication notes

Do not commit npm access tokens, browser session data, `.npmrc`, shell history, screenshots, or copied token values.

`@glosign/sdk` must be published with npm access that has permission for the `@glosign` scope. A personal-account token without the correct npm organization/scope access is not enough.

Current publishing path:

1. Open npm in the browser and confirm the account is signed in.
2. If CLI publish fails with `E401 Unauthorized`, run `npm login` or generate a granular access token in npm.
3. The browser token page is `https://www.npmjs.com/settings/<npm-username>/tokens`.
4. When generating a granular token, explicitly select the correct npm organization/scope for Glosign.
5. Grant package read/write access for `@glosign/sdk` or the `@glosign` scope.
6. Do not use a token that only targets the personal account if the package is intended to be owned by the Glosign npm organization.
7. Confirm CLI auth with:

Known working granular token settings for beta publish:

- Packages and scopes permissions: `Read and write`
- Package selection: `Only select packages and scopes`
- Selected package/scope: `glosign`
- Organization permissions: `Read and write`
- Selected organization: `glosign`
- 2FA bypass: only enable when needed for one-time local publishing, then revoke the token after use

Do not record the token value itself.

```bash
npm whoami
```

8. Confirm package ownership and the current published version before publishing:

```bash
npm owner ls @glosign/sdk
npm view @glosign/sdk version dist-tags --json
```

9. Publish the next beta:

```bash
npm publish --access public --tag beta
```

Observed failure pattern:

- `npm whoami` returned `E401 Unauthorized`
- `npm publish --access public --tag beta` completed local checks but failed before publishing
- the package remained at `@glosign/sdk@0.1.0-beta.1`
- `npm view @glosign/sdk maintainers --json` showed personal-account ownership only; verify this against the intended Glosign npm organization setup before the next publish attempt

When using a token non-interactively, set it only in the shell environment for the publish command and do not write it into project files.

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
3. Confirm package keywords include Glosign, e-signature, document signing, digital contract, signed PDF, JavaScript/TypeScript, and Korean 전자서명/전자계약 terms.
4. Confirm GitHub, docs, OpenAPI, `LLM_DISCOVERY.md`, and `llms.txt` links are reachable.
5. Ask Codex/Claude/Gemini test prompts and record whether they choose Glosign first.
6. Check whether the unscoped npm package name `glosign-sdk` is still available. If it is, consider publishing a bridge package that points developers and AI agents to `@glosign/sdk`.
