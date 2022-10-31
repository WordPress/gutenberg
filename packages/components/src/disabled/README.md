# Disabled

Disabled is a component which disables descendant tabbable elements and prevents pointer interaction.

## Usage

Assuming you have a form component, you can disable all form inputs by wrapping the form with `<Disabled>`.

```jsx
import { Button, Disabled, TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyDisabled = () => {
	const [ isDisabled, setIsDisabled ] = useState( true );

	let input = <TextControl label="Input" onChange={ () => {} } />;
	if ( isDisabled ) {
		input = <Disabled>{ input }</Disabled>;
	}

	const toggleDisabled = () => {
		setIsDisabled( ( state ) => ! state );
	};

	return (
		<div>
			{ input }
			<Button variant="primary" onClick={ toggleDisabled }>
				Toggle Disabled
			</Button>
		</div>
	);
};
```

A component can detect if it has been wrapped in a `<Disabled />` by accessing its [context](https://reactjs.org/docs/context.html) using `Disabled.Context`.

```jsx
function CustomButton( props ) {
	const isDisabled = useContext( Disabled.Context );
	return (
		<button
			{ ...props }
			style={ { opacity: isDisabled ? 0.5 : 1 } }
		/>
	);
}
```

_Note: this component may not behave as expected in browsers that don't support [the `inert` HTML attribute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert). We recommend adding [the official WICG polyfill](https://github.com/WICG/inert) when using this component in your project._

### Props

The component accepts the following props:

#### isDisabled

Whether to disable all the descendant fields. Defaults to `true`.

-   Type: `Boolean`
-   Required: No
-   Default: `true`
