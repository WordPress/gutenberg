# @wordpress/agent-tools

Tools for configuring AI coding agents in the Gutenberg repository. This is a private workspace package and is not published to npm.

## Setup

Run `npm run agents:setup` from the repository root to generate compatibility views of the canonical `.agents/skills` catalog for supported agents.

## Validation

Run `npm run lint:skills` from the repository root to check the YAML frontmatter of every `.agents/skills/*/SKILL.md` file. It reports invalid YAML, an unquoted ` #` that turns the rest of a value into a comment, a missing or malformed `name` or `description`, a `name` that does not match the skill's directory, a `compatibility` that is not a non-empty string of 500 characters or fewer, and any field other than `name`, `description` and `compatibility`, following the [skill conventions](../../docs/contributors/code/agents-and-skills.md#skill-conventions). It runs in CI and on commit when skill files change.
