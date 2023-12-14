/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	requestConnectionStatus,
	subscribeConnectionStatus,
} from '@wordpress/react-native-bridge';

export default function useNetworkConnectivity() {
	const [ isConnected, setIsConnected ] = useState( null );

	useEffect( () => {
		let isCurrent = true;

		requestConnectionStatus( ( isBridgeConnected ) => {
			if ( ! isCurrent ) {
				return;
			}

			setIsConnected( isBridgeConnected );
		} );

		return () => {
			isCurrent = false;
		};
	}, [] );

	useEffect( () => {
		const subscription = subscribeConnectionStatus(
			( { isConnected: isBridgeConnected } ) => {
				setIsConnected( isBridgeConnected );
			}
		);

		return () => {
			subscription.remove();
		};
	}, [] );

	return { isConnected };
}
