# DetectFocusOutside

`DetectFocusOutside` is a component used to help detect when focus leaves a component tree.

This is useful to detect whether focus has transitioned to another element outside a particular component tree, in which case DetectFocusOutside will invoke the onFocusOutside callback. This is unlike React's `onBlur`, which will be invoked even when focus transitions to another element in the same component tree.

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
