# Surface

<p class="callout callout-alert">This component is deprecated. Write your own CSS instead, preferably using the <a href="https://wordpress.github.io/gutenberg/?path=/docs/design-system-tokens-introduction--docs">design tokens</a> available in <code>@wordpress/theme</code>.</p>

`Surface` is a core component that renders a primary background color.

## Usage

In the example below, notice how the `Surface` renders in white (or dark gray if in dark mode).

```jsx
import {
	__experimentalSurface as Surface,
	__experimentalText as Text,
} from '@wordpress/components';

function Example() {
	return (
		<Surface>
			<Text>Code is Poetry</Text>
		</Surface>
	);
}
```

## Props

### `backgroundSize`: `number`

-   Required: No
-   Default: `12`

Determines the grid size for "dotted" and "grid" variants.

### `borderBottom`: `boolean`

-   Required: No
-   Default: `false`

Renders a bottom border.

### `borderLeft`: `boolean`

-   Required: No
-   Default: `false`

Renders a left border.

### `borderRight`: `boolean`

-   Required: No
-   Default: `false`

Renders a right border.

### `borderTop`: `boolean`

-   Required: No
-   Default: `false`

Renders a top border.

### `variant`: `string`

-   Required: No
-   Default: `false`
-   Allowed values: `primary`, `secondary`, `tertiary`, `dotted`, `grid`

Modifies the background color of `Surface`.

-   `primary`: Used for almost all cases.
-   `secondary`: Used as a secondary background for inner `Surface` components.
-   `tertiary`: Used as the app/site wide background. Visible in **dark mode** only. Use case is rare.
-   `grid`: Used to show a grid.
-   `dotted`: Used to show a dots grid.
