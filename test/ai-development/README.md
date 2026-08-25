# AI development tests

This directory tests Gutenberg's AI-assisted development workflows for effectiveness and efficiency.

## Overview

The standalone `evals/` package uses [Promptfoo](https://www.promptfoo.dev/docs/) to run coding agents against isolated temporary repositories.

## How it works

Promptfoo runs the prompt × provider × test × repeat matrix. Its standard lifecycle hooks create a clean Git workspace from the committed `HEAD` before each row and remove it afterward. The native Claude provider receives that directory as `working_dir`.

```text
      prompt × provider × test
                 │
                 ▼
   beforeEach: create temporary repo
      from HEAD and hide eval files
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

The subject workspace excludes `test/ai-development/`, so the agent cannot inspect its prompt configuration or assertions. Uncommitted repository changes are not included.

See Promptfoo's [coding-agent guide](https://www.promptfoo.dev/docs/guides/evaluate-coding-agents/) and [extension hooks](https://www.promptfoo.dev/docs/configuration/reference/#extension-hooks).

### Grading code changes

Promptfoo's built-in trajectory assertions deterministically check tool calls, including which testing references the agent read or skipped. Its built-in `agent-rubric` receives read-only access to the live workspace, where the grading agent inspects Git status, the diff, relevant documentation, and changed files against the spec's rubric. This keeps code review inside Promptfoo without relying on the subject agent's final message or custom diff processing.

## Setup

Use Node.js 22.22 or newer; Node.js 24 LTS is recommended. This is a workspace,
so a root `npm install` installs it.

Claude can use an existing Claude Code login or `ANTHROPIC_API_KEY`. Model calls consume the associated quota or paid usage.

## Run

Run from the repository root:

```bash
# Validate configuration without model calls.
npm --workspace @wordpress/agent-skill-evals run validate

# Run every spec and provider.
npm run test:agent-evals -- --config 'specs/*/*.test.js'

# Run one spec.
npm run test:agent-evals -- --config specs/SPEC_GROUP/TEST_NAME.test.js

# Override repeats.
npm run test:agent-evals -- --config specs/SPEC_GROUP/TEST_NAME.test.js --repeat 3

# Open the local results viewer.
npm --workspace @wordpress/agent-skill-evals run view
```

Results under `results/` are gitignored and may contain source code and tool output.

## Files

```text
test/ai-development/
├── lib/
│   ├── base.js                     shared setup a spec spreads
│   ├── default-test.js             shared test options
│   ├── providers.js                shared coding agents
│   └── workspace-extension.mjs     workspace lifecycle
├── package.json
└── specs/SPEC_GROUP/
    └── TEST_NAME.test.js           prompt, assertions, and spec configuration
```

## Authoring

For each spec:

1. State the narrow claim the evaluation supports.
2. Add a `TEST_NAME.test.js` file that spreads `lib/base.js` and adds a
   realistic agent prompt, cases, and named metrics.
3. Validate, run one provider once, then run the intended matrix with repeats.
