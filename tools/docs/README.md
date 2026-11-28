# Docs Tools

Scripts that generate the parts of the Gutenberg documentation that come from source code. The workspace is private: the scripts read and write files inside this repository and are not published to npm.

Generated content sits between `<!-- START TOKEN(...) -->` and `<!-- END TOKEN(...) -->` markers, so hand-written text around it is kept. Run the scripts from the repository root:

```sh
npm run docs:build
```

That runs every generator below except `docs:check-api-docs-unstaged`, in the order listed.

## Generators

| Script               | File                      | Reads                                           | Writes                                                                                                     |
| -------------------- | ------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `docs:components`    | `gen-components-docs/`    | `packages/components/src/**/docs-manifest.json` | The `README.md` next to each manifest                                                                      |
| `docs:gen`           | `gen-manifest.cjs`        | `docs/toc.json`, package/component/block docs   | `docs/manifest.json`, the handbook table of contents                                                       |
| `docs:blocks`        | `gen-block-lib-list.js`   | `packages/block-library/src/*/block.json`       | `docs/reference-guides/core-blocks/README.md`, the summary of all core blocks                              |
| `docs:blocks-detail` | `generate-block-docs.mjs` | `packages/block-library/src/*/block.json`       | Each block's `README.md`, `docs/reference-guides/core-blocks/category-*.md` and the deprecated blocks list |
| `docs:api-ref`       | `update-api-docs.js`      | Package source, through `@wordpress/docgen`     | Package `README.md` API sections and `docs/reference-guides/data/data-*.md`                                |
| `docs:theme-ref`     | `gen-theme-reference.mjs` | `schemas/json/theme.json`                       | `docs/reference-guides/theme-json-reference/theme-json-living.md`                                          |

`docs:check-api-docs-unstaged` (`are-api-docs-unstaged.js`) exits with an error when a generated README has unstaged changes, so CI can catch docs that were not regenerated.

## Documenting other blocks

`generate-block-docs.mjs` can also document a directory of blocks outside the block library, such as a plugin's. It writes a `README.md` into each block directory and nothing else; category pages, the deprecated list and handbook links stay specific to core.

```sh
node tools/docs/generate-block-docs.mjs \
    --blocks-dir=../my-plugin/src/blocks \
    --source-url=https://github.com/me/my-plugin/tree/trunk/src/blocks/
```

-   `--blocks-dir`: a directory with one sub-directory per block, each holding a `block.json`.
-   `--source-url` (optional): the URL each block directory name is appended to for the Source links. Without it, the Source section is left out.

This still runs from a Gutenberg checkout, because attribute and supports links are checked against the handbook pages in `docs/`.
