/**
 * Internal dependencies
 */
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';
import useNetworkConnectivity from '../../hooks/use-network-connectivity';

const withIsConnected = createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const { isConnected } = useNetworkConnectivity();
		return <WrappedComponent { ...props } isConnected={ isConnected } />;
	};
}, 'withIsConnected' );

export default withIsConnected;
