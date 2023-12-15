/**
 * WordPress dependencies
 */
import { useIsConnected } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';

const withIsConnected = createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const { isConnected } = useIsConnected();
		return <WrappedComponent { ...props } isConnected={ isConnected } />;
	};
}, 'withIsConnected' );

export default withIsConnected;
