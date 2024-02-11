# Text

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Text` is a core component that renders text in the library, using the library's typography system.

## Usage

`Text` can be used to render any text-content, like an HTML `p` or `span`.

```jsx
import { __experimentalText as Text } from '@wordpress/components';

function Example() {
	return <Text>Code is Poetry</Text>;
}
```

## Props

### adjustLineHeightForInnerControls

**Type**: `"large"`,`"medium"`,`"small"`,`"xSmall"`

Automatically calculate the appropriate line-height value for contents that render text and Control elements (e.g. `TextInput`).

```jsx
import { __experimentalText as Text, TextInput } from '@wordpress/components';

function Example() {
	return (
		<Text adjustLineHeightForInnerControls={"small"}>
			Lorem ipsum dolor sit amet, consectetur
			<TextInput value="adipiscing elit..." />
		</Text>
	);
}
```

### align

**Type**: `CSSProperties['textAlign']`

Adjusts the text alignment.

```jsx
import { __experimentalText as Text } from '@wordpress/components';

function Example() {
	return (
		<Text align="center" isBlock>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit...
		</Text>
	);
}
```

### color

**Type**: `CSSProperties['color']`

Adjusts the text color.

### display

**Type**: `CSSProperties['display']`

Adjusts the CSS display.

### ellipsis

**Type**: `string`

The ellipsis string when `truncate` is set.

### ellipsizeMode

**Type**: `"auto"`,`"head"`,`"tail"`,`"middle"`

Determines where to truncate. For example, we can truncate text right in the middle. To do this, we need to set `ellipsizeMode` to `middle` and a text `limit`.

-   `auto`: Trims content at the end automatically without a `limit`.
-   `head`: Trims content at the beginning. Requires a `limit`.
-   `middle`: Trims content in the middle. Requires a `limit`.
-   `tail`: Trims content at the end. Requires a `limit`.

### highlightCaseSensitive

**Type**: `boolean`

Escape characters in `highlightWords` which are meaningful in regular expressions.

### highlightEscape

**Type**: `boolean`

Determines if `highlightWords` should be case sensitive.

### highlightSanitize

**Type**: `boolean`

Array of search words. String search terms are automatically cast to RegExps unless `highlightEscape` is true.

### highlightWords

**Type**: `any[]`

Letters or words within `Text` can be highlighted using `highlightWords`.

```jsx
import { __experimentalText as Text } from '@wordpress/components';

function Example() {
	return (
		<Text highlightWords={ [ 'pi' ] }>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc ex
			neque, vulputate a diam et, luctus convallis lacus. Vestibulum ac
			mollis mi. Morbi id elementum massa. Suspendisse interdum auctor
			ligula eget cursus. In fermentum ultricies mauris, pharetra
			fermentum erat pellentesque id.
		</Text>
	);
}
```

### isBlock

**Type**: `boolean`

Sets `Text` to have `display: block`.

Note: text truncation only works when `isBlock` is `false`.

### isDestructive

**Type**: `boolean`

Renders a destructive color.

### limit

**Type**: `number`

Determines the max characters when `truncate` is set.

### lineHeight

**Type**: `CSSProperties['lineHeight']`

Adjusts all text line-height based on the typography system.

### numberOfLines

**Type**: `number`

Clamps the text content to the specifiec `numberOfLines`, adding the `ellipsis` at the end.

### optimizeReadabilityFor

**Type**: `CSSProperties['color']`

The `Text` color can be adapted to a background color for optimal readability. `optimizeReadabilityFor` can accept CSS variables, in addition to standard CSS color values (e.g. Hex, RGB, HSL, etc...).

```jsx
import { __experimentalText as Text, View } from '@wordpress/components';

function Example() {
	const backgroundColor = 'blue';

	return (
		<View css={ { backgroundColor } }>
			<Text optimizeReadabilityFor={ backgroundColor }>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit.
			</Text>
		</View>
	);
}
```

### size

**Type**: `CSSProperties['fontSize']`,`TextSize`

Adjusts text size based on the typography system. `Text` can render a wide range of font sizes, which are automatically calculated and adapted to the typography system. The `size` value can be a system preset, a `number`, or a custom unit value (`string`) such as `30em`.

```jsx
import { __experimentalText as Text } from '@wordpress/components';

function Example() {
	return <Text size="largeTitle">Code is Poetry</Text>;
}
```

### truncate

**Type**: `boolean`

Enables text truncation. When `truncate` is set, we are able to truncate the long text in a variety of ways.

Note: text truncation won't work if the `isBlock` property is set to `true`

```jsx
import { __experimentalText as Text } from '@wordpress/components';

function Example() {
	return (
		<Text truncate>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc ex
			neque, vulputate a diam et, luctus convallis lacus. Vestibulum ac
			mollis mi. Morbi id elementum massa. Suspendisse interdum auctor
			ligula eget cursus. In fermentum ultricies mauris, pharetra
			fermentum erat pellentesque id.
		</Text>
	);
}
```

### upperCase

**Type**: `boolean`

Uppercases the text content.

### variant

**Type**: `"muted"`

Adjusts style variation of the text.

```jsx
import { __experimentalText as Text } from '@wordpress/components';

function Example() {
	return <Text variant="muted">Code is Poetry</Text>;
}
```

### weight

**Type**: `CSSProperties['fontWeight']`,`TextWeight`

Adjusts font-weight of the text.
