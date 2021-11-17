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
