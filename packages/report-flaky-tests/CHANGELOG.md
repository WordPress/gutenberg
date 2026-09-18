<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Changes

-   Flaky tests are no longer reported to GitHub issues, and are no longer reported on pushes. The action now only comments the detected tests, together with their errors, on the pull request. The `label` input has been removed as a result.
-   The action now runs straight from its TypeScript sources on Node's type stripping, instead of from a bundle. Relative imports must carry their `.ts` extension, and the syntax must be erasable — no enums, namespaces, parameter properties or decorators.

### Internal

-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81517](https://github.com/WordPress/gutenberg/pull/81517))

-- Initial version of the package.
