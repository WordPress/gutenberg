# Card

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Card` groups similar concepts and tasks together. `Card`'s background is rendered with a `Surface`.

## Usage

`Card` provides convenient sub-components such as `CardBody`, `CardHeader`, and `CardFooter`.

```jsx live
import {
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	Text,
	Heading,
} from '@wordpress/components';

function Example() {
	return (
		<Card>
			<CardHeader>
				<Heading size={ 4 }>Card Title</Heading>
			</CardHeader>
			<CardBody>
				<Text>Card Content</Text>
			</CardBody>
			<CardFooter>
				<Text>Card Footer</Text>
			</CardFooter>
		</Card>
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

##### elevation

**Type**: `number`

Size of the elevation shadow, based on the Style system's elevation system.
Elevating a `Card` can be done by adjusting the `elevation` prop. This may be helpful in highlighting certain content. For more information, check out `Elevation`.

##### isBorderless

**Type**: `boolean`

Renders without a border.

##### isRounded

**Type**: `boolean`

Renders with rounded corners.

##### variant

**Type**: `"grid"`,`"primary"`,`"secondary"`,`"tertiary"`,`"dotted"`

Modifies the background color of `Surface`.

-   `primary`: Used for almost all cases.
-   `secondary`: Used as a secondary background for inner `Surface` components.
-   `tertiary`: Used as the app/site wide background. Visible in **dark mode** only. Use case is rare.
