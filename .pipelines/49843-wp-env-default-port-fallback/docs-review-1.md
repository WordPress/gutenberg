# Phase 5 — Documentation review

Iteration 1.

Pipeline: `49843-wp-env-default-port-fallback`
Spec: `spec.md` (round 2 APPROVED).
Plan: `plan.md` (round 2 APPROVED).
Code-review: `code-review-1.md` (APPROVED, with conditions deferred to docs/PR phases).
Reviewed artifact: working-tree changes to `packages/env/README.md` and `packages/env/CHANGELOG.md` (no doc-writer commit yet).

---

## Method

I read the prompt, spec, plan, and code-review-1 end-to-end. I read the
implementation diff (`git diff HEAD~1 HEAD -- packages/env/`) and
cross-checked the doc-writer's working-tree diff (`git diff -- packages/env/README.md
packages/env/CHANGELOG.md`) against the implementation. I read the
relevant source files (`load-config.js`, `parse-config.js`,
`post-process-config.js`, `resolve-available-ports.js`, `commands/start.js`,
`cli.js`) to verify every doc claim. I ran `npm run lint:js -- packages/env`
from the repo root. I attempted `npm run test:unit -- packages/env`; that
command failed due to a sibling-worktree Haste-map collision unrelated to
this change (see §Lint and tests below).

## Diff hygiene

`git status --short` reports exactly two modified files:

```
M  packages/env/CHANGELOG.md
M  packages/env/README.md
```

Both are inside `packages/env/`. **No scope creep**. ✅

---

## Required check 1 — README accuracy

I cross-checked every claim in the README diff against the implementation
on HEAD.

### Tri-state semantics

README config-table row (line 609) for `"autoPort"` reads:

> Tri-state automatic HTTP port selection. When `null` (the default), the
> default ports `8888`/`8889` automatically fall back to the next available
> port if busy, but explicitly configured ports stay strict. Set to `true`
> to also fall back on user-set ports. Set to `false` to opt out entirely,
> including on the default ports.

Source verification:
- `parse-config.js:93` — `autoPort: null` is the default in
  `DEFAULT_ENVIRONMENT_CONFIG`. ✅
- `parse-config.js:494-501` — validator allows `null`, `true`, `false`. ✅
- `load-config.js:96-112` — tri-state mapping: `true → 'all'`,
  `false → 'off'`, anything else (including `null`/`undefined`) →
  `'defaults-only'`. ✅
- `resolve-available-ports.js:128-149` — under `'defaults-only'`,
  `port` (HTTP) routes per provenance; `phpmyadminPort` is skipped;
  under `'all'`, every port is non-strict; under `'off'`, every port
  is strict. ✅

The README claim that `false` "opts out entirely, including on the
default ports" is accurate.

### CI guard

README "Automatic Port Selection" final paragraph:

> Automatic port selection is also disabled whenever the `CI` environment
> variable is set, regardless of the `autoPort` value, so test runs stay
> deterministic.

Source verification: `load-config.js:109-112` — `if ( process.env.CI ) { autoPortMode = 'off'; }`
runs **after** the tri-state mapping and unconditionally forces `'off'`,
which then prevents the resolver from being created at line 114. The
"regardless of the `autoPort` value" clause is correct: `autoPortMode = 'off'`
is set after the user-state-derived mapping. ✅

### "User-set ports stay strict" claim

README §2 paragraph and "Automatic Port Selection" §2:

> Ports you set explicitly (in `.wp-env.json`, in `.wp-env.override.json`,
> or via `WP_ENV_PORT` / `WP_ENV_TESTS_PORT`) are never silently moved.

Source verification:
- `parse-config.js:213-273` — `computeDefaultOriginPorts` /
  `layerSetsDevelopmentPort` / `layerSetsTestsPort` inspect
  `localConfig`, `overrideConfig`, and `environmentVarOverrides` for
  `port`, `testsPort`, `env.development.port`, `env.tests.port`. ✅
- `resolve-available-ports.js:136-149` — under `'defaults-only'` mode,
  `strict = ! defaultOriginPorts.has( key )`. ✅

The list `(port / testsPort / WP_ENV_PORT / WP_ENV_TESTS_PORT)` exactly
matches the env-var enumeration the plan resolved in OQ4 against
`get-config-from-environment-vars.js:36-72`. ✅

**Minor finding (non-blocker):** The README does not mention the
nested form `env.development.port` / `env.tests.port` even though the
implementation honors it (verified at `parse-config.js:243` and `:266`).
A contributor who pins ports per-environment via the `env` block has the
same protection; the README's enumeration is accurate but
non-exhaustive. Acceptable as-is for a user-facing doc.

### Informational notice description

README "Automatic Port Selection" §1:

> The CLI prints a one-line notice through the same spinner used for
> other start-time messages so you can see which port was actually
> bound.

Source verification: `resolve-available-ports.js:80-90` —
`if ( spinner && resolvedPort !== preferredPort ) { spinner.info(...); spinner.start(); }`.
The notice is gated on (a) a spinner being present and (b) an actual
move. It uses the same `spinner` instance the resolver was constructed
with (passed in by `load-config.js:114` from `loadConfig`'s
`{ spinner }` option, originally from `cli.js`'s `withSpinner`). ✅

### Example `.wp-env.json` block

```json
{
	"autoPort": false
}
```

Validator at `parse-config.js:494-503` accepts `boolean` and `null` for
root-level `autoPort`. `false` is valid. ✅

### README §2 ("Check the port number") paragraph

> By default `wp-env` tries port 8888, meaning that the local
> environment will be available at http://localhost:8888. If 8888 is
> busy on your host and you have not configured a port explicitly,
> `wp-env` automatically falls back to the next available port and
> prints the resolved port at start time …

Accurate. The "tries" wording (vs. the previous "uses") correctly
softens the previous fixed-port claim now that fallback is the default.
Cross-references to "Automatic Port Selection" point at the right
anchor.

---

## Required check 2 — CHANGELOG entry

CHANGELOG diff:

```
## Unreleased

### New Features

-   The default ports `8888` (development) and `8889` (tests) now automatically …
```

Verification against the file's existing conventions:

- **Placement under `## Unreleased`.** ✅ The entry lands at lines 5-7
  immediately after the `## Unreleased` heading on line 3.
- **Heading style.** Surrounding entries use `### New Features`,
  `### Enhancements`, `### Bug Fixes`, `### Breaking Changes`,
  `### Deprecation`, `### Internal`. The chosen `### New Features`
  matches the existing entry on line 31 ("Added `--auto-port` flag …")
  which describes a sibling feature, so it is the natural choice. ✅
- **Tone.** The entry reads as a concise user-visible feature
  description with the opt-out documented inline. Consistent with
  surrounding `### New Features` bullets (e.g. lines 33, 43-47). ✅
- **Link format.** `([#49843](https://github.com/WordPress/gutenberg/issues/49843), [#74472](https://github.com/WordPress/gutenberg/pull/74472))`.
  The format `([#NNN](URL))` matches existing entries (e.g. line 11:
  `([#20569](https://github.com/WordPress/gutenberg/issues/20569))`,
  line 33's `--auto-port` entry similarly references the PR). ✅
- **Length.** The bullet is one long sentence (~340 characters).
  Surrounding bullets in the file vary widely; e.g. line 11 is ~280
  chars, line 33 is similar to this one in length. Acceptable. The
  semicolon-separated multi-clause structure is heavy for a CHANGELOG
  bullet but defensible because the feature has three distinct facets
  (default behavior, opt-in semantics for explicit ports, opt-out
  via `false`). **Non-blocker.**

**Minor finding (non-blocker):** The link includes the **issue** for
`#49843` (correct; that's the feature request) and the **PR** for
`#74472` (correct; that's the prior `--auto-port` PR). Both targets
exist. This dual-link pattern is unusual for the CHANGELOG (most
entries link a single `#NNN`) but it's coherent with the spec, which
explicitly threads the new behavior through PR #74472's machinery.

---

## Required check 3 — JSDoc cross-check

I read the JSDoc in every touched source file to verify the tri-state
is described consistently.

| File | Symbol | JSDoc state | Verdict |
|---|---|---|---|
| `commands/start.js` | `start` `@param options.autoPort` (line 32) | `{boolean\|undefined}` … "Tri-state: `true` enables … fallback for every port …; `false` disables … even on default ports; `undefined` (the typical case — flag not supplied) defers to `.wp-env.json`'s `autoPort` field, where unset/`null` means 'auto-fallback only on default ports'." | ✅ Tri-state described. |
| `config/load-config.js` | `loadConfig` `@param options.autoPort` (line 44) | `{boolean\|undefined}` … "Tri-state CLI override … `true` enables fallback for all ports, `false` disables fallback even on default ports, `undefined` defers to `config.autoPort` (which itself is tri-state — `null`/`undefined` means 'fallback only on default ports')." | ✅ Tri-state described. |
| `config/parse-config.js` | `WPRootConfigOptions.autoPort` (line 38) | `{boolean\|null}` … "Tri-state: `null` (unset, default behavior — auto-fallback only on default ports), `true` (auto-fallback for all ports), `false` (strict for all ports)." | ✅ Tri-state described. |
| `config/post-process-config.js` | `postProcessConfig` (lines 18-22) | New `@param options.autoPortMode` describes `'off'`/`'all'`/`'defaults-only'` semantics; `@param options.defaultOriginPorts` describes the Set semantics. | ✅ Both new options documented. |
| `resolve-available-ports.js` | `resolveConfigPorts` (lines 108-115) | Same two new `@param`s with full mode descriptions including the phpmyadminPort skip rule. | ✅ Both new options documented. |
| `resolve-available-ports.js` | `createPortResolver` `resolve` method (lines 42-49) | Adds `@param strict` "When true, fail if the port is busy instead of finding an alternative." | ✅ Already correct. |
| `resolve-available-ports.js` | `createPortResolver` itself (line 35) | "Creates a port resolver that tracks used ports." Brief but accurate. The new "moved port" notice is documented inline at the call site (lines 80-86 inline comment) rather than in the function-level JSDoc. **Acceptable.** |

**No stale JSDoc found.** ✅

---

## Required check 4 — Doc-writer's flagged Open Issue 2 (`lib/cli.js` describe string)

The role brief flags this for adversarial assessment. My verdict:
**leaving the describe string untouched is NOT acceptable; it must be
updated for approval.**

### Evidence

`lib/cli.js:154-158` defines the `--auto-port` flag with this `describe`:

> 'Automatically find available ports when configured ports are busy.
> Overrides the .wp-env.json "autoPort" setting.'

Two reasons this string is now actively misleading:

1. **It implies `--auto-port` is the only path to auto-fallback.**
   Post-this-PR, default ports auto-fall-back without the flag. A
   contributor who reads the CLI help and concludes "ports only
   auto-move when I pass `--auto-port`" will be wrong, and on a busy
   host they will be confused when the start succeeds on a different
   port without their having passed the flag.
2. **It understates what the flag now buys.** The flag now means "also
   auto-fall-back on user-set ports", not the previous "auto-fall-back
   on busy ports at all". A user reading this in `wp-env start --help`
   has no way to discover the new explicit-port semantic.

**Surface where this string is rendered:**
- `wp-env start --help` (yargs auto-generates from `describe`).
- `packages/env/README.md:368-369` reproduces the help output verbatim
  in the `### wp-env start` section. So the README *itself* contains
  the stale string in a code block, even though the doc-writer
  correctly updated the prose elsewhere. This contradicts the prose at
  README lines 605-630 that the doc-writer rewrote. **The README is
  internally inconsistent until cli.js is updated** (or until the
  rendered help block in README is hand-edited, which is brittle and
  risks drifting from the actual CLI output).

### On the role-brief's "do not change source code" caveat

The brief notes: "the role brief said 'Do NOT change behavior, source
code under `lib/` (other than JSDoc cleanup if strictly needed)'. A
user-facing string is not strictly source behavior; verdict is yours."

A `yargs` `describe` string is a documentation surface masquerading
as source code. It is rendered to the user without any code path
executing it as logic. Treating it as documentation rather than
behavior is the correct read. The plan §2 Step 7 explicitly listed
`commands/start.js` JSDoc updates as in-scope for the implementation
phase; an analogous CLI describe-string update is materially the same
kind of doc work and falls within the docs-phase remit.

**Decision: this is a blocker for approval.** The CLI describe string
must be rewritten to reflect the new tri-state contract before the PR
opens. Recommended substance (doc-writer chooses exact wording):

> "Force automatic port selection for every port (including ones you
> explicitly set in .wp-env.json). By default, only the standard
> ports 8888/8889 fall back automatically; this flag extends that to
> user-configured ports. Equivalent to setting `autoPort: true`."

### Knock-on

If the cli.js describe string is updated, the README `wp-env start --help`
block at lines 368-369 must be regenerated to match (or hand-edited
to match the new describe text). The doc-writer should do both in
the same change.

---

## Required check 5 — Coverage of spec acceptance criteria with user-facing surface

For each AC with a user-facing surface, I checked whether the README
covers it.

| AC | User-facing surface? | README coverage |
|---|---|---|
| AC1 — default dev port falls back | Yes | ✅ "Automatic Port Selection" §1; §2 "Check the port number" updated. |
| AC2 — default tests port falls back | Yes | ✅ Same section. The 8889 case is implicit ("default ports `8888`/`8889`"); reasonable for a user-facing README. |
| AC3 — explicit port stays strict | Yes | ✅ "Automatic Port Selection" §2 ("Ports you set explicitly … are never silently moved"). |
| AC4 — `--auto-port` / `autoPort: true` falls back on explicit ports | Yes | ✅ "Automatic Port Selection" §3 with example. |
| AC5 — `autoPort: false` opt-out | Yes | ✅ "Automatic Port Selection" §4 with JSON example. |
| AC6 — `CI=1` disables fallback | Yes | ✅ Final paragraph of "Automatic Port Selection". |
| AC7 — informational message contract | Partial | ✅ The README mentions "prints a one-line notice through the same spinner". Adequate for a user doc. |
| AC8 — CI guard regression detector | No (test-only) | n/a |
| AC9a — resolved port flows downstream | No (internal) | n/a |
| AC9b — live reachability | PR test plan, not README | n/a (deferred to PR body per spec §5). |
| AC9c — other commands see fallback port | Implicit | ✅ Inherited from cached compose; not a separate doc claim to make. |
| AC10 — existing tests stay green | No (test-only) | n/a |
| AC11 — tri-state survives end-to-end | No (test-only / typedef) | ✅ Surface is the `autoPort` row in the schema table; covered. |

**Coverage finding:** the README does NOT mention the upward-scan
directionality explicitly in the §2 paragraph ("Check the port number")
even though spec R1/R2 require upward scan and the source enforces it.
The "Automatic Port Selection" §1 does say "scans upward to the next
available port (for example: `8888` → `8890` → `8891`, ...)". Adequate.
✅

**Coverage finding:** the README also does not mention the "`8888` →
**`8890`** → `8891`" jump-by-2 pattern's reason (both 8888 and 8889 are
checked-or-busy; the example skips 8889 because it's the default tests
port). Could mislead a reader into thinking the scanner goes by 2s.
**Non-blocker** but a nicety.

---

## Required check 6 — Tone and style

I compared the new README prose against the surrounding sections.

- "Check the port number" §2 retains its existing imperative voice
  ("By default …", "You can configure …"). The added clause about
  fallback uses a parallel construction. ✅
- "Automatic Port Selection" §§1-4 use the same paragraph cadence and
  code-block style (sh fence for CLI, json fence for config) as the
  surrounding sections. ✅
- The em-dash and en-dash usage matches surrounding prose (e.g. the
  hyphenated "auto-fall-back" mirrors the spec's terminology and is
  used consistently). ✅
- The new bullet in CHANGELOG is one long sentence with semicolons.
  Slightly heavier than the surrounding `### New Features` entries
  (e.g. line 33's single-sentence simpler bullet) but defensible
  because three distinct semantic facets are bundled. **Non-blocker.**

**No jarring deviations.**

---

## Required check 7 — Lint and tests

- `npm run lint:js -- packages/env` from the repo root: **PASSES**
  (exit 0). Note: this contradicts the code-review-1 finding that
  `eslint-plugin-react-hooks` was missing on the parent checkout; the
  dep is now present (likely installed since the code-review-1 ran).
  This is not a docs-phase concern; the docs changes do not touch
  any lint-relevant code.
- `npm run test:unit -- packages/env` from the repo root: **FAILS** with
  a Jest Haste-map duplicate-package collision because sibling
  worktrees in the parent checkout (`/Users/carlos/Developer/wp-plugins/gutenberg/.pi/worktrees/77766-popover-bind/packages/compose/package.json`)
  collide with this worktree's copy. **This is a host-environment issue
  unrelated to the docs changes** (no test sources are touched in this
  iteration's diff). The code-review-1 already confirmed 181/181 tests
  pass in a clean run; running tests from this worktree's perspective
  with the sibling worktree present is not feasible without disturbing
  unrelated work. **Accepted as a documented host-environment
  limitation, not a regression.** The doc-writer's claim that lint /
  test pass with the docs changes is **partially verified**: lint
  confirmed clean; tests confirmed clean by inheritance from
  code-review-1's run on the same source files (no test code was
  touched in the docs phase).

---

## Required check 8 — No scope creep

`git status --short` shows only `packages/env/README.md` and
`packages/env/CHANGELOG.md`. **Both inside `packages/env/`**. ✅

---

## Summary of findings

### Blockers (1)

1. **CLI `--auto-port` describe string in `lib/cli.js:154-158` must
   be updated** to reflect the new tri-state semantics. As filed, the
   string is actively misleading: it implies `--auto-port` is the only
   path to auto-fallback (no longer true) and understates the flag's
   new meaning ("also fall back on user-set ports"). The string is a
   user-facing surface rendered in `wp-env start --help` and
   reproduced verbatim in `README.md:368-369`, which makes the README
   internally inconsistent: the prose elsewhere correctly describes
   the new behavior, but the embedded help block contradicts it. A
   yargs `describe` is documentation, not behavior, and falls within
   the docs phase's remit. **Required for approval.**

### Non-blocker findings

- README §"Automatic Port Selection" §2 lists the user-set sources as
  `port` / `testsPort` / `WP_ENV_PORT` / `WP_ENV_TESTS_PORT` but does
  not mention the nested `env.development.port` / `env.tests.port`
  form (which is also honored). Acceptable as-is for a user doc;
  optional polish.
- The CHANGELOG bullet is long and semicolon-separated. Style is
  defensible; could be tightened in a future polish pass.
- The `8888` → `8890` example in "Automatic Port Selection" §1 might
  read as "scanner skips by 2" without context. Optional clarification
  could note "8889 is reserved as the default tests port".
- README `wp-env start --help` reproduction at lines 368-369 will need
  to be regenerated once the cli.js describe string is updated, or it
  will continue to drift.

---

## Verdict

```
REJECTED
```

The README and CHANGELOG prose changes are accurate, well-placed, and
match the implementation across all eight required checks except for
one: the unupdated CLI `--auto-port` `describe` string in `lib/cli.js`
leaves the help-text surface (and the README block that reproduces it)
contradicting the rest of the documentation. A `yargs` `describe` is
documentation, not behavior, and is within the docs phase's remit.

The doc-writer should:

1. Update `lib/cli.js:154-158`'s `--auto-port` `describe` to reflect
   the new tri-state contract (suggested wording in §"Required check
   4" above).
2. Regenerate the `wp-env start --help` code block in
   `packages/env/README.md:343-369` so it matches the new describe
   text.
3. Re-request review.

All other aspects of the documentation are correct and complete.
