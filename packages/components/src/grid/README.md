# Grid

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Grid` is a primitive layout component that can arrange content in a grid configuration.

## Usage

```jsx
import {
	__experimentalGrid as Grid,
	__experimentalText as Text,
} from '@wordpress/components';

function Example() {
	return (
		<Grid columns={ 3 }>
			<Text>Code</Text>
			<Text>is</Text>
			<Text>Poetry</Text>
		</Grid>
	);
}
```

## Props

### `align`: `CSS['alignItems']`

Adjusts the block alignment of children.

-   Required: No

### `alignment`: `GridAlignment`

Adjusts the horizontal and vertical alignment of children.

-   Required: No

### `columnGap`: `CSSProperties['gridColumnGap']`

Adjusts the `grid-column-gap`.

-   Required: No

### `columns`: `number`

Adjusts the number of columns of the `Grid`.

-   Required: No
-   Default: `2`

### `gap`: `number`

Gap between each child.

-   Required: No
-   Default: `3`

### `isInline`: `boolean`

Changes the CSS display from `grid` to `inline-grid`.

-   Required: No

### `justify`: `CSS['justifyContent']`

Adjusts the inline alignment of children.

-   Required: No

### `rowGap`: `CSSProperties['gridRowGap']`

Adjusts the `grid-row-gap`.

-   Required: No

### `rows`: `number`

Adjusts the number of rows of the `Grid`.

-   Required: No

### `templateColumns`: `CSS['gridTemplateColumns']`

Adjusts the CSS grid `template-columns`.

-   Required: No

### `templateRows`: `CSS['gridTemplateRows']`

Adjusts the CSS grid `template-rows`.

-   Required: No
