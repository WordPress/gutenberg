# Phase 2 — Implementation plan

Pipeline: `49843-wp-env-default-port-fallback`
Spec: `spec.md` (round 2 APPROVED).
Scope: `packages/env/` only.

---

## Revision log

Round 2 revisions, in response to `plan-review-1.md`:

- **B1 (blocker)** — `parseConfig` return shape change broke ~25 existing tests. Resolved by changing the design: instead of returning `{ config, defaultOriginPorts }`, attach `defaultOriginPorts` to the returned config object as a **non-enumerable** property named `__defaultOriginPorts` (a `Set<string>`). Existing destructurings, `expect( parsed ).toEqual( DEFAULT_CONFIG )` calls, and `Object.keys` / `for…in` iteration in `mergeConfig` (`merge-configs.js:39,81`) all skip non-enumerable properties, so the existing test suite is unchanged. The plan now uses this single approach (Step 3 rewritten); the consumer in `load-config.js` reads `config.__defaultOriginPorts` (Step 2 updated), and `postProcessConfig` reads it from the same config object (Step 4 updated). This also removes the need to change the call shape in `load-config.js:90-94`.
- **B2 (blocker)** — `DEFAULT_ENVIRONMENT_CONFIG.autoPort` flip from `false` to `null` breaks the `DEFAULT_CONFIG` fixture at `parse-config.js:21-71` (line 24) which is consumed by `toEqual( DEFAULT_CONFIG )` and spread-based assertions throughout the file. Resolved by making "update the test fixture" an explicit sub-step of Step 1 (point 4) AND by enumerating the affected assertions in the test plan §3 row "Modified — `DEFAULT_CONFIG` fixture". Also the modified test `should accept autoPort as a boolean` (line 196) is unaffected by this fixture change because it asserts only `parsed.autoPort` (not `toEqual( DEFAULT_CONFIG )`).
- **B3 (blocker)** — `phpmyadminPort` would silently auto-move under `defaults-only` mode. Resolved by extending the strict-routing rule in `resolveConfigPorts` (Step 5) so that under `autoPortMode='defaults-only'`, **only HTTP ports (`property === 'port'`) get any non-strict treatment**; for `phpmyadminPort` the resolver is skipped entirely (no resolver call at all), preserving today's behavior verbatim — today phpmyadminPort is only resolved when `--auto-port` is set, which corresponds to the new `autoPortMode='all'` mode. This avoids both the silent-move regression and any need to thread provenance for phpmyadminPort. Spec is unchanged (phpmyadminPort is out of scope per §5).
- **F1 (minor)** — `build-docker-compose-config.js` path is `packages/env/lib/runtime/docker/build-docker-compose-config.js` (verified: the file at `packages/env/lib/build-docker-compose-config.js` does NOT exist; only the one under `runtime/docker/` and its test at `packages/env/lib/test/build-docker-compose-config.js`). All references in the plan now use the full path.
- **F2 (minor)** — Snapshot drift expectation is corrected: `grep autoPort` against `packages/env/lib/test/__snapshots__/md5.js.snap` and `packages/env/lib/config/test/__snapshots__/config-integration.js.snap` returns zero hits, so no `autoPort`-related snapshot churn is expected. The real fixture risk (the inline `DEFAULT_CONFIG` at `parse-config.js:21-71`, line 24) is now called out in Step 1 sub-step 4 and re-confirmed in Step 12.
- **F3 (minor)** — Added an AC4 behavior-level integration test (`loadConfig with CLI autoPort=true and explicit user port falls back when port is busy`) in `config-integration.js`, matching the symmetry of the AC5 integration test.
- **F4 (minor)** — Step 6 now cites the existing `start.js:98-101` and `start.js:105-112` precedent of `spinner.warn(...); spinner.start();` and the test plan asserts call order (`spinner.info` before `spinner.start`).
- **F5 (minor)** — OQ7 wording is cleaned up; the resolution now reads correctly: "all non-empty strings are truthy; empty string and `undefined` are falsy". The implementation is unchanged (`if ( process.env.CI )`).
- **F6 (minor)** — Step 12 now includes a JSDoc-review checklist line (verify the `WPRootConfigOptions` typedef in `parse-config.js`, the `loadConfig` JSDoc in `load-config.js`, and the `start` JSDoc in `commands/start.js` reflect the new tri-state).
- **F7 (minor)** — Sequencing diagram in §4 corrected: step 3 is serial (must precede step 4), and step 6 cannot run literally in parallel with step 5 because both edit the same file. Updated to show realistic ordering for both single-implementer and multi-agent scenarios.
- **F8 (minor)** — §7 Rollback paragraph extended with a one-sentence note about cached `docker-compose.yml` files retaining post-fallback ports across a revert.

---

## 1. Plan summary

The chosen design shape: extend the existing `--auto-port` / `autoPort` machinery (PR #74472) with two narrow tweaks rather than introduce parallel code paths.

1. **Tri-state `autoPort`.** Change `DEFAULT_ENVIRONMENT_CONFIG.autoPort` from `false` to `null` so that the "unset" state survives merging. CLI parsing already preserves `undefined`/`true`/`false` (verified — see OQ-resolutions). `load-config.js` becomes the single point where the tri-state is interpreted into a runtime decision: `'all'` (today's PR #74472 behavior) | `'defaults-only'` (new behavior) | `'off'` (explicit opt-out).
2. **Per-port "user-set" provenance, attached as a non-enumerable property.** Track which environment ports came from `DEFAULT_ENVIRONMENT_CONFIG` versus from any user source (root `.wp-env.json`, `.wp-env.override.json`, env vars). The mechanism is a small `Set<string>` (`__defaultOriginPorts`) built in `parseConfig` (in `parse-config.js`), attached to the returned config via `Object.defineProperty(config, '__defaultOriginPorts', { value: …, enumerable: false })`. `mergeConfig` in `merge-configs.js:39,81` iterates with `for ( const option in config )` which excludes non-enumerable properties, so existing tests' `toEqual` and destructure expectations are untouched. `loadConfig` reads `config.__defaultOriginPorts` and threads it into `postProcessConfig` → `resolveConfigPorts`. `resolveConfigPorts` then decides per-port whether to use the existing `findAvailablePort` (auto-fallback) or the existing `isPortAvailable` strict path, based on `(autoPortMode, isDefaultOrigin, property)`.

The port resolver is invoked from `loadConfig` whenever EITHER `autoPortMode === 'all'` (today's PR #74472 contract) OR `autoPortMode === 'defaults-only'` (the new behavior). In the new mode, only HTTP ports (`property === 'port'`) participate in the routing decision; `phpmyadminPort` is **only** auto-resolved under `'all'` mode (preserving today's behavior verbatim). The `process.env.CI` guard stays in `load-config.js` and short-circuits both modes by forcing `'off'`. The "moved port" notice (R11/AC7) is added to `createPortResolver` so it fires only when the resolved port differs from the preferred port and goes through the same `spinner` instance the resolver already accepts.

No new top-level config option is introduced. No new CLI flag is introduced. No package boundary is crossed. `appendPortToWPConfigs` is unchanged: it already consumes `config.env[env].port`, which now reflects the resolved port (R8 / AC9a). For other commands (R8 / AC9c), the existing pattern of writing the resolved port into the cached `docker-compose.yml` during `start` already covers `stop`/`destroy`/`logs`/`run` because they operate against the cached compose file by container name; no additional port re-resolution is needed in those commands.

### Resolution of OQ1–OQ7 (each cited to source)

- **OQ1 — Per-environment `autoPort`.** Resolved: root-only. `parse-config.js:481-493` lists `autoPort` in the switch's case-block of `parseEnvironmentConfig` (specifically `case 'autoPort':` at line 483), allowed only when `options.rootConfig` is true. `parse-config.js:390-397` parses it only on the root config path. Plan inherits root-only and does not extend it.
- **OQ2 — Provenance tracking mechanism.** Resolved: a `Set<string>` (`defaultOriginPorts`) built in `parseConfig` (in `parse-config.js`) and attached to the returned config object as a non-enumerable property `__defaultOriginPorts`. The Set is populated as the inverse of "any non-default config layer set this key" — see step 3. Citation: `parse-config.js:130-167` shows the merge order (`localConfig`, `overrideConfig`, `defaultConfig` from `getDefaultConfig`, `environmentVarOverrides`); each non-default layer can be inspected for whether it provided `port`/`testsPort`/`env.development.port`/`env.tests.port`. The non-enumerable approach is chosen so `mergeConfig` (which iterates via `for…in` at `merge-configs.js:39,81`) does not see it during merging and so existing tests' `toEqual(DEFAULT_CONFIG)` assertions remain unchanged.
- **OQ3 — Multiple override layers.** Resolved: any non-default layer (`localConfig`, `overrideConfig`, `environmentVarOverrides`) that sets the port marks the port as "user-set". Citation: same `parse-config.js:130-167` merge sequence; environment vars are produced by `getEnvironmentVarOverrides` at `parse-config.js:284-344` and we inspect the same struct that already exists.
- **OQ4 — env-var sources for ports.** Resolved: enumerated from `get-config-from-environment-vars.js:36-72` — the user-set port-yielding env vars are `WP_ENV_PORT`, `WP_ENV_TESTS_PORT`, `WP_ENV_MYSQL_PORT`, `WP_ENV_TESTS_MYSQL_PORT`, `WP_ENV_PHPMYADMIN_PORT`, and `WP_ENV_TESTS_PHPMYADMIN_PORT`. Of these, only `WP_ENV_PORT` and `WP_ENV_TESTS_PORT` are in scope of this feature (HTTP ports). `mysqlPort` is out of scope per spec §5; `phpmyadminPort` is out of scope per spec §5 and per the B3 resolution above (see Step 5).
- **OQ5 — Behavior when no upward port is available.** Resolved: re-use existing failure mode. `port-utils.js:51-80` already throws `Error('No available port found in range ${startPort}-${maxPort}.')` and that error is wrapped in `resolve-available-ports.js:84-87` into `Could not find available port for <configPath>: ...`. Plan does not change this; the error already surfaces to the spinner via `withSpinner` in `cli.js:24-93` (rejection branch at lines 46-92).
- **OQ6 — Re-resolution on every `start`; downstream commands consume cached compose.** Resolved: confirmed by tracing — `start.js:55-59` calls `loadConfig({ resolvePorts: true, ... })`, `post-process-config.js:35-37` writes the resolved port into `config.env[env].port` (and therefore into the env-merged config consumed by `appendPortToWPConfigs` at `post-process-config.js:39`), `runtime/docker/build-docker-compose-config.js:173,267` interpolates that port into the cached `docker-compose.yml`, and downstream commands such as `stop.js:21-31` operate on `dockerComposeConfigPath` by container name (no port re-resolution). So a stale running environment from a prior wp-env version is unaffected until the next `start`, which re-resolves freshly. No persisted-state file is needed.
- **OQ7 — `CI` truthiness.** Resolved: inherit verbatim from `load-config.js:102-104` — `if ( process.env.CI )`. JavaScript truthy semantics: any non-empty string is truthy (so `"true"`, `"1"`, `"false"`, `"0"`, etc. are all truthy as strings); `undefined` and the empty string are falsy. The plan does not redefine this; it relies on the existing one-liner.

No OQs are deferred to "the implementer will figure it out". Zero blockers.

---

## 2. Steps

### Step 1 — Make `autoPort` tri-state at the config-default layer

- **Goal.** Stop collapsing `undefined → false` at the default-config layer so that "unset" survives merging and is observable inside `load-config.js`.
- **Files touched.**
  - `packages/env/lib/config/parse-config.js`
  - `packages/env/lib/config/test/parse-config.js` (fixture only — see sub-step 4)
- **Change description.**
  1. In `DEFAULT_ENVIRONMENT_CONFIG` (currently `parse-config.js:86-111`, specifically line 93), change `autoPort: false` to `autoPort: null`. `null` is the sentinel for "user did not set this" (chosen over `undefined` so the key stays present after `mergeConfigs` for snapshot/typedef stability).
  2. In the `WPRootConfigOptions` typedef comment block (`parse-config.js:32-44`, specifically the `@property` line at line 38), update the `autoPort` `@property` line to `boolean|null` and refine the description to "Tri-state: `null` (unset, default behavior — auto-fallback only on default ports), `true` (auto-fallback for all ports), `false` (strict for all ports)."
  3. In `parseRootConfig`, the existing block at `parse-config.js:390-397` already only assigns `parsedConfig.autoPort` when `rawConfig.autoPort !== undefined`; no change there. The change at the default layer is sufficient because the merge in `mergeConfigs` will now leave a non-user-set `autoPort` as `null`.
  4. **Update the inline test fixture `DEFAULT_CONFIG` in `packages/env/lib/config/test/parse-config.js:21-71`, line 24: change `autoPort: false` to `autoPort: null`.** This fixture is `toEqual()`-compared at `parse-config.js test:91, 193, 232, 293, 305` and is used as a spread base at `parse-config.js test:166, 232, 305, 500, 531, 557` (`...DEFAULT_CONFIG`, `...DEFAULT_CONFIG.env.development`). The single fixture edit fixes all of those in one step. The named test `'should accept autoPort as a boolean'` at `parse-config.js test:196-207` does NOT use `DEFAULT_CONFIG` and is updated separately in Step 10 (it must additionally assert that the **default** is `null`).
- **Spec ACs covered.** AC11, AC1, AC2, AC5 (foundational — all rely on this).
- **Depends on.** None.

### Step 2 — Reinterpret `autoPort` in `loadConfig` as tri-state

- **Goal.** Replace the binary on/off interpretation in `load-config.js` with a tri-state interpretation, and decide whether to invoke the port resolver.
- **Files touched.**
  - `packages/env/lib/config/load-config.js`
- **Change description.**
  - At `load-config.js:96-109`, replace the existing block that computes `shouldAutoPort` with a new computation that yields one of three values for an internal variable `autoPortMode`: `'all'` (today's PR #74472 behavior — `true`), `'defaults-only'` (new behavior — `null`/`undefined`), or `'off'` (explicit opt-out — `false`). Source precedence is unchanged: CLI `autoPort` parameter beats `config.autoPort`.
  - Mapping: CLI `true` → `'all'`; CLI `false` → `'off'`; CLI `undefined` AND `config.autoPort === true` → `'all'`; CLI `undefined` AND `config.autoPort === false` → `'off'`; CLI `undefined` AND (`config.autoPort === null` or `undefined`) → `'defaults-only'`.
  - The existing `process.env.CI` guard (lines 102-104) is rewritten to force `autoPortMode = 'off'` when CI is truthy. (Same observable behavior, slightly different shape so the guard sits in front of the resolver gate.)
  - Always create a `portResolver` when `resolvePorts` is true and `autoPortMode !== 'off'`. (Today the resolver is only created when `shouldAutoPort` is truthy. The new resolver still behaves correctly with no default-origin ports — see step 5 for the per-port routing — but it must exist so `defaults-only` mode can fire on default HTTP ports.)
  - Read `config.__defaultOriginPorts` from the parsed config (a `Set<string>`; see Step 3) — fall back to `new Set()` if the property is absent. Pass it through to `postProcessConfig` along with `autoPortMode`. The signature of `postProcessConfig` is extended to accept `{ portResolver, autoPortMode, defaultOriginPorts }` (see step 4).
  - Update the JSDoc on `loadConfig` to describe the new tri-state.
  - The call to `parseConfig` at `load-config.js:90-94` is **unchanged in shape** — `parseConfig` still returns the merged config object directly (the `__defaultOriginPorts` is a non-enumerable property attached to that object).
- **Spec ACs covered.** AC1, AC2, AC3, AC4, AC5, AC6, AC11.
- **Depends on.** Step 1.

### Step 3 — Track default-origin port provenance in `parseConfig`

- **Goal.** Build a `Set<string>` (`defaultOriginPorts`) listing port keys whose value came from `DEFAULT_ENVIRONMENT_CONFIG` and was NOT overridden by any user-supplied source (root or override JSON, or environment variable). Attach it to the returned config object as a non-enumerable property.
- **Files touched.**
  - `packages/env/lib/config/parse-config.js`
- **Change description.**
  - In `parseConfig` (`parse-config.js:124-168`), after computing `localConfig`, `overrideConfig`, and `environmentVarOverrides` (lines 129-158) and BEFORE the final `return mergeConfigs(...)` at lines 162-167, build a `defaultOriginPorts` Set.
  - Implement as a small helper `function computeDefaultOriginPorts(localConfig, overrideConfig, envVarOverrides)` returning a `Set<string>` containing zero or more of `'development.port'` and `'tests.port'`.
  - For each of the two HTTP ports (`'development.port'`, `'tests.port'`), the port is "default-origin" iff none of the following provided it:
    - `localConfig?.port` (root-level, hoisted to development by `mergeRootToEnvironments` later).
    - `localConfig?.testsPort` (root-level, hoisted to tests).
    - `localConfig?.env?.development?.port` / `localConfig?.env?.tests?.port` (env-specific).
    - The same five paths on `overrideConfig`.
    - `envVarOverrides.port` (set by `getEnvironmentVarOverrides` at `parse-config.js:301-304` when `WP_ENV_PORT` is defined; same for `testsPort` at lines 316-319).
    - Note: `envVarOverrides.env.development.port` and `envVarOverrides.env.tests.port` are also set in those same blocks; either one being present is sufficient signal.
  - Capture the merge result in a local `merged` variable instead of returning it directly, then attach the Set:
    - `Object.defineProperty(merged, '__defaultOriginPorts', { value: defaultOriginPortsSet, enumerable: false, writable: false, configurable: false })`.
    - Return `merged`.
  - Why non-enumerable: `mergeConfig` in `merge-configs.js` iterates via `for ( const option in ... )` at lines 39 and 81. Non-enumerable properties are skipped by `for…in`. `JSON.stringify` and `Object.keys` also skip them. `expect( parsed ).toEqual( DEFAULT_CONFIG )` (Jest) compares own-enumerable properties only. Therefore attaching `__defaultOriginPorts` does not affect `mergeConfig`, JSON serialization, or Jest equality checks. (Verified semantics; see existing tests at `packages/env/lib/config/test/parse-config.js:91, 193, 232, 293, 305, 506, 537, 560`.)
  - The `parseConfigFile` and `parseRootConfig` internals do not need to know about provenance; only `parseConfig` itself does, because it has visibility into all four sources at once.
  - `getConfigFilePath` exports — unchanged.
- **Spec ACs covered.** AC1, AC2, AC3, AC5.
- **Depends on.** Step 1 (the default `autoPort` change is independent, but Step 3 must run before Step 4 can consume its output).

### Step 4 — Thread `defaultOriginPorts` through `postProcessConfig`

- **Goal.** Hand the per-port provenance to the place that decides `findAvailablePort` vs. `isPortAvailable` strict.
- **Files touched.**
  - `packages/env/lib/config/post-process-config.js`
- **Change description.**
  - Update the exported `postProcessConfig` signature from `(config, { portResolver })` (currently `post-process-config.js:24-27`) to `(config, { portResolver, autoPortMode = 'off', defaultOriginPorts = new Set() })`. Defaults preserve current behavior for the existing call sites that do not opt in.
  - In the body, where the existing call `await resolveConfigPorts( config, portResolver )` is at line 36, change it to `await resolveConfigPorts( config, portResolver, { autoPortMode, defaultOriginPorts } )`.
  - No other behavior in `postProcessConfig` changes. `mergeRootToEnvironments`, `appendPortToWPConfigs`, and `validatePortUniqueness` are untouched.
  - Update the JSDoc to describe the two new options.
- **Spec ACs covered.** AC1, AC2, AC3, AC5, AC9a.
- **Depends on.** Step 3.

### Step 5 — Per-port strict/non-strict routing in `resolveConfigPorts`

- **Goal.** Use the per-port provenance + tri-state to decide, for each port, whether to call the existing `findAvailablePort` (auto-fallback) path, the existing `isPortAvailable` strict path, or skip the port entirely (preserving today's behavior).
- **Files touched.**
  - `packages/env/lib/resolve-available-ports.js`
- **Change description.**
  - Update the exported `resolveConfigPorts(config, portResolver)` signature (currently `resolve-available-ports.js:100`) to `resolveConfigPorts(config, portResolver, { autoPortMode = 'off', defaultOriginPorts = new Set() } = {})`.
  - Inside the loop over `PORT_DEFINITIONS` (currently `resolve-available-ports.js:101-127`), add a small early-exit and a `strict` decision:
    - **Per-port skip rule** (preserves today's behavior for `phpmyadminPort` under the new mode):
      - If `autoPortMode === 'defaults-only'` AND `property !== 'port'` (i.e. `phpmyadminPort`): `continue` — skip this port entirely. Today phpmyadminPort is only resolved when `--auto-port` is on (because the resolver itself is only created in that case); under `'defaults-only'` we keep that exact behavior verbatim by skipping the port. (B3 resolution.)
    - **Strict decision** for the remaining ports:
      - If `autoPortMode === 'off'` → `strict = true`. (Note: in this branch the resolver is never created in `load-config.js`, so this case is unreachable in production. We still set it defensively for correctness when the function is unit-tested.)
      - If `autoPortMode === 'all'` → `strict = false`. (Today's PR #74472 behavior, including the existing `phpmyadminPort` non-strict path which we preserve here when the property is `phpmyadminPort` because the skip rule above does not apply.)
      - If `autoPortMode === 'defaults-only'` AND `property === 'port'`: `strict = ! defaultOriginPorts.has( '${env}.port' )`. That is, default-origin ports get auto-fallback (strict=false); user-set ports stay strict (AC1, AC2, AC3).
  - Pass `strict` as the third argument to `portResolver.resolve(preferredPort, configPath, strict)` — the resolver already supports this third parameter at `resolve-available-ports.js:50`.
  - `createPortResolver` is updated separately in step 6 for the messaging contract; the `resolve` signature here is unchanged.
  - The `PREFERRED_PORTS` table (`resolve-available-ports.js:23-26`) and the lookup `currentValue ?? PREFERRED_PORTS[ key ]` (line 113) are unchanged.
  - Update the JSDoc on `resolveConfigPorts` to document the two new options.
- **Spec ACs covered.** AC1, AC2, AC3, AC4, AC5, AC9a.
- **Depends on.** Steps 2, 3, 4.

### Step 6 — Add the "moved port" notice to `createPortResolver`

- **Goal.** Implement R11 / AC7: emit an informational message via the existing spinner, only when the resolved port differs from the preferred port, with no new flag and no separate output channel.
- **Files touched.**
  - `packages/env/lib/resolve-available-ports.js`
- **Change description.**
  - Inside `createPortResolver`'s returned `resolve` method, in the non-strict branch (currently `resolve-available-ports.js:74-87`), after `findAvailablePort` resolves to `resolvedPort` and BEFORE `usedPorts.push( resolvedPort )` (line 80), compare `resolvedPort` to `preferredPort`. When they differ AND `spinner` exists, call:
    - `spinner.info( 'Port ${preferredPort} (${configPath}) was busy; using ${resolvedPort} instead.' )` (exact message format chosen for clarity; the test in step 11 asserts a regex containing both port numbers and the string "busy").
    - Followed by `spinner.start()` to re-arm the spinner. Precedent: `start.js:98-101` and `start.js:105-112` use this exact `spinner.warn(...); spinner.start();` pattern; `start.js:169-193` uses `spinner.info(...)` followed by `spinner.start()`.
  - The strict branch (lines 56-72) is unchanged — when the port is busy in strict mode, the existing `throw new Error(...)` at lines 65-69 already surfaces via the spinner's `fail` path in `withSpinner` (`cli.js:46-92`). No "moved" notice fires on the strict path (matches AC7's "only when a fallback actually occurred").
  - When `spinner` is undefined (test path), suppress the notice silently. Implementation guard: `if ( spinner && resolvedPort !== preferredPort ) { ... }`.
  - The notice MUST go through the same `spinner` instance that `--auto-port` already uses today (the one passed into `createPortResolver(spinner)`); do NOT introduce a new logger, console call, or stream. AC7's "regression detectable" clause means the test in step 11 asserts the call goes through the spinner (`spinner.info` was called) and that there is **no** `console.log` / `console.info` / `process.stdout.write` invocation.
- **Spec ACs covered.** AC1, AC2, AC4, AC7.
- **Depends on.** Step 5 (sequencing — both edit `resolve-available-ports.js`; step 5 lands first, then step 6 modifies `createPortResolver` in the same file).

### Step 7 — Wire `start` to pass tri-state and provenance to `loadConfig`

- **Goal.** Surface the new options on the call-site, and verify nothing else needs to change in `start.js`.
- **Files touched.**
  - `packages/env/lib/commands/start.js`
- **Change description.**
  - No public signature change. The existing `loadConfig( path.resolve('.'), customConfigPath, { resolvePorts: true, autoPort, spinner })` call at `start.js:55-59` already passes `autoPort` from yargs (which is `undefined` / `true` / `false`); the new tri-state interpretation in `load-config.js` (step 2) consumes that directly. Confirm by tracing: `cli.js:154-158` defines `--auto-port` as `type: 'boolean'` with no `default`, so missing → `undefined`; explicit `--auto-port` → `true`; explicit `--no-auto-port` → `false`. (Verified in `lib/test/cli.js:35-52`.)
  - Update the JSDoc on `start` (`start.js:21-34`, specifically line 32 for `options.autoPort`) to describe `autoPort` as tri-state.
- **Spec ACs covered.** AC11 (CLI boundary preservation), AC1–AC6 (consumer correctness).
- **Depends on.** Step 2.

### Step 8 — Documentation: README

- **Goal.** Document the new default behavior and the `"autoPort": false` opt-out.
- **Files touched.**
  - `packages/env/README.md`
- **Change description.**
  - In the config table at `README.md:609`, update the `"autoPort"` row: change Default from `false` to `null` and rewrite the Description to "Tri-state: when unset (`null`), default ports `8888`/`8889` automatically fall back to the next available port if busy; explicitly `true` enables fallback for all ports including user-set ones; explicitly `false` disables fallback even on default ports."
  - In the "Automatic Port Selection" section at `README.md:620-630`, rewrite to reflect the new contract: (a) by default, when the contributor has not pinned a port, busy default ports auto-fall-back upward; (b) explicitly configured ports remain strict unless `--auto-port` / `"autoPort": true` is set; (c) `"autoPort": false` is the opt-out for the default-fallback behavior; (d) `CI=1` continues to disable all auto-fallback.
  - Keep the existing example `wp-env start --auto-port` and explain it still applies when contributors want explicit ports to also auto-fall-back.
- **Spec ACs covered.** AC documentation in spec §3 R14.
- **Depends on.** Step 2 (so that the documented semantics match implementation).

### Step 9 — Documentation: CHANGELOG

- **Goal.** List the user-visible change under the next unreleased version.
- **Files touched.**
  - `packages/env/CHANGELOG.md`
- **Change description.**
  - Under the existing `## Unreleased` heading at `CHANGELOG.md:3`, add a `### New Features` (or `### Enhancements`) subsection describing: "Default ports `8888` and `8889` now automatically fall back to the next available port when busy and the contributor has not set a port explicitly. Set `"autoPort": false` in `.wp-env.json` to opt out, or `CI=1` for CI runs." Reference issue `#49843`.
  - Do NOT add a "breaking change" entry — the change is additive on the unset-port path; explicit ports are unchanged.
- **Spec ACs covered.** AC documentation in spec §3 R14.
- **Depends on.** Step 8 (so wording is consistent).

### Step 10 — Unit tests for tri-state and provenance plumbing

- **Goal.** Add automated tests covering AC1, AC2, AC3, AC4, AC5, AC6, AC9a, AC11.
- **Files touched.**
  - `packages/env/lib/config/test/parse-config.js`
  - `packages/env/lib/config/test/post-process-config.js`
  - `packages/env/lib/config/test/config-integration.js`
  - `packages/env/lib/test/resolve-available-ports.js`
- **Change description.** See test plan §3 below for the table. The DEFAULT_CONFIG fixture edit is in Step 1 (sub-step 4), not here.
- **Spec ACs covered.** AC1, AC2, AC3, AC4, AC5, AC6, AC8, AC9a, AC11.
- **Depends on.** Steps 1–7.

### Step 11 — Unit tests for the "moved port" notice

- **Goal.** Lock in AC7's "same output mechanism" contract such that introducing a new output path is a detectable regression.
- **Files touched.**
  - `packages/env/lib/test/resolve-available-ports.js`
- **Change description.** See test plan §3 below.
- **Spec ACs covered.** AC7.
- **Depends on.** Step 6.

### Step 12 — Snapshot, fixture, and JSDoc verification sweep

- **Goal.** Verify snapshot churn is intentional and limited; verify all fixture and JSDoc updates landed.
- **Files touched.**
  - `packages/env/lib/config/test/__snapshots__/config-integration.js.snap` (only if it changes — which is NOT expected; see verification below).
- **Change description.**
  - Run `npm run test:unit -- packages/env` after steps 1–11 land. **Expectation:** no snapshot diffs (verified — `grep autoPort packages/env/lib/config/test/__snapshots__/config-integration.js.snap` and `… packages/env/lib/test/__snapshots__/md5.js.snap` both return zero hits today, so flipping `autoPort: false → null` does not affect any serialized snapshot). If a snapshot DOES change unexpectedly, inspect the diff before accepting; a sudden snapshot diff after this PR would indicate a regression and should be investigated rather than blanket-accepted with `--updateSnapshot`. AC10 requires this discipline.
  - **Inline-fixture verification.** Confirm `DEFAULT_CONFIG.autoPort === null` in `packages/env/lib/config/test/parse-config.js:24` (changed in Step 1 sub-step 4). Confirm no other inline fixtures contain `autoPort: false` that need updating: `grep -rn "autoPort" packages/env/lib/`. Expected matches: `parse-config.js` (default), `parse-config.js test` (one fixture line + the named test + the `non-boolean autoPort` validation test), `load-config.js` (the new tri-state computation), `post-process-config.js` (the new option threading), `resolve-available-ports.js` (the new routing), `config-integration.js` (new integration tests). No other matches expected.
  - **JSDoc verification checklist.** Confirm the JSDoc updates from steps 1, 2, 5, 7 landed:
    - `parse-config.js` `WPRootConfigOptions` typedef line for `autoPort` reads `boolean|null` with the tri-state description.
    - `load-config.js` `loadConfig` JSDoc describes `autoPort` as tri-state.
    - `post-process-config.js` `postProcessConfig` JSDoc describes the two new options (`autoPortMode`, `defaultOriginPorts`).
    - `resolve-available-ports.js` `resolveConfigPorts` JSDoc describes the two new options.
    - `commands/start.js` `start` JSDoc line 32 describes `autoPort` as tri-state.
- **Spec ACs covered.** AC10.
- **Depends on.** All prior steps.

---

## 3. Test plan

| Test file | New / Modified | `it` name | Spec AC | Description |
|---|---|---|---|---|
| `packages/env/lib/config/test/parse-config.js` | **Modified — fixture** | `DEFAULT_CONFIG` fixture at line 21-71 | AC11 | Change `autoPort: false` to `autoPort: null` at line 24. Single edit; cascades through all `toEqual( DEFAULT_CONFIG )` and `...DEFAULT_CONFIG`-spread assertions (lines 91, 166, 193, 232, 293, 305, 500, 531, 557). Done in Step 1 sub-step 4. |
| `packages/env/lib/config/test/parse-config.js` | Modified | `should accept autoPort as a boolean` (line 196) | AC11 | Augment the existing assertion (`expect( parsed.autoPort ).toEqual( true )`) with a second case asserting that when no autoPort is set in any source, `parsed.autoPort` is `null` (the new default). Update the test name to `should accept autoPort as a tri-state (null default, true, false)`. |
| `packages/env/lib/config/test/parse-config.js` | New | `parseConfig attaches __defaultOriginPorts as a non-enumerable Set with both http ports when no user config sets them` | AC1, AC2 | With `readRawConfigFile.mockResolvedValue(null)` and no env vars set, the returned config has a `__defaultOriginPorts` Set containing exactly `'development.port'` and `'tests.port'`. Also assert `Object.propertyIsEnumerable.call(parsed, '__defaultOriginPorts')` is `false`. |
| `packages/env/lib/config/test/parse-config.js` | New | `parseConfig omits development.port from __defaultOriginPorts when local config sets root port` | AC3 | Local config sets `port: 9000`; Set contains `'tests.port'` but NOT `'development.port'`. |
| `packages/env/lib/config/test/parse-config.js` | New | `parseConfig omits tests.port from __defaultOriginPorts when local config sets env.tests.port` | AC3 | Local config sets `env.tests.port: 9001`; Set contains `'development.port'` but NOT `'tests.port'`. |
| `packages/env/lib/config/test/parse-config.js` | New | `parseConfig omits development.port from __defaultOriginPorts when override config sets port` | AC3 | `.wp-env.override.json` sets `port: 9000`; Set contains `'tests.port'` but NOT `'development.port'`. |
| `packages/env/lib/config/test/parse-config.js` | New | `parseConfig omits development.port from __defaultOriginPorts when WP_ENV_PORT is set` | AC3 (R3 env-var clause), OQ4 | Set `process.env.WP_ENV_PORT = '4321'` before call (the existing `afterEach` at line 79-86 already cleans this up); assert Set lacks `'development.port'`. |
| `packages/env/lib/config/test/parse-config.js` | New | `parseConfig omits tests.port from __defaultOriginPorts when WP_ENV_TESTS_PORT is set` | AC3 (R3 env-var clause), OQ4 | Mirror of above for `WP_ENV_TESTS_PORT`. |
| `packages/env/lib/config/test/parse-config.js` | New | `__defaultOriginPorts is invisible to mergeConfigs and toEqual (regression guard for B1 / non-enumerable contract)` | AC10 | Construct a fresh `parseConfig` result, run `JSON.parse(JSON.stringify(parsed))`, assert `__defaultOriginPorts` is absent in the round-trip, AND assert `expect(parsed).toEqual(DEFAULT_CONFIG)` still passes (i.e. `toEqual` does not see `__defaultOriginPorts`). This is the regression detector for any future change that flips the property to enumerable. |
| `packages/env/lib/config/test/post-process-config.js` | New | `postProcessConfig threads autoPortMode and defaultOriginPorts to resolveConfigPorts` | AC9a | Use a fake `portResolver` whose `resolve` is a `jest.fn()` returning `8890`; pass `{ portResolver, autoPortMode: 'defaults-only', defaultOriginPorts: new Set([ 'development.port', 'tests.port' ]) }` and a config with `env.development.port: 8888`, `env.tests.port: 8889`, plus `config: { WP_HOME: 'http://localhost', WP_SITEURL: 'http://localhost' }`. Assert `portResolver.resolve` is called with `(8888, 'env.development.port', false)` AND `(8889, 'env.tests.port', false)`. Assert the post-process result has `env.development.port === 8890` (from the mock return) and `env.development.config.WP_HOME === 'http://localhost:8890'` (i.e. `appendPortToWPConfigs` consumed the resolved port). |
| `packages/env/lib/config/test/post-process-config.js` | New | `postProcessConfig with autoPortMode=defaults-only routes user-set port to strict and default-origin port to non-strict` | AC1, AC2, AC3 | Pass `defaultOriginPorts: new Set([ 'development.port' ])` (i.e. tests port is user-set); assert the resolver call for `env.development.port` has third arg `false` and for `env.tests.port` has third arg `true`. |
| `packages/env/lib/config/test/post-process-config.js` | New | `postProcessConfig with autoPortMode=defaults-only skips phpmyadminPort entirely (B3 regression guard)` | AC10, R3 | Provide a config with `env.development.port: 8888` and `env.development.phpmyadminPort: 8080`, `defaultOriginPorts: new Set([ 'development.port' ])`. Assert `portResolver.resolve` is called once for `'env.development.port'` and is NEVER called with `configPath` containing `'phpmyadminPort'`. This guards against the B3 regression where phpmyadminPort would silently auto-move under defaults-only mode. |
| `packages/env/lib/config/test/post-process-config.js` | New | `postProcessConfig with autoPortMode=all routes both http ports AND phpmyadminPort non-strict (preserves PR #74472 behavior)` | AC4 | Config with all three ports populated; `defaultOriginPorts: new Set()`; assert `resolver.resolve` is called for HTTP ports AND phpmyadminPort, all with `strict=false`. |
| `packages/env/lib/config/test/post-process-config.js` | New | `postProcessConfig defaults to autoPortMode=off and routes ports strict (back-compat)` | AC10 | Call `postProcessConfig(config, { portResolver })` with NO `autoPortMode` / `defaultOriginPorts` (the existing call shape from before this PR). Assert the resolver receives `strict=true` for HTTP ports and is also called for phpmyadminPort (because the skip rule only applies to `'defaults-only'`). This guards the back-compat default in Step 4. |
| `packages/env/lib/config/test/config-integration.js` | New | `loadConfig with no user autoPort and busy default port falls back via defaults-only mode` | AC1, AC11 | With no user config, mock the port resolver path: spy on `createPortResolver` to verify it IS created (not skipped). Mock `findAvailablePort` to return `8890` for preferred `8888`. Assert `config.env.development.port === 8890` and `config.env.development.config.WP_HOME === 'http://localhost:8890'`. |
| `packages/env/lib/config/test/config-integration.js` | New | `loadConfig with autoPort:false in user config skips fallback even on default ports` | AC5 | With `.wp-env.json` containing `{ "autoPort": false }`, mock `isPortAvailable` to return `false` for 8888 → assert `loadConfig` rejects with the strict port-busy error. |
| `packages/env/lib/config/test/config-integration.js` | New | `loadConfig with CI=1 disables fallback regardless of autoPort:true` | AC6, AC8 | Set `process.env.CI = '1'`, set user config `{ "autoPort": true }`, mock the port-availability layer so 8888 is busy → assert `loadConfig` rejects with the strict port-busy error. The named test exists so removing the `if ( process.env.CI )` guard in `load-config.js` causes this test to fail — this is the AC8 regression detector. Cleanup `delete process.env.CI` in `afterEach`. |
| `packages/env/lib/config/test/config-integration.js` | New | `loadConfig with CI=1 disables fallback even when autoPort is unset` | AC6 | Same as above but with no `autoPort` key in the config. |
| `packages/env/lib/config/test/config-integration.js` | New | `loadConfig with CLI autoPort=true and user config autoPort=false has CLI win` | AC4 (precedence) | Asserts existing precedence (CLI beats config) is preserved by setting `customConfigPath` to a config with `autoPort: false` and passing `autoPort: true` in options; mock `findAvailablePort` to return a moved port; assert the moved port flows through. |
| `packages/env/lib/config/test/config-integration.js` | New | `loadConfig with CLI autoPort=true and explicit user port falls back when port is busy (AC4 behavior-level)` | AC4 | Mirror of the AC5 integration test. With `.wp-env.json` setting `port: 9000` and CLI `autoPort: true`, mock `findAvailablePort` to return `9001`; assert `config.env.development.port === 9001` and `WP_HOME` reflects 9001. (Addresses F3.) |
| `packages/env/lib/test/resolve-available-ports.js` | Existing — keep | `should resolve a port in non-strict mode` (line 19) | AC1 | Existing test — keep; still asserts `findAvailablePort` is hit for non-strict calls. |
| `packages/env/lib/test/resolve-available-ports.js` | New | `resolveConfigPorts under autoPortMode=defaults-only uses strict mode for non-default-origin ports and non-strict for default-origin ports` | AC1, AC2, AC3 | Mocks `findAvailablePort`/`isPortAvailable`. Calls `resolveConfigPorts(config, resolver, { autoPortMode: 'defaults-only', defaultOriginPorts: new Set([ 'development.port' ]) })` with both env ports populated. Asserts `findAvailablePort` was called for dev port (preferred 8888), `isPortAvailable` was called (strict path) for tests port (preferred 8889). |
| `packages/env/lib/test/resolve-available-ports.js` | New | `resolveConfigPorts under autoPortMode=defaults-only skips phpmyadminPort entirely (B3 regression guard)` | AC10, R3 | Config with `env.development.port: 8888, phpmyadminPort: 8080`. Call resolver with `defaultOriginPorts: new Set([ 'development.port' ])`. Assert `findAvailablePort` called for HTTP port only; `findAvailablePort` NOT called for phpmyadminPort; `isPortAvailable` NOT called for phpmyadminPort. |
| `packages/env/lib/test/resolve-available-ports.js` | New | `resolveConfigPorts under autoPortMode=all uses non-strict mode for all ports including phpmyadminPort` | AC4 | All ports get `findAvailablePort` (preserves PR #74472 behavior). |
| `packages/env/lib/test/resolve-available-ports.js` | New | `resolveConfigPorts under autoPortMode=off uses strict mode for HTTP ports and still resolves phpmyadminPort non-strictly` | AC5, AC10 | Defensive coverage for the per-port skip rule's non-`defaults-only` branch. Also documents that in production `'off'` never reaches this function (resolver is not created). |
| `packages/env/lib/test/resolve-available-ports.js` | New | `createPortResolver emits spinner.info exactly once when fallback occurs and re-arms the spinner` | AC7 | Mock spinner with `info: jest.fn()` and `start: jest.fn()`. Mock `findAvailablePort` to return `8890` when preferred is `8888`. Call `resolver.resolve(8888, 'env.development.port')`. Assert `spinner.info` was called exactly once with a string matching `/8888.*busy.*8890/i`, and `spinner.start` was called after `spinner.info` (assert via `info.mock.invocationCallOrder[0] < start.mock.invocationCallOrder[0]`). |
| `packages/env/lib/test/resolve-available-ports.js` | New | `createPortResolver does NOT emit spinner.info when the preferred port is available (no move occurred)` | AC7 | Mock `findAvailablePort` to return the preferred port. Assert `spinner.info` was NOT called. |
| `packages/env/lib/test/resolve-available-ports.js` | New | `createPortResolver does NOT emit spinner.info on the strict failure path` | AC7 | Strict mode + busy port → `isPortAvailable` returns `false` → throws. Assert `spinner.info` was NOT called. |
| `packages/env/lib/test/resolve-available-ports.js` | New | `createPortResolver does not write to console or process.stdout when fallback occurs (regression guard)` | AC7 | Spy on `console.log`, `console.info`, `console.warn`, `process.stdout.write`. After a fallback, none of them were called. (This is the "introducing a new output path is a detectable regression" assertion from AC7. Restore the spies in `afterEach`.) |
| `packages/env/lib/test/resolve-available-ports.js` | New | `createPortResolver suppresses the notice silently when no spinner is provided` | AC7 (test-path safety) | Call `createPortResolver()` with no args; mock `findAvailablePort` to return a different port; assert no throw and no console output. |

End-to-end / manual repro for **AC9b** is documented in the PR body, NOT in the automated suite (per spec §5 and AC9b). The PR test plan must include the recipe:

> 1. Bind 8888 manually: `python3 -m http.server 8888 &`
> 2. From a fresh project with no `.wp-env.json`, run `wp-env start`.
> 3. Confirm CLI prints a "moved port" info line referencing 8890 (or next free).
> 4. Browse to the printed URL; confirm WP loads and admin login works.
> 5. Free 8888, run `wp-env stop && wp-env start`; confirm the env re-resolves (may go back to 8888).

This recipe is referenced from the PR body's test plan checklist as the AC9b verification.

**AC9c (other commands)** is verified manually as part of the same recipe (steps 4 supplemented by `wp-env logs`, `wp-env run cli wp option get siteurl`, `wp-env stop`, `wp-env destroy --force`). No new automated test is added in this phase because the existing pattern (commands consume the cached `docker-compose.yml`) is unchanged by this PR — we are not regressing AC9c, we are inheriting the existing guarantee. The plan acknowledges this rather than expanding scope.

---

## 4. Sequencing and parallelism

For a single implementer, the realistic ordering (respecting both dependency graph and same-file edits) is:

1. **Step 1** (default flip + fixture update; touches `parse-config.js` and its test fixture).
2. **Step 3** (`__defaultOriginPorts` provenance; touches `parse-config.js` only — the helper and the property attachment).
3. **Step 2** (`load-config.js` tri-state + threading).
4. **Step 4** (`post-process-config.js` option threading).
5. **Step 5** (`resolve-available-ports.js` per-port routing).
6. **Step 6** (`resolve-available-ports.js` notice — same file as step 5; sequential edit).
7. **Step 7** (`commands/start.js` JSDoc only).
8. **Steps 10 + 11** (tests).
9. **Step 12** (verification sweep).
10. **Steps 8 + 9** (documentation — can land at any point after Step 2; deferred to last so wording is informed by the implementation).

Multi-agent worker plan (if parallelism is desired):

- Worker A handles `parse-config.js` (Steps 1 + 3) and updates the test fixture.
- Worker B waits for Worker A to commit, then handles `load-config.js` (Step 2), `post-process-config.js` (Step 4), and `resolve-available-ports.js` (Steps 5 + 6 sequentially within the same file).
- Worker C handles docs (Steps 8 + 9) after Worker B's interface lands.
- Tests (Steps 10 + 11) and the verification sweep (Step 12) are owned by a single coordinator after all workers have committed.

**Verification gates** (run during implementation, not just at the end):

1. **After step 5 lands**: run `npm run test:unit -- packages/env/lib/config/test/post-process-config.js packages/env/lib/test/resolve-available-ports.js` to confirm the routing matrix works before writing the integration tests.
2. **After step 7 lands**: run `npm run test:unit -- packages/env` to confirm the full unit-test suite stays green; this is the early regression radar — if any unit test is unexpectedly red, escalate before continuing. Also run `composer test` from repo root to catch any unexpected PHP-side coupling early (per **R17 / R-PHPRegress**).
3. **After step 11 lands**: run `npm run lint:js -- packages/env` to catch style issues before docs.
4. **After step 12 lands**: run `composer test` again from repo root. Per **R17 / R-PHPRegress**, this is mandatory before review even though changes are JS-only. If any PHP test fails unexpectedly, escalate to spec/plan rather than work around silently.

---

## 5. Verification strategy

| AC | Verification command / test name |
|---|---|
| AC1 | `npm run test:unit -- packages/env -t "no user autoPort and busy default port falls back via defaults-only mode"` and `… -t "uses strict mode for non-default-origin ports and non-strict for default-origin ports"`. Manual: AC9b recipe steps 1–4. |
| AC2 | `npm run test:unit -- packages/env -t "uses strict mode for non-default-origin ports and non-strict for default-origin ports"` (covers both env keys symmetrically). |
| AC3 | `npm run test:unit -- packages/env -t "routes user-set port to strict and default-origin port to non-strict"` plus the four `parse-config.js` provenance tests for local / override / `WP_ENV_PORT` / `WP_ENV_TESTS_PORT`. |
| AC4 | `npm run test:unit -- packages/env -t "autoPortMode=all"` and `… -t "CLI autoPort=true and user config autoPort=false has CLI win"` and `… -t "CLI autoPort=true and explicit user port falls back when port is busy"` (the new behavior-level integration test). |
| AC5 | `npm run test:unit -- packages/env -t "autoPortMode=off"` and `… -t "autoPort:false in user config skips fallback even on default ports"`. |
| AC6 | `npm run test:unit -- packages/env -t "CI=1 disables fallback"` (both variants). |
| AC7 | The five `createPortResolver` notice tests in `resolve-available-ports.js` (emits-once-and-re-arms / not-emitted-on-no-move / not-emitted-on-strict-fail / no-console-write-regression / silent-without-spinner). |
| AC8 | `npm run test:unit -- packages/env -t "CI=1 disables fallback regardless of autoPort:true"` — this is the named regression-detector test. Removing the `if ( process.env.CI )` guard in `load-config.js` makes this test fail. |
| AC9a | `npm run test:unit -- packages/env -t "threads autoPortMode and defaultOriginPorts to resolveConfigPorts"` — asserts merged config's `WP_HOME`/`WP_SITEURL` reflect the resolved port. |
| AC9b | Manual reproduction documented in PR body test plan. |
| AC9c | Manual reproduction documented in PR body test plan (no new automated test; covered by inherited compose-file guarantee). |
| AC10 | `npm run test:unit -- packages/env` (entire suite) green; the new "non-enumerable contract" test plus the back-compat `postProcessConfig` test plus the snapshot-no-drift expectation in Step 12. |
| AC11 | `npm run test:unit -- packages/env -t "tri-state"` plus `… -t "should accept autoPort as a tri-state"` (modified test). |

---

## 6. Risks and mitigations

- **R-TriState** — collapsed at the config layer because `DEFAULT_ENVIRONMENT_CONFIG.autoPort` is `false`. **Mitigation in plan.** Step 1 changes the default to `null`; step 2 reinterprets it; AC11 + the modified `should accept autoPort as a tri-state` test catch a future regression. The CLI side is already safe (verified — `lib/test/cli.js:35-52` already asserts `undefined`/`true`/`false`).
- **R-NonEnumerable** — `__defaultOriginPorts` becomes enumerable in a future refactor and starts leaking into `mergeConfig` iteration, JSON serialization, or `toEqual` assertions. **Mitigation in plan.** A dedicated regression test (`__defaultOriginPorts is invisible to mergeConfigs and toEqual`) asserts both `propertyIsEnumerable === false` and that `JSON.stringify` round-trip drops the property. Flipping it to enumerable fails the test.
- **R-TOCTOU** — port reads as free during the scan but is grabbed before Docker binds. **Mitigation in plan.** Inherited from PR #74472 — the plan does not change the existing `findAvailablePort` / `isPortAvailable` call sites, so the existing TOCTOU window is unchanged. Spec explicitly does not require a new mitigation.
- **R-PHPRegress** — PR #74472's earlier always-on attempt broke PHP tests. **Mitigation in plan.** `composer test` is invoked twice during implementation per §4 verification gates 2 and 4; any failure escalates rather than gets worked around. The plan also keeps the change tightly scoped to JS in `packages/env/` (per R15) so PHP coupling surfaces are minimized.
- **R-Snapshots** — snapshot drift. **Mitigation in plan.** Step 12 explicitly states that no snapshot diff is expected (verified — `grep autoPort` against both snapshot files returns zero hits today). Any unexpected diff is treated as a regression to investigate, not as routine updateSnapshot fodder. The real risk (the inline `DEFAULT_CONFIG` fixture at `parse-config.js test:21-71`) is addressed in Step 1 sub-step 4, not Step 12.
- **R-DownstreamURL** — resolved port not propagated. **Mitigation in plan.** Verified by tracing: `appendPortToWPConfigs` already runs after `resolveConfigPorts` in the existing `postProcessConfig` flow (`post-process-config.js:35-39`), so no new wiring needed; the AC9a test asserts the propagation explicitly via `WP_HOME`.
- **R-PortCollision** — dev and tests resolve to the same port. **Mitigation in plan.** Inherited: `createPortResolver`'s `usedPorts` array is passed as `exclude` to `findAvailablePort` (`resolve-available-ports.js:75-78`); already correct.
- **R-PhpmyadminMove (B3)** — phpmyadminPort silently auto-moves when a contributor has set it explicitly and runs under the new defaults-only mode. **Mitigation in plan.** Step 5's per-port skip rule under `autoPortMode === 'defaults-only'` skips `phpmyadminPort` entirely, preserving today's behavior verbatim (today phpmyadminPort is only resolved when `--auto-port` is on). The `postProcessConfig` test `… skips phpmyadminPort entirely` and the `resolveConfigPorts` test `… skips phpmyadminPort entirely` are the regression detectors.

---

## 7. Rollback

If a regression surfaces post-merge: revert this PR. The change is additive at the boundary (one default-value flip, one tri-state interpretation, one provenance-tracking helper, one routing matrix, one spinner notice, one README/CHANGELOG update). A clean `git revert <merge-commit>` restores the prior PR #74472 opt-in-only behavior with no downstream cleanup needed: there is no migration, no persisted state, no schema change, and no public API surface change. Contributors who relied on the new default-fallback behavior would temporarily need to add `--auto-port` to recover it; everyone else is unaffected.

**Cached compose caveat.** Environments that were `start`ed under the new default-fallback behavior have their resolved port pinned in the cached `docker-compose.yml` at `~/.wp-env/<project-hash>/docker-compose.yml`. After a revert, those already-running environments continue working unchanged (the cached compose still references the post-fallback port; `stop`/`destroy` operate by container name). However, a contributor who deletes the cache or runs `wp-env destroy && wp-env start` post-revert on a host where 8888 is busy will once again see the original port-busy failure. This is worth a one-line note in the revert PR's body so the reverting maintainer can communicate it.
