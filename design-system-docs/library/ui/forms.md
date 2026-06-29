# Forms

Form components need clear labels, predictable value APIs, and validation that reaches the actual control the user interacts with.

## Rules

- Prefer `value` / `defaultValue` / `onValueChange` for component-level value state.
- Keep native event handlers available only when they are needed for interoperability.
- Attach descriptions and validation errors to the focusable interactive element.
- For delegate-based controls, distinguish the element used for native validity from the element the user focuses.
- Do not validate too early when it creates noisy or misleading feedback. For email fields and similar inputs, delay expensive or error-like validation until blur when appropriate.
- Use live announcements or notices for feedback that must be heard after an action.

## Error messages

An error message that only points to a hidden validity delegate is not enough. Screen reader users must hear the error when they return focus to the visible interactive control.

## Sources

- [Validated controls error issue #76741](../../_sources/github/threads/issue-76741.md)
- [Validation error target issue #76694](../../_sources/github/threads/issue-76694.md)
- [Delayed email validation PR #79518](../../_sources/github/threads/pr-79518.md)
- [@wordpress/ui README controlled modes](../../../packages/ui/README.md)
