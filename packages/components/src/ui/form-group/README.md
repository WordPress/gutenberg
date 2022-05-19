# FormGroup

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`FormGroup` is a form component that groups a label with a form element (e.g. `Switch` or `TextInput`).

## Usage

```jsx
import { FormGroup, TextInput } from '@wordpress/components/ui';

function Example() {
	return (
		<FormGroup label="First name">
			<TextInput />
		</FormGroup>
	);
}
```

## Props

##### align

**Type**: `CSS['alignItems']`

Adjusts the block alignment of children.

##### alignLabel

**Type**: `Pick<TextProps, "align">`

Aligns the label within `FormGroup`.

##### alignment

**Type**: `string`

Adjusts the horizontal and vertical alignment of children.

##### columns

**Type**: `number`,`(number`,`null)[]`

Adjusts the number of columns of the `Grid`.

##### gap

**Type**: `number`

Gap between each child.

##### help

**Type**: `React.ReactElement`

Displays help content.

##### horizontal

**Type**: `boolean`

Displays the label and form field horizontally.

##### isInline

**Type**: `boolean`

Changes the CSS display from `grid` to `inline-grid`.

##### justify

**Type**: `CSS['justifyContent']`

Adjusts the inline alignment of children.

##### label

**Type**: `string`

Label of the form field.

##### labelHidden

**Type**: `boolean`

Visually hides the label.

##### rows

**Type**: `number`,`(number`,`null)[]`

Adjusts the number of rows of the `Grid`.

##### templateColumns

**Type**: `CSS['gridTemplateColumns']`

Adjusts the CSS grid `template-columns`.

##### templateRows

**Type**: `CSS['gridTemplateRows']`

Adjusts the CSS grid `template-rows`.

##### truncate

**Type**: `boolean`

Truncates the label text content.
