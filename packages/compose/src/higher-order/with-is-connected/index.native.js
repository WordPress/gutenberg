/**
 * Internal dependencies
 */
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';
import { useIsConnected } from '@wordpress/react-native-bridge';

const withIsConnected = createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const { isConnected } = useIsConnected();
		return <WrappedComponent { ...props } isConnected={ isConnected } />;
	};
}, 'withIsConnected' );

export default withIsConnected;
