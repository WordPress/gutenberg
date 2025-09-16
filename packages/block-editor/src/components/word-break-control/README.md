# WordBreakControl

A control component for selecting word break behavior in typography settings.

## Description

WordBreakControl provides a user interface for setting the CSS `word-break` property, which determines how text should break when it overflows its container. This is particularly useful for handling long words, URLs, or text in different languages.

## Usage

```jsx
import { __experimentalWordBreakControl as WordBreakControl } from '@wordpress/block-editor';

function MyComponent() {
	const [ wordBreak, setWordBreak ] = useState( 'normal' );

	return (
		<WordBreakControl
			value={ wordBreak }
			onChange={ setWordBreak }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
		/>
	);
}
```

## Props

### `value`
- **Type:** `string`
- **Required:** No
- **Default:** `undefined`

The currently selected word break value. Can be one of:
- `'normal'` - Default browser behavior
- `'break-all'` - Break between any two characters
- `'keep-all'` - Don't break words (useful for CJK languages)
- `'break-word'` - Break long words if necessary

### `onChange`
- **Type:** `Function`
- **Required:** Yes

Callback function called when the word break value changes.

### `__next40pxDefaultSize`
- **Type:** `boolean`
- **Required:** No
- **Default:** `false`

Whether to use the larger 40px default size that will become the default in a future version.

### `__nextHasNoMarginBottom`
- **Type:** `boolean`
- **Required:** No
- **Default:** `false`

Whether to remove the bottom margin from the control (new margin-free styles for future versions).

### `className`
- **Type:** `string`
- **Required:** No

Additional CSS class name to apply to the control.

## Word Break Options

### Default
Uses the browser's default word break behavior (equivalent to not setting the property).

### Normal
Default browser behavior. Words break at normal word boundaries.

### Break All
Text may be broken at any character. Useful for preventing overflow of long URLs or unbreakable strings.

### Keep All
Word breaks should not be used for CJK (Chinese/Japanese/Korean) text. Non-CJK text behavior is the same as `normal`.

### Break Word
Word may be broken at arbitrary points if there are no otherwise-acceptable break points in the line. Similar to `break-all` but preserves the integrity of words when possible.

## Block Support

To enable word break support in a block, add the following to your block's `supports` configuration:

```json
{
	"supports": {
		"typography": {
			"__experimentalWordBreak": true
		}
	}
}
```

## Global Settings

Word break can be enabled/disabled globally via theme.json:

```json
{
	"settings": {
		"typography": {
			"wordBreak": true
		}
	}
}
```

## Styling

You can apply custom word break values via theme.json styles:

```json
{
	"styles": {
		"typography": {
			"wordBreak": "break-all"
		},
		"elements": {
			"h1": {
				"typography": {
					"wordBreak": "keep-all"
				}
			}
		}
	}
}
```

## CSS Output

The control generates the following CSS:

```css
.wp-block-example {
	word-break: break-all;
}
```

## Accessibility

The WordBreakControl component includes proper ARIA labels and follows WordPress accessibility guidelines. The toggle group provides clear visual feedback for the selected state and keyboard navigation support.