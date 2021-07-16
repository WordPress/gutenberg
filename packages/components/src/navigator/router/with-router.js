/**
 * External dependencies
 */
import hoistNonReactStatics from 'hoist-non-react-statics';

/**
 * Internal dependencies
 */
import RouterContext from './router-context';

// A public higher-order component to access the imperative API
function withRouter( Component ) {
	const displayName = `withRouter(${
		Component.displayName || Component.name
	})`;
	const C = ( props ) => {
		const { wrappedComponentRef, ...remainingProps } = props;

		return (
			<RouterContext.Consumer>
				{ ( context ) => {
					return (
						<Component
							{ ...remainingProps }
							{ ...context }
							ref={ wrappedComponentRef }
						/>
					);
				} }
			</RouterContext.Consumer>
		);
	};

	C.displayName = displayName;
	C.WrappedComponent = Component;

	return hoistNonReactStatics( C, Component );
}

export default withRouter;
