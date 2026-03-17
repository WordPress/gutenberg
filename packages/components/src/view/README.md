# View

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`View` is a core component that renders everything in the library. It is the principle component in the entire library.

**Everything** is a `View`, and a `View` is **everything**.

## Usage

```jsx
import {
	__experimentalText as Text,
	__experimentalView as View,
} from '@wordpress/components';

function Example() {
	return (
		<View>
			<Text>Code is Poetry</Text>
		</View>
	);
}
```

## Props

### as

**Type**: `string`,`E`

Render the component as another React Component or HTML Element.

### css

**Type**: `InterpolatedCSS`

Render custom CSS using the style system.
