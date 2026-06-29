# Get started

The WordPress design system is organized as packages that serve different levels of abstraction. Start with the package that matches the decision you need to make.

- Use `@wordpress/theme` for design tokens, theming, and token tooling.
- Use `@wordpress/ui` for new token-driven generic UI primitives.
- Use `@wordpress/admin-ui` for opinionated admin-page composition, not generic primitives.
- Use `@wordpress/dataviews` for data browsing, picking, and editing flows.
- Use `@wordpress/components` when working in existing WordPress surfaces that already depend on the legacy bundled component library.

Do not treat every exported component as equally mature. `@wordpress/ui` and `@wordpress/theme` are still experimental, and recent ThemeProvider work restored private API boundaries after a premature stable promotion caused bundled-package build problems.

## Quick setup

Inside standard WordPress editor and admin screens, stylesheets and token styles are normally managed centrally. Avoid adding duplicate setup in shared WordPress contexts.

Outside WordPress, install and load the pieces your application actually uses:

```bash
npm install @wordpress/ui @wordpress/theme
```

```js
import '@wordpress/theme/design-tokens.css';
```

If you use `@wordpress/components`, `@wordpress/admin-ui`, or `@wordpress/dataviews` outside WordPress, also load their documented build styles.

## Sources

- [@wordpress/ui README](../../packages/ui/README.md)
- [@wordpress/theme README](../../packages/theme/README.md)
- [ThemeProvider stable API revert, PR #79594](../_sources/github/threads/pr-79594.md)
- [CSS setup instructions, PR #76975](../_sources/github/threads/pr-76975.md)
