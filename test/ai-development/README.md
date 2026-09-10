# AI development tests

This directory tests Gutenberg's AI-assisted development workflows for effectiveness and efficiency.

## Overview

This directory is a standalone `@wordpress/agent-skill-evals` package. It uses [Promptfoo](https://www.promptfoo.dev/docs/) to run coding agents against an isolated temporary repository.

## How it works

Promptfoo runs the prompt × provider × test × repeat matrix. Its standard lifecycle hooks build one process-specific disposable repository for the run and roll it back between rows, so every row starts from the same state. The agent provider receives that directory as `working_dir`.

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
  tool calls        agent response        │
                    + captured diff       │
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

|                           | Covers                                               | Path syntax  | Default                                                            |
| ------------------------- | ---------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| `sandbox.filesystem`      | Bash and every process it starts, enforced by the OS | `/absolute`  | reads: everywhere; writes: working directory and session temp only |
| `Read()` / `Edit()` rules | every tool, checked before it runs                   | `//absolute` | a path outside `working_dir` is refused                            |

So:

-   **Writes** need no rules. A sandboxed command can write to the working directory and the session temp directory and nowhere else, and the working directory is the workspace.
-   **Reads** are allowed everywhere by default, so the home directory, the checkout, and the temp directory are denied, and `allowRead` re-opens only the workspace inside it — for sandbox paths the narrower rule wins. Denying `/` outright does not work: it takes the system libraries with it, and a profile no command can run under does not survive to enforce anything.
-   **Bash is the gap the sandbox exists to close.** The in-process file tools are already bounded: the SDK tests a path against `working_dir` before the tool runs, and one outside it is refused. Bash gets no such check, and its children none either, which is what the OS layer is for.
-   **Permission rules run the opposite way round** to sandbox paths: deny is resolved before allow and specificity is ignored, so a deny rule cannot carry an exception. The harness omits any deny region that contains the workspace. This matters on Windows, where the system temp directory normally sits inside the home directory. The checkout stays denied, and the SDK's working-directory boundary refuses other paths outside the workspace.
-   **The network** is unreachable: the allowlist is empty and `strictAllowlist` makes that a deterministic denial rather than a prompt a headless run would resolve as an allow.
-   **Hooks go around both layers**, so both providers disable them. Claude Code runs a hook itself rather than through the Bash tool, before the session starts and with the inherited environment — and a workspace is built from the tree under evaluation, so a branch adding `.claude/settings.json` would otherwise run commands on the host.
-   **Project settings could weaken the sandbox** — `filesystem.allowRead` and `network.allowedDomains` merge from every settings source, so a branch under evaluation that force-added `.claude/settings.json` could re-open reads and the network for its own run. Unlike hooks there is no switch that ignores them, so the workspace build strips `.claude/settings.json` and `.claude/settings.local.json` before the base commit is made.
-   **The environment** is bounded by `lib/environment.js` and the sandbox's credential rules. The provider copies the whole of `process.env` into the agent and `config.env` can only override a name, never remove one, so inherited variables are blanked there. Promptfoo restores `ANTHROPIC_API_KEY` after that step, so the Bash sandbox denies that name explicitly.

The subject also never sees `test/ai-development/`: it is stripped from the workspace, and the checkout holding the other copy is denied. `specs/sandbox` probes reads, writes, network access, Docker, hooks, and the inherited environment rather than trusting the configuration alone.

See [Claude Code sandboxing](https://code.claude.com/docs/en/sandboxing) and [permissions](https://code.claude.com/docs/en/permissions).

### Grading code changes

An agent's response is its account of what it did, not what it did. Promptfoo's coding-agent guide puts it plainly: the output "is its final text response describing what it did, not the file contents", and file-level verification means reading the files after the eval.

So the harness reads them. `lib/diff.js` is a Promptfoo transform that stages the workspace and appends `git status` and the diff to the response before any assertion runs. Rubrics then judge that diff, and are told to prefer it wherever it contradicts the agent's summary.

Taking the diff here rather than having a grading agent go and find it matters for two reasons. A model-graded assertion defers grading onto a queue, and a grader that inspects the workspace itself is then correct only because Promptfoo happens to run that queue before the `afterEach` rollback — an ordering nothing documents, and the first thing that would break on raising `maxConcurrency`. A transform runs before any assertion is graded or queued, so it depends on no such ordering. Before the host stages or resets anything, the harness replaces the agent-controlled `.git` directory with a trusted copy and disables global and system Git configuration. The trusted copy lives in the source checkout, which is explicitly denied for edits, rather than beside the workspace in the writable system temp directory. That prevents repository-local clean filters and other agent-supplied Git settings from escaping the sandbox.

Judgement that the diff alone cannot support — whether a change follows the repository's own references — stays with `agent-rubric`, which Promptfoo documents for exactly this: verifying a claimed code change against the artifact rather than the response.

Its grading provider takes Promptfoo's documented form — naming `working_dir` and letting the default allowlist of `Read`, `Grep`, `Glob` and `LS` apply. That is read-only, and the SDK refuses any path outside the working directory, so it needs no sandbox: the sandbox wraps Bash and this grader has none. Giving a grader a shell is what would drag in a sandbox, a readable global Git config, and the write access Promptfoo's safety guidance tells you to avoid. Beyond that it adds confinement the tool list should not be relied on to provide: no settings sources, no hooks, and the same blanked environment as the subject.

That is also why the transform is not redundant: with no shell the grader cannot run `git diff` itself. The transform shows it what changed; its read-only tools let it check that against `.agents/skills/`.

Use `llm-rubric` instead wherever a rubric only needs the response and the diff — Promptfoo's rule is that a judge needing to inspect an artifact takes `agent-rubric`, and one that doesn't takes `llm-rubric`.

## Setup

This package is deliberately not one of the root workspaces: Promptfoo's
dependency tree is large and only needed by people running evals, so it keeps
its own lockfile and install step.

Promptfoo is pinned to `0.122.1` because `0.122.2` adds a dependency affected
by [GHSA-jmr9-qjv8-65gv](https://github.com/advisories/GHSA-jmr9-qjv8-65gv).
The package overrides also update two optional local-transformer dependencies to
releases that fix [GHSA-xcpc-8h2w-3j85](https://github.com/advisories/GHSA-xcpc-8h2w-3j85)
and [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj).
The CI job fails if a high-severity advisory returns.

It also needs a newer Node than the repository — see `.nvmrc`.

```bash
nvm use "$(cat test/ai-development/.nvmrc)"
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --prefix test/ai-development
```

Runs go through [Claude Code](https://claude.com/claude-code), so it has to be
installed and signed in — run `claude`, then `/login`, before the first eval.
Model calls consume the associated quota or paid usage.

## Run

Run from the repository root:

```bash
# The repository default is Node 20; the eval package requires Node 22.22+.
nvm use "$(cat test/ai-development/.nvmrc)"

# Validate configuration without model calls.
npm --prefix test/ai-development run validate

# Unit-test the harness and the read assertions. No model calls.
npm --prefix test/ai-development run test:utils

# Also prove the sandbox's filesystem shape live: two small model calls that
# check denying regions confines reads to the workspace, and that denying `/`
# never yields a working boundary.
AI_EVAL_LIVE=1 npm --prefix test/ai-development run test:utils

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
