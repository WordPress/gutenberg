# Eval scenarios

Scenarios verify that an agent, given a task prompt, **consults the right guidance**: reads the skill files and docs it should, doesn't read the ones it shouldn't, in the right order, and reaches for the right kind of command. The evidence is the agent's own transcript.

Each `<slug>.json` defines a human-readable spec — `name`, `skills`, `query`, `expected_behavior`, `success_criteria` — plus a machine-checkable `assertions` block. When adding a skill, add at least one scenario for it.

## Running

The tests use Playwright purely as a test runner — no browsers are involved. Each test spawns a real, headless agent session, which costs minutes and real tokens per scenario, so they run only through this explicit command (never in CI or default test sweeps):

```bash
# All scenarios:
npm run test:ai-development

# One scenario, by name:
npm run test:ai-development -- -g "Negative control"

# Repeat for confidence (agent compliance is probabilistic):
npm run test:ai-development -- --repeat-each=3

# Against a specific model (passed through to the agent CLI):
AI_EVAL_MODEL=haiku npm run test:ai-development
```

Notes:

-   No environment is required: the point is what the agent *consults and attempts*, not whether Gutenberg's tests execute. Agents run without write permissions, so a denied edit still shows up in the transcript as the attempt the assertions need — and your checkout is never modified.
-   Treat a single-run failure as a smoke signal, not a verdict — re-run with `--repeat-each=3` before calling it a regression.
-   Results are colored by your personal agent configuration (`~/.claude`, `CLAUDE.local.md`, memory).
-   Each run's raw transcript is saved under `test/ai-development/artifacts/` (failure messages include the exact path).
-   Supporting another agent CLI means adding one adapter entry in `test/ai-development/agent.mjs` that invokes it headless and normalizes its transcript into read/write/command events — the assertions are agent-agnostic.

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
