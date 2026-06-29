# Tabs

Use Tabs for switching between related panels in the same view. Do not use Tabs to render navigation links.

## Rules

- Use uncontrolled mode with `defaultValue` when the selected tab is local UI state.
- Use controlled mode with `value` and `onValueChange` when the selected tab is owned by parent state.
- Pass `null` to `value` when no tab should be selected.
- Do not use Tabs for a list of links. Link lists have different semantics and users expect each link to be tabbable.
- Keep tab labels short and stable.

## Cross-link

If the UI changes routes or browser history, use navigation or link components instead of Tabs.

## Sources

- [Tabs best practices](../../../packages/ui/src/tabs/stories/best-practices.mdx)
- [Navigation component proposal issue #79154](../../_sources/github/threads/issue-79154.md)
