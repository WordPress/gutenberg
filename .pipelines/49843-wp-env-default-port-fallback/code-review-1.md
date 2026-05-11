# Phase 4 — Code review

Iteration 1.

Pipeline: `49843-wp-env-default-port-fallback`
Spec: `spec.md` (round 2 APPROVED).
Plan: `plan.md` (round 2 APPROVED).
Reviewed artifact: 9 staged files, 0 commits.

---

## Method

I verified the staged diff (`git diff --staged --stat` showed 9 files,
+1016 / −42), read every changed file end-to-end against the spec ACs and
plan steps 1–12, ran the project's unit suite, ran Prettier on the
staged files, and inspected the existing baseline for the lint blocker
the implementer flagged.

## Diff hygiene check

`git status --short` reports exactly the 9 files authorized by plan
§2. No unauthorized files (no `block-editor`, no `core-data`, no
`lib/compat/`, no `tools/`):

```
M  packages/env/lib/commands/start.js
M  packages/env/lib/config/load-config.js
M  packages/env/lib/config/parse-config.js
M  packages/env/lib/config/post-process-config.js
M  packages/env/lib/config/test/config-integration.js
M  packages/env/lib/config/test/parse-config.js
M  packages/env/lib/config/test/post-process-config.js
M  packages/env/lib/resolve-available-ports.js
M  packages/env/lib/test/resolve-available-ports.js
```

`git diff --staged -- packages/env/**/__snapshots__/` is empty. **Zero
snapshot drift**, matching plan §6 R-Snapshots expectation.

## Test run (mandated by the role)

```
$ npm run test:unit -- packages/env
…
Test Suites: 18 passed, 18 total
Tests:       181 passed, 181 total
Snapshots:   8 passed, 8 total
Time:        1.664 s
```

Matches the implementer's reported count exactly. No skipped tests.

## Lint blocker provenance

`ls /Users/carlos/Developer/wp-plugins/gutenberg/node_modules/eslint-plugin-react-hooks`
returns `No such file or directory` on the parent checkout. The
implementer's claim that the lint failure is pre-existing and unrelated
to this work is **confirmed**. Not a blocker for this review. The
docs-phase or PR description MUST acknowledge it so the maintainer
knows the lint command was not run as configured.

Prettier was run on the 9 staged files and reports `All matched files
use Prettier code style!`. Standalone ESLint on the staged files via
`eslint --no-config-lookup` is a reasonable substitute — accepted.

---

## AC coverage matrix

For each AC I cite the test (file + `it` name) and the production code
path it exercises.

### AC1 — Default development port falls back automatically (upward scan)

- **Test:** `config-integration.js:236` `with no user autoPort and busy
  default port falls back via defaults-only mode (AC1)`. Mocks
  `findAvailablePort` to return 8890 for preferred 8888; asserts
  `config.env.development.port === 8890` and `WP_HOME ===
  'http://localhost:8890'`.
- **Production code path:** `load-config.js:101–106` maps unset
  `autoPort` to `autoPortMode='defaults-only'`, `load-config.js:114–116`
  creates the resolver, `resolve-available-ports.js:140–149` routes
  default-origin HTTP ports as non-strict, `resolve-available-ports.js:75–78`
  calls `findAvailablePort`. **Covered.**
- Upward-scan directionality is inherited from `port-utils.js`
  (unchanged); no spec violation.

### AC2 — Default tests port falls back independently (upward scan)

- **Test:** `resolve-available-ports.js:165` `under autoPortMode=defaults-only
  uses strict mode for non-default-origin ports and non-strict for default-origin ports`
  asserts the dev-default→non-strict / tests-user-set→strict matrix
  symmetrically. The post-process-config sibling test (line ~351)
  `threads autoPortMode and defaultOriginPorts to resolveConfigPorts`
  covers both http ports as non-strict in the same call. **Covered.**

### AC3 — Explicitly configured port stays strict by default

- **Production path:** `parse-config.js:213–273` (the new
  `computeDefaultOriginPorts` + `layerSetsDevelopmentPort`/
  `layerSetsTestsPort` helpers) excludes a user-set key from
  `__defaultOriginPorts`. `resolve-available-ports.js:147–149` then
  computes `strict = ! defaultOriginPorts.has(key)` → user-set ports
  go strict.
- **Tests:** Four `parse-config.js` provenance tests cover local
  config, override config, `WP_ENV_PORT`, `WP_ENV_TESTS_PORT`
  (lines ~632, ~648, ~666, ~677). `post-process-config.js:425`
  `with autoPortMode=defaults-only routes user-set port to strict and
  default-origin port to non-strict` and
  `resolve-available-ports.js:165` cover the routing side. **Covered.**

### AC4 — `--auto-port` / `"autoPort": true` still falls back on explicit ports

- **Tests:** `config-integration.js:341` `with CLI autoPort=true and
  user config autoPort=false has CLI win (AC4 precedence)`. The new
  F3 integration test at `config-integration.js:367` `with CLI
  autoPort=true and explicit user port falls back when port is busy
  (AC4 behavior-level)` asserts the moved port flows all the way
  through to `WP_HOME`. Sibling unit-level tests at
  `resolve-available-ports.js:226` and `post-process-config.js:524`
  assert `autoPortMode='all'` routes every port non-strict.
- **Production path:** `load-config.js:101` `effectiveAutoPort ===
  true` → `'all'`. `resolve-available-ports.js:145` `autoPortMode ===
  'all'` → `strict = false` for every port (skip rule does not
  trigger because the rule requires `defaults-only`). **Covered.**

### AC5 — `"autoPort": false` opts out of default-port fallback too

- **Test:** `config-integration.js:265` `with autoPort:false in user
  config skips fallback even on default ports (AC5)`. Asserts
  `findAvailablePort` was never called.
- **Production path:** `load-config.js:103` `effectiveAutoPort ===
  false` → `'off'`; `load-config.js:114` resolver not created.
  **Covered.** The test name carries `AC5` so a future refactor that
  collapses the false branch would fail this test by name.

### AC6 — `CI=1` continues to disable all auto-fallback

- **Tests:** `config-integration.js:288` `with CI=1 disables fallback
  regardless of autoPort:true in user config (AC6 + AC8 regression
  detector)` and `config-integration.js:319` `with CI=1 disables
  fallback even when autoPort is unset (AC6)`.
- **Production path:** `load-config.js:109–112` — the
  `process.env.CI` guard overwrites `autoPortMode` to `'off'`. CI
  cleanup is correctly handled by the new `originalCI` save/restore
  in `beforeEach`/`afterEach`. **Covered.**

### AC7 — Informational message contract (observable)

- **Tests (five):** `resolve-available-ports.js:309` `emits spinner.info
  exactly once when fallback occurs and re-arms the spinner`;
  line 329 `does NOT emit spinner.info when the preferred port is
  available`; line 340 `does NOT emit spinner.info on the strict
  failure path`; line 352 `does not write to console or process.stdout
  when fallback occurs (regression guard)`; line 386 `suppresses the
  notice silently when no spinner is provided (test-path safety)`.
- **Production path:** `resolve-available-ports.js:80–90` —
  `if ( spinner && resolvedPort !== preferredPort )` guard, message,
  then `spinner.start()` re-arm. The order assertion
  (`info.mock.invocationCallOrder[0] < start.mock.invocationCallOrder[0]`)
  is well-formed and exercises the re-arm sequence the plan requires.
  **Covered.** The "no console output" regression detector exactly
  matches the spec's "introducing a separate output path would be a
  detectable regression" clause.

### AC8 — CI guard regression is detectable

- **Test:** `config-integration.js:288` carries the explicit name
  `(AC6 + AC8 regression detector)` and the comment "Removing the
  `if ( process.env.CI )` guard in load-config.js would call
  findAvailablePort and fail this expectation." Verified by reading
  the test body. **Covered.**

### AC9a — Resolved port flows downstream into merged config

- **Test:** `post-process-config.js:351` `threads autoPortMode and
  defaultOriginPorts to resolveConfigPorts` asserts
  `processed.env.development.config.WP_HOME === 'http://localhost:8890'`
  and the same for `WP_SITEURL`. The integration test
  `config-integration.js:236` also asserts the same end-to-end through
  `loadConfig`.
- **Production path:** `post-process-config.js:37–40` calls
  `resolveConfigPorts` first; line 42 then calls
  `appendPortToWPConfigs`. Order preserved. **Covered.**

### AC9b — Live reachability (manual)

- Out of scope for the automated suite per spec §5 / plan §3 trailer.
  Verification deferred to the PR test plan. **Acknowledged; not a
  code-review blocker.**

### AC9c — Other wp-env commands see the resolved fallback port

- No new automated test (plan §3 trailer documents this — the
  guarantee is inherited from the unchanged cached-compose contract).
- Plan §1 Step 1 traces `start.js → loadConfig → postProcessConfig →
  build-docker-compose-config.js` to confirm the resolved port is
  what `runtime/docker/build-docker-compose-config.js:173,267` writes
  into the cached compose file, which `stop.js`/`destroy.js`/etc.
  consume by container name. I spot-checked
  `packages/env/lib/runtime/docker/build-docker-compose-config.js` —
  not touched in this diff, so the contract is preserved. **Covered
  by inheritance; verification deferred to manual PR test plan steps.**

### AC10 — Existing tests stay green; snapshots intentional

- 181 / 181 unit tests pass.
- Zero snapshot drift in `__snapshots__/` directories.
- The non-enumerable contract test at `parse-config.js:715`
  (`__defaultOriginPorts is invisible to mergeConfigs and toEqual`)
  asserts `JSON.parse(JSON.stringify(parsed)).__defaultOriginPorts`
  is `undefined` AND `expect(parsed).toEqual(DEFAULT_CONFIG)` still
  passes AND `Object.keys(parsed)` does not contain the property.
  This is a strong regression detector for plan §6 R-NonEnumerable.
- The back-compat test `post-process-config.js:583` `defaults to
  autoPortMode=off and routes ports strict (back-compat for callers
  that do not pass options)` guarantees callers that bypass the new
  options keep working. **Covered.**

### AC11 — `autoPort` tri-state survives end-to-end

- **Test:** `parse-config.js:196` (renamed) `should accept autoPort
  as a tri-state (null default, true, false)` asserts three distinct
  values: default `null`, explicit `true`, explicit `false`. The
  test ends with `expect( parsedFalse.autoPort ).not.toBeNull()`
  which is the spec's "observably distinct" requirement.
- The default-config flip at `parse-config.js:93`
  (`autoPort: null`) and the validator change at line 493–504 (`null`
  passes the boolean check) together guarantee the tri-state survives
  parse → merge. `load-config.js:101–107` consumes the tri-state.
  **Covered.**

---

## Plan adherence

| Step | Status | Notes |
|---|---|---|
| 1 — default flip + fixture | Done | `parse-config.js:93` is `null`; test fixture line 24 updated to `null`. JSDoc updated. |
| 2 — `load-config.js` tri-state | Done | Block at `load-config.js:96–122` matches plan exactly (CLI beats config; CI forces `'off'`; resolver created only when `resolvePorts && mode !== 'off'`). JSDoc updated. |
| 3 — `__defaultOriginPorts` provenance | Done | Helper functions land at `parse-config.js:194–273`. Non-enumerable property attached at line 175. The four user-source layers are inspected as specified. |
| 4 — `postProcessConfig` threading | Done | Signature change + JSDoc at `post-process-config.js:24–35`. Defaults preserve back-compat. |
| 5 — per-port routing in `resolveConfigPorts` | Done | Skip rule at `resolve-available-ports.js:128–135`; strict decision at lines 136–151. Matches plan's three-mode matrix. |
| 6 — moved-port notice in `createPortResolver` | Done | `resolve-available-ports.js:80–90`. Guarded by `spinner && resolvedPort !== preferredPort`; `spinner.start()` re-arms. |
| 7 — `start.js` JSDoc | Done | One-line JSDoc tri-state description at `start.js:32`. No public signature change. |
| 8 — README | **Deferred to phase 5** | Acceptable per role brief. |
| 9 — CHANGELOG | **Deferred to phase 5** | Acceptable per role brief. |
| 10 — tests (tri-state + provenance) | Done | All planned test rows in §3 are present; the `'off'`-mode test for phpmyadminPort was correctly adjusted (see deviation note below). |
| 11 — tests (moved-port notice) | Done | Five spinner tests land at `resolve-available-ports.js:309–411`. |
| 12 — verification sweep | Partial | Snapshot/JSDoc/fixture sweep done. **`composer test` from plan §4 verification gate 4 was not run** — see PHP test deferral section below. |

### Deviations from plan

1. **Plan §3 row for `'off'`-mode phpmyadminPort test (line 259) says
   "still resolves phpmyadminPort non-strictly".** The implementation
   in plan Step 5 reads "If `autoPortMode === 'off'` → `strict = true`",
   so phpmyadminPort under `'off'` is actually resolved **strictly**.
   The implementer correctly aligned the test
   (`resolve-available-ports.js:262` asserts `isPortAvailable.toHaveBeenCalledWith(8080)`
   and `findAvailablePort.not.toHaveBeenCalled()`). This is a plan
   text error, not a code error. The test name was also adjusted to
   "still resolves phpmyadminPort **strictly**" which is consistent
   with the implementation. **Deviation accepted; the test correctly
   guards Step 5's actual strict-decision rule.**

2. **Validator at `parse-config.js:493–504` allows `null` to pass
   silently** but still emits "must be a boolean" if a non-null,
   non-boolean is provided. The user-visible error message is
   slightly inaccurate (it implies only boolean is allowed, but null
   is also accepted). However, `null` is not a value a contributor
   would ever write in `.wp-env.json` (it would parse as `null` only
   if they explicitly typed it, which would behave the same as
   omitting the key). **Accepted as written.** Optional tightening
   for future: update the error message to "must be a boolean or
   null" — non-blocking nit.

3. The implementer reported running `eslint --no-config-lookup` and
   `prettier --check` instead of `npm run lint:js` because the
   parent checkout is missing `eslint-plugin-react-hooks`. I
   confirmed the missing dep is pre-existing. **Accepted as a valid
   substitute for this review iteration.** Docs phase or PR
   description must acknowledge.

4. The implementer reported skipping `composer test` because wp-env
   is not running. See PHP test deferral section.

---

## Test correctness audit

I read every new test and checked for the four common cheats. Findings:

- **No empty assertions.** Every `it` block ends in an `expect(…)`
  call against a meaningful value.
- **No mocks swallowing the call.** Where `jest.fn()` mocks are used
  (`portResolver.resolve`, `findAvailablePort`, `isPortAvailable`),
  the tests assert against `.mock.calls` or against the returned
  config object, not against the input.
- **No tautological assertions** (asserting on inputs). The
  `__defaultOriginPorts` provenance tests all assert against
  `parsed.__defaultOriginPorts.has(…)` — i.e. against the result of
  `parseConfig`, not against the mocks.
- **AC4 / AC5 / AC8 integration tests correctly assert observable
  behavior** (`findAvailablePort.toHaveBeenCalled()` /
  `not.toHaveBeenCalled()` plus the resolved port in the returned
  config), not just internal state.
- The non-enumerable contract test (`parse-config.js:715`) is
  particularly well-constructed: it asserts the property is
  invisible to JSON serialization, to `Object.keys`, and to Jest's
  `toEqual` deep-equal in a single test. A future refactor that
  flips the property to enumerable fails this test.
- The "moved-port notice" tests correctly assert call order
  (`info.mock.invocationCallOrder[0] < start.mock.invocationCallOrder[0]`)
  — this is the right way to assert ordering between two mock fns.
- The "no console output" regression detector spies on
  `console.log`, `console.info`, `console.warn`, and
  `process.stdout.write`, and restores them in `finally`. Correctly
  scoped and cleaned up.

**No test cheats detected.**

---

## Behavior verification (production code path)

### `parse-config.js` `__defaultOriginPorts` provenance

- Line 167–175 captures `mergeConfigs` result in `merged`, computes
  `defaultOriginPorts`, attaches via `Object.defineProperty(merged,
  '__defaultOriginPorts', { value: …, enumerable: false, writable:
  false, configurable: false })`. **All three flags are tightened
  beyond the default;** the property is also non-writable and
  non-configurable, making the contract harder to accidentally
  break. Good defensive choice.
- `merge-configs.js` `for (const option in config)` is unchanged.
  `for…in` excludes non-enumerable own properties, so the provenance
  Set never leaks into the merge. The dedicated test at
  `parse-config.js:715` (`JSON round-trip drops the property; toEqual
  still passes`) is the regression detector.
- The helpers `layerSetsDevelopmentPort` / `layerSetsTestsPort`
  correctly inspect both root-level (`port` / `testsPort`) and
  env-specific (`env.development.port` / `env.tests.port`) paths,
  plus the env-var-derived layer. **Matches plan §2 Step 3 exactly.**
- One reviewer concern: the helpers inspect `layer.env?.development?.port`
  with `?? undefined` semantics; an explicit `port: 0` would count
  as "user-set". That is the right behavior (zero is a port value
  the user typed). No issue.

### `load-config.js` tri-state resolution

- `effectiveAutoPort = autoPort !== undefined ? autoPort : config.autoPort`
  — CLI beats config. CLI `false` short-circuits to `'off'`; CLI
  `true` short-circuits to `'all'`. CLI `undefined` defers to
  `config.autoPort`.
- `config.autoPort` is `true`/`false`/`null` (after Step 1's default
  flip; `null` is the "unset" sentinel). When `effectiveAutoPort ===
  true` → `'all'`; `=== false` → `'off'`; **else** (which covers
  `null`, `undefined`, and any other unexpected value) → `'defaults-only'`.
  This `else` branch correctly handles the case where `config.autoPort`
  is undefined (defensive), `null`, or genuinely unset.
- CI guard at line 109 is reached **after** the tri-state mapping
  and unconditionally forces `'off'`. Test
  `config-integration.js:288` (CI=1 + `autoPort: true` → no
  fallback) proves the guard is in front of the resolver creation.

### `resolve-available-ports.js` per-port routing

- Skip rule at line 128–135: `if ( autoPortMode === 'defaults-only'
  && property !== 'port' ) continue;` — exactly preserves today's
  phpmyadminPort behavior under the new mode (B3 fix).
- Strict decision at line 136–151: matches plan's matrix
  (`'off'`→true, `'all'`→false, `'defaults-only'` HTTP →
  `! defaultOriginPorts.has(key)`).
- `portResolver.resolve(preferredPort, configPath, strict)` — third
  argument was already supported by `createPortResolver`'s
  `resolve` method (line 50 in the unchanged baseline section).

### `createPortResolver` info notice

- Guard at line 85: `if ( spinner && resolvedPort !== preferredPort )`.
  Fires **only when both are true**. When `spinner` is undefined →
  silent. When `resolvedPort === preferredPort` → silent. The two
  tests at `resolve-available-ports.js:329` (no move) and `:386` (no
  spinner) confirm both branches.
- Notice goes through `spinner.info(…)` followed by `spinner.start()`
  to re-arm. Matches the precedent at `commands/start.js:98–101` and
  `:169–193` cited in plan §F4.
- Strict branch (lines 56–72) **does not** reach the notice code —
  the throw happens earlier. The test at `resolve-available-ports.js:340`
  confirms `spinner.info` is not called on strict failure.

### `commands/start.js` JSDoc

- Line 32: `@param {boolean|undefined} options.autoPort Tri-state:
  …` — describes all three states. **No public signature change.**

---

## PHP test deferral decision

- `composer test` was not run because wp-env is not running locally
  in this worktree. The plan §4 verification gates 2 and 4 both
  mandate `composer test`, and spec **R17 / R-PHPRegress** explicitly
  ties this to PR #74472's history of breaking PHP tests with the
  always-on default-fallback approach.
- **Decision: accepted as a deferred checkpoint, NOT a blocker for
  this code review.** Rationale:
    - This change is JS-only inside `packages/env/`. No PHP file
      changed in the staged diff.
    - The PHP suite depends on `wp-env` running, which is a
      side-effectful operation the implementer is correct to avoid
      in the middle of an implementation cycle.
    - The 181/181 JS-test green plus zero snapshot drift makes a
      PHP regression unlikely; if one surfaces, it surfaces at the
      checkpoint without harm.
- **Explicit checkpoint:** `composer test` MUST run green **after**
  the docs phase commits and **before** the PR is opened (i.e. as
  part of the pipeline's "ready for review" gate, not before this
  code-review verdict). The docs-phase reviewer or the PR-opening
  step inherits responsibility for confirming the gate.

---

## Open issues raised by the implementer

1. **parse-config validator allows `null` but error message says
   "must be a boolean".** Minor cosmetic. **Accepted as written.**
   Optional polish: update the message in a follow-up; non-blocking
   here.
2. **AC5 / AC6 integration test phrasing carries AC tags inline.**
   This is helpful for future maintenance and matches plan §5's
   "named regression detector" intent. **Accepted.**
3. **PHP gate deferral.** **Accepted as a documented checkpoint
   before PR open.** See section above.
4. **Lint blocker (`eslint-plugin-react-hooks` missing).** Confirmed
   pre-existing on the parent checkout. **Accepted; not a blocker.**
   Prettier on staged files passes; eslint via `--no-config-lookup`
   is an acceptable substitute. Docs phase or PR description must
   note that `npm run lint:js` is currently broken in the parent
   tree.

---

## Verdict

```
APPROVED
```

The 9 staged files faithfully implement plan steps 1–7 and 10–12, and
the test suite covers every code-eligible AC (AC1, AC2, AC3, AC4, AC5,
AC6, AC7, AC8, AC9a, AC10, AC11). AC9b and AC9c are correctly deferred
to the manual PR test plan per spec §5. All 181 unit tests pass; zero
snapshot drift; no unauthorized files touched; the non-enumerable
contract for `__defaultOriginPorts` is independently regression-guarded.
The one plan-vs-implementation deviation (Plan §3 row 259 wording on
`'off'`-mode phpmyadminPort) is a plan documentation error that the
implementer correctly resolved in favor of the implementation logic
defined elsewhere in the plan.

### Conditions that MUST hold before the PR is opened (not blocking this iteration)

1. **README updated** per plan Step 8 — describes the new default
   behavior, the `"autoPort": false` opt-out, and updates the config
   table row for `autoPort` (default `null`, tri-state description).
2. **CHANGELOG updated** per plan Step 9 — `Unreleased` entry under
   `### New Features` or `### Enhancements`, referencing `#49843`.
3. **`composer test` runs green** from repo root with wp-env running,
   per spec R17 / plan §4 verification gate 4. Any failure escalates
   to spec/plan, not silently worked around.
4. **PR body test plan enumerates AC1 through AC11** (including
   AC9a/AC9b/AC9c) per spec §9 + R16.
5. **PR body includes the AC9b manual reproduction recipe** from
   plan §3 (bind 8888 with `python3 -m http.server`, run wp-env
   start, browse to the printed URL, verify, then stop and restart).
6. **PR body acknowledges the pre-existing `npm run lint:js`
   breakage** (missing `eslint-plugin-react-hooks` in the parent
   checkout) so the maintainer knows lint was not run as configured.
   This is a host-project issue, not a regression introduced by this
   PR.
7. **PR is opened against `WordPress/gutenberg` `trunk` from branch
   `try/49843-wp-env-default-port-fallback`**, links `#49843`, and
   is filed as a draft per spec §9.

All ACs in scope for the automated suite are satisfied. Implementation
is ready for the documentation phase.
