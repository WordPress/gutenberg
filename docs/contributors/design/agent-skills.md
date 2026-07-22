# WordPress Design System agent skills

The design-system skills provide procedural guidance for common workflows. The
skills do not replace component documentation, the token reference, code
review, or package contribution guides. They direct an agent to the right
sources and require target-version and consumer evidence.

## Available skills

| Skill | Use it for |
| --- | --- |
| `design-system-ui-composition` | Building a Gutenberg feature, plugin interface, or standalone app with public package APIs. |
| `design-system-consumer-code-review` | Reviewing a consumer-only application or plugin change. |
| `design-system-contribution` | Changing `packages/components`, `packages/ui`, or `packages/theme` in a Gutenberg checkout. |
| `design-system-code-review` | Reviewing a design-system package contribution. |

The canonical source is the repository-root [`skills/`](../../../skills)
directory. Consumer skills are portable and link only to public documentation.
Maintainer skills require a Gutenberg checkout because they reference source and
package contribution guidance.

## Install and update intentionally

Use a supported skill installer for your coding agent, or copy an individual
skill folder into the agent's documented project or global skill location. For
example, the open `skills` CLI can list and install a selected skill:

```sh
npx skills add WordPress/gutenberg --list
npx skills add WordPress/gutenberg --skill design-system-ui-composition --agent codex
```

For a project-wide installation, use the installer's copy mode, review the
generated files and `skills-lock.json`, and commit them together. A local
symlink is not a reproducible project dependency.

Skills update only when a user or project deliberately runs the installer’s
update command. Before accepting an update, check the target checkout or
installed package versions: latest skill guidance does not prove an older
package supports the same API. Review and commit project-scoped updates like
any other dependency update.

When a skill is renamed, split, or retired, retain a migration note for one
release cycle. Automated updates must not silently remove a project skill.

## Maintaining the skills

Keep durable public facts in human-facing package documentation and generated
references. Keep each `SKILL.md` short: task boundary, required inputs,
source-resolution procedure, verification evidence, and escalation path.

Changes to consumer guidance, token/theming guidance, or maintainer
architecture guidance need Design System review. Validate metadata and local
links with `node skills/validate.mjs` before submitting a change.
