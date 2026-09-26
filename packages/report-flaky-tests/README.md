# Report Flaky Tests

A GitHub action to render a report of flaky E2E tests as markdown.

It writes the report to the file named by its `output-path` input, and writes nothing when no test was flaky. Posting is the caller's job: in this repository `tools/pr-meta` puts it in the single automation comment on the pull request.

It runs straight from the TypeScript sources in `src/`: the `node24` runtime strips the types on the fly, so there is no build step. Two constraints come with that — relative imports must carry their `.ts` extension, and the syntax must be erasable, which rules out enums, namespaces, parameter properties and decorators.

**This package is still experimental and breaking changes could be introduced in future minor versions (`v0.x`). Use it at your own risks.**

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
