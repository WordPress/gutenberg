# AGENTS.md

## Dev environment tips

```bash
# Setup
nvm use                    # Use the required node version
npm install && composer install
npm run wp-env-test status      # Always check status first.
npm run wp-env-test start       # Only start if not already running.

# Development
npm start     # Development with watch
npm run build # Production build; emits types with --noCheck, does NOT type check
```

`npm run build` never fails on type errors. After changing TypeScript or checked JS, run `npm run typecheck`.

### Key Directories

-   `/packages/` - JavaScript packages (each has README.md and CHANGELOG.md)
-   `/routes/` - Route entry points for the admin single-page apps, one directory per route; each declares the page(s) it belongs to (the extensible site editor, the dashboard, the media editor, and others)
-   `/lib/` - PHP code
-   `/lib/compat/wordpress-X.Y/` - Version-specific features (new PHP features usually go here)
-   `/phpunit/` - PHP tests
-   `/schemas/json/` - JSON Schemas for `block.json`, `theme.json`, `font-collection.json`, and `wp-env.json` (published to `schemas.wp.org`; tests in `/test/integration/`)
-   `/docs/` - Documentation
    -   `/docs/contributors/` - Contributing guides
    -   `/docs/explanations/architecture/` - System architecture docs
    -   `/docs/how-to-guides/` - Implementation tutorials
    -   `/docs/reference-guides/` - API documentation

## Progressive discovery

Read only what your task needs, when it needs it:

-   **Contributor docs**: before starting a task, check `docs/contributors/code/` for the guide covering that kind of work (coding guidelines, backward compatibility, workspaces, releases) and read the relevant one.
-   **User-facing copy**: before writing or changing a string a user reads, read `docs/contributors/documentation/copy-guide.md` — it covers terminology, capitalization, and how to word an error message.
-   **Directory guides**: some directories carry their own `AGENTS.md` and `README.md` with rules for working there (e.g. `packages/components/AGENTS.md`) — read it before changing files in that directory.

## Code quality

```bash
npm run format            # Fix JS formatting
npm run lint:js          # Check JS linting
npm run typecheck        # Type check sources, plus TypeScript tests and stories
vendor/bin/phpcbf        # Fix PHP standards
vendor/bin/phpcs         # Check PHP standards

# Specific files
vendor/bin/phpcbf <path_to_php_file.php>
```

## Architectural decisions

-   **Package layering**: Three editor layers — `block-editor` (generic, WP-agnostic) → `editor` (WordPress post-type-aware) → `edit-post`/`edit-site` (full screens). Lower layers MUST NOT depend on higher ones.
-   **Site editor parity**: the site editor exists twice — `packages/edit-site` (v1) and the extensible site editor (v2: the `routes/*` entry points declaring the `site-editor-v2` page, booted by `packages/boot`, behind the `gutenberg-extensible-site-editor` experiment). Any feature or enhancement added to the site editor MUST be added to the extensible site editor in the same change, so the two do not drift. If a feature deliberately does not belong in v2, say so explicitly instead of silently skipping it.
-   **Block data model**: Blocks are in-memory tree structures during editing, serialized as HTML with comment delimiters (`<!-- wp:name -->`). Work with the block tree via APIs, not the serialized HTML.
-   **Data layer**: Uses `@wordpress/data` (Redux-like stores). Edit entities through `core-data` actions (`editEntityRecord` / `saveEditedEntityRecord`), not direct state manipulation.
-   **Styles system**: Three-layer merge — WordPress defaults < `theme.json` < user preferences. Use Block Supports API and CSS custom properties (`--wp--preset--*`), not hardcoded values.
-   **Modularity**: Packages are available both as npm packages and WordPress scripts (`wp-*` handles). Production packages must work in both contexts.

For full architecture details, see `docs/explanations/architecture/`.

## Common pitfalls

-   Do not add dependencies to the root `package.json`. Add them to the workspace that uses them, or create a new workspace under `tools/` (or `test/` for test infrastructure). See [Workspace Development](docs/contributors/code/workspace-development.md).
-   PHP features in `lib/compat/` MUST go in the `wordpress-X.Y/` directory for their intended WordPress release. Inspect the available compatibility directories first; do not assume the newest one is right.
-   Avoid using private APIs in bundled packages (packages without `wpScript` or `wpModuleExports`). Private APIs are intended for Core usage; bundled packages may also be imported via npm into plugin scripts, causing incompatibilities.
-   Avoid adding new APIs prefixed with `__experimental` or `__unstable`. This pattern is now not used. Instead use private APIs or in bundled packages regular exports.
-   `block-editor` is a WordPress-agnostic package. NEVER add `core-data` dependencies or direct REST API calls to it.
-   `@wordpress/build` (`packages/wp-build`) is a generic build tool used both in Gutenberg and by plugins targeting WordPress Core directly. Avoid Gutenberg-specific changes in it.
-   Never invoke WordPress's forked or local CLIs through `npx` (e.g. `npx prettier`, `npx wp-scripts`). WordPress ships its own `wp-prettier` fork, and `wp-scripts` is the bin name of `@wordpress/scripts`. A bare `npx wp-scripts` can resolve to an unrelated third-party package on the public registry, not the local tool. Use the npm scripts instead (`npm run format`, `npm run lint:js`, `npm run lint:css` and so on), which run the binaries from local `node_modules`.
-   PHP function and class names are renamed at build time (`gutenberg_*` prefix, `*_Gutenberg` suffix) to avoid conflicts with WordPress Core — the built names, not the source names, are what runs (and what tests must call). See `docs/contributors/code/build-system-function-prefixing.md`.
-   Code changes in a package that have an external impact to consumers should be accompanied by an entry in that package's `CHANGELOG.md`. Entries in the changelog should have a PR reference. In some cases you may not know the PR reference, ask the user. See `docs/contributors/code/managing-packages.md`.
-   Packages with TypeScript dev files split their configs: `tsconfig.build.json` (src only, emits `build-types`) and the default `tsconfig.json` (dev project: tests and stories, `noEmit`, jest types). Packages without dev files keep a single `tsconfig.json` build project, and a few packages deviate (a dev-only project with handwritten declarations, or specialized build projects); see the TypeScript section in `packages/README.md`. Reference a split package by `../<pkg>/tsconfig.build.json` and an unsplit one by `../<pkg>`. `npm run build` never type checks (it emits declarations with `--noCheck`); use `npm run typecheck`, and never add jest types to a build project.
-   A rejected `apiFetch` is not always an `Error`: a REST error arrives as a plain object (`{ code, message, data }`), `parse: false` rejects with the `Response` (which carries `status`, not `message`), an aborted request rethrows an `AbortError`, and a handler set via `setFetchHandler` can reject anything. Do not interpolate the rejection into a string (`` `${ error }` `` gives `[object Object]`) or branch on `instanceof Error`. Normalise it to a message before showing the user anything, and supply your own copy when there is none — `ensureError` in `packages/core-data/src/private-actions.js` is the reference implementation, though it is local to that file rather than exported.

## PR instructions

-   Ensure build passes.
-   Fix all formatting/linting issues; these are enforced through CI in PRs.
