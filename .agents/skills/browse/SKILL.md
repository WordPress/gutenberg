---
name: browse
description: Use when checking a change by hand in the real editor or admin, from the command line: open a logged-in browser on the local site, set up content, use the keyboard, call the REST API, and read back the blocks or the page.
---

# Browse

`npm run browse` drives one browser on this checkout's WordPress site. The browser stays open between commands, so each command continues where the last one stopped. It uses `WP_BASE_URL`, like the e2e tests, and defaults to `http://localhost:8889`.

Always pass the command after `--`, so npm does not take its flags. Run `npm run browse -- open` first: it opens the browser on the dashboard, logged in as admin.

## Commands

Each one calls an e2e test util from `packages/e2e-test-utils-playwright/src`, which shows the options it takes. Arguments are read as JSON when they are JSON, otherwise as text.

| Command | Does | Test util |
| --- | --- | --- |
| `new-post [options]` | Opens a new post, e.g. `new-post '{"postType":"page","content":"<block markup>"}'`. | `admin.createNewPost`, `editor.setContent` |
| `edit-post <id>` | Opens a post in the editor. | `admin.editPost` |
| `site-editor [options]` | Opens the site editor. | `admin.visitSiteEditor` |
| `content [markup]` | Prints the post's block markup, or sets it. | `editor.getEditedPostContent`, `editor.setContent` |
| `blocks [blocks]` | Prints the blocks with all their attributes, as JSON, or sets them from the same shape, e.g. `blocks '[{"name":"core/heading","attributes":{"content":"Hi"}}]'`. | `editor.getBlocks`, `editor.insertBlock` |
| `insert <block>` | Inserts a block, in the shape `blocks` prints, e.g. `insert '{"name":"core/heading","attributes":{"level":3}}'`. | `editor.insertBlock` |
| `transform <name>` | Transforms the selected block, e.g. `transform core/paragraph`. | `editor.transformBlockTo` |
| `keys <keys>` | Presses keys, with `primary` for Cmd or Ctrl, e.g. `keys primary+z`. | `pageUtils.pressKeys` |
| `focus` | Prints what has keyboard focus. | `editor.getFocusOwnerLabel` |
| `save`, `publish` | Saves a draft, or publishes. | `editor.saveDraft`, `editor.publishPost` |
| `api <method> <path> [data]` | Calls the REST API as admin, like curl, e.g. `api POST /wp/v2/posts '{"title":"Hi"}'`. Needs no browser. | `requestUtils.rest` |

## Everything else: playwright-cli

Any other command goes to [playwright-cli](https://playwright.dev/docs/getting-started-cli) in the same browser: `snapshot` (the page as text, with refs), `click <ref>`, `type <text>`, `press <key>`, `goto <full URL>`, `screenshot`, `close`. Run `npm run browse -- --help` for the full list; its first lines point to playwright-cli's own skill.

To record a video of a check, wrap the steps in `video-start` and `video-stop`, which prints the file's path. It records everything on the page, including the commands above. `video-chapter <title>` marks a step, and `video-show-actions` labels each action on screen.

## Check a change

1. Run `open`, then set the page up, for example with `new-post`.
2. Check the setup with `blocks` or `snapshot` before acting.
3. Act with the keyboard where a user would. Click a block before typing into it.
4. Check the result exactly with `blocks`, including attributes, and `snapshot` or `screenshot` for what is on screen.

```sh
npm run browse -- open
npm run browse -- new-post '{"content":"<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->"}'
npm run browse -- snapshot
npm run browse -- click <ref of the paragraph>
npm run browse -- press End
npm run browse -- press Enter
npm run browse -- blocks
```

A check by hand does not replace an e2e test. Once the steps work, write them as one.
