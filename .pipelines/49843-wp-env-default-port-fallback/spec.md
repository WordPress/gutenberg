# Phase 1 — Spec

## Revision log

Round 2 revisions, in response to `spec-review-1.md`:

- **F-2 (blocker)** — Added §9 "Spec scope handoff (final-deliverable obligations)" capturing the prompt's PR target (`trunk`), source branch (`try/49843-wp-env-default-port-fallback`), `#49843` link, and the requirement that the test plan enumerate ACs. Also added **R16** so the AC-enumeration obligation is a tracked spec requirement, not a side note.
- **F-4 (blocker)** — Rewrote **AC7** as an observable contract: message MUST be emitted only when a fallback occurred, MUST go through the same logger / spinner / output mechanism that `--auto-port` uses today (such that introducing a new output path would be a detectable test regression), and no new suppression flag MUST be required. Tightened **R11** correspondingly.
- **F-3 (minor)** — Added **R17** explicitly scoping regression coverage to JS unit tests inside `packages/env/` and noting "no PHP-side regression is expected because changes are JS-only inside `packages/env/`". Added matching risk **R-PHPRegress** in §7 referencing PR #74472's earlier always-on attempt that broke PHP unit tests, with a concrete mitigation: the implementer phase MUST run `composer test` (or the equivalent PHP unit suite) at least once and confirm green before requesting review, and any unexpected PHP failure becomes a spec-level escalation.
- **F-5 (minor)** — Split **AC9** into **AC9a** (unit-testable: merged-config values used by `WP_HOME` / `WP_SITEURL` / `appendPortToWPConfigs` reflect the resolved port) and **AC9b** (manual / PR test plan: live HTTP reachability at the printed URL). The spec now states which AC the automated suite must cover and which the PR test plan handles.
- **F-6 (minor)** — Added **AC11** verifying R6 directly at the CLI/config boundary: an unset `--auto-port` flag combined with an unset `autoPort` config field MUST be distinguishable from explicit `false` after configuration is resolved.
- **F-12 (minor)** — Promoted OQ1 to a tracked risk **R-TriState** in §7 with mitigation (plan phase MUST confirm tri-state survival from CLI through merge; an automated test asserts the distinction — covered by AC11). Removed OQ1 from §8.
- **F-13 (minor)** — Added a one-line risk **R-TOCTOU** in §7 acknowledging port-bind race as inherited from PR #74472, no new mitigation required.
- **F-15 (minor)** — Added explicit "any other command that resolves ports" coverage to **R8** and a new **AC9c** so commands beyond `start` (e.g. `run`, `clean`, `logs`) also see the resolved fallback port.
- **F-1, F-9, F-11, F-14, F-16 (nits)** — Reworded AC8 as a behavioral observable; dropped the "`port-utils`-style" nickname in A1; dropped the "(sentinel, separate object, post-process flag)" enumeration in OQ3 (now OQ2); added explicit upward-scan directionality to R1; added one sentence (now part of OQ6) on already-running environments.

---

Pipeline: `49843-wp-env-default-port-fallback`
Linked issue: WordPress/gutenberg#49843
Scope: `packages/env/` (the `@wordpress/env` CLI). No other packages.

This spec describes WHAT must be true after the change ships. It does not propose a design, file layout, or implementation. The plan phase owns those.

---

## 1. Goal statement

A contributor who runs `wp-env start` for the first time, with no `.wp-env.json` (or with a `.wp-env.json` that does not pin `port` / `testsPort`), must succeed even when the default ports `8888` (development) or `8889` (tests) are already bound by another process on the host. `@wordpress/env` resolves the next available port automatically and starts the environment there. Contributors who explicitly configured a port keep today's behavior — the start fails loudly so their explicit choice is honored — unless they have separately opted into auto-fallback for explicit ports via `--auto-port` / `"autoPort": true`.

---

## 2. Stakeholders

- **First-time and casual contributors to WordPress/Gutenberg.** They get a working dev environment from `npm install && npm run wp-env start` even when 8888/8889 are taken by another local stack, without needing to learn `.wp-env.json`, `--auto-port`, or Docker port-binding errors.
- **Plugin and theme authors using `@wordpress/env` standalone.** Same out-of-the-box win: they do not need to author config to get a usable dev URL on a busy laptop.
- **Existing wp-env users who have pinned ports.** They are explicitly protected: their pinned port will not be silently moved. Behavior on their machines is unchanged unless they opt in.
- **CI operators (Gutenberg core CI and downstream consumers).** They are explicitly protected: the existing `process.env.CI` guard keeps default-port fallback disabled, so test suites that key off `8888` / `8889` stay deterministic.
- **Maintainers of `packages/env/`.** They get the smaller out-of-box-friction support load promised by issue #49843, with the same opt-in/opt-out surface they shipped in PR #74472, just extended to the unconfigured case.

The change reaches stakeholders through:

- the next `@wordpress/env` release on npm,
- the bundled `wp-env` CLI used inside the gutenberg monorepo,
- `packages/env/README.md` documenting the new default and the `"autoPort": false` opt-out,
- `packages/env/CHANGELOG.md`.

---

## 3. Requirements

Each requirement is atomic, testable, and traceable to a sentence in `prompt.md`. "Default port" means a port whose value comes from `DEFAULT_ENVIRONMENT_CONFIG` and was not overridden by `.wp-env.json`, `.wp-env.override.json`, an environment variable, a CLI flag, or any other supported override mechanism.

1. **R1 — Auto-fallback on unconfigured default development port.** When the development port is a default (not user-set) and the resolved port is busy on the host, `wp-env start` MUST resolve to the next available port — scanning **upward** from the configured default — and proceed. (Traces to: prompt §"Goal of this pipeline"; AC1.)
2. **R2 — Auto-fallback on unconfigured default tests port.** R1 also applies to the tests port (`testsPort`, default `8889`) independently of the development port; the same upward-scan directionality applies. (Traces to: AC1.)
3. **R3 — User-set ports are never silently moved by default.** When a port value originates from any user-supplied source (root `.wp-env.json`, `.wp-env.override.json`, environment variable override, or any other documented override mechanism), and that port is busy, `wp-env start` MUST surface the existing port-busy failure and MUST NOT pick a different port. (Traces to: prompt §"Goal of this pipeline" paragraph 2; AC2.)
4. **R4 — `--auto-port` and `"autoPort": true` keep their PR #74472 semantics.** When the user opts in via the CLI flag or the config field, auto-fallback MUST apply to all ports — both default and user-set. (Traces to: prompt §"Goal of this pipeline" paragraph 3; AC3; anti-goal "Do not introduce new top-level config options".)
5. **R5 — Explicit `"autoPort": false` is a hard opt-out, even for default ports.** When the user has set `"autoPort": false` in config (any layer), default-port fallback MUST NOT happen; a port-busy failure surfaces as it does today. This MUST work without setting `CI=1`. (Traces to: prompt §"Goal of this pipeline" paragraph 3; AC4; anti-goal about reusing `autoPort` as tri-state.)
6. **R6 — `autoPort` is interpreted as tri-state.** The semantics MUST distinguish three states: `undefined` (unset → new "auto on defaults only" behavior), `true` (full opt-in, today's behavior), `false` (full opt-out). No new top-level config option is introduced for this distinction. The tri-state MUST survive end-to-end from CLI parsing through config merge so that "unset" is observably distinct from explicit `false`. (Traces to: prompt §"Anti-goals".)
7. **R7 — `CI=1` continues to disable all auto-fallback.** When `process.env.CI` is truthy, auto-fallback MUST NOT happen for any port, regardless of `autoPort` value or whether the port is default or user-set. (Traces to: prompt §"Background"; AC5.)
8. **R8 — Resolved port is the source of truth for downstream URL/config rewriting, across all wp-env commands that resolve ports.** Any consumer that today reads the resolved port (e.g. `appendPortToWPConfigs`, `WP_HOME`, `WP_SITEURL`) MUST receive the post-fallback port, so the started environment is reachable at the URL the CLI prints. This contract applies not only to `start` but to any other wp-env command that resolves ports (e.g. `run`, `clean`, `logs`, `destroy`, `stop`); the resolved fallback port MUST flow through to those code paths so they operate against the actually-bound environment. (Traces to: prompt §"Goal of this pipeline" — "(and any other command that resolves ports)" — and prompt §"Anti-goals".)
9. **R9 — Default port constants are unchanged.** `DEFAULT_ENVIRONMENT_CONFIG.port` and `testsPort` MUST remain `8888` and `8889`. The fallback is a runtime resolution step, not a default value change. (Traces to: prompt §"Anti-goals".)
10. **R10 — Existing CLI flags are not renamed or deprecated.** `--auto-port` and `"autoPort"` keep their existing names, types, and CLI surface. (Traces to: prompt §"Out of scope".)
11. **R11 — Informational CLI output for fallback reuses the existing channel and only fires on a real move.** When auto-fallback moves a port (whether on a default port via the new behavior or on an explicit port via `--auto-port`), the CLI MUST inform the user via the same logger / spinner / output mechanism already used by `--auto-port` today, such that introducing a new output path would be a detectable regression in the test suite. The message MUST NOT fire on the no-fallback path. No new always-on chatter is introduced and no new suppression flag is required. (Traces to: prompt §"Anti-goals".)
12. **R12 — Existing JS test suites stay green.** All existing JS unit tests in `packages/env/lib/test/` and `packages/env/lib/config/test/` MUST continue to pass. Snapshots that legitimately change must be reviewed and intentional. (Traces to: AC6.)
13. **R13 — New tests cover the primary behaviors.** New automated tests MUST cover: R1+R2 (default fallback), R3 (explicit-port strict), R4 (`autoPort: true` still falls back on explicit ports), R5 (`autoPort: false` strict on defaults), R7 (CI guard), and R6 (tri-state survives end-to-end). (Traces to: AC6.)
14. **R14 — Documentation updated.** `packages/env/README.md` MUST describe the new default behavior and the `"autoPort": false` opt-out. `packages/env/CHANGELOG.md` MUST list the user-visible change under the next unreleased version. (Traces to: AC7.)
15. **R15 — Scope confinement.** All code changes MUST live inside `packages/env/`. No edits to other packages, the Docker layer, the WordPress runtime, or public TypeScript types beyond what this feature strictly requires. (Traces to: prompt §"Out of scope".)
16. **R16 — PR test plan enumerates the acceptance criteria.** The final draft PR's body MUST list the acceptance criteria (AC1 through the highest-numbered AC defined here, including AC9a/AC9b/AC9c sub-criteria) so reviewers can map each AC to a verification step in the PR description. (Traces to: prompt §"Final deliverable" — "summarizing the change, and listing the acceptance criteria in its test plan".)
17. **R17 — Regression scope is explicitly JS-only.** Because the change is confined to JS inside `packages/env/`, no PHP-side regression is expected. The implementer phase MUST nevertheless run the project's PHP unit suite (`composer test` or equivalent) at least once and confirm it remains green before requesting review, since PR #74472's earlier always-on attempt at this feature broke PHP unit tests. Any unexpected PHP failure during implementation becomes a spec-level escalation. (Traces to: prompt §"Background" — "an earlier 'always on' version broke PHP unit tests".)

---

## 4. Acceptance criteria

Given/When/Then form. Each criterion is independently verifiable by an automated test in `packages/env/` or by the documented manual reproduction in the final PR's test plan.

### AC1 — Default development port falls back automatically (upward scan)

- **Given** a project with no `.wp-env.json` (or one that does not set `port`),
- **And** port `8888` on the host is bound by another process,
- **And** `process.env.CI` is unset,
- **When** the contributor runs `wp-env start`,
- **Then** the start command succeeds,
- **And** the development environment is bound to the next available port found by scanning **upward** from `8888` (e.g. `8890`),
- **And** the CLI informs the user via the same output mechanism that `--auto-port` uses today (see AC7).

### AC2 — Default tests port falls back automatically (independent of dev port, upward scan)

- **Given** the same conditions as AC1 but with `8889` busy and `8888` free,
- **When** `wp-env start` runs,
- **Then** the development environment binds to `8888` and the tests environment binds to the next available port found by scanning upward from `8889`.

### AC3 — Explicitly configured port stays strict by default

- **Given** a `.wp-env.json` that sets `"port": 9000`,
- **And** port `9000` on the host is bound by another process,
- **And** neither `--auto-port` nor `"autoPort": true` is set,
- **When** `wp-env start` runs,
- **Then** the start fails with the existing port-busy error message,
- **And** no other port is silently used.

### AC4 — `--auto-port` / `"autoPort": true` still falls back on explicit ports

- **Given** a `.wp-env.json` that sets `"port": 9000`,
- **And** port `9000` on the host is bound,
- **And** the contributor runs `wp-env start --auto-port` (or sets `"autoPort": true`),
- **When** the command runs,
- **Then** the start succeeds against the next available port above `9000`,
- **And** the CLI informs the user via the same output mechanism that `--auto-port` uses today (see AC7).

### AC5 — `"autoPort": false` opts out of default-port fallback too

- **Given** a `.wp-env.json` that sets `"autoPort": false` and does NOT set `port`,
- **And** port `8888` on the host is bound,
- **And** `process.env.CI` is unset,
- **When** `wp-env start` runs,
- **Then** the start fails with the existing port-busy error message,
- **And** no other port is silently used.

### AC6 — `CI=1` continues to disable all auto-fallback

- **Given** `process.env.CI` is truthy,
- **And** port `8888` on the host is bound,
- **And** the project has no `.wp-env.json` (or has any `autoPort` value, including `true`),
- **When** `wp-env start` runs,
- **Then** the start fails with the existing port-busy error message,
- **And** no other port is silently used.

### AC7 — Informational message contract (observable)

- **Given** any scenario in which auto-fallback moves a port (AC1, AC2, AC4),
- **When** the CLI emits the "moved port" notice,
- **Then** the message is emitted only when a fallback actually occurred (no message on the no-fallback path),
- **And** the message is emitted through the same output mechanism — the same logger function, spinner instance, or stream — that `--auto-port` uses today, such that introducing a new output path would be a detectable regression in the test suite,
- **And** no new flag is required to suppress the message.

### AC8 — CI guard regression is detectable

- **Given** the implementation of R7,
- **When** the test suite runs,
- **Then** a named, documented test asserts that `process.env.CI === '1'` (or other truthy values defined by the inherited guard) disables fallback regardless of `autoPort` state, such that **removing the guard fails the test**.

### AC9a — Resolved port flows downstream into merged config (automated)

- **Given** a fallback occurred per AC1,
- **When** the merged configuration object is computed,
- **Then** the values used for `WP_HOME`, `WP_SITEURL`, and the inputs to `appendPortToWPConfigs` all reflect the post-fallback port. This is unit-testable at the config layer without requiring Docker.

### AC9b — Live reachability at printed URL (manual / PR test plan)

- **Given** a fallback occurred per AC1,
- **When** the environment is up on the contributor's machine,
- **Then** the URL printed by the CLI is reachable via HTTP. This is verified manually as part of the PR test plan rather than in the automated suite.

### AC9c — Other wp-env commands see the resolved fallback port

- **Given** a previous `wp-env start` resolved the development environment to a fallback port (e.g. `8890`),
- **When** a subsequent wp-env command that resolves ports (`run`, `clean`, `logs`, `destroy`, `stop`, etc.) runs in the same project,
- **Then** that command operates against the actually-bound port, not against the original default `8888`.

### AC10 — Existing tests stay green

- **Given** the change is implemented,
- **When** `npm run test:unit packages/env` (and the equivalent for `packages/env/lib/config/test/`) runs,
- **Then** all previously passing tests still pass,
- **And** any snapshot changes are reviewed and intentional, not incidental.

### AC11 — `autoPort` tri-state survives end-to-end (boundary check for R6)

- **Given** `--auto-port` unset on the CLI invocation and `autoPort` unset in config,
- **When** configuration is resolved,
- **Then** the effective `autoPort` value is **distinguishable** from an explicit `false` (i.e. the tri-state is preserved through CLI parsing and config merge),
- **And** an automated test asserts this distinction so a future refactor that collapses `undefined → false` fails the test.

---

## 5. Out of scope

Restated and extended from the prompt.

- **Phase 2 design doc.** RP does not implement a separate design-doc phase yet; the spec → plan → implementation chain proceeds directly.
- **`mysqlPort` behavior.** Already supports Docker-native auto-assignment via `null`; not touched here.
- **Docker layer changes.** No changes to Docker image, Compose generation strategy, or container networking beyond what consuming the resolved port already requires.
- **WordPress runtime changes.** No PHP, no WordPress core, no theme/plugin runtime behavior.
- **Public TypeScript type surface.** No new exported types or breaking changes to existing ones beyond what this feature minimally needs.
- **Renaming or deprecating `--auto-port` / `"autoPort"`.** The names stay. No deprecation warning is added.
- **New top-level config options.** Reuse `autoPort` as a tri-state instead of inventing a second flag.
- **Cross-package refactors.** All changes live inside `packages/env/`.
- **Changing default port constants.** `8888` / `8889` stay as the defaults.
- **Always-on "moved port" chatter, or new flag to suppress it.** Reuse the existing `--auto-port` output mechanism.
- **Telemetry, analytics, or remote reporting** of fallback events.
- **Behavior under non-`CI` automation environments** that do not set `CI`. Those continue to be treated as ordinary developer machines (auto-fallback applies on defaults). Setting `"autoPort": false` is the documented opt-out for such cases.
- **Live HTTP integration testing in the automated suite.** Reachability is verified manually per AC9b in the PR test plan; the automated suite stops at AC9a's config-layer assertions.

---

## 6. Assumptions

These are treated as true without separate verification. If any turns out to be false, the plan or implementation phase must surface it.

- **A1.** The existing port-availability scanning utility used by PR #74472 correctly detects busy ports on the host, scans upward, and can take an `exclude` list so the dev and tests resolutions do not collide.
- **A2.** The existing `process.env.CI` guard in `packages/env/lib/config/load-config.js` is the only CI-determinism gate that needs to keep applying; no other package or process needs to be taught about it.
- **A3.** The current CLI has a place where `--auto-port` is parsed and merged into config such that a tri-state `autoPort` (`undefined` / `true` / `false`) can be represented end-to-end without ambiguity. (See R-TriState risk in §7: if the existing CLI/yargs layer coerces missing `--auto-port` to `false`, the plan phase must define how the tri-state survives; AC11 guarantees a regression test exists.)
- **A4.** "User-set" can be detected in config processing by tracking whether `port` / `testsPort` came from `DEFAULT_ENVIRONMENT_CONFIG` versus from a user source. The exact mechanism is a design concern, not a spec concern.
- **A5.** The "informational message" output mechanism used by today's `--auto-port` is appropriate for the new default-fallback case too, both in tone and verbosity. No separate UX research is required.
- **A6.** README and CHANGELOG conventions in `packages/env/` are stable; the doc-writer phase can update them in place without coordinating release notes elsewhere.
- **A7.** `npm run test:unit` for `packages/env/` is sufficient to validate R12; the wp-env package does not have hidden integration tests outside the `lib/test/` and `lib/config/test/` trees that require separate invocation.
- **A8.** Existing snapshots in `packages/env/lib/test/` are stable enough that the only legitimate snapshot churn comes from this change, so any churn is reviewable.

---

## 7. Risks and mitigations

- **R-CI — CI determinism regresses.** A future contributor refactors port resolution and accidentally drops the `process.env.CI` gate, silently moving ports in CI runs and breaking suites that key off `8888` / `8889`. **Mitigation:** R7 + AC8 mandate a named test that asserts the CI guard such that removing the guard fails the test.
- **R-Explicit — A user-set port is silently moved.** A contributor pinned `port: 9000` for a reason (proxy, hosts file, integration with another tool); silently moving to 9001 produces a working-but-wrong environment. **Mitigation:** R3 + R6 (tri-state `autoPort`) keep explicit ports strict by default; AC3 covers it with an automated test.
- **R-OptIn — `--auto-port` opt-in is broken by the refactor.** Contributors who already rely on `--auto-port` to escape pinned-port conflicts find their workflow regressed. **Mitigation:** R4 + AC4 require that `true` continues to override everything (default and explicit), preserving PR #74472 semantics.
- **R-OptOut — No way to opt out without `CI=1`.** A contributor wants strict default-port behavior locally without polluting their environment with `CI=1`. **Mitigation:** R5 + AC5 make `"autoPort": false` a documented hard opt-out.
- **R-Snapshots — Test snapshots in `packages/env/lib/test/` go stale.** Tri-stating `autoPort` and threading "user-set" provenance can ripple into serialized config snapshots. **Mitigation:** R12 explicitly calls out keeping existing tests green; the implementer phase reviews each snapshot diff for intent; AC10 makes "intentional snapshot diffs only" a checkable criterion.
- **R-UX — Always-on port-moved chatter annoys users.** If the informational message fires noisily even when no move happened, it becomes spam. **Mitigation:** R11 + AC7 constrain the message to actual moves and to the existing output mechanism.
- **R-DownstreamURL — Resolved port not propagated.** The dev environment starts on a moved port but the printed URL, `WP_HOME`, or `appendPortToWPConfigs` still reflect the original, leaving the user with a broken-looking site. Or, secondarily, the `start` path is patched but other commands (`run`, `clean`, `logs`) still consult the original default. **Mitigation:** R8 + AC9a + AC9c require the resolved port to be the source of truth downstream and across commands.
- **R-PortCollision — Dev and tests resolve to the same port.** Both default ports are busy and the scan produces overlapping next-free ports. **Mitigation:** Assumption A1 covers `exclude`-list support. If A1 turns out to be false, the plan phase must add coordination as a design concern.
- **R-TriState — `autoPort` tri-state collapses at the CLI boundary.** If the existing yargs definition coerces an unset `--auto-port` to `false` (or any layer collapses `undefined → false`), the entire feature silently regresses to today's behavior on default ports — the new R1/R2 paths never fire because every config is interpreted as "explicit opt-out". **Mitigation:** R6 + AC11 require the tri-state to survive end-to-end with an automated boundary test that asserts unset is distinguishable from explicit `false`. The plan phase MUST verify the existing `--auto-port` yargs configuration in `packages/env/lib/cli.js` and define how the tri-state is preserved before implementation begins.
- **R-PHPRegress — PHP unit tests regress.** PR #74472's earlier always-on attempt at this feature broke PHP unit tests, which is why it shipped opt-in instead. Even though this revision is JS-only, anything that changes wp-env's default behavior risks tripping PHP suites that consume wp-env-derived URLs or ports. **Mitigation:** R17 mandates a `composer test` (or equivalent PHP unit suite) green check during implementation before review; any unexpected PHP failure escalates back to spec/plan rather than being silently worked around.
- **R-TOCTOU — Port-bind race.** A port reads as free during the scan but is grabbed by another process before Docker binds it. **Mitigation:** Inherited from PR #74472; no new mitigation required beyond what `--auto-port` already does today. The plan phase need not re-litigate this.

---

## 8. Open questions

The prompt does not pin these down. They are flagged for the plan phase, not invented here.

- **OQ1 — Per-environment `autoPort`.** Can `autoPort` be set per-environment (e.g. only for `tests`, not `development`) under existing config-merging rules, or is it root-only? The prompt does not say; the spec treats whatever the existing PR #74472 surface allows as the contract.
- **OQ2 — Provenance tracking for "user-set" ports.** The spec requires distinguishing default vs. user-set ports (R3, R6) but does not specify how. The plan phase chooses the mechanism.
- **OQ3 — Multiple override layers.** When `port` comes from `.wp-env.override.json` but the base `.wp-env.json` did not set it, is that "user-set"? The spec answers yes (any user-supplied source counts as user-set per R3) but the plan phase should confirm the override-merging code can be taught this distinction.
- **OQ4 — `WP_ENV_PORT` / environment-variable overrides.** The prompt mentions "environment variable override" as a user-set source. The exact list of env vars wp-env honors as user-set port sources should be enumerated by the plan phase against the current `parse-config.js` code, not invented here.
- **OQ5 — Behavior when no upward port is available.** The prompt does not specify the failure mode if scanning runs out of ports. The spec assumes the existing scanner already has a defined failure mode (per A1); the plan phase should confirm and, if needed, surface a sensible error.
- **OQ6 — Interaction with `wp-env destroy` / `wp-env stop` and persisted state, including already-running environments.** If a previous run bound the dev environment to `8890` via fallback, do subsequent `stop`/`destroy`/`start` cycles need to remember the port, or do they re-resolve each time? Likewise, an environment started under the old behavior (pre-upgrade) that is still running when the user upgrades wp-env: behavior is treated as unchanged for that already-running environment until the next `start` re-resolves. The prompt is silent. The spec treats re-resolution on each `start` as the default expectation, with persisted-state changes considered out of scope unless the plan phase finds a concrete blocker.
- **OQ7 — `CI` truthiness semantics.** `process.env.CI` can be `"true"`, `"1"`, `"false"`, or any string; today's guard's exact truthiness rule (per the existing PR #74472 implementation) is the contract this spec inherits. The plan phase should confirm the existing rule and reuse it verbatim, not redefine it.

---

## 9. Spec scope handoff (final-deliverable obligations)

Captured here so they are not silently dropped. These obligations come from prompt §"Final deliverable" and are the spec's contract with the orchestration / doc-writer / PR-creation phases. The spec does not own their execution, but it does own that they are not forgotten.

- **PR target.** Final draft PR opens against `WordPress/gutenberg` `trunk`.
- **Source branch.** PR is opened from branch `try/49843-wp-env-default-port-fallback` (provisioned via the EnterWorktree convention in `.claude/rp.md`).
- **Issue link.** PR body links `#49843`.
- **Test plan content.** Per **R16**, the PR body's test plan section enumerates the acceptance criteria defined in §4 of this spec (AC1–AC11, including AC9a/AC9b/AC9c) so reviewers can map each AC to a verification step.
- **PR is a draft until docs and code-review phases sign off.** The spec does not gate final ready-for-review; it simply pins the deliverable shape.

These obligations are NOT acceptance criteria of the code change itself (they are not user-observable behaviors of `wp-env`); they are deliverable obligations of the pipeline. Capturing them here closes the F-2 gap from spec-review-1 without conflating "what the code does" with "what the PR contains".
