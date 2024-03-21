/**
 * Internal dependencies
 */
import useNetworkConnectivity from './use-network-connectivity';

function withNetworkConnectivity( WrappedComponent ) {
	return function ( props ) {
		const { isConnected } = useNetworkConnectivity();

		return <WrappedComponent { ...props } isConnected={ isConnected } />;
	};
}

export default withNetworkConnectivity;
