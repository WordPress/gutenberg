# View (Experimental)

`View` is a core component that renders everything in the library. It is the principle component in the entire library. Note that `View` is not exported from components, it's fully internal.

**Everything** is a `View`, and a `View` is **everything**.

## Usage

```jsx
import { Text, View } from '@wordpress/components/ui';

function Example() {
	return (
		<View>
			<Text>Into The Unknown</Text>
		</View>
	);
}
```

## Props

##### as

**Type**: `string`,`E`

Render the component as another React Component or HTML Element.

##### css

**Type**: `InterpolatedCSS`

Render custom CSS using the style system.

## Styling

### Presets

The Style system provides a bunch of style presets, which come from `@wp-g2/styles`. These presets are namespaced under `ui`.

Presets can style a `View` by passing an `Array` of them into the `css` prop.

```jsx
import { Text, View } from '@wordpress/components/ui';
import { ui } from '@wp-g2/styles';

function Example() {
	return (
		<View
			css={ [
				ui.padding( 5 ),
				ui.background.blue,
				ui.hover( ui.background.red, ui.scale( 1.02 ) ),
				ui.active( ui.background.yellow, ui.scale( 0.8 ) ),
				ui.animation.bounce,
			] }
		>
			<Text>Into The Unknown</Text>
		</View>
	);
}
```
