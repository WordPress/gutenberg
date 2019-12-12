/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';
import useSafeTimeout from '../../hooks/use-safe-timeout';

/**
 * A higher-order component used to provide and manage delayed function calls
 * that ought to be bound to a component's lifecycle.
 *
 * @param {WPComponent} OriginalComponent Component requiring setTimeout
 *
 * @return {WPComponent} Wrapped component.
 */
const withSafeTimeout = createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => {
		const { setTimeout, clearTimeout } = useSafeTimeout();
		return (
			<OriginalComponent
				{ ...props }
				setTimeout={ setTimeout }
				clearTimeout={ clearTimeout }
			/>
		);
	};
}, 'withSafeTimeout' );

export default withSafeTimeout;
