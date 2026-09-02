# Config Tools

Shared tooling configuration for the repo, published internally as
`@wordpress/config-tools`. The workspace is private: it exists so the configs
have one home and a stable name, not for use outside the monorepo.

## TypeScript

`tsconfig/base.json` holds the compiler options every TypeScript project in the
repo inherits, and `tsconfig/dev.base.json` extends it for the test and story
files that never emit declarations.

```json
{
	"extends": "@wordpress/config-tools/tsconfig/base.json"
}
```

Both are presets. The solution files that list the repo's projects —
`tsconfig.json` and `tsconfig.build.json` — stay at the repo root, where `tsc`
and editors expect to find them.

Paths inside these presets fall into two groups, and the difference matters
when editing them:

-   `${configDir}` resolves against the project doing the extending, so it is
    what per-project paths such as `rootDir` and `include` use.
-   A plain relative path resolves against this directory, so anything pointing
    at the repo root has to walk back up (`../../../typings`).

See the TypeScript section of [`packages/README.md`](../../packages/README.md)
for how a package lays its projects out.
