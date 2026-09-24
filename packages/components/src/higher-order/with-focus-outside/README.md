# withFocusOutside

`withFocusOutside` is a React [higher-order component](https://facebook.github.io/react/docs/higher-order-components.html) to enable behavior to occur when focus leaves an element. Since a `blur` event will fire in React even when focus transitions to another element in the same context, this higher-order component encapsulates the logic necessary to determine if focus has truly left the element.

## Usage

Wrap your original component with `withFocusOutside`, defining a `handleFocusOutside` instance method on the component class.

**Note:** `withFocusOutside` must only be used to wrap the `Component` class.

```jsx
import { withFocusOutside, TextControl } from '@wordpress/components';

const MyComponentWithFocusOutside = withFocusOutside(
	class extends React.Component {
		handleFocusOutside() {
			console.log( 'Focus outside' );
		}

		render() {
			return (
				<div>
					<TextControl onChange={ () => {} } />
					<TextControl onChange={ () => {} } />
				</div>
			);
		}
	}
);
```

In the above example, the `handleFocusOutside` function is only called if focus leaves the element, and not if transitioning focus between the two inputs.
