# Toolchain Pinning

## Must fix

- `tools/release/commands/performance.js:363` — Unconditionally installing `npm@10` breaks comparisons against older refs. The command runs `nvm install` from each checked-out ref, and documented/supported refs such as Gutenberg v14–v17 select Node 14 or 16, while npm 10 requires Node 18.17 or newer. Dependency installation then fails before benchmarks run. Select an npm version compatible with each ref’s Node version, or avoid overriding npm in these historical checkouts. The same issue occurs at line 406.

## Should fix

- `package.json:28` — The declared npm range includes versions that do not implement `devEngines`. npm 10.2.3 predates `devEngines`, so developers using an explicitly supported version receive only the existing `engines` warning instead of the intended install failure. Raise the minimum npm version to one that supports `devEngines`—npm 10.9.0 or newer—or retain a separate enforcement mechanism.
