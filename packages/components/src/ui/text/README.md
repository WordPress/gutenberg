# Text (Experimental)

`Text` is a core component that renders text in the library, using the library's typography system.

## Usage

`Text` can be used to render any text-content, like an HTML `p` or `span`.

```jsx
import { Text } from '@wordpress/components/ui';

function Example() {
	return <Text>Where the north wind meets the sea</Text>;
}
```

## Props

##### adjustLineHeightForInnerControls

**Type**: `boolean`,`"large"`,`"medium"`,`"small"`,`"xSmall"`

Automatically calculate the appropriate line-height value for contents that render text and Control elements (e.g. `TextInput`).

```jsx
import { Text, TextInput } from '@wordpress/components/ui';

function Example() {
	return (
		<Text adjustLineHeightForInnerControls>
			Where the north wind meets the <TextInput value="sea..." />
		</Text>
	);
}
```

##### align

**Type**: `CSS['textAlign']`

Adjusts the text alignment.

```jsx
import { Text } from '@wordpress/components/ui';

function Example() {
	return (
		<Text align="center" isBlock>
			Where the north wind meets the sea...
		</Text>
	);
}
```

##### color

**Type**: `CSS['color']`

Adjusts the text color.

##### display

**Type**: `CSS['display']`

Adjusts the CSS display.

##### ellipsis

**Type**: `string`

The ellipsis string when `truncate` is set.

##### ellipsizeMode

**Type**: `"auto"`,`"head"`,`"tail"`,`"middle"`

Determines where to truncate. For example, we can truncate text right in the middle. To do this, we need to set `ellipsizeMode` to `middle` and a text `limit`.

-   `auto`: Trims content at the end automatically without a `limit`.
-   `head`: Trims content at the beginning. Requires a `limit`.
-   `middle`: Trims content in the middle. Requires a `limit`.
-   `tail`: Trims content at the end. Requires a `limit`.

##### highlightCaseSensitive

**Type**: `boolean`

Escape characters in `highlightWords` which are meaningful in regular expressions.

##### highlightEscape

**Type**: `boolean`

Determines if `highlightWords` should be case sensitive.

##### highlightSanitize

**Type**: `boolean`

Array of search words. String search terms are automatically cast to RegExps unless `highlightEscape` is true.

##### highlightWords

**Type**: `any[]`

Letters or words within `Text` can be highlighted using `highlightWords`.

```jsx
import { Text } from '@wordpress/components/ui';

function Example() {
	return (
		<Text highlightWords={ [ 'the' ] }>
			Where the north wind meets the sea, there's a river full of memory.
			Sleep, my darling, safe and sound, for in this river all is found.
			In her waters, deep and true, lay the answers and a path for you.
			Dive down deep into her sound, but not too far or you'll be drowned
		</Text>
	);
}
```

##### isBlock

**Type**: `boolean`

Sets `Text` to have `display: block`.

##### isDestructive

**Type**: `boolean`

Renders a destructive color.

##### limit

**Type**: `number`

Determines the max characters when `truncate` is set.

##### lineHeight

**Type**: `CSS['lineHeight']`

Adjusts all text line-height based on the typography system.

##### numberOfLines

**Type**: `number`

Clamps the text content to the specifiec `numberOfLines`, adding the `ellipsis` at the end.

##### optimizeReadabilityFor

**Type**: `CSS['color']`

The `Text` color can be adapted to a background color for optimal readability. `optimizeReadabilityFor` can accept CSS variables, in addition to standard CSS color values (e.g. Hex, RGB, HSL, etc...).

```jsx
import { Text, View } from '@wordpress/components/ui';

function Example() {
	const backgroundColor = 'blue';

	return (
		<View css={ { backgroundColor } }>
			<Text optimizeReadabilityFor={ backgroundColor }>
				Where the north wind meets the sea, there's a river full of
				memory.
			</Text>
		</View>
	);
}
```

##### size

**Type**: `CSS['fontSize']`,`TextSize`

Adjusts text size based on the typography system. `Text` can render a wide range of font sizes, which are automatically calculated and adapted to the typography system. The `size` value can be a system preset, a `number`, or a custom unit value (`string`) such as `30em`.

```jsx
import { Text } from '@wordpress/components/ui';

function Example() {
	return <Text size="largeTitle">Where the north wind meets the sea...</Text>;
}
```

##### truncate

**Type**: `boolean`

Enables text truncation. When `truncate` is set,we are able to truncate the long text in a variety of ways.

```jsx
import { Text } from '@wordpress/components/ui';

function Example() {
	return (
		<Text truncate>
			Where the north wind meets the sea, there's a river full of memory.
			Sleep, my darling, safe and sound, for in this river all is found.
			In her waters, deep and true, lay the answers and a path for you.
			Dive down deep into her sound, but not too far or you'll be drowned
		</Text>
	);
}
```

##### upperCase

**Type**: `boolean`

Uppercases the text content.

##### variant

**Type**: `"muted"`

Adjusts style variation of the text.

```jsx
import { Text } from '@wordpress/components/ui';

function Example() {
	return <Text variant="muted">Where the north wind meets the sea...</Text>;
}
```

##### weight

**Type**: `CSS['fontWeight']`,`TextWeight`

Adjusts font-weight of the text.
