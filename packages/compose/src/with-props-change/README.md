withPropsChange
==============

Sometimes it may be useful to overwrite the props a component receives.
E.g: to force a prop to contain some static prop or to in a specific context,
compute one property as a function of other.

withPropsChange receives a function that given the props of a component,
should return the new props.

## Usage

```jsx
/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';

const ShowGreeting = ( { greeting, name } ) => {
	return (
		<div>
			{ greeting } { name }
		</div>
	);
};

const ShowWordPressGreeting = withPropsChange(
	( props ) => ( { ...props, greeting: 'Howdy' } )
)( ShowGreeting );
```
