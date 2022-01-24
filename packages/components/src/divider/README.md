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
	__experimentalVStack as VStack,
} from `@wordpress/components`;

function Example() {
	return (
		<VStack spacing={4}>
			<Text>Some text here</Text>
			<Divider />
			<Text>Some more text here</Text>
		</VStack>
	);
}
```

## Props

### `margin`: `number`

Adjusts all margins on the inline dimension.

- Required: No

### `marginStart`: `number`

Adjusts the inline-start margin.

- Required: No

### `marginEnd`: `number`

Adjusts the inline-end margin.

- Required: No

### Inherited props

`Divider` also inherits all of the [`Separator` props](https://reakit.io/docs/separator/).
