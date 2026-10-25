---
name: browse
description: Use when checking a change by hand in the real editor or admin, from the command line: open a logged-in browser on the local site, set up content with the e2e test utils, use the keyboard, and read back the blocks or the page.
---

# Browse

`npm run browse` drives one browser on this checkout's WordPress site. The browser stays open between commands, so each command continues where the last one stopped. It uses `WP_BASE_URL`, like the e2e tests, and defaults to `http://localhost:8889`.

Always pass the command after `--`, so npm does not take its flags.

## Commands

-   `npm run browse -- open`: opens the browser on the dashboard, logged in as admin. Run it first.
-   `npm run browse -- <helper>.<method> [args]`: calls an e2e test util on the open page. The helpers are `admin`, `editor`, `pageUtils` and `requestUtils`, with the same methods as in the tests; see `packages/e2e-test-utils-playwright/src/<helper>`. Each argument is read as JSON when it is JSON, otherwise as text, and the return value is printed as JSON.
-   Any other command goes to [playwright-cli](https://playwright.dev/docs/getting-started-cli) in the same browser: `snapshot` (the page as text, with refs), `click <ref>`, `type <text>`, `press <key>`, `goto <full URL>`, `screenshot`, `close`. Run `npm run browse -- --help` for the full list; its first lines point to playwright-cli's own skill.

```sh
npm run browse -- open
npm run browse -- admin.createNewPost
npm run browse -- editor.setContent '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->'
npm run browse -- editor.insertBlock '{"name":"core/heading"}'
npm run browse -- pageUtils.pressKeys primary+z
npm run browse -- editor.getBlocks
```

Set blocks with `editor.setContent`, not with `createNewPost`'s `content`: WordPress escapes block markup there.

## Check a change

1. Run `open`, then set the page up, for example with `admin.createNewPost` and `editor.setContent`.
2. Check the setup with `editor.getBlocks` or `snapshot` before acting.
3. Act with the keyboard where a user would. Click a block before typing into it.
4. Check the result exactly with `editor.getBlocks`, including attributes, and `snapshot` or `screenshot` for what is on screen.

A check by hand does not replace an e2e test. Once the steps work, write them as one.
