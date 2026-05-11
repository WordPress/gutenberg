# Plan review — Iteration 1

Pipeline: `49843-wp-env-default-port-fallback`
Reviewer role: plan-reviewer (adversarial)
Reviewing: `plan.md` (single iteration so far)
Source-citations verified by reading: `packages/env/lib/config/parse-config.js`, `packages/env/lib/config/load-config.js`, `packages/env/lib/config/post-process-config.js`, `packages/env/lib/config/merge-configs.js`, `packages/env/lib/resolve-available-ports.js`, `packages/env/lib/port-utils.js`, `packages/env/lib/cli.js`, `packages/env/lib/commands/start.js`, `packages/env/lib/commands/stop.js`, `packages/env/lib/commands/status.js`, `packages/env/lib/commands/{clean,destroy,cleanup,logs,reset,run}.js`, `packages/env/lib/runtime/docker/build-docker-compose-config.js`, `packages/env/lib/config/get-config-from-environment-vars.js`, `packages/env/lib/test/cli.js`, `packages/env/lib/test/build-docker-compose-config.js`, `packages/env/lib/config/test/parse-config.js`, `packages/env/README.md`, `packages/env/CHANGELOG.md`, the `packages/env/lib/test/__snapshots__/` and `packages/env/lib/config/test/__snapshots__/` directories.

---

## Summary

The plan resolves OQ1-OQ7 with mostly correct evidence and traces every spec AC to at least one step. Most cited line numbers are accurate. The shape of the design (tri-state `autoPort: null`, per-port `defaultOriginPorts` Set, per-port `strict` flag in `resolveConfigPorts`, spinner.info from `createPortResolver`) is consistent with the spec.

However, the plan has **three blockers** that will cause the implementer to either ship something that fails the existing test suite, or has to invent ad-hoc fixes mid-implementation:

1. The plan changes `parseConfig`'s return shape (Step 3) from `WPRootConfig` to `{ config, defaultOriginPorts }`. This silently breaks ~25 existing call sites in `packages/env/lib/config/test/parse-config.js` (every `parsed = await parseConfig(...)` followed by `expect( parsed )...`). The plan does not list these tests as "Modified", does not include them in Step 12's snapshot sweep, and does not mention the structural change at all in the test plan. AC10 explicitly requires existing tests stay green; this is a guaranteed regression.
2. The plan changes `DEFAULT_ENVIRONMENT_CONFIG.autoPort` from `false` to `null` (Step 1). The test fixture `DEFAULT_CONFIG` at `packages/env/lib/config/test/parse-config.js:21-71` has `autoPort: false` hardcoded and is `toEqual()`-compared against `parseConfig` output in many tests (lines 91, 193, 232, 293, 305, 506, 537, 560, etc.). The plan only mentions modifying the named test `should accept autoPort as a boolean`. Every other test that compares against the `DEFAULT_CONFIG` fixture will fail. Again breaks AC10.
3. The plan unconditionally creates the port resolver whenever `autoPortMode !== 'off'` (Step 2). Today, `phpmyadminPort` is only resolved when `--auto-port` is on; the plan would now also auto-resolve `phpmyadminPort` non-strictly in the new `defaults-only` mode. For a contributor who has `phpmyadmin: true, phpmyadminPort: 8080` (user-set) and no explicit `autoPort`, this silently moves their phpmyadmin port if 8080 is busy — a regression of the "user-set ports are never silently moved" contract (R3) for the phpmyadmin case. The plan does not analyze this behavior change. Either the plan needs to thread `defaultOriginPorts` for phpmyadminPort too (mirroring the HTTP ports), or it needs to special-case phpmyadminPort to keep today's behavior (only resolved when `autoPortMode === 'all'`), or the spec needs to be amended to acknowledge phpmyadminPort moves silently in defaults-only. None of those is in the plan.

In addition, several **non-blocking findings** below should be addressed before approval.

---

## Verified citations (correct)

- `parse-config.js:86-111` `DEFAULT_ENVIRONMENT_CONFIG`: confirmed (`autoPort: false` at line 93). Step 1's target.
- `parse-config.js:124-167` merge sequence: confirmed.
- `parse-config.js:284-344` `getEnvironmentVarOverrides`: confirmed.
- `parse-config.js:390-397` `parseRootConfig`'s `autoPort` block: confirmed (does NOT assign when `undefined`).
- `parse-config.js:483` `case 'autoPort':` in the switch: confirmed.
- `load-config.js:96-109` (`shouldAutoPort` block): confirmed (lines 96-109 contain the exact block plan rewrites).
- `load-config.js:102-104` `process.env.CI` guard: confirmed verbatim (`if ( process.env.CI ) { shouldAutoPort = false; }`).
- `load-config.js:90-94` `parseConfig` call site: confirmed.
- `post-process-config.js:24-43` exported function with `{ portResolver }` destructure: confirmed.
- `post-process-config.js:35-42` resolveConfigPorts call: confirmed (lines 35-37 specifically).
- `resolve-available-ports.js:38-90` `createPortResolver`: confirmed.
- `resolve-available-ports.js:50` `resolve(preferredPort, configPath, strict = false)`: confirmed third-arg already supports strict.
- `resolve-available-ports.js:74-87` non-strict branch: confirmed (lines 74-87).
- `resolve-available-ports.js:75-78` `usedPorts` exclude: confirmed.
- `resolve-available-ports.js:84-87` error wrapping: confirmed.
- `resolve-available-ports.js:100-130` `resolveConfigPorts`: confirmed; the loop body matches.
- `resolve-available-ports.js:101-127` PORT_DEFINITIONS loop: confirmed.
- `resolve-available-ports.js:121-126` phpmyadminPort behavior: confirmed (lines 121-127 cover both HTTP and phpmyadmin in the same loop, no special branching).
- `port-utils.js:51-80` `findAvailablePort` with throw: confirmed (`No available port found in range ${ startPort }-${ maxPort }.` at lines 77-79).
- `cli.js:154-159` `--auto-port` yargs definition: confirmed (`type: 'boolean'`, no `default`).
- `cli.js:24-93` `withSpinner` (plan also says `cli.js:46-92` for spinner: that range is accurate for the rejection branches).
- `start.js:55-59` `loadConfig({ resolvePorts: true, autoPort, spinner })`: confirmed.
- `stop.js:21-31` consumes cached compose by container name: confirmed (`loadConfig` is called WITHOUT `resolvePorts`, so no resolution; runtime stop operates on `dockerComposeConfigPath`).
- `lib/test/cli.js:35-52` tri-state CLI assertions: confirmed (`undefined`, `true`, `false`).
- `get-config-from-environment-vars.js:36-72` env-var enumeration: confirmed (`WP_ENV_PORT`, `WP_ENV_TESTS_PORT`, `WP_ENV_MYSQL_PORT`, `WP_ENV_TESTS_MYSQL_PORT`, `WP_ENV_PHPMYADMIN_PORT`, `WP_ENV_TESTS_PHPMYADMIN_PORT` are the port-yielding ones; OQ4 resolution is correct).
- README `autoPort` row at line 609 and "Automatic Port Selection" at lines 620-630: confirmed.
- CHANGELOG `## Unreleased` at line 3: confirmed.

## Verified citations (wrong — would mislead the implementer)

- `build-docker-compose-config.js:173, 267` — the file is **not** at `packages/env/lib/build-docker-compose-config.js` as suggested by the bare reference style elsewhere in the plan. The actual path is `packages/env/lib/runtime/docker/build-docker-compose-config.js`. The line numbers (173 and 267) are correct *for that path* — line 173 is the `developmentPorts = ` interpolation and line 267 is the `testsPorts = ` interpolation. The implementer should be steered to the runtime/docker subpath. (Non-blocking but should be corrected.)

---

## Findings

### B1 (Blocker) — Step 3 silently breaks every existing parseConfig test
Step 3 changes `parseConfig`'s return value from `WPRootConfig` (the merged config object) to `{ config, defaultOriginPorts }`. The existing test file `packages/env/lib/config/test/parse-config.js` calls `parseConfig` ~25 times and asserts shape against the result directly (e.g. `expect( parsed ).toEqual( DEFAULT_CONFIG )` at line 91, `expect( parsed.coreSource )...` at line 101, `expect( parsed.autoPort ).toEqual( true )` at line 206). With the new shape, every such assertion is either a structural mismatch (`{ config, defaultOriginPorts }` vs the inner config) or `parsed.autoPort` becomes `undefined`. AC10 demands "existing tests stay green". The test plan in §3 lists exactly one modified test (`should accept autoPort as a boolean`) but does not acknowledge the wholesale refactor. Fix: either (a) explicitly enumerate every existing parse-config test as "Modified" with the new destructure pattern, or (b) attach `defaultOriginPorts` as a non-enumerable property on the returned config (the plan listed this as an alternative and explicitly rejected it, but it would preserve API compatibility with the test suite). The plan must commit to one of those before implementation begins.

### B2 (Blocker) — DEFAULT_CONFIG fixture in tests is not updated
Step 1 changes `DEFAULT_ENVIRONMENT_CONFIG.autoPort` from `false` to `null`. The test fixture `DEFAULT_CONFIG` at `packages/env/lib/config/test/parse-config.js:21-71` has `autoPort: false` hardcoded (line 24) and is used as the expected value in `expect( parsed ).toEqual( DEFAULT_CONFIG )` (line 91) and as a spread base in many other assertions (lines 166, 232, 293, 305, etc.). Step 12's snapshot sweep does not catch this because it is not a snapshot — it is an inline fixture. The plan does not list this fixture update under Step 10 ("modified" tests) or anywhere else. Without it, the suite is red on the very first commit. Fix: explicitly call out "update `DEFAULT_CONFIG.autoPort` from `false` to `null` in `packages/env/lib/config/test/parse-config.js`" as part of Step 1 or Step 10.

### B3 (Blocker) — phpmyadminPort silently auto-moves under defaults-only mode (R3 regression)
Step 2 says "Always create a portResolver when resolvePorts is true and autoPortMode !== 'off'", and Step 5 says for phpmyadminPort: "keep today's behavior (always non-strict via findAvailablePort) … Implement as `strict = false`." But TODAY, when `--auto-port` is off, `portResolver` is never created, so `resolveConfigPorts` never runs for phpmyadminPort either. The plan would change behavior so that under the new default-only mode (the common case for a contributor with no `autoPort` setting), a user-set `phpmyadminPort: 8080` that happens to be busy gets silently moved. That violates R3 ("user-set ports are never silently moved") for the phpmyadmin case, even though phpmyadminPort is technically out of the explicit HTTP-port scope. The plan needs to either (a) thread the same `defaultOriginPorts` provenance for phpmyadminPort and apply the same `strict = ! defaultOriginPorts.has(...)` rule, (b) special-case phpmyadminPort so the resolver only runs in `'all'` mode (preserving today's behavior verbatim), or (c) escalate to spec to explicitly accept this regression. As written, this is a silent behavior change not analyzed in the plan.

### F1 (Non-blocker) — `build-docker-compose-config.js` path is ambiguous
The plan refers to `build-docker-compose-config.js:173, 267` without the `runtime/docker/` prefix. The line numbers are accurate but the file lives at `packages/env/lib/runtime/docker/build-docker-compose-config.js`, not at `packages/env/lib/build-docker-compose-config.js`. The test file at `packages/env/lib/test/build-docker-compose-config.js` is unrelated (it imports from the runtime path). Clarify the cited path so the implementer does not chase a non-existent file.

### F2 (Non-blocker) — Snapshot drift assessment is incomplete
Step 12 says "If `config-integration.js.snap` changes (e.g. because `null` now appears for `autoPort`), inspect the diff." But `grep -n autoPort` against both snapshot files (`packages/env/lib/test/__snapshots__/md5.js.snap` and `packages/env/lib/config/test/__snapshots__/config-integration.js.snap`) returns zero hits today. There is no `autoPort` in the snapshots, so no drift is expected from that field. The snapshot risk the plan should call out instead is the `build-docker-compose-config.js` test file (not snapshot-based, but assertion-based on hardcoded `8888`/`8889`); however that file does NOT use `parseConfig` end-to-end — it constructs synthetic configs with explicit ports. So the plan's worry about snapshot churn is overstated and the actual fixture-update risk (B2 above) is missed.

### F3 (Non-blocker) — AC4 lacks a behavior-level integration test
The test plan covers AC4 only at the routing-matrix level ("uses non-strict mode for all ports under autoPortMode=all"). Spec AC4 reads as a Given/When/Then on `loadConfig` end-to-end (".wp-env.json sets port: 9000 + --auto-port + 9000 busy → start succeeds against next port above 9000"). The mirror to AC5's `loadConfig`-level test would be a `loadConfig with CLI autoPort=true and explicit user port falls back when port is busy` integration test in `config-integration.js`. The plan covers AC5 with such a test but not AC4. Strictly, the routing-matrix test plus the existing `--auto-port` test path may be enough for this change, but the asymmetry is worth flagging.

### F4 (Non-blocker) — Step 6 spinner re-arming claim under-specified
Step 6 says "call `spinner.info(...)` followed by `spinner.start()` to re-arm the spinner (the existing `withSpinner` in `cli.js:24-93` expects the spinner to remain active until the command resolves)." Reading `cli.js:24-93`, `spinner.info` is `ora`'s API which does change the spinner state, and `spinner.start()` is needed afterward to resume. The plan's instinct is correct but it does not cite where in the existing code the same pattern is used (`start.js:101` and `start.js:113` both do `spinner.warn(...); spinner.start();` — that is the precedent). Citing that precedent would make the implementer's job clearer. Also: the test plan asserts `spinner.start was called to re-arm` but does not assert the order of calls (info before start). Minor.

### F5 (Non-blocker) — OQ7 resolution slightly imprecise
The plan says about `process.env.CI` truthiness: "JavaScript truthy semantics: `"true"`, `"1"`, `"false"` (non-empty string), and any non-empty string are all truthy; `undefined`/empty string/`"0"` is also truthy in string form (`"0"` is truthy as a string)." This is internally inconsistent — `undefined` is NOT truthy in JS, and `""` is NOT truthy. The plan probably meant "non-empty string", but as written the sentence contradicts itself. This is reused from spec OQ7 verbatim and does not affect correctness (the implementation is `if ( process.env.CI )` which the plan correctly preserves), but the wording should be cleaned up to avoid confusing the implementer.

### F6 (Non-blocker) — JSDoc updates are mentioned twice but never staged in test plan
Steps 1, 2, 7 each say "update the JSDoc". No verification step asserts the JSDoc reflects the new tri-state. Not critical (JSDoc is non-functional) but worth a single-line note in Step 12 that the JSDoc updates were performed.

### F7 (Non-blocker) — Sequencing line is wrong about parallel/serial
§4 says: "Serial (must run in order): step 1 → step 2 → steps 4/5/7 → step 10/11 → step 12." But step 4 depends on step 3 (per Step 4's own "Depends on. Step 3" line), so the serial chain should read "step 1 → step 2 → step 3 → steps 4/5 → step 7 → step 10/11 → step 12" with step 3 also serial, not "parallelizable with step 1". And step 6 (described as parallelizable with step 1) actually should be parallel with step 5 since both touch the same file (`resolve-available-ports.js`) — so they cannot literally be done in parallel by separate workers, only by sequential editing of the same file. The plan's parallelism statement is thus aspirational but technically wrong. Minor for a single implementer; matters for an agent team.

### F8 (Non-blocker) — Rollback paragraph could mention the snapshot
§7 ("Rollback") says "A clean `git revert <merge-commit>` restores the prior PR #74472 opt-in-only behavior with no downstream cleanup needed: there is no migration, no persisted state, no schema change, and no public API surface change." This is correct as far as wp-env's own surface goes, but the plan does not call out that since cached `docker-compose.yml` files contain hardcoded resolved ports, an environment that started under the new default-fallback behavior on (say) 8890 will keep its cached compose pinned to 8890 until the user runs `start` again. Post-revert, that already-running environment continues to work, but newly-started ones (without `--auto-port`) on a busy 8888 will start failing again. Worth one sentence so the reverting maintainer knows to communicate this in the revert message.

---

## AC coverage matrix (audited)

| AC | Plan step(s) | Test(s) | OK? |
|---|---|---|---|
| AC1 | Steps 1, 2, 3, 4, 5 | parse-config provenance tests + "uses non-strict mode for default-origin ports" + "tri-state autoPort: unset triggers defaults-only mode" | Yes |
| AC2 | Steps 1, 2, 3, 4, 5 | same as AC1 (covers both env keys symmetrically) | Yes |
| AC3 | Steps 1, 2, 3, 4, 5 | "uses strict mode for non-default-origin ports under autoPortMode=defaults-only" + four parse-config provenance tests | Yes |
| AC4 | Steps 2, 5 | "uses non-strict mode for all ports under autoPortMode=all" + "CLI autoPort=true and user config autoPort=false has CLI win" | Partial (see F3) |
| AC5 | Steps 1, 2, 5 | "uses strict mode for all ports under autoPortMode=off" + "loadConfig with autoPort:false in user config skips fallback" | Yes |
| AC6 | Step 2 (CI guard preserved) | "loadConfig with CI=1 disables fallback regardless of autoPort:true" + "even when autoPort is unset" | Yes |
| AC7 | Step 6 | four resolver-notice tests including the no-console regression guard | Yes |
| AC8 | Step 2 + Step 10 named test | "CI=1 disables fallback regardless of autoPort:true" is the named regression detector | Yes |
| AC9a | Step 4 (post-process threading) | "postProcessConfig threads autoPortMode and defaultOriginPorts to portResolver" asserts WP_HOME/WP_SITEURL reflect resolved port | Yes |
| AC9b | Manual recipe in §3 of plan | PR test plan recipe enumerated | Yes (manual per spec) |
| AC9c | Inherited from cached compose pattern | None automated; manual per recipe | Yes (manual per spec; rationale documented) |
| AC10 | Step 12 | Snapshot sweep — but B1 and B2 mean existing tests will fail without fixture/return-shape updates | **No** — broken by B1/B2 |
| AC11 | Steps 1, 2, 7 | "should accept autoPort as a boolean" (modified to assert default is null) + "tri-state autoPort: unset triggers defaults-only mode" | Yes |

All ACs have at least one plan step targeting them. AC10 is technically covered by Step 12 but B1 and B2 will make it fail in practice.

---

## OQ resolution audit

| OQ | Plan resolution | Source verified? | Verdict |
|---|---|---|---|
| OQ1 (per-environment autoPort) | Root-only per `parse-config.js:483` and `:390-397` | Yes | Correct |
| OQ2 (provenance mechanism) | `defaultOriginPorts` Set built in parseConfig | Citation correct (`parse-config.js:124-167`) | Correct shape, but see B1 about return-value impact |
| OQ3 (multi-layer overrides) | Any non-default layer counts | Yes | Correct |
| OQ4 (env-var sources) | `WP_ENV_PORT`, `WP_ENV_TESTS_PORT` in scope | Verified at `get-config-from-environment-vars.js:38,40` | Correct |
| OQ5 (no upward port available) | Throws via `port-utils.js:77-79`, wrapped at `resolve-available-ports.js:84-87` | Yes | Correct |
| OQ6 (re-resolution on every start) | Confirmed by tracing start.js → load-config.js → post-process → resolveConfigPorts → mutates config.env[env].port; build-docker-compose interpolates that into cached YAML; downstream commands operate on cached YAML by container name | Yes (verified `stop.js:21-31` does NOT call loadConfig with resolvePorts; `clean/destroy/cleanup/logs/run/status` likewise omit `resolvePorts`) | Correct |
| OQ7 (CI truthiness) | Inherit verbatim from `load-config.js:102-104` | Yes — but see F5 about wording | Correct in substance |

---

## Verification of required-check items from the team prompt

1. **Spec AC coverage** — All ACs have at least one plan step. Coverage matrix above. (All ACs covered, none uncovered.)
2. **Step traceability** — Each step traces to ACs in its own "Spec ACs covered" line. No over-scoping detected.
3. **Source-code feasibility** — Citations are largely accurate; the only path ambiguity is `build-docker-compose-config.js` (F1).
4. **OQ resolutions** — All seven OQs resolved with valid evidence; OQ7 wording is internally inconsistent but not wrong in substance.
5. **Test plan completeness** — Major gap: B1 and B2 (parseConfig return-shape change and DEFAULT_CONFIG fixture); minor gap: B3 (phpmyadminPort behavior change unanalyzed); F3 (AC4 lacks behavior-level integration test).
6. **Sequencing** — F7: serial chain is wrong about step 3, and step 6 cannot literally be parallel with step 5 (same file).
7. **PHP-regression risk** — `composer test` is invoked at gates 2 and 4 per §4. Concrete checkpoint exists. OK.
8. **Scope confinement** — All file paths live inside `packages/env/`. OK.
9. **Rollback** — Concrete enough to act on, but should mention the cached-compose-pinning side effect (F8).

---

## Verdict

```
REJECTED — REVISIONS REQUESTED
```

Three blockers must be addressed before this plan can drive an implementation: (B1) the `parseConfig` return-shape change breaks ~25 existing tests with no acknowledgment in the test plan; (B2) the `DEFAULT_CONFIG` fixture in `parse-config.js` tests is not updated when the default `autoPort` value changes; (B3) `phpmyadminPort` will silently move under the new defaults-only mode whenever a user has set it, which is a quiet R3 regression the plan does not analyze.

The non-blocking findings (F1–F8) should also be cleaned up but are not gates.
