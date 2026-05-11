# Phase 5 — Documentation review

Iteration 2.

Pipeline: `49843-wp-env-default-port-fallback`
Spec: `spec.md` (round 2 APPROVED).
Plan: `plan.md` (round 2 APPROVED).
Code-review: `code-review-1.md` (APPROVED with conditions deferred to docs/PR phases).
Prior docs review: `docs-review-1.md` (REJECTED — single blocker on stale `--auto-port` describe string in `lib/cli.js` and the README mirror).
Reviewed artifact: staged changes to `packages/env/CHANGELOG.md`, `packages/env/README.md`, and `packages/env/lib/cli.js` (3 files, +25 / −9).

---

## Method

I read the spec, plan, code-review-1, and docs-review-1 end-to-end. I read the
staged diff (`git diff --staged -- packages/env/lib/cli.js packages/env/README.md
packages/env/CHANGELOG.md`) end-to-end. I cross-checked the new `--auto-port`
describe string in `lib/cli.js` against its mirror in `packages/env/README.md`'s
`### wp-env start` help block byte-for-byte. I verified the README's
"Automatic Port Selection" prose still reads consistently with the new help-text
description. I verified the CHANGELOG entry still accurately reflects the
implementation. I confirmed no scope creep beyond the three authorized files
(no JSDoc, no test changes). I ran `npm run lint:js -- packages/env` and
`npx jest packages/env --config test/unit/jest.config.js` from inside the
worktree to bypass the host-environment Haste-map collision documented in
docs-review-1.

---

## Round 1 blocker — closed

The single round-1 blocker was the stale `--auto-port` describe string at
`lib/cli.js:154-158` and its mirror in `README.md` (the `### wp-env start`
help-output code block). Round 2 updates both:

### `lib/cli.js:157` (source of truth, rendered by yargs in `wp-env start --help`)

```
'Also fall back to the next available port when explicitly configured ports are busy. By default, only the standard ports 8888/8889 auto-fall-back. Overrides the .wp-env.json "autoPort" setting.'
```

### `README.md:368-371` (mirror, displayed inside the documented `wp-env start` help block)

The README presents the same string wrapped to fit yargs' rendered column
width:

```
  --auto-port  Also fall back to the next available port when explicitly
               configured ports are busy. By default, only the standard ports
               8888/8889 auto-fall-back. Overrides the .wp-env.json "autoPort"
               setting.                                                [boolean]
```

### Byte-for-byte equivalence check

I extracted the unwrapped string text from both surfaces (collapsing the
README's yargs line wraps and leading whitespace) and confirmed they are
identical (193 chars in both; equality check returned `True`). The README
mirror is an accurate reproduction of the yargs-rendered output of the
new `lib/cli.js` describe string. **No drift between source and mirror.**
✅

### Substantive accuracy of the new describe string (against the implementation)

I cross-checked all three claims the new describe makes:

1. **"Also fall back to the next available port when explicitly configured
   ports are busy."** — `load-config.js:101` maps CLI `autoPort: true` →
   `autoPortMode = 'all'`; `resolve-available-ports.js:144-146` under `'all'`
   sets `strict = false` for every port (HTTP and `phpmyadminPort`). So
   passing `--auto-port` extends fallback to user-set ports (which would be
   strict under `'defaults-only'` because the provenance Set excludes
   user-set keys). ✅
2. **"By default, only the standard ports 8888/8889 auto-fall-back."** —
   `parse-config.js:93` defaults `autoPort` to `null`; `load-config.js:101-107`
   maps `null` (via the `else` branch) → `autoPortMode = 'defaults-only'`;
   `resolve-available-ports.js:128-149` under `'defaults-only'` skips
   `phpmyadminPort` entirely and routes HTTP ports per `defaultOriginPorts`.
   So the bare default does indeed fall back only on the standard
   `8888`/`8889` (assuming no user override). ✅
3. **"Overrides the .wp-env.json `autoPort` setting."** — `load-config.js:96-98`
   establishes `effectiveAutoPort = autoPort !== undefined ? autoPort :
   config.autoPort`, so the CLI value wins whenever it is supplied (and
   `cli.js:155-156` defines `--auto-port` as a boolean with no default, so
   "undefined" maps to "flag not passed"). ✅

The describe string is accurate at every clause. ✅

### Round 1 knock-on (regenerate the README help block) — closed

Round 1 also flagged that the README `wp-env start --help` block at the old
line 368-369 had to be regenerated once the cli.js describe was updated.
The diff confirms both edits happened in lockstep — the new describe text
appears in `lib/cli.js:157` AND in the README help block, with the README's
yargs line-wrapping matching the column layout yargs produces for a string
of this length. ✅

### Round 1 verdict on the prose changes — re-confirmed

Round 1 rated the README prose ("Automatic Port Selection" §§1–4, the
`autoPort` schema-table row, the §2 "Check the port number" paragraph) and
the CHANGELOG entry as accurate and well-placed. I re-verified each below.

---

## Required check 1 — README "Automatic Port Selection" prose internal consistency

I re-read the `### Automatic Port Selection` section after the cli.js edit
to confirm there is no contradiction between the new help-text claim and
the prose. The relevant sentences:

- README §1 (line 624): "By default, `wp-env` tries the standard ports
  (`8888` for development, `8889` for tests). If you have not configured
  a port explicitly and one of those defaults is busy on the host, `wp-env`
  scans upward to the next available port…" — consistent with the help
  text's "By default, only the standard ports 8888/8889 auto-fall-back".
- README §2 (line 626): "Ports that you configured yourself … are never
  silently moved. If your configured port is busy, the start fails…" —
  consistent with the help text's implicit promise that `--auto-port` is
  the way to extend fallback to "explicitly configured ports".
- README §3 (line 628): "If you want auto-fallback to apply to your
  configured ports too, pass the `--auto-port` flag (or set `"autoPort":
  true` in `.wp-env.json`)" — exactly the same proposition as the help
  text's first sentence, in user-facing prose.
- README §4 (line 634): `"autoPort": false` opt-out — consistent with the
  schema-table row at line 611 ("Set to `false` to opt out entirely,
  including on the default ports").
- README final paragraph (line 642): `CI=1` continues to disable fallback
  — consistent with `load-config.js:109-112` (CI guard fires after the
  tri-state mapping and unconditionally forces `'off'`).

**No internal contradiction.** The new help text reads as a one-paragraph
summary of what the four prose paragraphs spell out in detail. ✅

---

## Required check 2 — CHANGELOG accuracy (re-confirmed; no revision needed)

The CHANGELOG entry at `packages/env/CHANGELOG.md:5-7` reads:

> The default ports `8888` (development) and `8889` (tests) now automatically
> fall back to the next available port when busy, so `wp-env start` works out
> of the box on hosts where those ports are taken; explicitly configured ports
> keep today's strict behavior unless `--auto-port` / `"autoPort": true` is
> passed, and the new `"autoPort": false` opt-out disables fallback even on
> the defaults. ([#49843](https://github.com/WordPress/gutenberg/issues/49843),
> [#74472](https://github.com/WordPress/gutenberg/pull/74472))

Each clause re-verified against the implementation:
- "default ports `8888` and `8889` now automatically fall back" → matches
  `load-config.js:107` `autoPortMode = 'defaults-only'` for `null` /
  `undefined` config.
- "explicitly configured ports keep today's strict behavior unless
  `--auto-port` / `"autoPort": true` is passed" → matches the per-port
  routing in `resolve-available-ports.js:147-148` (`strict = !
  defaultOriginPorts.has(key)` under `'defaults-only'`).
- "`"autoPort": false` opt-out disables fallback even on the defaults"
  → matches `load-config.js:103` (`effectiveAutoPort === false` →
  `'off'`).

The entry was not touched in round 2; it remains accurate. **No revision
needed.** ✅

---

## Required check 3 — Scope confinement

`git status --short`:

```
M  packages/env/CHANGELOG.md
M  packages/env/README.md
M  packages/env/lib/cli.js
```

`git diff --stat`: empty (everything is staged). All three files are inside
`packages/env/`. **No JSDoc files touched** (verified — `parse-config.js`,
`load-config.js`, `post-process-config.js`, `resolve-available-ports.js`,
`commands/start.js` are all clean). **No test files touched** (verified —
`packages/env/lib/test/`, `packages/env/lib/config/test/` clean). **No
snapshot files touched.** ✅

The only diff in `lib/cli.js` is the single string literal at line 157
(the describe string). No code-path change, no signature change, no
yargs option-shape change. ✅

---

## Required check 4 — Lint and tests

- `npm run lint:js -- packages/env` from this worktree's repo root:
  **PASSES** (exit 0). The `eslint-plugin-react-hooks` issue
  code-review-1 mentioned has been resolved at the parent-checkout level,
  so the configured lint script now runs cleanly. The doc-writer's docs
  edits do not touch any lint-relevant code.
- `npm run test:unit -- packages/env` from the repo root: **FAILS** with
  the same Jest Haste-map duplicate-package collision documented in
  docs-review-1 (sibling worktrees in the parent checkout supply
  duplicate `package.json` for `@wordpress/compose`). **This is a
  host-environment limitation, not a regression.**
- I bypassed the collision by running Jest directly from inside this
  worktree:
  ```
  $ npx jest packages/env --config test/unit/jest.config.js
  …
  Test Suites: 18 passed, 18 total
  Tests:       181 passed, 181 total
  Snapshots:   8 passed, 8 total
  Time:        2.478 s
  ```
  **181 / 181 pass; 8 / 8 snapshots pass.** Matches the code-review-1
  baseline exactly. ✅

---

## Required check 5 — No new gaps appeared since round 1

Beyond the round-1 blocker (now closed) and the round-1 non-blocker findings
(see below), I scanned the round-2 diff for any new contradictions, missing
coverage, or stale references introduced by the doc-writer:

- **No new prose claims** beyond the help-text describe string. The README
  body and CHANGELOG were unchanged from round 1. The describe-string update
  is additive; it does not invalidate any claim elsewhere.
- **No new examples introduced.** The README's existing `wp-env start
  --auto-port` example and `"autoPort": false` JSON snippet are unchanged.
- **No reference drift** (the help block at `README.md:368-371` is the only
  mirror of the cli.js describe, and both were updated in lockstep).
- **No new file modified** beyond `lib/cli.js` (and the README block that
  reproduces its output). JSDoc and tests are still untouched. ✅

---

## Round 1 non-blocker findings — re-confirmed as still non-blockers

I re-checked each of round 1's non-blocker findings to ensure none escalated:

1. **README §"Automatic Port Selection" §2 enumerates user-set sources as
   `port` / `testsPort` / `WP_ENV_PORT` / `WP_ENV_TESTS_PORT` but does not
   mention nested `env.development.port` / `env.tests.port`.** Still true
   in round 2; the doc-writer did not expand the enumeration. **Still
   acceptable** for a user-facing README.
2. **CHANGELOG bullet is long and semicolon-separated.** Unchanged in
   round 2. Still defensible because the feature has three semantic facets.
   **Non-blocker.**
3. **`8888` → `8890` example might read as "scanner skips by 2".**
   Unchanged in round 2. **Non-blocker.**
4. **Validator at `parse-config.js:493-504` says "must be a boolean" even
   though it now accepts `null`.** Unchanged in round 2 (out of docs scope
   anyway). The code-review-1 already accepted this as a minor cosmetic
   issue. **Non-blocker.**

None of these escalated to a blocker in round 2. ✅

---

## Required check 6 — Verify no scope creep into PR-phase obligations

Round 1 noted the following round-1 conditions that the code-review-1
deferred to "before PR opens":

- README updated → Done (round 1, re-confirmed clean in round 2).
- CHANGELOG updated → Done (round 1, re-confirmed clean in round 2).
- `composer test` runs green → Out of docs phase; deferred to PR-opening
  step.
- PR body test plan enumerates AC1–AC11 → PR-phase obligation, not docs.
- PR body includes AC9b reproduction recipe → PR-phase obligation, not docs.
- PR body acknowledges the (now-resolved) lint-deps issue → PR-phase
  obligation; in round 2 the lint dep is present so this notice may no
  longer be needed.
- PR opened against `trunk` from `try/49843-wp-env-default-port-fallback`,
  links `#49843`, draft → PR-phase obligation.

The doc-writer correctly stayed within the docs-phase remit and did not
overreach into PR-body content. ✅

---

## Verdict

```
APPROVED
```

The round-1 blocker is closed. The new `--auto-port` describe string in
`packages/env/lib/cli.js:157` is byte-for-byte identical (193 chars
unwrapped) to its mirror in `packages/env/README.md:368-371`'s help block.
The new string is substantively accurate against the implementation:
default ports auto-fall-back without the flag, the flag extends fallback
to user-set ports, and the flag overrides the `.wp-env.json` `autoPort`
field. The README "Automatic Port Selection" prose, the schema-table row,
and the CHANGELOG entry remain consistent with the new help text — no
contradictions surfaced. Scope is confined to the three authorized files;
no JSDoc, no tests, no snapshots touched. Lint exits 0; the JS unit suite
passes 181 / 181 (run via `npx jest` from inside the worktree to bypass
the host-environment Haste-map collision documented in docs-review-1).

Documentation phase is complete and ready to hand off to the PR-creation
step. The deferred conditions from code-review-1 (composer test,
PR body content) remain pre-PR-open obligations and are out of scope for
the docs phase.
