# AI development tests

This directory tests Gutenberg's AI-assisted development workflows for effectiveness and efficiency.

## Overview

The standalone `evals/` package uses [Promptfoo](https://www.promptfoo.dev/docs/) to run coding agents against an isolated temporary repository.

## How it works

Promptfoo runs the prompt × provider × test × repeat matrix. Its standard lifecycle hooks build one disposable repository for the run and roll it back between rows, so every row starts from the same state. The agent provider receives that directory as `working_dir`.

```text
   beforeAll: build one repository
     from your tree, hide eval files
                 │
                 ▼
      prompt × provider × test  ◄─────────┐
                 │                        │
                 ▼                        │
       coding agent changes files         │
                 │                        │
       ┌─────────┴─────────┐              │
       ▼                   ▼              │
  tool calls          live workspace      │
                      + agent response    │
       │                   │              │
       └─────────┬─────────┘              │
                 ▼                        │
         Promptfoo assertions             │
         ┌───────┴───────┐                │
         ▼               ▼                │
  deterministic     agent-rubric          │
   assertions          review             │
         └───────┬───────┘                │
                 ▼                        │
       result row and metrics             │
                 │                        │
                 ▼                        │
     afterEach: roll the workspace ───────┘
        back to its first commit
                 │
                 ▼
       afterAll: delete it
```

Rolling back rather than rebuilding is what makes one workspace practical: archiving Gutenberg once per run is affordable, once per row is not. It is also why rows run one at a time — `maxConcurrency` is `1`, and raising it would let one row reset another's work. This is Promptfoo's documented shape for an agent with side effects; see its [`claude-agent-sdk/advanced` example](https://github.com/promptfoo/promptfoo/tree/main/examples/claude-agent-sdk/advanced).

A run measures your working tree, uncommitted edits included. Untracked files are the exception: a new file has to be added before it appears.

See Promptfoo's [coding-agent guide](https://www.promptfoo.dev/docs/guides/evaluate-coding-agents/) and [extension hooks](https://www.promptfoo.dev/docs/configuration/reference/#extension-hooks).

### What the agents can reach

Promptfoo does not implement sandboxing. It passes the `sandbox` and `settings` blocks to the Claude Agent SDK without interpreting them, so what `lib/sandbox.js` declares is exactly what the agents run under. Two layers, because neither covers the other's ground:

| | Covers | Path syntax | Default |
| --- | --- | --- | --- |
| `sandbox.filesystem` | Bash and every process it starts, enforced by the OS | `/absolute` | reads: everywhere; writes: working directory only |
| `Read()` / `Edit()` rules | every tool, checked before it runs | `//absolute` | a path outside `working_dir` is refused |

So:

- **Writes** need no rules. A sandboxed command can write to the working directory and the session temp directory and nowhere else, and the working directory is the workspace.
- **Reads** are allowed everywhere by default, so the checkout and the home directory are denied by name. `allowRead` re-opens the workspace inside any denied region — for sandbox paths the narrower rule wins.
- **Bash is the gap the sandbox exists to close.** The in-process file tools are already bounded: the SDK tests a path against `working_dir` before the tool runs, and one outside it is refused. Bash gets no such check, and its children none either, which is what the OS layer is for.
- **Permission rules run the opposite way round** to sandbox paths: deny is resolved before allow and specificity is ignored, so a deny rule cannot carry an exception. That is why the workspace lives outside every denied path — in the system temp directory rather than inside the checkout, where the rules keeping the agent out of the source would have locked it out of its own working directory.
- **The network** is unreachable, so the agent cannot look up the answer.
- **The environment** is bounded by `lib/environment.js`, not by either layer. The provider copies the whole of `process.env` into the agent and `config.env` can only override a name, never remove one, so anything exported in the shell that starts a run is blanked there.

The subject also never sees `test/ai-development/`: it is stripped from the workspace, and the checkout holding the other copy is denied. `specs/sandbox` proves all of this by behaviour rather than by inspecting configuration.

See [Claude Code sandboxing](https://code.claude.com/docs/en/sandboxing) and [permissions](https://code.claude.com/docs/en/permissions).

### Grading code changes

Promptfoo's built-in trajectory assertions deterministically check tool calls, including which testing references the agent read or skipped. Its built-in `agent-rubric` receives read-only access to the live workspace, where the grading agent inspects Git status, the diff, relevant documentation, and changed files against the spec's rubric. This keeps code review inside Promptfoo without relying on the subject agent's final message or custom diff processing.

The grader runs under the same confinement, with `Bash` as its only tool. Denying it the checkout is what stops a rubric being answered from the original source rather than from the agent's work.

## Setup

This package is deliberately not one of the root workspaces: Promptfoo's
dependency tree is large and only needed by people running evals, so it keeps
its own lockfile and install step.

It also needs a newer Node than the repository — see `.nvmrc`.

```bash
cd test/ai-development && nvm use && npm install
```

Claude can use an existing Claude Code login or `ANTHROPIC_API_KEY`. Model calls consume the associated quota or paid usage.

## Run

Run from the repository root:

```bash
# Validate configuration without model calls.
npm --prefix test/ai-development run validate

# Run every spec, each on its own.
npm run test:agent-evals

# Run one spec.
npm run test:agent-evals -- --config specs/SPEC_GROUP/TEST_NAME.eval.js

# Any other flag is passed through, with or without --config.
npm run test:agent-evals -- --repeat 3

# Open the local results viewer.
npm --prefix test/ai-development run view
```

Results under `results/` are gitignored and may contain source code and tool output.

## Authoring

For each spec:

1. State the narrow claim the evaluation supports.
2. Add a `TEST_NAME.eval.js` file that spreads `lib/base.js` and adds a
   realistic agent prompt, cases, and named metrics.
3. Validate, run one provider once, then run the intended matrix with repeats.
