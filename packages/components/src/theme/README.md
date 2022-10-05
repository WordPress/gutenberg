# Theme

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Theme` allows defining theme variables for components in the `@wordpress/components` package.

Multiple `Theme` components can be use and nested, in order to override specific theme variables.

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

### `accent`: `CSSProperties[ 'color' ]`

The accent color, used as the primary color _(wording TBD)_. If an accent color is not defined, the default fallback value is the original WP Admin main theme color.

-   Required: No
