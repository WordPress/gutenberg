# Eval scenarios

Scenarios verify that an agent, given a task prompt, **consults the right guidance**: reads the skill files and docs it should, doesn't read the ones it shouldn't, in the right order, and reaches for the right kind of command. The evidence is the agent's own transcript.

Each `<slug>.json` defines a human-readable spec — `name`, `skills`, `query`, `expected_behavior`, `success_criteria` — plus a machine-checkable `assertions` block. When adding a skill, add at least one scenario for it.

## Running

```bash
# Static sanity checks — fast, free:
node test/ai-development/run.mjs

# Live mode — run scenario queries through real agent sessions and check the
# transcripts. Costs minutes and real tokens per run.
node test/ai-development/run.mjs --live
node test/ai-development/run.mjs --live --scenario testing-run-e2e --repeat 3
node test/ai-development/run.mjs --live --scenario testing-write-e2e --model haiku
```

`--model` is passed through to the agent CLI, so the same scenario can be checked against any model you have access to. `--agent` selects the CLI adapter (default `claude`); supporting another agent CLI means adding one adapter entry in `test/ai-development/run.mjs` that invokes it headless and normalizes its transcript into read/write/command events — the assertions are agent-agnostic.

Notes:

-   No environment is required: the point is what the agent *consults and attempts*, not whether Gutenberg's tests execute. Agents run without write permissions, so a denied edit still shows up in the transcript as the attempt the assertions need — and your checkout is never modified.
-   Agent compliance is probabilistic: use `--repeat 3` before treating a failure as a regression, and read the reported rates (`PASS (3/3)`).
-   Results are colored by your personal agent configuration (`~/.claude`, `CLAUDE.local.md`, memory).
-   Transcripts are saved under `test/ai-development/artifacts/` for debugging; failures print the actual reads/commands next to the expectation.

## Assertion vocabulary

| Key | Checks |
| --- | --- |
| `readsInclude` | Each path substring matches some file the agent read |
| `readsExclude` | No read matches the path substring |
| `readsBeforeCommand` | The read occurs before the first shell command matching `command` |
| `readsBeforeWrite` | The read occurs before the agent's first attempted file edit |
| `commandOrder` | `[before, after]`: if `after` ever runs, `before` ran first |
| `commandRules` | A command matching `matching` occurred, containing / avoiding substrings |
| `resultIncludes` | The agent's final message contains the substring |
