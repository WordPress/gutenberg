# Badge

Use Badge for short status labels. A badge should help scanning; it should not become a miniature notice or action button.

## Intent decision tree

1. Ask whether the badge should draw the eye.
2. If not, use `none` or plain text.
3. If yes and the user needs to act, choose by urgency: `high`, `medium`, or `low`.
4. If the state is non-final, use `draft`.
5. If the state is notable but not actionable, use `informational`.
6. Use `stable` only when confirming the healthy state matters in that view.

## Guidelines

- Prefer text-only badges.
- Do not use icons in badges by default. Current guidance discourages it because the meaning and accessibility tradeoffs need more design iteration.
- In dense tables or lists, avoid coloring every ordinary state.
- Keep badge copy short and noun-like: `Draft`, `Scheduled`, `Approval required`.
- Do not use badges for actions or long explanations.

## Sources

- [Badge intent guidance](../../../packages/ui/src/badge/stories/choosing-intent.mdx)
- [Badge icon guidance PR #79585](../../_sources/github/threads/pr-79585.md)
- [Badge text overflow PR #78589](../../_sources/github/threads/pr-78589.md)
