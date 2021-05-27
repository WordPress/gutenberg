# Surface

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Surface` is a core component that renders a primary background color.

## Usage

In the example below, notice how the `Surface` renders in white (or dark gray if in dark mode).

```jsx
import { Surface, Text } from '@wordpress/components/ui';

function Example() {
	return (
		<Surface>
			<Text>Code is Poetry</Text>
		</Surface>
	);
}
```

## Props

##### backgroundSize

**Type**: `number`

Determines the grid size for "dotted" and "grid" variants.

##### border

**Type**: `boolean`

Renders a border around the entire `Surface`.

##### borderBottom

**Type**: `boolean`

Renders a bottom border.

##### borderLeft

**Type**: `boolean`

Renders a left border.

##### borderRight

**Type**: `boolean`

Renders a right border.

##### borderTop

**Type**: `boolean`

Renders a top border.

##### variant

**Type**: `"grid"`,`"primary"`,`"secondary"`,`"tertiary"`,`"dotted"`

Modifies the background color of `Surface`.

-   `primary`: Used for almost all cases.
-   `secondary`: Used as a secondary background for inner `Surface` components.
-   `tertiary`: Used as the app/site wide background. Visible in **dark mode** only. Use case is rare.
