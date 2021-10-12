# Heading

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Heading` renders headings and titles using the library's typography system.

## Usage

```jsx
import { __experimentalHeading as Heading } from '@wordpress/components';

function Example() {
	return <Heading>Code is Poetry</Heading>;
}
```

## Props

`Heading` uses `Text` underneath, so we have access to all of `Text`'s props except for `size` which is replaced by `level`. For a complete list of those props, check out [`Text`](/packages/components/src/text/README.md#props).

##### level

**Type**: `1 | 2 | 3 | 4 | 5 | 6`

Passing any of the heading levels to `level` will both render the correct typographic text size as well as the semantic element corresponding to the level (`h1` for `1` for example).
