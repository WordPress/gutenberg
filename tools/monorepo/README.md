# Monorepo Tools

Internal tooling for maintaining this monorepo. The workspace is private: it gives the shared configuration one home and a stable name, and nothing here is meant for use outside the repo.

## TypeScript

`tsconfig/base.json` holds the compiler options every TypeScript project in the repo inherits, and `tsconfig/dev.base.json` extends it for the test and story files that never emit declarations.

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

`typings/` holds the ambient type declarations the whole repo relies on: the `gutenberg-env`, `gutenberg-test-env` and `gutenberg-vitest-test-env` globals, the CSS and style-import module shims, and the stubs that stand in for packages that ship no types yet. They live here so `tsconfig/base.json` can point at them without walking out of the workspace, which is why it needs a single type root rather than one per consumer.

See the TypeScript section of [`packages/README.md`](../../packages/README.md) for how a package lays its projects out.
