/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useIsConnected } from '@wordpress/react-native-bridge';

const withIsConnected = createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const isConnected = useIsConnected();
		return <WrappedComponent { ...props } isConnected={ isConnected } />;
	};
}, 'withIsConnected' );

export default withIsConnected;
