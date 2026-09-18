# Monorepo Tools

Internal tooling for maintaining this monorepo. The workspace is private: it gives the shared configuration one home and a stable name, and nothing here is meant for use outside the repo.

## TypeScript

`tsconfig/base.json` holds the compiler options every TypeScript project in the repo inherits, and `tsconfig/dev.base.json` extends it for the test and story files that never emit declarations. The files are named `tsconfig.base.json` and `tsconfig.dev.base.json` on disk so editors match them against their `tsconfig.*.json` pattern and allow comments; the [subpath export](package.json) maps the shorter specifier onto them.

```json
{
	"extends": "@wordpress/monorepo-tools/tsconfig/base.json"
}
```

Both are presets. The solution files that list the repo's projects — `tsconfig.json` and `tsconfig.build.json` — stay at the repo root, where `tsc` and editors expect to find them.

Paths inside these presets fall into two groups, and the difference matters when editing them:

-   `${configDir}` resolves against the project doing the extending, so it is what per-project paths such as `rootDir` and `include` use.
-   A plain relative path resolves against this directory, so `../typings` reaches the ambient declarations below.

## Typings

`typings/` holds the ambient type declarations the whole repo relies on: the `gutenberg-env` and `gutenberg-vitest-test-env` declarations, the CSS and style-import module shims, and the stubs that stand in for packages that ship no types yet. They live here so `tsconfig/base.json` can point at them without walking out of the workspace, which is why it needs a single type root rather than one per consumer.

See the TypeScript section of [`packages/README.md`](../../packages/README.md) for how a package lays its projects out.

## Experimental API audit

`npm run --workspace @wordpress/monorepo-tools list-experimental-apis` prints a Markdown list of every `__experimental` API in `packages/` and `lib/`, each linked to a GitHub search for it. Release leads run it to audit experimental APIs ahead of a major WordPress release, as in [the WordPress 6.2 audit](https://github.com/WordPress/gutenberg/issues/47196).

## Patching

[`patching/`](./patching) creates and applies the dependency patches in [`patches/`](../../patches). `patch apply` runs from the repository root's `postinstall`.
