# withFocusReturn

`withFocusReturn` is a higher-order component used typically in scenarios of short-lived elements (modals, dropdowns) where, upon the element's unmounting, focus should be restored to the focused element which had initiated it being rendered.

Optionally, it can be used in combination with a `FocusReturnProvider` which, when rendered toward the top of an application, will remember a history of elements focused during a session. This can provide safeguards for scenarios where one short-lived element triggers the creation of another (e.g. a dropdown menu triggering a modal display). The combined effect of `FocusReturnProvider` and `withFocusReturn` is that focus will be returned to the most recent focused element which is still present in the document.

## Usage

### `withFocusReturn`

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

`withFocusReturn` can optionally be called as a higher-order function creator. Provided an options object, a new higher-order function is returned.

Currently, the following options are supported:

#### `onFocusReturn`

An optional function which allows the developer to customize the focus return behavior. A return value of `false` should be returned from this function to indicate that the default focus return behavior should be skipped.

- Type: `Function`
- Required: No

_Example:_

```jsx
function MyComponent() {
	return <textarea />;
}

const EnhancedMyComponent = withFocusReturn( {
	onFocusReturn() {
		document.getElementById( 'other-input' ).focus();
		return false;
	},
} )( MyComponent );
```

### `FocusReturnProvider`

```jsx
import { FocusReturnProvider } from '@wordpress/components';

function App() {
	return (
		<FocusReturnProvider>
			{ /* ... */ }
		</FocusReturnProvider>
	);
}
```
