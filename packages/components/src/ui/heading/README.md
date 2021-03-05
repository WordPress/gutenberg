# Heading

`Heading` renders headings and titles using the library's typography system.

## Usage

```jsx
import { Heading } from '@wp-g2/components';

function Example() {
	return <Heading>Into The Unknown</Heading>;
}
```

## Props


`Heading` uses `Text` underneath, so we have access to all of `Text`'s props. For a complete list of those props, check out [`Text`](../text/#props).

##### size

**Type**: `CSS['fontSize']`,`TextSize`,`HeadingSize`

This behaves exactly as `Text`'s `size` prop with one caveat: the numbers `1`, through `6` are reserved sizes for `Heading` and correspond to `H1` through `H6` tags, though with the correct sizes to match the typography system.
