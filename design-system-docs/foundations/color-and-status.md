# Color and status

Color should communicate role and severity, not decorate isolated components.

## Status tones

- Use `success` only when confirming a meaningful positive state in context.
- Use `info` for neutral system information and non-actionable context.
- Use `caution` for lower-severity risk or guidance.
- Use `warning` when the user must pay attention to avoid a problem.
- Use `error` for blocking issues, validation failures, destructive consequences, or failed actions.
- Use neutral tokens for default, stable, or background states that do not need attention.

## Status components

Badges, notices, form errors, and buttons should not each invent their own severity ladder. Link to the relevant component page for local guidance:

- [Badge](../library/ui/badge.md)
- [Status feedback](../library/ui/status-feedback.md)
- [Forms](../library/ui/forms.md)

## Practical rule

Ask whether color should draw attention. If not, use a neutral or no-color presentation even when the state is technically positive. Dense UIs become unreadable when every state shouts.

## Sources

- [Badge usage guidance PR #79585](../_sources/github/threads/pr-79585.md)
- [Theme token reference](../../packages/theme/docs/tokens.md)
- [Design token size/status adoption issue #79088](../_sources/github/threads/issue-79088.md)
