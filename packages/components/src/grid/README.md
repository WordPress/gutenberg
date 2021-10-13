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

##### align

**Type**: `CSS['alignItems']`

Adjusts the block alignment of children.

##### alignment

**Type**: `GridAlignment`

Adjusts the horizontal and vertical alignment of children.

##### columns

**Type**: `number`,`(number`,`null)[]`

Adjusts the number of columns of the `Grid`.

##### gap

**Type**: `number`

Gap between each child.

##### isInline

**Type**: `boolean`

Changes the CSS display from `grid` to `inline-grid`.

##### justify

**Type**: `CSS['justifyContent']`

Adjusts the inline alignment of children.

##### rows

**Type**: `number`,`(number`,`null)[]`

Adjusts the number of rows of the `Grid`.

##### templateColumns

**Type**: `CSS['gridTemplateColumns']`

Adjusts the CSS grid `template-columns`.

##### templateRows

**Type**: `CSS['gridTemplateRows']`

Adjusts the CSS grid `template-rows`.
