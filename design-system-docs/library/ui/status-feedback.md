# Status feedback

Status feedback covers badges, notices, validation errors, action confirmations, and transient messages.

## Rules

- Use the least attention-grabbing treatment that still communicates the state.
- Use a notice or live announcement for feedback that happens after an action and must be available to assistive technologies.
- Use inline validation messages for form errors and connect them to the interactive control.
- Use badges for compact state labels, not explanatory messages.
- Do not use tooltips for required status feedback.

## Choosing the pattern

| Need | Pattern |
| --- | --- |
| Compact state in a list or header | Badge |
| System message or action result | Notice or speak announcement |
| Error tied to a field | Inline validation message |
| Non-essential visual clarification on hover/focus | Tooltip |
| Detailed contextual help | Popover or inline text |

## Sources

- [Badge usage guidance PR #79585](../../_sources/github/threads/pr-79585.md)
- [Tooltip usage guidelines](../../../packages/ui/src/tooltip/stories/usage-guidelines.mdx)
- [A11y speak queue PR #79562](../../_sources/github/threads/pr-79562.md)
