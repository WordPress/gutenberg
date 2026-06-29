# Migration guidance

Migration from `@wordpress/components` toward token-driven patterns should be incremental and compatibility-aware.

## Rules

- Move component-local styles to SCSS Modules when touching substantial styles.
- Keep public class names when consumers may target them.
- Replace hardcoded visual values with semantic `--wpds-*` tokens.
- Use descriptive `__next*` props only when a stable component needs an opt-in grace period for style changes.
- Put new docs and stories on the future behavior, not the deprecated behavior.
- Add regression stories for text overflow, density, RTL, keyboard, and visual states when migration changes layout.

## Avoid

- Runtime changes solely to accommodate inaccurate Jest CSS module mocks.
- One large migration PR that changes behavior across many stable components without clear review surfaces.
- New Emotion usage in components moving toward the token-based system.

## Sources

- [Components contributing guide](../../../packages/components/CONTRIBUTING.md)
- [CSS module composition PR #79490](../../_sources/github/threads/pr-79490.md)
- [CSS module mock PR #79535](../../_sources/github/threads/pr-79535.md)
- [Border token migration PR #79244](../../_sources/github/threads/pr-79244.md)
- [Complete border token migration PR #79003](../../_sources/github/threads/pr-79003.md)
