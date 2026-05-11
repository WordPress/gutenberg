# Plan review — Iteration 2

Pipeline: `49843-wp-env-default-port-fallback`
Reviewer role: plan-reviewer (adversarial)
Reviewing: `plan.md` (round 2 revision)
Prior review: `plan-review-1.md`
Source-citations re-verified by reading: `packages/env/lib/config/parse-config.js`, `packages/env/lib/config/load-config.js`, `packages/env/lib/config/post-process-config.js`, `packages/env/lib/config/merge-configs.js`, `packages/env/lib/resolve-available-ports.js`, `packages/env/lib/cli.js`, `packages/env/lib/commands/start.js`, `packages/env/lib/commands/stop.js`, `packages/env/lib/runtime/docker/build-docker-compose-config.js`, `packages/env/lib/config/get-config-from-environment-vars.js`, `packages/env/lib/test/cli.js`, `packages/env/lib/config/test/parse-config.js`, `packages/env/README.md`, `packages/env/CHANGELOG.md`, plus a directory listing of `packages/env/lib/runtime/docker/` and the snapshot directories under `packages/env/lib/{,config/}test/__snapshots__/`.

---

## Summary

Round 2 closes all three round-1 blockers and every minor finding (F1–F8) at the artifact level. The non-enumerable-property design (B1 fix) is well-grounded: I re-read `merge-configs.js` and confirmed both iteration sites (`for ( const option in config )` at line 39 and `for ( const option in toMerge )` at line 81) use `for…in`, which is well-defined in JavaScript to skip non-enumerable own properties. Jest's `toEqual` also walks own-enumerable properties only. The DEFAULT_CONFIG fixture update (B2 fix) is now an explicit Step 1 sub-step, and the phpmyadminPort regression (B3 fix) is sealed by a per-port skip rule with a dedicated regression test.

Spot-checks of cited line numbers all matched the source. The plan reads as feasible and complete. Approving.

---

## Round-1 finding closure audit

| Round-1 finding | Status | Where in plan v2 |
|---|---|---|
| **B1** — `parseConfig` return-shape change broke ~25 existing tests | **CLOSED** | Revision log entry "B1"; Step 3 (return shape unchanged; `__defaultOriginPorts` attached non-enumerably via `Object.defineProperty`); Step 2 ("call to `parseConfig` at `load-config.js:90-94` is **unchanged in shape**"); Step 4 (reads `config.__defaultOriginPorts`); test plan §3 row "`__defaultOriginPorts is invisible to mergeConfigs and toEqual (regression guard for B1 / non-enumerable contract)`". |
| **B2** — DEFAULT_CONFIG fixture not updated | **CLOSED** | Revision log entry "B2"; Step 1 sub-step 4 explicitly calls out the fixture edit at `parse-config.js test:24` and enumerates affected `toEqual` / spread sites (lines 91, 166, 193, 232, 293, 305, 500, 531, 557); test plan §3 row "Modified — `DEFAULT_CONFIG` fixture"; Step 12 inline-fixture verification line. |
| **B3** — phpmyadminPort silent move under defaults-only mode | **CLOSED** | Revision log entry "B3"; Step 5 per-port skip rule under `autoPortMode === 'defaults-only'` (`continue` for `property !== 'port'`); Step 1 plan summary §1 ("phpmyadminPort is **only** auto-resolved under `'all'` mode"); test plan §3 has two regression-detector rows: "`postProcessConfig with autoPortMode=defaults-only skips phpmyadminPort entirely (B3 regression guard)`" and "`resolveConfigPorts under autoPortMode=defaults-only skips phpmyadminPort entirely (B3 regression guard)`"; Risks §6 "R-PhpmyadminMove (B3)". |
| **F1** — `build-docker-compose-config.js` path ambiguity | **CLOSED** | Revision log entry "F1"; OQ6 resolution (§1) cites the full path `packages/env/lib/runtime/docker/build-docker-compose-config.js:173,267`. I verified the path/file existence — the directory listing of `packages/env/lib/runtime/docker/` contains `build-docker-compose-config.js` and there is no file at `packages/env/lib/build-docker-compose-config.js`. |
| **F2** — Snapshot drift assessment incomplete | **CLOSED** | Revision log entry "F2"; Step 12 explicitly states "no snapshot diffs" expected, with the `grep autoPort` evidence cited. I re-verified — `grep autoPort` against `packages/env/lib/config/test/__snapshots__/config-integration.js.snap` and `packages/env/lib/test/__snapshots__/md5.js.snap` returns zero hits today. (Note: only `config-integration.js.snap` actually exists in `packages/env/lib/config/test/__snapshots__/`; `packages/env/lib/test/__snapshots__/` is empty in this checkout. The plan over-cites a non-existent file but the substantive claim — no `autoPort` in any snapshot — holds.) |
| **F3** — AC4 lacks behavior-level integration test | **CLOSED** | Revision log entry "F3"; test plan §3 row "`loadConfig with CLI autoPort=true and explicit user port falls back when port is busy (AC4 behavior-level)`"; mirrors the AC5 integration test as requested. |
| **F4** — Spinner re-arming pattern under-specified | **CLOSED** | Revision log entry "F4"; Step 6 now cites `start.js:98-101`, `start.js:105-112`, and `start.js:169-193` as precedents (verified — `start.js:98-101` is the `spinner.warn(...); spinner.start();` block for the missing `.wp-env.json` case; `start.js:105-112` is the testsEnvironment deprecation warning; `start.js:169-193` uses `spinner.info(...)` followed by `spinner.start()` in `checkForLegacyInstall`). Test plan asserts call order via `mock.invocationCallOrder`. |
| **F5** — OQ7 truthiness wording inconsistent | **CLOSED** | Revision log entry "F5"; OQ7 resolution in §1 now reads "all non-empty strings are truthy; empty string and `undefined` are falsy" — clean and correct. The implementation is unchanged. |
| **F6** — JSDoc updates not staged for verification | **CLOSED** | Revision log entry "F6"; Step 12 now has a JSDoc-review checklist enumerating all five JSDoc sites (parse-config typedef, load-config, post-process-config, resolve-available-ports, commands/start). |
| **F7** — Sequencing wrong about parallelism | **CLOSED** | Revision log entry "F7"; §4 now shows Step 3 as serial (must precede Step 4) and notes Steps 5/6 are sequential within `resolve-available-ports.js`. The single-implementer ordering and the multi-agent worker plan both reflect this realistically. |
| **F8** — Rollback paragraph missing cached-compose note | **CLOSED** | Revision log entry "F8"; §7 ends with a "Cached compose caveat." paragraph describing the post-fallback port pinned in `~/.wp-env/<project-hash>/docker-compose.yml`, the behavior of already-running environments, and the recommended one-line note for the revert PR. |

Net: **3 of 3 blockers CLOSED, 8 of 8 minor findings CLOSED, 0 NOT CLOSED, 0 PARTIALLY CLOSED.**

---

## Non-enumerable-property design verification (round-2-specific check)

Plan v2's B1 fix hinges on the claim that attaching `__defaultOriginPorts` as a non-enumerable property to the merged config will be invisible to `mergeConfig` iteration, JSON serialization, and Jest `toEqual`. I verified each leg:

- **`mergeConfig` iteration.** `packages/env/lib/config/merge-configs.js` line 39: `for ( const option in config ) {` — `for…in` walks own-and-inherited enumerable keys. Non-enumerable own properties are skipped. (Same at line 81: `for ( const option in toMerge )`.) `mergeConfigs` is the only consumer along the parseConfig → loadConfig → postProcessConfig path that iterates the config object's keys generically. Other call sites (e.g. `appendPortToWPConfigs`, `validatePortUniqueness`) read named properties (`config.env`, `config.env[env].port`, etc.) and never iterate the root object. So the non-enumerable property cannot leak into the merge path.
- **JSON serialization.** `JSON.stringify` walks own-enumerable properties; non-enumerable properties are omitted. Plan's regression test "`__defaultOriginPorts is invisible to mergeConfigs and toEqual`" asserts `JSON.parse(JSON.stringify(parsed))` drops the property, locking this in.
- **Jest `toEqual`.** Jest's recursive equality compares own-enumerable properties; non-enumerable own properties are not compared. So `expect( parsed ).toEqual( DEFAULT_CONFIG )` continues to pass even though `parsed` carries the extra hidden property. The same regression test asserts this.
- **Object iteration mechanism in the actual code path.** I confirmed the iteration mechanism inside `mergeConfig` is `for…in`, **not** `Object.keys` / `Object.entries` / spread-into-new-object. (All three of those would also skip non-enumerable properties — `Object.keys`/`Object.entries` walk own-enumerable; object spread `{...config}` also copies only own-enumerable properties — so even a future refactor that switches mechanisms would preserve the contract. But as written today, the mechanism is `for…in`.)

The trick works as plan v2 claims. No risk of leakage along the existing code paths.

---

## Spot-check of cited line numbers in plan v2

I picked five citations across the plan and re-read each in the source.

1. **`parse-config.js:86-111` `DEFAULT_ENVIRONMENT_CONFIG` with `autoPort: false` at line 93.** Verified — `DEFAULT_ENVIRONMENT_CONFIG` opens at line 86 and closes at line 111; `autoPort: false,` is line 93 verbatim. Step 1 sub-step 1 target.
2. **`parse-config.js test:21-71` inline `DEFAULT_CONFIG` fixture, `autoPort: false` at line 24.** Verified — fixture spans lines 21–70; `autoPort: false,` is at line 24. Step 1 sub-step 4 target.
3. **`load-config.js:96-109` `shouldAutoPort` block.** Verified — lines 96–109 contain the `let portResolver; if ( resolvePorts ) { let shouldAutoPort = …; if ( process.env.CI ) { shouldAutoPort = false; } if ( shouldAutoPort ) { portResolver = createPortResolver( spinner ); } }` block exactly as described in Step 2.
4. **`resolve-available-ports.js:50` `resolve(preferredPort, configPath, strict = false)`.** Verified — line 50 reads `async resolve( preferredPort, configPath, strict = false ) {` with `strict` as the third parameter and a default of `false`. Step 5's claim that the resolver already supports the third arg is correct.
5. **`runtime/docker/build-docker-compose-config.js:173, 267` port interpolation sites.** Verified — line 173 is `` const developmentPorts = `\${WP_ENV_PORT:-${ config.env.development.port }}:80`; `` and line 267 is `` const testsPorts = `\${WP_ENV_TESTS_PORT:-${ config.env.tests.port }}:80`; ``. OQ6 resolution claim correct.

Bonus spot-checks (not strictly required but useful):
- `cli.js:154-159` `--auto-port` yargs definition: confirmed at lines 154–158, `type: 'boolean'`, no `default` → missing arg is `undefined`.
- `lib/test/cli.js:35-52` tri-state assertions: confirmed (lines 35–52 cover `start` parses with no flag → `autoPort` undefined; with `--auto-port` → `true`; with `--no-auto-port` → `false`).
- `start.js:55-59` `loadConfig({ resolvePorts: true, autoPort, spinner })`: confirmed.
- `stop.js:21-31` consumes cached compose without `resolvePorts`: confirmed (`stop.js:26` calls `loadConfig(path.resolve('.'), customConfigPath)` with no third arg, so `resolvePorts` defaults to `false`).
- `get-config-from-environment-vars.js:36-72` env-var enumeration: confirmed (`WP_ENV_PORT` line 38, `WP_ENV_TESTS_PORT` line 40, plus mysql/phpmyadmin variants — OQ4 resolution scope correct).
- README `autoPort` row at line 609 and "Automatic Port Selection" at lines 620–630: confirmed.
- CHANGELOG `## Unreleased` at line 3: confirmed.

All cited line numbers in plan v2 match the source. No drift.

---

## Over-correction / new-scope check

I scanned plan v2 for design that goes beyond what the spec requires:

- The non-enumerable-property design is the minimal mechanism that satisfies AC10 + R3 / R6 without breaking existing tests. Not over-correction; it is the smallest fix for B1.
- The phpmyadminPort `continue` skip in Step 5 is the smallest fix that preserves today's behavior verbatim. The spec explicitly puts phpmyadminPort out of scope (§5 of the spec), so refusing to extend the resolver to it is *under*-engineering on purpose, not over-correction. Good.
- The new behavior-level integration test for AC4 (F3) is symmetric with the existing AC5 integration test. Not new scope; just covering an already-required AC at the boundary level.
- The JSDoc-review checklist in Step 12 is documentation hygiene tied to the typedef changes the plan already requires; not new scope.
- The cached-compose caveat in §7 is informational text, not new design.

No over-correction or new-scope detected.

---

## Revision-log drift check

I read each revision-log entry against the corresponding body section.

- **B1** ↔ Step 3 (rewritten to attach non-enumerably), Step 2 (parseConfig call shape unchanged), Step 4 (reads `config.__defaultOriginPorts`): consistent.
- **B2** ↔ Step 1 sub-step 4 (fixture edit explicit) and test plan §3 row "Modified — `DEFAULT_CONFIG` fixture": consistent. Revision log also notes the `should accept autoPort as a boolean` test is unaffected by the fixture change because it asserts only `parsed.autoPort` — verified by reading `parse-config.js test:196-207`, the test indeed only asserts `parsed.autoPort` and does not use `DEFAULT_CONFIG`.
- **B3** ↔ Step 5 per-port skip rule and the two regression-detector tests in test plan §3: consistent.
- **F1** ↔ OQ6 resolution in §1 cites the full path: consistent.
- **F2** ↔ Step 12 inline-fixture verification + grep evidence + Step 1 sub-step 4 cross-reference: consistent.
- **F3** ↔ test plan §3 new row for AC4 behavior-level test: consistent.
- **F4** ↔ Step 6 cites the `spinner.warn(...); spinner.start();` precedent in `start.js:98-101` and `start.js:105-112`, plus `spinner.info(...)` precedent in `start.js:169-193`; test plan asserts call order: consistent.
- **F5** ↔ OQ7 wording in §1 cleaned up: consistent.
- **F6** ↔ Step 12 JSDoc-review checklist: consistent.
- **F7** ↔ §4 sequencing diagram showing Step 3 serial and Steps 5/6 sequential: consistent.
- **F8** ↔ §7 "Cached compose caveat." paragraph: consistent.

No drift between revision log and body.

---

## AC coverage matrix (re-audited for round 2)

| AC | Plan step(s) | Test(s) | OK? |
|---|---|---|---|
| AC1 | Steps 1, 2, 3, 4, 5 | parse-config provenance tests + integration test "no user autoPort and busy default port falls back via defaults-only mode" + "uses strict mode for non-default-origin ports and non-strict for default-origin ports" | Yes |
| AC2 | Steps 1, 2, 3, 4, 5 | same as AC1 (covers both env keys symmetrically) | Yes |
| AC3 | Steps 1, 2, 3, 4, 5 | "routes user-set port to strict and default-origin port to non-strict" + four parse-config provenance tests (local / env.tests / override / WP_ENV_PORT) + matching WP_ENV_TESTS_PORT test | Yes |
| AC4 | Steps 2, 5 | routing-matrix test + "CLI autoPort=true and user config autoPort=false has CLI win" + new behavior-level integration test "CLI autoPort=true and explicit user port falls back when port is busy" | Yes (F3 closed) |
| AC5 | Steps 1, 2, 5 | "autoPortMode=off" routing test + "loadConfig with autoPort:false in user config skips fallback even on default ports" | Yes |
| AC6 | Step 2 (CI guard) | "CI=1 disables fallback regardless of autoPort:true" + "CI=1 disables fallback even when autoPort is unset" | Yes |
| AC7 | Step 6 | five resolver-notice tests (emits-once-and-re-arms / not-emitted-on-no-move / not-emitted-on-strict-fail / no-console-write-regression / silent-without-spinner) | Yes |
| AC8 | Step 2 + named test | "CI=1 disables fallback regardless of autoPort:true" is the named regression detector | Yes |
| AC9a | Step 4 | "postProcessConfig threads autoPortMode and defaultOriginPorts to resolveConfigPorts" asserts WP_HOME/WP_SITEURL reflect resolved port | Yes |
| AC9b | Manual recipe in §3 | PR test plan recipe enumerated | Yes (manual per spec) |
| AC9c | Inherited from cached compose pattern | None automated; manual per recipe (rationale documented) | Yes (manual per spec) |
| AC10 | Step 12 + back-compat tests | Full-suite green; B1 / B2 fixes mean existing tests now stay green | Yes (B1 + B2 closed) |
| AC11 | Steps 1, 2, 7 | "should accept autoPort as a tri-state (null default, true, false)" + integration test asserting tri-state survives end-to-end | Yes |

All ACs covered with at least one automated test or a documented manual verification per spec.

---

## Verification of required-check items from the team prompt

1. **Each round-1 finding now closed.** All B1, B2, B3 and F1–F8 are CLOSED with cited sections (table above).
2. **Non-enumerable trick verified in actual code path.** `merge-configs.js:39` and `:81` use `for…in` (verified by reading the file) and `for…in` skips non-enumerable properties (well-defined JS). The plan also locks the contract with a regression test that asserts `propertyIsEnumerable === false` and `JSON.parse(JSON.stringify(parsed))` drops the property.
3. **Five line-number spot-checks.** All five (`parse-config.js:86-111`/`:93`, `parse-config.js test:21-71`/`:24`, `load-config.js:96-109`, `resolve-available-ports.js:50`, `runtime/docker/build-docker-compose-config.js:173`/`:267`) match the source exactly.
4. **Over-correction / new scope.** None detected. The B1/B2/B3 fixes are minimal; the new AC4 test is symmetric with an existing AC5 test; phpmyadminPort is intentionally left out of scope as the spec requires.
5. **Revision-log drift.** None detected. Each log entry maps cleanly to a body change.

---

## Minor observations (non-blocking)

These are not gates; documenting them so the implementer is not surprised.

- **N1.** Step 12 mentions running `grep` against `packages/env/lib/test/__snapshots__/md5.js.snap`; that file does not exist in the current checkout (the directory `packages/env/lib/test/__snapshots__/` is empty). The substantive claim (no `autoPort` references in any snapshot) holds because the only existing snapshot file (`packages/env/lib/config/test/__snapshots__/config-integration.js.snap`) contains no `autoPort`. The plan slightly over-cites; this does not affect correctness.
- **N2.** The plan uses a non-enumerable, non-writable, non-configurable property descriptor (`Object.defineProperty(merged, '__defaultOriginPorts', { value: …, enumerable: false, writable: false, configurable: false })`). That is correct and safe, but the implementer should be aware that any future code path that tries to overwrite `merged.__defaultOriginPorts` will silently fail in non-strict mode and throw in strict mode. The plan does not have such an overwrite path, and the wp-env package opts in to `'use strict'` at the file level (e.g. `parse-config.js:1`), so an accidental overwrite would throw — which is actually the desired behavior. No action required; just noting for the implementer.

---

## Verdict

```
APPROVED
```

All three round-1 blockers (B1, B2, B3) are closed with concrete plan changes that are grounded in re-verified source citations. All eight minor findings (F1–F8) are closed. The non-enumerable-property design works as the plan claims — the `for…in` iteration in `merge-configs.js` is well-defined to skip non-enumerable own properties, Jest `toEqual` and `JSON.stringify` likewise ignore them, and a dedicated regression test locks the contract. Spot-checks of five cited line numbers all matched the source. No over-correction, no new scope, no revision-log drift detected.

The plan is ready to drive implementation.
