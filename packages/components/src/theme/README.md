# Theme

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Theme` allows defining theme variables for components in the `@wordpress/components` package.

Multiple `Theme` components can be nested in order to override specific theme variables.

## Usage

```jsx
import { __experimentalTheme as Theme } from '@wordpress/components';

const Example = () => {
	return (
		<Theme accent="red">
			<Button variant="primary">I'm red</Button>
			<Theme accent="blue">
				<Button variant="primary">I'm blue</Button>
			</Theme>
		</Theme>
	);
};
```

## Props

### `accent`: `string`

Used to set the accent color (used by components as the primary color). If an accent color is not defined, the default fallback value is the original WP Admin main theme color. No all valid CSS color syntaxes are supported — in particular, keywords (like `'currentcolor'`, `'inherit'`, `'initial'`, `'revert'`, `'unset'`...) and CSS custom properties (e.g. `var(--my-custom-property)`) are _not_ supported values for this property.

-   Required: No
