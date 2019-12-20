# Disabled

Disabled is a component which disables descendant tabbable elements and prevents pointer interaction.

## Usage

Assuming you have a form component, you can disable all form inputs by wrapping the form with `<Disabled>`.

```jsx
import { Button, Disabled, TextControl } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyDisabled = withState( {
	isDisabled: true,
} )( ( { isDisabled, setState } ) => { 
	let input = <TextControl label="Input" onChange={ () => {} } />;
	if ( isDisabled ) {
		input = <Disabled>{ input }</Disabled>;
	}
	
	const toggleDisabled = () => {
		setState( ( state ) => ( { isDisabled: ! state.isDisabled } ) );
	};
	
	return (
		<div>
			{ input }
			<Button isPrimary onClick={ toggleDisabled }>
				Toggle Disabled
			</Button>
		</div>
	);
} );
```

A component can detect if it has been wrapped in a `<Disabled>` by accessing its [context](https://reactjs.org/docs/context.html) using `Disabled.Consumer`.

```jsx
function CustomButton() {
	return (
		<Disabled.Consumer>
			{ ( isDisabled ) => (
				<button
					{ ...this.props }
					style={ { opacity: isDisabled ? 0.5 : 1 } }
				/>
			) }
		</Disabled.Consumer>
	);
}
```
