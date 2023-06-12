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
			<Theme accent="blue" background="black">
				<Button variant="primary">I'm blue</Button>
			</Theme>
		</Theme>
	);
};
```

## Props

### `accent`: `string`

The accent color (used by components as the primary color). If an accent color is not defined, the default fallback value is the original WP Admin main theme color.

Not all valid CSS color syntaxes are supported — in particular, keywords (like `'currentcolor'`, `'inherit'`, `'initial'`, `'revert'`, `'unset'`...) and CSS custom properties (e.g. `var(--my-custom-property)`) are _not_ supported values for this property.

-   Required: No

### `background`: `string`

The background color.  If a component explicitly has a background, it will be this color. Otherwise, this color will simply be used to determine what the foreground colors should be. The actual background color will need to be set on the component's container element. If a background color is not defined, the default fallback value is #fff.

Not all valid CSS color syntaxes are supported — in particular, keywords (like `'currentcolor'`, `'inherit'`, `'initial'`, `'revert'`, `'unset'`...) and CSS custom properties (e.g. `var(--my-custom-property)`) are _not_ supported values for this property.

-   Required: No

## Writing themeable components

If you would like your custom component to be themeable as a child of the `Theme` component, it should use these color variables. (This is a work in progress, and this list of variables may change. We do not recommend using these variables in production at this time.)

-  `--wp-components-color-accent`: The accent color.
-  `--wp-components-color-accent-darker-10`: A slightly darker version of the accent color.
-  `--wp-components-color-accent-darker-20`: An even darker version of the accent color.
-  `--wp-components-color-accent-inverted`: The foreground color when the accent color is the background, for example when placing text on the accent color.
-  `--wp-components-color-background`: The background color.
-  `--wp-components-color-foreground`: The foreground color, for example text.
-  `--wp-components-color-foreground-inverted`: The foreground color when the foreground color is the background, for example when placing text on the foreground color.
-  Grayscale:
   -  `--wp-components-color-gray-100`: Used for light gray backgrounds.
   -  `--wp-components-color-gray-200`: Used sparingly for light borders.
	 -	`--wp-components-color-gray-300`: Used for most borders.
	 -	`--wp-components-color-gray-400`
	 -	`--wp-components-color-gray-600`: Meets 3:1 UI or large text contrast against white.
	 -	`--wp-components-color-gray-700`: Meets 4.6:1 text contrast against white.
	 -	`--wp-components-color-gray-800`
