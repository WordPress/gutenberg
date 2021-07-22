# AspectRatio

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`AspectRatio` renders content with a given width:height ratio. A common example would be the **HD** `16:9` ratio. Typically, media-based content (such as images or video) would benefit from an `AspectRatio` controlled container. Another common use-case for `AspectRatio` would be to render `iframe` content with a specific responsive width:height ratio.

<div class="callout callout-alert">
Noting that only the first valid `ReactElement` will be actually rendered. Other children (if any) are ignored.
</div>

## Usage

```js
import { __experimentalAspectRatio as AspectRatio } from '@wordpress/components';

function Example() {
	return (
		<AspectRatio ratio={ 16 / 9 }>
			<img
				src="https://cldup.com/cXyG__fTLN.jpg"
				alt="Snowy Mountains"
				style={ { objectFit: 'cover' } }
			/>
		</AspectRatio>
	);
}
```

## Props

### `ratio`: `number`

-   Required: No
-   Default: `1`

The width:height ratio to render.

### `width`: `CSSProperties[ 'width' ]`

-   Required: No

A custom width.
