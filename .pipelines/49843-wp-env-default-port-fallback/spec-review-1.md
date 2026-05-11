# Spec Review — Iteration 1

Pipeline: `49843-wp-env-default-port-fallback`
Reviewer role: spec-reviewer (adversarial)
Artifacts under review:
- `prompt.md`
- `spec.md`

This review is adversarial. The default posture is rejection unless the spec is demonstrably complete, testable, traceable, and free of cross-phase leakage.

---

## 1. Traceability — every requirement / AC mapped back to the prompt

Mapping each spec item to the sentence(s) in `prompt.md` it derives from. "OK" = direct trace, "PARTIAL" = trace exists but is loose, "CREEP" = no trace.

### Requirements

| Req | Prompt anchor (verbatim or near-verbatim) | Verdict |
|-----|-------------------------------------------|---------|
| R1 (default dev port fallback) | Goal: "Allow `wp-env start` ... to fall back automatically to the next free port when the **default** ports 8888 (development) and 8889 (tests) are busy". AC1. | OK |
| R2 (default tests port fallback, independent) | AC1 second sentence: "Same for 8889 and the tests environment." Goal: "8888 (development) and 8889 (tests)". | OK. The "independently of the development port" wording is a reasonable extrapolation, not creep. |
| R3 (user-set ports never silently moved) | Goal §2: "User-set ports — anything the contributor explicitly wrote in `.wp-env.json`, `.wp-env.override.json`, an environment variable override, or any other supported override mechanism — must NOT be silently replaced." AC2. | OK |
| R4 (`--auto-port` / `"autoPort": true` keeps PR #74472 semantics) | Goal §3: "The opt-in `--auto-port` flag and `"autoPort": true` config option must keep working...". AC3. | OK |
| R5 (`"autoPort": false` is a hard opt-out for default ports) | Goal §3: "Setting `"autoPort": false` explicitly must still force strict behavior on default ports too." AC4. | OK |
| R6 (tri-state semantics for `autoPort`) | Anti-goal: "Reuse `autoPort` as a tri-state (`undefined` / `true` / `false`) instead of inventing a second flag." | OK |
| R7 (`CI=1` continues to disable all auto-fallback) | Background: "CI determinism is preserved through a `process.env.CI` guard inside `load-config.js`." AC5. Goal §4: "The `process.env.CI` determinism guard must keep applying — CI runs must not silently move ports around." | OK |
| R8 (resolved port is downstream source of truth) | Anti-goal: "Do not break `appendPortToWPConfigs` or the `WP_HOME` / `WP_SITEURL` rewriting that depends on the resolved port." | OK |
| R9 (default port constants unchanged) | Anti-goal: "Do not change `DEFAULT_ENVIRONMENT_CONFIG.port` or `testsPort` away from `8888` / `8889`." | OK |
| R10 (no rename / deprecation of `--auto-port`) | Out of scope: "Renaming or deprecating `--auto-port` / `"autoPort"`." | OK |
| R11 (informational message reuses existing channel) | Anti-goal: "Do not silently print 'moved port' messages with no way to suppress them; reuse the existing CLI spinner / informational message used by `--auto-port` today." | OK |
| R12 (existing test suites stay green) | AC6: "Existing unit tests in `packages/env/lib/test/` and `packages/env/lib/config/test/` continue to pass". | OK |
| R13 (new tests cover four primary behaviors) | AC6: "new tests cover the four behaviors above." | OK |
| R14 (README and CHANGELOG updated) | AC7. | OK |
| R15 (scope confined to `packages/env/`) | Out of scope: "Cross-package refactors. Stay inside `packages/env/`." | OK |

No requirement is wholly unsupported. **No CREEP findings at the requirement level.**

### Acceptance Criteria

| AC | Trace | Verdict |
|----|-------|---------|
| AC1 (default dev port) | Prompt AC1 first half. | OK |
| AC2 (default tests port, independent) | Prompt AC1 second half. | OK |
| AC3 (explicit port strict by default) | Prompt AC2. | OK |
| AC4 (`--auto-port` falls back on explicit ports) | Prompt AC3. | OK |
| AC5 (`"autoPort": false` strict on defaults) | Prompt AC4. | OK |
| AC6 (`CI=1` disables all auto-fallback) | Prompt AC5. | OK |
| AC7 (informational message contract) | Prompt anti-goal on "moved port" messages. | OK |
| AC8 (CI guard regression test exists) | Prompt §"Background" + AC5 (regression-protection is a reasonable spec extrapolation). | OK — defensible but borderline. See finding F-1. |
| AC9 (resolved port flows downstream) | Prompt anti-goal about `appendPortToWPConfigs` / `WP_HOME` / `WP_SITEURL`. | OK |
| AC10 (existing tests stay green) | Prompt AC6. | OK |

---

## 2. Completeness — prompt criteria / constraints not covered

Walking the prompt's enumerated items and checking coverage in the spec.

- **Prompt AC1** → R1, R2, AC1, AC2. Covered.
- **Prompt AC2** → R3, AC3. Covered.
- **Prompt AC3** → R4, AC4. Covered.
- **Prompt AC4** → R5, AC5. Covered.
- **Prompt AC5** → R7, AC6. Covered.
- **Prompt AC6** → R12, R13, AC10, AC8. Covered.
- **Prompt AC7** → R14. Covered.
- **Prompt anti-goal "do not introduce new top-level config options"** → R6. Covered.
- **Prompt anti-goal "do not change `DEFAULT_ENVIRONMENT_CONFIG.port` / `testsPort`"** → R9. Covered.
- **Prompt anti-goal "do not break `appendPortToWPConfigs` / `WP_HOME` / `WP_SITEURL`"** → R8, AC9. Covered.
- **Prompt anti-goal "do not silently print 'moved port' messages with no way to suppress; reuse existing channel"** → R11, AC7. Covered.
- **Prompt out-of-scope: phase 2 design doc, `mysqlPort`, Docker layer, runtime, types, renaming `--auto-port`, cross-package refactors** → §5 of spec. Covered.
- **Prompt §"Final deliverable" (draft PR against `trunk` from `try/49843-wp-env-default-port-fallback`, links #49843, lists ACs in test plan)** → **NOT covered** in spec. See **F-2** below.

### Findings — completeness

- **F-2 (MAJOR).** The prompt's "Final deliverable" section pins the PR target (`WordPress/gutenberg` `trunk`), the source branch (`try/49843-wp-env-default-port-fallback`), the requirement that the PR link `#49843`, and that the test plan list the acceptance criteria. None of these appear as a spec requirement or AC. While most of this is plumbing the doc-writer / orchestrator handles, the "test plan lists the acceptance criteria" obligation is a deliverable-shaped requirement and should be either explicitly captured (e.g. as R16) or explicitly delegated out of spec scope with a one-line note. Right now it is silently dropped.

- **F-3 (MINOR).** Prompt §"Background" specifies that PR #74472 "broke PHP unit tests" when it was always-on. The spec does not call out PHP unit tests at all (R12/AC10 only mention `lib/test/` and `lib/config/test/`, i.e. JS unit tests). If PHP unit tests in `phpunit/` are sensitive to wp-env default ports, the spec should say so. If they are not, the spec should explicitly note that "no PHP-side regression is expected because the change is JS-only". Either way, the silence is a gap.

---

## 3. Testability — is each AC automatable, manually verifiable, or untestable?

| AC | Automatable? | Notes |
|----|--------------|-------|
| AC1 | YES (with port-binding stub or fake `net.createServer`-style harness in unit tests). The "8888 busy" precondition can be simulated; PR #74472's existing tests for `--auto-port` confirm this is feasible. | OK |
| AC2 | YES, same harness, additionally exercising the dev/tests independence. | OK |
| AC3 | YES, unit-testable through the config layer + port resolver, without spinning up Docker. | OK |
| AC4 | YES, same. | OK |
| AC5 | YES, same. | OK |
| AC6 | YES via `process.env.CI` mutation in tests, mirroring PR #74472's existing pattern. | OK |
| AC7 ("Informational message contract") | PARTIAL. "Same channel as `--auto-port` today" is testable only insofar as the test can assert which channel is used. The AC does not name the channel concretely (it intentionally defers to "the existing one"), which makes the assertion mechanism shaky: a refactor that swaps the spinner for a different but equivalent channel could pass or fail arbitrarily. **Finding F-4.** |
| AC8 | YES — explicitly demands an automated test, which is the right framing. | OK |
| AC9 | PARTIAL. Asserting that `WP_HOME` / `WP_SITEURL` reflect the resolved port is unit-testable. Asserting that "the URL printed by the CLI" matches the bound port leans into integration territory; without a Docker-up step, the test can only inspect the value the CLI *intends* to print, not the live HTTP response. The AC blurs unit-vs-integration. **Finding F-5.** |
| AC10 | YES — pure regression check. | OK |

### Findings — testability

- **F-4 (MAJOR).** AC7 is currently underspecified for automated assertion. It says the message goes through "the same spinner/informational channel that `--auto-port` uses today" without naming an observable contract (e.g. "via the same `info`/`log` helper", "as a non-throwing return", "rendered through the existing yargs/ora stream"). A test cannot mechanically verify "same channel as today" without a stable identifier for that channel. The spec should either (a) state the observable contract in WHAT terms (e.g. "the message MUST appear on stderr/stdout in the same form the existing `--auto-port` spinner emits, including the existing message prefix/format"), or (b) reduce the AC to "no new always-on log lines are introduced; messages only appear when a fallback occurred", which is independently testable. As written, AC7 risks producing flaky or trivially-passing tests.

- **F-5 (MINOR).** AC9 needs a clearer split between "values inside the merged config object reflect the resolved port" (unit-testable, this is what R8 actually demands) and "the running HTTP server is reachable at the printed URL" (integration). The spec hints at both; the plan phase will need a clear signal which one is in scope. Recommend tightening AC9 to the unit-testable subset and explicitly leaving live reachability to manual PR test plan.

- **F-6 (MINOR).** No AC explicitly verifies R6 (tri-state semantics) at the boundary between CLI parsing and config merge. R6 is a structural requirement; without a dedicated AC, it is verified only transitively through AC3+AC4+AC5. That is *probably* sufficient, but a one-line AC ("Given an unset `--auto-port` flag and unset `autoPort` config field, the resolved `autoPort` MUST be distinguishable from explicit `false`") would close OQ1 from the test side rather than leaving it as an unobserved invariant.

---

## 4. Phase boundary — does the spec leak HOW into WHAT?

The spec is generally disciplined about staying at WHAT. A few sentences cross the line or come close.

- **F-7 (MINOR — phase leak).** §3 R6: "No new top-level config option is introduced for this distinction." This is a *constraint* (which is fine) but it implicitly prescribes the design (reuse `autoPort`). The constraint comes from the prompt's anti-goal, so it traces. Acceptable, but right at the line.

- **F-8 (MINOR — phase leak).** §3 R3 enumerates concrete user-source mechanisms: "root `.wp-env.json`, `.wp-env.override.json`, environment variable override, or any other documented override mechanism". This mostly mirrors the prompt language. Acceptable.

- **F-9 (NIT — phase leak).** §6 A1 names "`port-utils`-style helper". This is a hint at file organization. Bracketing it as "the existing port-availability scanning utility used by PR #74472" without the `port-utils`-style nickname would be cleaner. Not a blocker; rewrite is trivial.

- **F-10 (NIT — phase leak).** §6 A2 names `packages/env/lib/config/load-config.js` directly. This is a file path — borderline HOW. It traces to the prompt's reference list, so it is defensible as scoping rather than design. Borderline acceptable.

- **F-11 (NIT — phase leak).** §8 OQ3 mentions "sentinel, separate object, post-process flag, etc." as possible mechanisms. The spec correctly defers the choice to the plan phase, but enumerating implementation options inside the spec is a soft phase leak. Recommend: drop the parenthetical enumeration; just say "the plan phase chooses the mechanism".

No critical phase-boundary violations. The spec does not specify file layout, function names, or refactor steps.

---

## 5. Out-of-scope completeness — does spec match prompt?

Comparing prompt §"Out of scope" against spec §5.

| Prompt out-of-scope item | Spec §5 covers? |
|--------------------------|-----------------|
| Phase 2 design doc | YES |
| `mysqlPort` behavior | YES |
| Docker layer / runtime / public TS types | YES (split into 3 bullets in spec) |
| Renaming or deprecating `--auto-port` / `"autoPort"` | YES |
| Cross-package refactors; stay inside `packages/env/` | YES |

Spec §5 also adds: changing default port constants, always-on chatter / new suppression flag, telemetry/analytics, behavior under non-CI automation environments, new top-level config options. All trace cleanly to prompt anti-goals or are sensible scope-fencing.

No omissions, no contradictions.

---

## 6. Risk coverage — are the prompt's stated risks reflected with mitigations?

The prompt names four risk threads:

1. **CI determinism** → Spec R-CI + R7 + AC6 + AC8. Covered.
2. **Silent moves of explicit ports** → Spec R-Explicit + R3 + AC3. Covered.
3. **Breaking opt-in flag (`--auto-port`)** → Spec R-OptIn + R4 + AC4. Covered.
4. **Stale snapshots** → Spec R-Snapshots + R12 + AC10. Covered.

Spec also adds R-OptOut, R-UX, R-DownstreamURL, R-PortCollision. All four are reasonable extensions, each tied to a requirement.

### Findings — risk coverage

- **F-12 (MINOR).** Spec lacks a risk for **"`autoPort` tri-state coercion at the CLI boundary loses the `undefined` state"**. This is OQ1 in the spec's open-questions section, but it is also a substantive risk: if yargs collapses `undefined` → `false`, the entire feature silently regresses to today's behavior on default ports. It deserves a dedicated risk entry (e.g. R-TriState) with a mitigation that the plan phase must surface and test for, not just an open question. Without this, the risk lives only as a passive Q rather than a tracked threat.

- **F-13 (MINOR).** Spec lacks a risk for **"port-resolution race / TOCTOU"**: scanning a port as free, then Docker tries to bind it and someone else has grabbed it in the interim. Today's `--auto-port` has the same exposure, so this might be inherited rather than new — but the spec should at least say "inherited from PR #74472, no new mitigation required" so the plan phase does not re-litigate it.

---

## 7. Open question triage

| OQ | Spec's framing | Triage verdict | Justification |
|----|----------------|----------------|---------------|
| OQ1 (tri-state coercion at CLI boundary) | "spec assumes solvable per A3" | **(c) Resolvable by reading existing code** — and **escalate to a risk (F-12)**. The plan phase can answer this in minutes by reading `packages/env/lib/cli.js` to see how yargs is configured for `--auto-port`. No owner input required. NOT a spec blocker. |
| OQ2 (per-environment `autoPort`) | "spec treats whatever PR #74472 surface allows as the contract" | **(c) Resolvable by reading existing code.** Read `parse-config.js` / `post-process-config.js` to see whether `autoPort` is per-env or root-only. The deferral is fine. |
| OQ3 (provenance tracking for "user-set" ports) | Deferred to plan phase | **(b) Acceptable to defer.** This is a design decision and the spec correctly stays out of it. |
| OQ4 (multiple override layers — is `.wp-env.override.json` user-set?) | Spec answers YES, defers confirmation to plan | **(b) Acceptable to defer.** Spec gives the answer, plan confirms feasibility. |
| OQ5 (`WP_ENV_PORT` / env-var overrides — exact list) | Defers enumeration to plan against `parse-config.js` | **(c) Resolvable by reading existing code.** No owner input needed. |
| OQ6 (no upward port available — failure mode) | "spec assumes existing scanner has defined failure mode" | **(c) Resolvable by reading existing code.** Read `resolve-available-ports.js`. |
| OQ7 (interaction with stop/destroy + persisted state) | Spec asserts "re-resolve on each `start`", treats persisted-state changes as out of scope unless plan finds a blocker | **(b) Acceptable to defer with the spec's stated default.** This is a sensible call. |
| OQ8 (`CI` truthiness semantics) | "plan phase reuses existing rule verbatim" | **(c) Resolvable by reading existing code.** Read the existing guard in `load-config.js`. |

**No open question is a blocker for entering the plan phase.** Most can be resolved by reading existing source; a couple are appropriate design deferrals. OQ1 should be promoted to a tracked risk regardless (F-12).

---

## 8. Other findings

- **F-1 (NIT).** AC8 ("CI guard regression test exists") is a meta-AC about the test suite rather than about user-observable behavior. It is *useful* (the prompt explicitly warns about CI determinism regressing), and AC8 traces defensibly, but it is structurally an instruction to the implementer phase rather than a behavioral acceptance. Consider rephrasing as "a named, documented test asserts CI guard behavior, such that removing the guard fails the test" — same intent, expressed as a checkable observable rather than a "test exists" assertion.

- **F-14 (NIT).** §4 AC2 says "binds to the next available port above 8889" — but the spec elsewhere (R1) says "the next available port" without the "above" directionality. The prompt itself only says "next free port (8890, 8891, ...)", which implies upward scanning. The spec should be consistent: either both ACs say "above" or neither does, and the directionality should be one explicit requirement (e.g. an addendum to R1: "scanning proceeds upward from the configured port"). Currently it is implied by example, not stated.

- **F-15 (NIT).** No requirement covers the contract that **wp-env-internal commands other than `start` that resolve ports** (e.g. `run`, `clean`, `logs`) also see the resolved fallback port. The prompt's goal opens with "Allow `wp-env start` (and any other command that resolves ports) to fall back automatically". The "(and any other command that resolves ports)" parenthetical is dropped from the spec. Recommend an explicit one-liner (an addendum to R8 or a new R) so the plan phase does not narrowly fix `start` and leave `run` confused.

- **F-16 (NIT).** The spec does not state what happens to **already-running environments** that were started under the old behavior. A user with a previously-bound 8888 environment runs `wp-env start` again with the new code — does state get re-resolved? OQ7 hints at this but treats it as "default expectation" without a requirement. If the answer is "behavior is unchanged for environments started before the upgrade; only new starts are affected", say so. If not, define it.

---

## 9. Severity rollup

- **Blockers (must fix before plan phase): 2**
  - **F-2** — "Final deliverable" obligations from the prompt (PR target/branch/issue link, test-plan-lists-ACs) are silently dropped. Either add as R16 or explicitly delegate out of spec scope with one line.
  - **F-4** — AC7 ("informational message contract") is not mechanically testable as written. Tighten it to an observable contract or reduce its scope.

- **Major (should fix before plan phase): 0** (F-2 and F-4 already blocker-level)

- **Minor (worth fixing, not blocking): 6**
  - F-3 (PHP unit tests silence — say something either way)
  - F-5 (AC9 unit/integration split unclear)
  - F-6 (no direct AC for R6 tri-state at the boundary)
  - F-12 (OQ1 should also be a tracked risk R-TriState)
  - F-13 (port-resolution TOCTOU — say "inherited, no new mitigation")
  - F-15 ("any other command that resolves ports" dropped from spec)

- **Nits (polish): 5** — F-1, F-7, F-9, F-10, F-11, F-14, F-16. Address opportunistically.

---

## 10. Suggested concrete revisions (prioritized)

For the spec-writer's next iteration, in priority order:

1. **(Blocker, F-2)** Add either a new requirement R16 or a clearly-labeled "Spec scope handoff" subsection capturing the prompt's "Final deliverable" obligations: PR targets `trunk` from `try/49843-wp-env-default-port-fallback`, body links #49843, test plan enumerates the acceptance criteria. Suggested wording: *"R16 — PR test plan enumerates the acceptance criteria. The final draft PR's body MUST list AC1–AC10 (or their post-revision equivalents) so reviewers can map each AC to a verification step."*

2. **(Blocker, F-4)** Rewrite AC7 to express an observable contract. Suggested replacement:
   - **Then** the message is emitted only when a fallback actually occurred (no message on the no-fallback path),
   - **And** the message is emitted through the same output mechanism (same logger / spinner instance / stream) that `--auto-port` uses today, such that adding a new output path would be a detectable regression in the test suite,
   - **And** no new flag is required to suppress the message.

3. **(Minor, F-3)** Add one sentence to R12 or the assumptions section addressing PHP unit tests: either include `phpunit/` in the regression scope, or explicitly state "no PHP-side regression is expected because changes are JS-only inside `packages/env/`".

4. **(Minor, F-5)** Split AC9: tighten the in-scope assertion to the merged-config layer (`WP_HOME`, `WP_SITEURL`, `appendPortToWPConfigs` inputs reflect the resolved port) and move "live HTTP reachability" into the manual PR test plan, or say so explicitly.

5. **(Minor, F-6)** Add an AC verifying R6 directly at the CLI/config boundary: *"Given `--auto-port` unset and `autoPort` unset in config, when configuration is resolved, then the effective `autoPort` value is distinguishable from an explicit `false` (i.e. the tri-state survives end-to-end)."*

6. **(Minor, F-12)** Promote OQ1 to a tracked risk R-TriState in §7 with an explicit mitigation (the plan phase MUST verify the tri-state survives CLI parsing; an automated test asserts the distinction).

7. **(Minor, F-13)** Add a one-line note (under §7 or §8) acknowledging port-bind TOCTOU as inherited from PR #74472, with no new mitigation required.

8. **(Minor, F-15)** Add one sentence to R8 (or a new R) capturing "any other command that resolves ports" — `run`, `clean`, `logs`, etc. — also sees the resolved fallback port.

9. **(Nits, F-1/F-7/F-9/F-10/F-11/F-14/F-16)** Polish pass: reword AC8 to a behavioral observable; drop the `port-utils`-style nickname in A1; drop the "(sentinel, separate object, post-process flag)" enumeration in OQ3; make the upward-scan directionality explicit in R1 instead of by example; add one sentence on already-running environments.

---

## Verdict

**REJECTED — REVISIONS REQUESTED**

The spec is structurally strong: traceability is excellent, out-of-scope handling is thorough, the prompt's named risks are all reflected with mitigations, the open questions are correctly flagged rather than silently invented away, and the spec stays disciplined about WHAT vs. HOW. Were it not for two specific gaps, this would be approvable.

The two blockers:

- **F-2** drops the prompt's "Final deliverable" obligations (especially "PR test plan enumerates the acceptance criteria"). Without capturing this, downstream phases lose a checkable handoff.
- **F-4** leaves AC7 mechanically untestable by stating "same channel as today" without an observable contract; the test that satisfies this AC would be flaky or trivial.

Address F-2 and F-4 (and ideally the six minor findings) and resubmit. The open questions are appropriately deferred and do not block planning, but OQ1 should also be promoted to a risk entry (F-12).
