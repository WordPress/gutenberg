# Workspace Development

The Gutenberg repository is an [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces) monorepo. Beyond the published `@wordpress/*` packages under `packages/`, the repo also contains internal workspaces for development tools (`tools/*`), test infrastructure (`test/*`), and related projects (`storybook`, `widgets/*`, `routes/*`).

This guide explains how to add or modify those internal workspaces, and why dependencies should land in a workspace rather than in the root `package.json`.

## Why workspaces, not root dependencies

Anything added to the root `package.json` becomes implicitly available to every workspace in the repo, which makes it hard to tell which workspace actually needs a given dependency. Keeping root lean has several benefits:

-   **Separation of concerns.** Each workspace declares the dependencies it needs to function, making the relationship between code and dependencies explicit.
-   **Cleaner root.** The root `package.json` only contains repo-wide tooling (lint, format, type-check, git hooks, monorepo orchestration). Reviewing dependency changes is easier when the root is small.
-   **Fewer merge conflicts.** Contributors can update a workspace's dependencies without touching the root.
-   **Phantom dependency prevention.** With npm's hoisted install strategy, dependencies are hoisted to the root `node_modules`, so a workspace can accidentally import a dependency it never declared. A clean root keeps these relationships honest now, and is a prerequisite for moving to an isolated dependency approach in the future (one proposal under discussion is a [migration to pnpm](https://github.com/WordPress/gutenberg/pull/74689)), where workspaces can only see their own declared dependencies.

The default answer for "where does this dependency go?" is **a workspace**, not the root. If you find yourself reaching for the root `package.json`, consider whether the dependency can live in:

-   An **existing workspace** under `tools/` or `test/` that already covers the use case (for example, `@wordpress/eslint-tools`, `@wordpress/release-tools`, `@wordpress/validation-tools`, `@wordpress/unit-tests`).
-   A **new workspace** under `tools/` (or `test/` for test infrastructure) if no existing one fits.

## Where workspaces live

| Location              | Purpose                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `packages/*`          | Published `@wordpress/*` npm packages. See [Managing Packages](/docs/contributors/code/managing-packages.md).                    |
| `tools/*`             | Internal development tools (ESLint config, release CLI, API doc generator, validation, etc.). Not published to npm.             |
| `test/*`              | Test infrastructure (unit, integration, e2e, performance, native, storybook-playwright).                                        |
| `storybook`           | The Gutenberg Storybook host.                                                                                                   |
| `routes/*`            | Editor route entry points.                                                                                                      |
| `widgets/*`           | Widget bundles.                                                                                                                 |

The set of registered workspace globs lives in the `"workspaces"` array of the root `package.json`. Any directory matched by an existing glob (for example, `tools/*`) is picked up automatically once it contains a `package.json`.

## Creating a new workspace

This pattern was established in [#74640](https://github.com/WordPress/gutenberg/pull/74640) (Storybook conversion) and is the model for subsequent conversions.

### 1. Add a `package.json` in the workspace directory

For an internal tool that is not published to npm:

```json
{
	"name": "@wordpress/<workspace-name>",
	"version": "0.0.0",
	"description": "<short description>",
	"private": true,
	"author": "The WordPress Contributors",
	"license": "GPL-2.0-or-later",
	"homepage": "https://github.com/WordPress/gutenberg/tree/HEAD/tools/<workspace-name>",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/WordPress/gutenberg.git",
		"directory": "tools/<workspace-name>"
	},
	"bugs": {
		"url": "https://github.com/WordPress/gutenberg/issues"
	},
	"devDependencies": {},
	"scripts": {}
}
```

Notes:

-   Use `"private": true` for workspaces that should never be published.
-   List only the dependencies this workspace actually imports or executes.
-   To depend on another workspace in the monorepo, use a `file:` reference (for example, `"@wordpress/scripts": "file:../../packages/scripts"`).

### 2. (Optional) Add a `tsconfig.json`

If the workspace contains TypeScript, extend the shared base config:

```json
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"rootDir": "./",
		"outDir": "./build"
	},
	"include": [ "./**/*.ts" ]
}
```

Then add a project reference for the new workspace in the root `tsconfig.json`.

### 3. Register the workspace (if needed)

If the new workspace lives under a path already covered by a glob in the root `package.json` (for example, `tools/*`), it is registered automatically. Otherwise, add an entry in `workspaces` in the root `package.json`.

### 4. Expose scripts from the repo root

Forward any scripts contributors should run from the repo root using `npm run --workspace`:

```json
"scripts": {
	"my-task": "npm run --workspace @wordpress/<workspace-name> my-task --"
}
```

The trailing `--` forwards extra CLI arguments through to the workspace script (for example, `npm run my-task -- --watch`).

### 5. Add a README

Include a `README.md` in the workspace directory describing what the workspace does, the scripts it exposes, and any non-obvious setup.

### 6. Update CI workflows

CI workflows under `.github/workflows/` should invoke the workspace through the root `npm run` wrappers added in step 4, rather than `cd`-ing into the workspace directory. Keeping CI aligned with the root scripts means contributors run the same commands locally that CI runs.

```yaml
- run: npm ci
- run: npm run my-task
```

## Working with workspaces day-to-day

### Adding or removing a dependency in a workspace

Always scope dependency changes to the workspace that uses them:

```bash
npm install <package> --workspace @wordpress/<workspace-name>
npm uninstall <package> --workspace @wordpress/<workspace-name>
```

These commands update the workspace's `package.json` and the root `package-lock.json`, without touching the root `package.json`.

### Running a workspace script

From the repo root:

```bash
npm run <script> --workspace @wordpress/<workspace-name>
```

Or, if a root-level forwarding script exists (see step 4 above):

```bash
npm run <root-script>
```

### Running a script across all workspaces

To run the same script in every workspace that defines it:

```bash
npm run --if-present --workspaces <script>
```

The root `prelint:js` script is one example of this pattern.

