# Truncate

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`Truncate` is a typography primitive that trims text content. For almost all cases, it is recommended that `Text`, `Heading`, or `Subheading` is used to render text content. However, `Truncate` is available for custom implementations.

## Usage

```jsx
import { __experimentalTruncate as Truncate } from '@wordpress/components';

function Example() {
	return (
		<Truncate>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc ex
			neque, vulputate a diam et, luctus convallis lacus. Vestibulum ac
			mollis mi. Morbi id elementum massa.
		</Truncate>
	);
}
```

## Props

##### `ellipsis`: `string`

The ellipsis string when truncating the text by the `limit` prop's value.

-   Required: No
-   Default: `…`

##### `ellipsizeMode`: `'auto' | 'head' | 'tail' | 'middle' | 'none'`

Determines where to truncate. For example, we can truncate text right in the middle. To do this, we need to set `ellipsizeMode` to `middle` and a text `limit`.

-   `auto`: Trims content at the end automatically without a `limit`.
-   `head`: Trims content at the beginning. Requires a `limit`.
-   `middle`: Trims content in the middle. Requires a `limit`.
-   `tail`: Trims content at the end. Requires a `limit`.

-   Required: No
-   Default: `auto`

##### `limit`: `number`

Determines the max number of characters to be displayed before the rest of the text gets truncated. Requires `ellipsizeMode` to assume values different from `auto` and `none`.

-   Required: No
-   Default: `0`

##### `numberOfLines`: `number`

Clamps the text content to the specified `numberOfLines`, adding an ellipsis at the end. Note: this feature ignores the value of the `ellipsis` prop and always displays the default `…` ellipsis.

-   Required: No
-   Default: `0`

```jsx
import { __experimentalTruncate as Truncate } from '@wordpress/components';

function Example() {
	return (
		<Truncate numberOfLines={ 2 }>
			Where the north wind meets the sea, there's a river full of memory.
			Sleep, my darling, safe and sound, for in this river all is found.
			In her waters, deep and true, lay the answers and a path for you.
			Dive down deep into her sound, but not too far or you'll be drowned
		</Truncate>
	);
}
```
