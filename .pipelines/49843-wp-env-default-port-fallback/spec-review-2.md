# Spec Review — Iteration 2

Pipeline: `49843-wp-env-default-port-fallback`
Reviewer role: spec-reviewer (adversarial)
Artifacts under review:
- `prompt.md`
- `spec.md` (v2)
- `spec-review-1.md` (for verifying the round-1 findings landed)

This review is adversarial. The default posture is rejection. This iteration must additionally verify each round-1 finding closed correctly without over-correction or revision-log drift.

---

## 1. Round-1 finding disposition (the round-2 obligation)

Walking every finding from `spec-review-1.md` and checking whether the v2 spec actually closes it. "CLOSED" requires the closure to land in the spec body, not just be claimed in the revision log.

### Blockers

| Finding | Round-1 ask | v2 closure | Verdict |
|---------|-------------|------------|---------|
| **F-2** — "Final deliverable" obligations dropped (PR target, branch, issue link, test plan lists ACs) | Add a tracked spec requirement or a labeled handoff section | §9 "Spec scope handoff (final-deliverable obligations)" added with PR target, source branch, issue link, AC enumeration. **R16** added making the AC-enumeration obligation a tracked requirement, with explicit traceability to prompt §"Final deliverable". §9 also clearly states these are deliverable obligations rather than user-observable behaviors of `wp-env`, which avoids conflating phases. | **CLOSED** |
| **F-4** — AC7 mechanically untestable as written | Express as observable contract (no message on no-fallback path; goes through same logger/spinner/stream as today; no new suppression flag) | AC7 rewritten verbatim along the suggested observable contract: "emitted only when a fallback actually occurred", "through the same output mechanism — the same logger function, spinner instance, or stream — that `--auto-port` uses today, such that introducing a new output path would be a detectable regression in the test suite", "no new flag is required to suppress the message". R11 tightened to match. | **CLOSED** |

### Minors

| Finding | Round-1 ask | v2 closure | Verdict |
|---------|-------------|------------|---------|
| **F-3** — PHP unit test silence | Either include `phpunit/` in regression scope, or state "no PHP regression expected because JS-only" | R17 added: explicitly scopes regression coverage as JS-only inside `packages/env/`, mandates `composer test` green check during implementation, and treats unexpected PHP failure as a spec-level escalation. R-PHPRegress added to §7 referencing PR #74472's prior breakage. | **CLOSED** |
| **F-5** — AC9 unit/integration split unclear | Tighten in-scope assertion to merged-config layer; move live HTTP to manual PR test plan | AC9 split into AC9a (automated config-layer assertion: merged-config values for `WP_HOME`, `WP_SITEURL`, `appendPortToWPConfigs` reflect the resolved port) and AC9b (manual reachability per PR test plan). §5 also restates that live HTTP integration testing is out of scope for the automated suite. | **CLOSED** |
| **F-6** — No direct AC for R6 tri-state at the boundary | Add an AC asserting unset is distinguishable from explicit `false` after config resolution | AC11 added with the suggested wording: "Given `--auto-port` unset and `autoPort` unset in config, when configuration is resolved, then the effective `autoPort` value is distinguishable from explicit `false` ... an automated test asserts this distinction so a future refactor that collapses `undefined → false` fails the test." R6 also extended with end-to-end survival language. | **CLOSED** |
| **F-12** — OQ1 should also be a tracked risk R-TriState | Promote OQ1 to a §7 risk with mitigation; reference AC11 | R-TriState added to §7 with concrete failure scenario (yargs collapsing `undefined → false`), explicit mitigation referencing R6 + AC11, and a directive that the plan phase MUST verify the existing yargs configuration in `packages/env/lib/cli.js`. OQ1 removed from §8. (Note: §8 is now renumbered OQ1–OQ7; the tri-state question is fully migrated to a risk, not duplicated.) | **CLOSED** |
| **F-13** — TOCTOU note missing | Add a one-line note acknowledging port-bind race as inherited from PR #74472 | R-TOCTOU added to §7: "Inherited from PR #74472; no new mitigation required beyond what `--auto-port` already does today. The plan phase need not re-litigate this." | **CLOSED** |
| **F-15** — "any other command that resolves ports" dropped from spec | Add explicit coverage for `run`, `clean`, `logs`, etc. | R8 expanded with an explicit clause naming `run`, `clean`, `logs`, `destroy`, `stop` and requiring the resolved fallback port to flow into those code paths. AC9c added covering the same observable. | **CLOSED** |

### Nits

| Finding | Round-1 ask | v2 closure | Verdict |
|---------|-------------|------------|---------|
| **F-1** — Reword AC8 as a behavioral observable | "such that removing the guard fails the test" framing | AC8 reworded: "a named, documented test asserts ... such that **removing the guard fails the test**". | **CLOSED** |
| **F-7** — R6 phase-leak ("no new top-level config option") | Already acceptable in round 1; no action required | No change. Acceptable. | **N/A — round-1 said "right at the line" but acceptable** |
| **F-8** — R3 enumerates concrete user-source mechanisms | Already acceptable in round 1; no action required | No change. Acceptable. | **N/A — already accepted** |
| **F-9** — Drop "`port-utils`-style" nickname in A1 | Replace with "the existing port-availability scanning utility used by PR #74472" | A1 reworded exactly as suggested: "The existing port-availability scanning utility used by PR #74472 ...". Nickname removed. | **CLOSED** |
| **F-10** — A2 names `load-config.js` (borderline HOW) | Round 1 said "borderline acceptable"; no explicit ask | No change; A2 still names the file, which is defensible as scoping. | **ACCEPTED — no closure required** |
| **F-11** — Drop "(sentinel, separate object, post-process flag)" enumeration in OQ3 (now OQ2) | Just say "the plan phase chooses the mechanism" | OQ2 (formerly OQ3) reworded: "The plan phase chooses the mechanism." Enumeration dropped. | **CLOSED** |
| **F-14** — Inconsistent upward-scan directionality | State directionality as an explicit requirement, not by example | R1 extended: "scanning **upward** from the configured default". R2 reuses "the same upward-scan directionality applies." AC1 names the upward direction explicitly; AC2's heading and body say "upward scan" / "scanning upward from `8889`". | **CLOSED** |
| **F-16** — Already-running environments | Add one sentence on already-running environments | OQ6 expanded: "an environment started under the old behavior (pre-upgrade) that is still running when the user upgrades wp-env: behavior is treated as unchanged for that already-running environment until the next `start` re-resolves." | **CLOSED** |

**Round-1 disposition summary:** All 2 blockers and all 6 minors land in the spec body in the form the round-1 review asked for. All addressable nits land too. No round-1 finding is left unaddressed.

---

## 2. Revision-log accuracy check (round-2-specific)

Walking each revision-log claim against the spec body to detect drift.

| Log claim | Body evidence | Drift? |
|-----------|---------------|--------|
| F-2 → §9 added; R16 added | §9 present with the listed content (PR target/branch/issue link/AC enumeration); R16 present in §3 with the cited prompt trace | None |
| F-4 → AC7 rewritten; R11 tightened | AC7 §4 rewritten with the three-clause observable contract; R11 §3 reflects "only on a real move" + "would be a detectable regression in the test suite" | None |
| F-3 → R17 added; R-PHPRegress added | R17 present in §3 with `composer test` mandate; R-PHPRegress present in §7 referencing PR #74472 | None |
| F-5 → AC9 split into AC9a/AC9b | AC9a and AC9b present in §4; §5 also explicitly restates that live HTTP integration testing is out of scope | None |
| F-6 → AC11 added | AC11 present in §4 with the boundary check wording | None |
| F-12 → R-TriState added; OQ1 removed from §8 | R-TriState present in §7; §8 renumbered (OQ1–OQ7) with no tri-state OQ remaining; A3 also references R-TriState | None |
| F-13 → R-TOCTOU added | R-TOCTOU present in §7 | None |
| F-15 → R8 extended; AC9c added | R8 contains the explicit list (`run`, `clean`, `logs`, `destroy`, `stop`); AC9c added in §4 | None |
| F-1, F-9, F-11, F-14, F-16 nits | AC8 reworded; A1 cleaned; OQ2 (formerly OQ3) trimmed; R1/R2 + AC1/AC2 made directional; OQ6 extended for already-running envs | None |

**No revision-log drift detected.** Every claim in the log is backed by a corresponding edit in the spec body.

---

## 3. Over-correction watch (round-2-specific)

Checking whether any closure introduced HOW-leaks or scope inflation.

- **R8 expansion (F-15 closure).** The extension names CLI commands (`run`, `clean`, `logs`, `destroy`, `stop`). These are user-observable command names already present in the wp-env CLI surface — they are WHAT the user types, not HOW the implementation routes them. **No leak.**
- **AC9a closure (F-5).** Names `WP_HOME`, `WP_SITEURL`, `appendPortToWPConfigs`. These are anchored to the prompt's anti-goal ("Do not break `appendPortToWPConfigs` or the `WP_HOME` / `WP_SITEURL` rewriting"). They are scoping anchors traced from the prompt. **No leak.**
- **R17 closure (F-3).** Mandates `composer test` runs during implementation. This is a process obligation on the implementer phase, not a design prescription. The risk it mitigates (R-PHPRegress) is grounded in the prompt's background section. **No leak; no scope inflation.**
- **R-TriState mitigation language (F-12 closure).** "The plan phase MUST verify the existing `--auto-port` yargs configuration in `packages/env/lib/cli.js` and define how the tri-state is preserved before implementation begins." This names a file path (`cli.js`), which is borderline — but the prompt's reference list already names `packages/env/lib/cli.js`, so this is scoping anchored to the prompt. **Acceptable; no fresh HOW.**
- **AC11 (F-6 closure).** Asserts a behavioral observable ("distinguishable from explicit `false`") and explicitly says "an automated test asserts this distinction" without prescribing the test mechanism. **No leak.**
- **§9 "Spec scope handoff" (F-2 closure).** Carefully labels itself as deliverable obligations, not acceptance criteria of the code change. This is exactly the framing round-1 asked for. **No scope inflation; correctly distinguishes WHAT-the-code-does from WHAT-the-PR-contains.**

**No over-correction detected.** The closures stay inside the prompt's bounds and at the WHAT layer.

---

## 4. Re-checking traceability for the v2 additions

| New / changed item | Trace |
|--------------------|-------|
| R16 (PR test plan enumerates ACs) | Prompt §"Final deliverable": "summarizing the change, and listing the acceptance criteria in its test plan." | OK |
| R17 (JS-only regression scope; `composer test` mandate) | Prompt §"Background": "an earlier 'always on' version broke PHP unit tests" | OK |
| AC9a / AC9b / AC9c | AC9a/b: prompt anti-goal on `appendPortToWPConfigs`/`WP_HOME`/`WP_SITEURL`; AC9c: prompt §"Goal of this pipeline" — "(and any other command that resolves ports)" | OK |
| AC11 | Prompt anti-goal: "Reuse `autoPort` as a tri-state (`undefined` / `true` / `false`)" | OK |
| R-PHPRegress | Prompt §"Background" PR #74472 history | OK |
| R-TOCTOU | Acknowledged inheritance from PR #74472; not a new obligation | OK (no trace required for an "inherited, no new mitigation" risk) |
| R-TriState | Prompt anti-goal on tri-state `autoPort` | OK |
| §9 "Spec scope handoff" | Prompt §"Final deliverable" | OK |
| Upward-scan directionality (R1/R2/AC1/AC2) | Prompt AC1: "the next free port (8890, 8891, ...)" implies upward; spec now states it explicitly. | OK |

**All v2 additions trace cleanly.** No CREEP introduced by the round-2 revision.

---

## 5. Re-checking testability for the v2 additions

| AC | Automatable? | Notes |
|----|--------------|-------|
| AC7 (rewritten) | YES — the three-clause contract gives a test the hooks it needs: assert a "no fallback path" produces no message; assert the fallback path goes through the same logger function or spinner instance the test can spy on; assert no new flag exists to suppress. | Round-1 F-4 closed in a testable form |
| AC9a | YES — pure config-layer assertion against the merged config object | OK |
| AC9b | NO (manual) — explicitly delegated to the PR test plan | Correctly out of automated scope |
| AC9c | YES — exercise `run`/`clean`/etc. with a stubbed prior fallback resolution and assert each command sees the resolved port | OK |
| AC11 | YES — invoke config resolution with both inputs unset; assert the resolved `autoPort` is observably not equal to `false` | OK |

All new ACs are either automatable or correctly labeled manual.

---

## 6. Re-checking phase boundary for the v2 additions

- **§9 (handoff)** — explicitly labeled as deliverable obligations, not behavioral ACs. Correct framing; no leak.
- **R17** — process obligation on the implementer phase ("MUST run `composer test` ... before requesting review"). This is a process gate, not a code design. Acceptable.
- **R-TriState mitigation** — names `cli.js` (a file already in the prompt's reference list). Borderline-acceptable as scoping.
- **R8 expansion** — names CLI command surface, not internals. Acceptable.
- **AC11** — asserts an observable, defers test mechanism to plan. Acceptable.

No fresh phase-boundary violations introduced in v2.

---

## 7. Open question triage (re-check)

§8 in v2 has 7 OQs (OQ1–OQ7) — OQ1 from v1 was correctly migrated to R-TriState in §7, and the remaining v1 OQs were renumbered. Spot-checking:

| v2 OQ | Was v1 OQ | Triage |
|-------|-----------|--------|
| OQ1 (per-environment `autoPort`) | v1 OQ2 | Resolvable by reading existing code; defer to plan |
| OQ2 (provenance tracking) | v1 OQ3 | Acceptable design deferral |
| OQ3 (multiple override layers) | v1 OQ4 | Acceptable deferral with stated default |
| OQ4 (env-var override list) | v1 OQ5 | Resolvable by reading existing code |
| OQ5 (no upward port available) | v1 OQ6 | Resolvable by reading existing code |
| OQ6 (stop/destroy + persisted state + already-running envs) | v1 OQ7, extended for F-16 | Acceptable deferral with stated default |
| OQ7 (`CI` truthiness) | v1 OQ8 | Resolvable by reading existing code |

**No OQ is a blocker for entering the plan phase.** The migration is clean and the renumbering is consistent.

---

## 8. New findings introduced in v2

None. The revision is targeted: it closes the listed round-1 findings without rewriting unrelated material. No new requirements snuck in beyond what was asked for. No prior requirements were softened or dropped.

---

## 9. Severity rollup

- **Blockers: 0**
- **Major: 0**
- **Minor: 0**
- **Nits: 0**

---

## Verdict

**APPROVED**

Round-1 findings closed:
- **F-2 (blocker)** — closed by §9 + R16
- **F-4 (blocker)** — closed by AC7 rewrite + R11 tightening
- **F-3 (minor)** — closed by R17 + R-PHPRegress
- **F-5 (minor)** — closed by AC9 split into AC9a/AC9b
- **F-6 (minor)** — closed by AC11
- **F-12 (minor)** — closed by R-TriState (OQ1 correctly migrated and removed from §8)
- **F-13 (minor)** — closed by R-TOCTOU
- **F-15 (minor)** — closed by R8 expansion + AC9c
- **F-1, F-9, F-11, F-14, F-16 (nits)** — all closed in the polish pass
- **F-7, F-8, F-10 (nits)** — round 1 already accepted these as borderline-acceptable; no action required

Open questions accepted as deferrable to the plan phase: OQ1 (per-env `autoPort`), OQ2 (provenance mechanism), OQ3 (multi-layer overrides), OQ4 (env-var override list), OQ5 (no-upward-port failure mode), OQ6 (stop/destroy + already-running env behavior), OQ7 (`CI` truthiness rule). All are either resolvable by reading existing code in the plan phase or are acceptable design deferrals with the spec's stated default.

The spec is complete, testable, traceable to the prompt, free of cross-phase HOW-leakage, and consistent with the host project's conventions in `AGENTS.md` and `.claude/rp.md`. The revision log accurately reflects the body changes, and the round-2 closures did not over-correct or inflate scope. Ready for the plan phase.
