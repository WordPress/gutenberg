---
name: browse
description: Use when checking a change by hand in the real editor or admin, from the command line: open a logged-in browser on the local site, create a post, type and press keys, and read back the blocks or the page.
---

# Browse

`npm run browse` drives one browser on this checkout's WordPress site. The browser stays open between commands, so each command continues where the last one stopped. It uses `WP_BASE_URL`, like the e2e tests, and defaults to `http://localhost:8889`.

Always pass the command after `--`, so npm does not take its flags.

## Our commands

-   `npm run browse -- open`: opens the browser on the site's dashboard, logged in as admin.
-   `npm run browse -- new-post [--content '<block markup>']`: opens a new post, without the welcome guide, optionally with the given blocks.
-   `npm run browse -- blocks`: prints the editor's blocks with their attributes, as JSON.

## Everything else is playwright-cli

Any other command goes to [playwright-cli](https://playwright.dev/docs/getting-started-cli) in the same browser. Run `npm run browse -- --help` for the full list; its first lines also point to playwright-cli's own skill. The ones used most:

-   `snapshot`: the page as text, with a ref for each element.
-   `click <ref>`, `type <text>`, `press <key>`: act on the page. Click a block before typing into it.
-   `goto <full URL>`, `screenshot`, `eval <js>`, `close`.

## Check a change

1. Run `open`, then set the page up, for example with `new-post --content`.
2. Check the setup with `blocks` or `snapshot` before acting.
3. Act with the keyboard where a user would.
4. Check the result exactly with `blocks`, including attributes, and `snapshot` or `screenshot` for what is on screen.

A check by hand does not replace an e2e test. Once the steps work, write them as one.
