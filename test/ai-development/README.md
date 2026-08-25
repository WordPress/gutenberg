# AI development tests

This directory tests Gutenberg's AI-assisted development workflows for effectiveness and efficiency.

## Overview

The standalone `evals/` package uses [Promptfoo](https://www.promptfoo.dev/docs/) to run coding agents against isolated temporary repositories.

## How it works

Promptfoo runs the prompt × provider × test × repeat matrix. Its standard lifecycle hooks create a clean Git workspace before each row and remove it afterward. The agent provider receives that directory as `working_dir`.

```text
      prompt × provider × test
                 │
                 ▼
   beforeEach: create temporary repo
     from your tree, hide eval files
                 │
                 ▼
       coding agent changes files
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
  tool calls          live workspace
                      + agent response
       │                   │
       └─────────┬─────────┘
                 ▼
         Promptfoo assertions
         ┌───────┴───────┐
         ▼               ▼
  deterministic     agent-rubric
   assertions          review
         └───────┬───────┘
                 ▼
       result row and metrics
                 │
                 ▼
      afterEach: delete workspace
```

A plain run measures your working tree, uncommitted edits included. Untracked files are the exception: a new file has to be added before it appears. You can also run an eval against a specific commit or a comparison with HEAD.

The subject workspace excludes `test/ai-development/`, and the sandbox denies this checkout, so the agent can reach neither copy of the assertions it is being graded against.

See Promptfoo's [coding-agent guide](https://www.promptfoo.dev/docs/guides/evaluate-coding-agents/) and [extension hooks](https://www.promptfoo.dev/docs/configuration/reference/#extension-hooks).

### Grading code changes

Promptfoo's built-in trajectory assertions deterministically check tool calls, including which testing references the agent read or skipped. Its built-in `agent-rubric` receives read-only access to the live workspace, where the grading agent inspects Git status, the diff, relevant documentation, and changed files against the spec's rubric. This keeps code review inside Promptfoo without relying on the subject agent's final message or custom diff processing.

## Setup

Claude can use an existing Claude Code login or `ANTHROPIC_API_KEY`. Model calls consume the associated quota or paid usage.

## Run

Run from the repository root:

```bash
# Validate configuration without model calls.
npm --workspace @wordpress/agent-skill-evals run validate

# Run every spec, each on its own.
npm run test:agent-evals

# Run one spec.
npm run test:agent-evals -- --config specs/SPEC_GROUP/TEST_NAME.test.js

# Any other flag is passed through, with or without --config.
npm run test:agent-evals -- --repeat 3

# Open the local results viewer.
npm --workspace @wordpress/agent-skill-evals run view
```

Results under `results/` are gitignored and may contain source code and tool output.

## Authoring

For each spec:

1. State the narrow claim the evaluation supports.
2. Add a `TEST_NAME.test.js` file that spreads `lib/base.js` and adds a
   realistic agent prompt, cases, and named metrics.
3. Validate, run one provider once, then run the intended matrix with repeats.
