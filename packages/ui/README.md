# UI

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A package that provides React UI components for the WordPress Design System, built on themeable design tokens.

While similar in scope to `@wordpress/components`, there are a few key differences:

-   `@wordpress/components` grew organically as a collection of unrelated UI elements for WordPress screens. In contrast, this package is an implementation of a design system that guarantees user- and developer-facing cohesion between components.
-   Unlike `@wordpress/components`, this package is not bundled as a WordPress script available on the `window.wp` global and is instead distributed as an npm package that follows [semantic versioning](https://semver.org/) for release changes.

This is a companion to the `@wordpress/theme` package that provides:

-   **Design Tokens**: A comprehensive system of design tokens for colors, spacing, typography, and more
-   **Theme System**: A flexible theming provider for consistent theming across applications

## Usage

### Basic Component Usage

```tsx
import { Box } from '@wordpress/ui';

function MyComponent() {
	return (
		<Box background="neutral" padding="small">
			Hello World
		</Box>
	);
}
```

## Core Design Principles

All components in the design system follow consistent patterns for maximum flexibility and developer experience:

### Custom Rendering

Every component supports the `render` prop for complete control over the underlying HTML element:

```tsx
import { Box } from '@wordpress/ui';

function MyComponent() {
	// Render Box as a <span /> instead of the default <div />
	return <Box render={ <span /> }>{ /* ... */ }</Box>;
}
```

### Ref Forwarding

All components forward refs to their underlying DOM elements:

```tsx
import { useRef } from '@wordpress/element';
import { Box } from '@wordpress/ui';

function MyComponent() {
	const boxRef = useRef< HTMLDivElement >( null );

	return <Box ref={ boxRef }>{ /* ... */ }</Box>;
}
```

### Automatic `className` Merging

Components merge provided `className` props with their internal styles:

```tsx
import { Box } from '@wordpress/ui';

function MyComponent() {
	// Your custom CSS className is merged with component styles
	return <Box className="my-custom-class">{ /* ... */ }</Box>;
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
