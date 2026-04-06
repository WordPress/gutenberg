# Divider

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Divider` is a layout component that separates groups of related content.

## Usage

```jsx
import {
	__experimentalDivider as Divider,
	__experimentalText as Text,
} from `@wordpress/components`;
import { Stack } from '@wordpress/ui';

function Example() {
	return (
		<Stack direction="column" gap="lg">
			<Text>Some text here</Text>
			<Divider />
			<Text>Some more text here</Text>
		</Stack>
	);
}
```

## Props

### `margin`: `number`

Adjusts all margins on the inline dimension.

-   Required: No

### `marginEnd`: `number`

Adjusts the inline-end margin.

-   Required: No

### `marginStart`: `number`

Adjusts the inline-start margin.

-   Required: No

### `orientation`: `horizontal | vertical`

Divider's orientation. When using inside a flex container, you may need to make sure the divider is `stretch` aligned in order for it to be visible.

-   Required: No
-   Default: `horizontal`

### Inherited props

`Divider` also inherits all of the [`Separator` props](https://ariakit.org/reference/separator#optional-props).
