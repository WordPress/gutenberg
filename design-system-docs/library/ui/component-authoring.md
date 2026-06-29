# Component authoring

Use this page when adding or changing components in `@wordpress/ui` or migrating components toward the design system.

## API shape

- Prefer small, composable components over prop-heavy components.
- Use controlled/uncontrolled prop pairs for user-facing state.
- Keep prop names semantic and consistent across components.
- Use `render` when consumers need to control the underlying element.
- Forward refs to the meaningful DOM element.
- Include JSDoc and Storybook examples for the recommended usage path.

## Styling

- Use CSS modules for component-local styles.
- Compose classes with `clsx` and keep public compatibility classes where consumers may rely on them.
- Use semantic `--wpds-*` tokens. Do not add local fallbacks to token vars.
- Use inline CSS custom properties for dynamic values consumed by a CSS module.
- Avoid new Emotion usage for components being moved toward token-driven styles.
- Do not contort runtime code to work around inaccurate test mocks. Fix the mock or test setup when possible.

## Documentation

A component page should answer three questions before listing props:

1. What problem does this component solve?
2. When should someone use another component instead?
3. What accessibility contract must consumers preserve?

## Sources

- [@wordpress/ui README](../../../packages/ui/README.md)
- [Components contributing guide](../../../packages/components/CONTRIBUTING.md)
- [CSS module composition PR #79490](../../_sources/github/threads/pr-79490.md)
- [Jest CSS module mock PR #79535](../../_sources/github/threads/pr-79535.md)
- [Stylelint module naming PR #79504](../../_sources/github/threads/pr-79504.md)
