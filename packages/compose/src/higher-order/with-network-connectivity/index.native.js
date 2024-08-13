/**
 * Internal dependencies
 */
import { createHigherOrderComponent } from '../../utils/create-higher-order-component';
import useNetworkConnectivity from '../../hooks/use-network-connectivity';

const withNetworkConnectivity = createHigherOrderComponent(
	( WrappedComponent ) => {
		return ( props ) => {
			const { isConnected } = useNetworkConnectivity();
			return (
				<WrappedComponent { ...props } isConnected={ isConnected } />
			);
		};
	},
	'withNetworkConnectivity'
);

export default withNetworkConnectivity;
