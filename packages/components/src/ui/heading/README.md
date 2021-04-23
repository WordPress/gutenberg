# Heading

`Heading` renders headings and titles using the library's typography system.

## Usage

```jsx
import { Heading } from '@wordpress/components/ui';

function Example() {
	return <Heading>Code is Poetry</Heading>;
}
```

## Props

`Heading` uses `Text` underneath, so we have access to all of `Text`'s props except for `size` which is replaced by `level`. For a complete list of those props, check out [`Text`](../text/#props).

##### level

**Type**: `1 | 2 | 3 | 4 | 5 | 6`

Passing any of the heading levels to `level` will both render the correct typographic text size as well as the semantic element corresponding to the level (`h1` for `1` for example).
