# `@wordpress/css-modules-tools`

Typed CSS Modules for the Gutenberg monorepo. This workspace is **private** and is not published to npm.

Two complementary tools cover “this class does not exist” errors:

-   **`typed-css-modules` (tcm)** generates a real sibling `.d.ts` file for every `*.module.css` / `*.module.scss` stylesheet (`export const` per class, consumed as `import styles from './foo.module.css'`). `tsc` and Native TypeScript (`tsgo`) both type-check against these files. `npm run css-modules:check` runs tcm’s `--listDifferent` equivalent and fails when a declaration is missing, stale, or orphaned.
-   **`typescript-plugin-css-modules`** is a TypeScript **language-service** plugin. It gives autocomplete and red squiggles in editors that load the workspace JS TypeScript version. It does **not** run during `tsc` / `npm run typecheck` — that is why the generated `.d.ts` files exist.

These tools do not report unused selectors (a class defined in CSS but never read from JS). Shared modules, `composes`, and dynamic lookups such as `styles[ \`is-${ tone }\` ]` make that a separate check.

## Scripts

From the repo root:

```bash
npm run css-modules:generate   # write/update sibling *.d.ts files
npm run css-modules:check      # fail if any .d.ts is missing, stale, or orphaned
```

After adding, renaming, or removing a local class, run `css-modules:generate` and commit the updated declaration next to the stylesheet.

## Editor plugin

`tsconfig.base.json` registers `typescript-plugin-css-modules` for every project. The plugin is ignored by `tsc`.

-   **Classic TS language service** (workspace version of TypeScript): autocomplete and live errors as you type, even before regenerating `.d.ts`.
-   **Native TypeScript Preview / `tsgo`** (the setup in [Getting Started](/docs/contributors/code/getting-started-with-code-contribution.md)): plugins are not loaded. Rely on the committed `.d.ts` files and regenerate after class-name changes.

Class names are typed **as written in CSS** (kebab-case keys such as `styles['box-sizing']`). That matches `@wordpress/build`, which exports the original local names.
