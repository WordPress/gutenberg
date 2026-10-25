---
name: browse
description: Use when checking a change by hand in the real editor or admin, from the command line: open a logged-in browser on the local site, set up content, use the keyboard, call the REST API, and read back the blocks or the page.
---

# Browse

`npm run browse` drives one browser on this checkout's WordPress site. The browser stays open between commands, so each command continues where the last one stopped. It uses `WP_BASE_URL`, like the e2e tests, and defaults to `http://localhost:8889`.

Always pass the command after `--`, so npm does not take its flags. Run `npm run browse -- open` first: it opens the browser on the dashboard, logged in as admin.

## Gutenberg commands: `gb`

`npm run browse -- gb <command>` calls an e2e test util from `packages/e2e-test-utils-playwright/src`, which shows the options it takes. Arguments are read as JSON when they are JSON, otherwise as text.

| Command | Does | Test util |
| --- | --- | --- |
| `gb new-post [options]` | Opens a new post, e.g. `gb new-post '{"postType":"page","content":"<block markup>"}'`. | `admin.createNewPost`, `editor.setContent` |
| `gb edit-post <id>` | Opens a post in the editor. | `admin.editPost` |
| `gb site-editor [options]` | Opens the site editor. | `admin.visitSiteEditor` |
| `gb content [markup]` | Prints the post's block markup, or sets it. | `editor.getEditedPostContent`, `editor.setContent` |
| `gb blocks [blocks]` | Prints the blocks with all their attributes, as JSON, or sets them from the same shape, e.g. `gb blocks '[{"name":"core/heading","attributes":{"content":"Hi"}}]'`. | `editor.getBlocks`, `editor.insertBlock` |
| `gb insert <block>` | Inserts a block, e.g. `gb insert '{"name":"core/heading"}'`. | `editor.insertBlock` |
| `gb transform <name>` | Transforms the selected block, e.g. `gb transform core/paragraph`. | `editor.transformBlockTo` |
| `gb keys <keys>` | Presses keys, with `primary` for Cmd or Ctrl, e.g. `gb keys primary+z`. | `pageUtils.pressKeys` |
| `gb focus` | Prints what has keyboard focus. | `editor.getFocusOwnerLabel` |
| `gb save`, `gb publish` | Saves a draft, or publishes. | `editor.saveDraft`, `editor.publishPost` |
| `gb api <method> <path> [data]` | Calls the REST API as admin, like curl, e.g. `gb api POST /wp/v2/posts '{"title":"Hi"}'`. Needs no browser. | `requestUtils.rest` |

## Everything else: playwright-cli

Any command without `gb` goes to [playwright-cli](https://playwright.dev/docs/getting-started-cli) in the same browser: `snapshot` (the page as text, with refs), `click <ref>`, `type <text>`, `press <key>`, `goto <full URL>`, `screenshot`, `close`. Run `npm run browse -- --help` for the full list; its first lines point to playwright-cli's own skill.

## Check a change

1. Run `open`, then set the page up, for example with `gb new-post`.
2. Check the setup with `gb blocks` or `snapshot` before acting.
3. Act with the keyboard where a user would. Click a block before typing into it.
4. Check the result exactly with `gb blocks`, including attributes, and `snapshot` or `screenshot` for what is on screen.

```sh
npm run browse -- open
npm run browse -- gb new-post '{"content":"<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->"}'
npm run browse -- snapshot
npm run browse -- click <ref of the paragraph>
npm run browse -- press End
npm run browse -- press Enter
npm run browse -- gb blocks
```

A check by hand does not replace an e2e test. Once the steps work, write them as one.
