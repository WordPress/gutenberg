# withContext

`withContext` is a React [higher-order component](https://facebook.github.io/react/docs/higher-order-components.html) to opt in to receiving [React context](https://reactjs.org/docs/context.html) into a component as props.

## Usage

Wrap your original component with `withContext`, defining a key of context to receive and an optional mapping function.

```jsx
import PropTypes from 'prop-types';
import { withContext } from '@wordpress/components';

class Settings extends React.Component {
	getChildContext() {
		return { 
			settings: {
				favoriteColor: 'purple', 
			},
		};
	}
	
	render() {
		return this.props.children;
	}
}

Settings.childContextTypes = {
	settings: PropTypes.object,
};

const EnhancedComponent = withContext( 'settings' )(
	( settings ) => ( { favoriteColor: settings.favoriteColor } )
)(
	( { favoriteColor } ) => <div>Your favorite color is: { favoriteColor }</div>
);

const MyComponentWithContext = () => (
	<Settings>
		<EnhancedComponent />
	</Settings>
);
```

The above example assumes that an ancestor component provides a `settings` context containing a key `favoriteColor`. When the enhanced component is rendered, the favorite color setting will be injected as a prop.

If the mapping function is not provided, a prop with the context key will be passed, assigned the value of the context.

Note that you [should not rely on context updates](https://reactjs.org/docs/context.html#updating-context), so use of `withContext` should be very limited to cases where values do not change over time.
