# DetectFocusOutside

`DetectFocusOutside` is a component used to help detect when focus leaves an element.

This can be useful to disambiguate focus transitions within the same element. A React `blur` event will fire even when focus transitions to another element in the same context. `DetectFocusOutside` will only invoke its callback prop when focus has truly left the element.

## Usage

Wrap your rendered children with `DetectFocusOutside`, defining an `onFocusOutside` callback prop.

```jsx
import { DetectFocusOutside, TextControl } from '@wordpress/components';

function MyComponent() {
	function onFocusOutside() {
		console.log( 'Focus has left the rendered element.' );
	}

	return (
		<DetectFocusOutside onFocusOutside={ onFocusOutside }>
			<TextControl />
			<TextControl />
		</DetectFocusOutside>
	);
);
```

In the above example, the `onFocusOutside` function is only called if focus leaves the element, and not if transitioning focus between the two inputs.

## Props

### `onFocusOutside`
* **Type:** `Function`
* **Required:** Yes

A callback function to invoke when focus has left the rendered element. The callback will receive the original blur event.
