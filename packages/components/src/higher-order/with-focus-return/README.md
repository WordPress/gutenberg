# withFocusReturn

## Usage

```jsx
import { withFocusReturn, TextControl, Button } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const EnhancedComponent = withFocusReturn(
	() => (
		<div>
			Focus will return to the previous input when this component is unmounted
			<TextControl
				autoFocus={ true }
				onChange={ () => {} }
			/>
		</div>
	)
);

const MyComponentWithFocusReturn = withState( {
	text: '',
} )( ( { text, setState } ) => {
	const unmount = () => {
		document.activeElement.blur();
		setState( { text: '' } );
	}

	return (
		<div>
			<TextControl
				placeholder="Type something"
				value={ text }
				onChange={ ( text ) => setState( { text } ) }
			/>
			{ text && <EnhancedComponent /> }
			{ text && <Button isDefault onClick={ unmount }>Unmount</Button> }
		</div>
	);
} ); 
```
